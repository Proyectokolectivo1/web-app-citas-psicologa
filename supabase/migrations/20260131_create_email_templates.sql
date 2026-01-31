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

-- Create psychologist_email setting if not exists
INSERT INTO settings (key, value)
VALUES ('psychologist_email', '"sebastianmontesg@gmail.com"')
ON CONFLICT (key) DO NOTHING;

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
