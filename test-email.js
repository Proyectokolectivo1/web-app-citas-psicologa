
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://paucuztylmtqacirraro.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdWN1enR5bG10cWFjaXJyYXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTQxMTgsImV4cCI6MjA4NTIzMDExOH0.dACyQ5bYUeA9_Wnv_iCAse4egwaHUe8hRW-mhX1nYWc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEmail() {
    console.log('Iniciando prueba de envío de correo...')

    const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
            to: 'delivered@resend.dev',
            subject: 'Prueba de Integración Exitos',
            html: '<h1>Funciona!</h1><p>Esta es una prueba de verificación del sistema de citas.</p>'
        }
    })

    if (error) {
        console.error('❌ Error en la prueba:', error)
    } else {
        console.log('✅ Prueba exitosa. Respuesta:', data)
    }
}

testEmail()
