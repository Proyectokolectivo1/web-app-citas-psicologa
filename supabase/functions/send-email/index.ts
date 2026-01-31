import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gmail SMTP configuration (preferred)
// @ts-ignore: Deno runtime available in Supabase Edge Functions
const GMAIL_USER = Deno.env.get('GMAIL_USER')
// @ts-ignore: Deno runtime available in Supabase Edge Functions
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')

// Resend API key (fallback)
// @ts-ignore: Deno runtime available in Supabase Edge Functions
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
    to: string
    subject: string
    html: string
}

async function sendViaGmail(to: string, subject: string, html: string): Promise<void> {
    const client = new SMTPClient({
        connection: {
            hostname: "smtp.gmail.com",
            port: 465,
            tls: true,
            auth: {
                username: GMAIL_USER!,
                password: GMAIL_APP_PASSWORD!,
            },
        },
    })

    try {
        await client.send({
            from: `Ama Nacer <${GMAIL_USER}>`,
            to: to,
            subject: subject,
            content: "Email HTML adjunto",
            html: html,
        })
    } finally {
        await client.close()
    }
}

async function sendViaResend(to: string, subject: string, html: string): Promise<any> {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'Ama Nacer <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html,
        }),
    })

    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.message || 'Failed to send email via Resend')
    }
    return data
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, html }: EmailRequest = await req.json()

        console.log(`Sending email to: ${to}, subject: ${subject}`)

        // Priority: Gmail > Resend
        if (GMAIL_USER && GMAIL_APP_PASSWORD) {
            console.log('Using Gmail SMTP...')
            await sendViaGmail(to, subject, html)
            console.log('Email sent successfully via Gmail')
            return new Response(
                JSON.stringify({ success: true, provider: 'gmail' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                },
            )
        }

        if (RESEND_API_KEY) {
            console.log('Using Resend API (fallback)...')
            const data = await sendViaResend(to, subject, html)
            console.log('Email sent successfully via Resend')
            return new Response(
                JSON.stringify({ success: true, provider: 'resend', data }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                },
            )
        }

        throw new Error('No email provider configured. Set GMAIL_USER + GMAIL_APP_PASSWORD or RESEND_API_KEY.')

    } catch (error: any) {
        console.error('Error sending email:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
