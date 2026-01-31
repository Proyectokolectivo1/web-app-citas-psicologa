# 📧 Configuración de Plantillas de Email Personalizables

## Paso 1: Ejecutar la Migración en Supabase

Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/wvskkrkuhrhtcspwpihn/sql/new) y ejecuta el siguiente SQL:

```sql
-- Create email_templates table for customizable email content
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_type TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    greeting TEXT NOT NULL DEFAULT 'Hola',
    main_message TEXT NOT NULL,
    footer_text TEXT NOT NULL DEFAULT 'Ama Nacer - Psicología',
    footer_signature TEXT NOT NULL DEFAULT 'Desarrollado por Monteslab',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (template_type, subject, greeting, main_message, footer_text, footer_signature) VALUES
('confirmation', '✅ Cita Confirmada - Ama Nacer', 'Hola', 'Tu cita ha sido agendada exitosamente.', 'Ama Nacer - Psicología', 'Desarrollado por Monteslab'),
('cancellation', '❌ Cita Cancelada - Ama Nacer', 'Hola', 'Te informamos que tu cita ha sido cancelada.', 'Ama Nacer - Psicología', 'Desarrollado por Monteslab'),
('reschedule', '📅 Cita Reagendada - Ama Nacer', 'Hola', 'Tu cita ha sido reagendada exitosamente.', 'Ama Nacer - Psicología', 'Desarrollado por Monteslab'),
('admin_cancellation_notice', '⚠️ Cancelación de Cita - Notificación', 'Hola', 'Un paciente ha cancelado su cita.', 'Sistema de Citas - Ama Nacer', 'Notificación Automática')
ON CONFLICT (template_type) DO NOTHING;

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read templates
CREATE POLICY "Allow authenticated read email_templates" ON email_templates
    FOR SELECT TO authenticated USING (true);

-- Allow psychologists to update templates
CREATE POLICY "Allow psychologists to update email_templates" ON email_templates
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'psychologist'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'psychologist'));
```

## Paso 2: Verifica la Tabla

Después de ejecutar el SQL, ve a **Table Editor** y verifica que la tabla `email_templates` exista con 4 registros.

## Resumen de Funcionalidades

### ✅ Plantillas Personalizables
- **Confirmación**: Email enviado al confirmar una cita
- **Cancelación**: Email enviado al paciente cuando cancela
- **Reagendamiento**: Email enviado cuando se reagenda
- **Notificación Admin**: Email enviado a la psicóloga cuando un paciente cancela

### ✅ Campos Editables
- Asunto del email
- Saludo (Hola, Querido/a, etc.)
- Mensaje principal
- Texto del pie de página
- Firma

### ✅ Notificación a la Psicóloga
Cuando un paciente cancela, se envía automáticamente un email a `sebastianmontesg@gmail.com` con:
- Datos del paciente (nombre, email, teléfono)
- Fecha y hora de la cita cancelada
- Motivo de cancelación (si lo proporcionó)
