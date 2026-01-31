
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

        const alg = 'RS256'
        // Robust key formatting: handle literal \n and wrapping quotes
        const pkcs8 = privateKey
            .replace(/\\n/g, '\n')
            .replace(/"/g, '')
            .trim()

        const privateKeyObj = await jose.importPKCS8(pkcs8, alg)

        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/calendar',
        })
            .setProtectedHeader({ alg })
            .setIssuer(serviceAccountEmail)
            .setAudience('https://oauth2.googleapis.com/token')
            .setExpirationTime('1h')
            .setIssuedAt()
            .sign(privateKeyObj)

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
            console.warn('⚠️ Missing Google Calendar credentials.')
            // Valid check for debug action even without credentials to report missing
            let body: any = {}
            try { body = await req.json() } catch (e) { }

            if (body.action === 'debug') {
                return new Response(
                    JSON.stringify({
                        success: true,
                        info: {
                            serviceAccountEmail: SERVICE_ACCOUNT_EMAIL ? 'PRESENT' : 'MISSING',
                            privateKeyLength: PRIVATE_KEY ? PRIVATE_KEY.length : 0,
                            error: 'Credentials missing in environment variables'
                        }
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Google Calendar Interaction Simulated (No credentials)",
                    eventId: `mock_${Date.now()}`
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        let body: any = {}
        try { body = await req.json() } catch (e) { }

        const action = body.action || (req.method === 'DELETE' ? 'delete' : req.method === 'PUT' ? 'update' : 'create')
        const eventData = body.event
        const eventId = body.eventId

        // --- DEBUG ACTION ---
        if (action === 'debug') {
            const pkLength = PRIVATE_KEY?.length || 0
            const saEmail = SERVICE_ACCOUNT_EMAIL
            let jwtStatus = 'Not attempted'
            let tokenStatus = 'Not attempted'
            let errorDetail = null

            try {
                // Try to generate JWT locally (lightweight check)
                const alg = 'RS256'
                const pkcs8 = PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '').trim()
                const privateKeyObj = await jose.importPKCS8(pkcs8, alg)
                const jwt = await new jose.SignJWT({ scope: 'test' })
                    .setProtectedHeader({ alg })
                    .setIssuer(saEmail)
                    .setAudience('test')
                    .setExpirationTime('1m')
                    .setIssuedAt()
                    .sign(privateKeyObj)
                jwtStatus = `Success, generated ${jwt.substring(0, 10)}...`

                // Try to get real token
                const token = await getAccessToken(saEmail, PRIVATE_KEY)
                tokenStatus = `Success, got ${token.substring(0, 10)}...`

            } catch (e: any) {
                jwtStatus = `Failed: ${e.message}`
                errorDetail = e.message
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    info: {
                        serviceAccountEmail: saEmail,
                        privateKeyLength: pkLength,
                        privateKeyStart: PRIVATE_KEY ? PRIVATE_KEY.substring(0, 10) + '...' : 'N/A',
                        calendarId: CALENDAR_ID,
                        jwtGeneration: jwtStatus,
                        accessTokenFetch: tokenStatus,
                        error: errorDetail
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const accessToken = await getAccessToken(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY)
        const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`

        let gcalUrl = baseUrl
        let method = 'POST'
        let payload = undefined
        const sendUpdates = 'all'

        if (action === 'create') {
            method = 'POST'
            // STRATEGY: Create BASE event first (Psychologist Only). Then add Patients.

            // 1. Base Payload
            const basePayload = {
                summary: eventData.summary,
                description: eventData.description,
                start: eventData.start,
                end: eventData.end,
                // NO ATTENDEES YET
            }

            console.log('🚀 Step 1: Creating Base Event...')

            let response = await fetch(`${baseUrl}?sendUpdates=none`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(basePayload)
            })

            if (!response.ok) {
                const err = await response.json()
                console.error('❌ Base Event Creation Failed:', JSON.stringify(err))
                throw new Error(err.error?.message || 'Failed to create base calendar event')
            }

            const newEvent = await response.json()
            const newEventId = newEvent.id
            console.log(`✅ Base Event Created: ${newEventId}`)

            // 2. Add Attendees (Best Effort)
            if (eventData.attendees && eventData.attendees.length > 0) {
                console.log('📧 Step 2: Adding attendees...')
                const updatePayload = {
                    attendees: eventData.attendees,
                    guestsCanSeeOtherGuests: true,
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'popup', minutes: 60 }
                        ]
                    }
                }

                // Try with sendUpdates=all
                const updateResponse = await fetch(`${baseUrl}/${newEventId}?sendUpdates=all`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatePayload)
                })

                if (!updateResponse.ok) {
                    console.warn('⚠️ Attendees update failed. Trying fallback without overrides...')
                    // Fallback: Just attendees, no custom reminders
                    const simpleUpdatePayload = { attendees: eventData.attendees }
                    await fetch(`${baseUrl}/${newEventId}?sendUpdates=all`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(simpleUpdatePayload)
                    })
                } else {
                    console.log('✅ Attendees INVITED successfully')
                }
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    eventId: newEventId,
                    googleLink: newEvent.htmlLink,
                    data: newEvent
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )

        } else if (action === 'update' || action === 'reschedule') {
            if (!eventId) throw new Error('Event ID required for update')
            gcalUrl = `${baseUrl}/${eventId}?sendUpdates=${sendUpdates}`
            method = 'PATCH'
            payload = eventData
        } else if (action === 'delete' || action === 'cancel') {
            if (!eventId) throw new Error('Event ID required for delete')
            gcalUrl = `${baseUrl}/${eventId}?sendUpdates=${sendUpdates}`
            method = 'DELETE'
        } else {
            throw new Error(`Unknown action: ${action}`)
        }

        console.log(`Executing Standard Action ${action} (${method})`)

        const response = await fetch(gcalUrl, {
            method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: payload ? JSON.stringify(payload) : undefined
        })

        // DELETE 204
        if (method === 'DELETE' && response.status === 204) {
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!response.ok) {
            const err = await response.json()
            console.error('GCal Error:', err)
            throw new Error(err.error?.message || 'Request failed')
        }

        const data = await response.json()
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
