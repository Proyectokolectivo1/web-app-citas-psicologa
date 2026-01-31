
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

declare const Deno: any

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface CalendarEvent {
    summary?: string
    description?: string
    start?: { dateTime: string, timeZone: string }
    end?: { dateTime: string, timeZone: string }
    attendees?: { email: string, displayName?: string }[]
}

const getAccessToken = async (serviceAccountEmail: string, privateKey: string) => {
    try {
        console.log(`🔑 Getting Access Token for: ${serviceAccountEmail}`)
        console.log(`🔑 Key Length: ${privateKey.length}`)
        console.log(`🔑 Key Start: ${privateKey.substring(0, 20)}...`)

        const alg = 'RS256'
        // Robust key formatting: handle literal \n and wrapping quotes
        const pkcs8 = privateKey
            .replace(/\\n/g, '\n')
            .replace(/"/g, '')
            .trim()

        console.log(`🔑 Formatted Key Lines: ${pkcs8.split('\n').length}`)

        const privateKeyObj = await jose.importPKCS8(pkcs8, alg)
        console.log('✅ Key Imported Successfully')

        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/calendar',
        })
            .setProtectedHeader({ alg })
            .setIssuer(serviceAccountEmail)
            .setAudience('https://oauth2.googleapis.com/token')
            .setExpirationTime('1h')
            .setIssuedAt()
            .sign(privateKeyObj)

        console.log('✅ JWT Signed')

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('❌ Error getting access token:', JSON.stringify(data))
            // Log the "error_description" explicitly if available
            throw new Error(data.error_description || data.error || 'Failed to get access token')
        }

        console.log('✅ Access Token Retrieved')
        return data.access_token
    } catch (error) {
        console.error('❌ Critical Error in getAccessToken:', error)
        throw error
    }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
        const PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')
        const CALENDAR_ID = Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary'

        // Check credentials
        if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
            console.warn('⚠️ Missing Google Calendar credentials. Skipping actual event creation.')
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Google Calendar Interaction Simulated (No credentials)",
                    eventId: `mock_${Date.now()}`
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const accessToken = await getAccessToken(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY)
        const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`

        // Parsed Body - We expect { action, event, eventId }
        // Or we infer from method. But Supabase invoke sends POST usually.
        // Let's support both. If POST has "action", use it. Else default to Create.
        let body: any = {}
        try { body = await req.json() } catch (e) { }

        const action = body.action || (req.method === 'DELETE' ? 'delete' : req.method === 'PUT' ? 'update' : 'create')
        const eventData = body.event
        const eventId = body.eventId

        let gcalUrl = baseUrl
        let method = 'POST'
        let payload = undefined
        // sendUpdates: 'all' sends email notifications to all attendees including patients
        const sendUpdates = 'all'

        if (action === 'create') {
            method = 'POST'
            // Add additional properties for better event experience
            payload = {
                ...eventData,
                guestsCanSeeOtherGuests: true,
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 1440 }, // 24 hours before
                        { method: 'popup', minutes: 60 }     // 1 hour before
                    ]
                }
            }
            gcalUrl = `${baseUrl}?sendUpdates=${sendUpdates}`
        } else if (action === 'update' || action === 'reschedule') {
            if (!eventId) throw new Error('Event ID required for update')
            gcalUrl = `${baseUrl}/${eventId}?sendUpdates=${sendUpdates}`
            method = 'PATCH' // PATCH is safer than PUT
            payload = eventData
        } else if (action === 'delete' || action === 'cancel') {
            if (!eventId) throw new Error('Event ID required for delete')
            gcalUrl = `${baseUrl}/${eventId}?sendUpdates=${sendUpdates}`
            method = 'DELETE'
        } else {
            throw new Error(`Unknown action: ${action}`)
        }

        console.log(`Executing GCal ${action} (${method}) on ${gcalUrl}`)
        console.log(`Attendees in payload:`, JSON.stringify(payload?.attendees))

        let response = await fetch(gcalUrl, {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: payload ? JSON.stringify(payload) : undefined
        })

        // --- FALLBACK LOGIC ---
        // If creation fails (non-2xx), try simpler payload
        if (!response.ok && action === 'create') {
            const errorData = await response.json()
            console.warn('⚠️ GCal creation failed with advanced params:', JSON.stringify(errorData))

            // Retry 1: Remove reminders (use default)
            console.log('🔄 Retrying without custom reminders...')
            const simplePayload = { ...eventData, reminders: { useDefault: true } }

            response = await fetch(gcalUrl, { // still try with sendUpdates
                method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(simplePayload)
            })

            if (!response.ok) {
                // Retry 2: Remove sendUpdates (maybe notifications are blocked)
                console.log('🔄 Retrying without sendUpdates...')
                const fallbackUrl = baseUrl // no query params
                response = await fetch(fallbackUrl, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(simplePayload) // still default reminders
                })
            }
        }

        // DELETE 204 No Content
        if (method === 'DELETE' && response.status === 204) {
            return new Response(
                JSON.stringify({ success: true, message: 'Event deleted' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        if (!response.ok) {
            const errorData = await response.json()
            console.error('GCal API Error:', errorData)
            // Handle 404 (Event not found) gracefully?
            if (response.status === 404 && action === 'delete') {
                return new Response(
                    JSON.stringify({ success: true, message: 'Event already deleted or not found' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
            throw new Error(errorData.error?.message || 'GCal API Request Failed')
        }

        const data = await response.json()

        return new Response(
            JSON.stringify({
                success: true,
                eventId: data.id,
                googleLink: data.htmlLink,
                data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
