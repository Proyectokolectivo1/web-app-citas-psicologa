import { create } from 'zustand'
import { supabase } from '../supabase/client'

export interface EmailTemplate {
    id: string
    template_type: 'confirmation' | 'cancellation' | 'reschedule' | 'admin_cancellation_notice'
    subject: string
    greeting: string
    main_message: string
    footer_text: string
    footer_signature: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface EmailTemplateState {
    templates: EmailTemplate[]
    isLoading: boolean
    error: string | null

    // Actions
    fetchTemplates: () => Promise<void>
    updateTemplate: (id: string, data: Partial<EmailTemplate>) => Promise<void>
    getTemplateByType: (type: EmailTemplate['template_type']) => EmailTemplate | undefined
}

export const useEmailTemplateStore = create<EmailTemplateState>((set, get) => ({
    templates: [],
    isLoading: false,
    error: null,

    fetchTemplates: async () => {
        try {
            set({ isLoading: true, error: null })

            const { data, error } = await (supabase
                .from('email_templates' as any)
                .select('*')
                .order('template_type')) as any

            if (error) throw error

            set({ templates: data || [] })
        } catch (error: any) {
            console.error('Error fetching email templates:', error)
            set({ error: error.message || 'Error al cargar plantillas' })
        } finally {
            set({ isLoading: false })
        }
    },

    updateTemplate: async (id: string, data: Partial<EmailTemplate>) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await (supabase
                .from('email_templates' as any)
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)) as any

            if (error) throw error

            // Update local state
            set(state => ({
                templates: state.templates.map(t =>
                    t.id === id ? { ...t, ...data } : t
                )
            }))
        } catch (error: any) {
            console.error('Error updating email template:', error)
            set({ error: error.message || 'Error al actualizar plantilla' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    getTemplateByType: (type) => {
        return get().templates.find(t => t.template_type === type)
    }
}))

// Default templates for fallback
export const DEFAULT_TEMPLATES: Record<EmailTemplate['template_type'], Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'is_active'>> = {
    confirmation: {
        template_type: 'confirmation',
        subject: '✅ Cita Confirmada - Ama Nacer',
        greeting: 'Hola',
        main_message: 'Tu cita ha sido agendada exitosamente.',
        footer_text: 'Ama Nacer - Psicología',
        footer_signature: 'Desarrollado por Monteslab'
    },
    cancellation: {
        template_type: 'cancellation',
        subject: '❌ Cita Cancelada - Ama Nacer',
        greeting: 'Hola',
        main_message: 'Te informamos que tu cita ha sido cancelada.',
        footer_text: 'Ama Nacer - Psicología',
        footer_signature: 'Desarrollado por Monteslab'
    },
    reschedule: {
        template_type: 'reschedule',
        subject: '📅 Cita Reagendada - Ama Nacer',
        greeting: 'Hola',
        main_message: 'Tu cita ha sido reagendada exitosamente.',
        footer_text: 'Ama Nacer - Psicología',
        footer_signature: 'Desarrollado por Monteslab'
    },
    admin_cancellation_notice: {
        template_type: 'admin_cancellation_notice',
        subject: '⚠️ Cancelación de Cita - Notificación',
        greeting: 'Hola',
        main_message: 'Un paciente ha cancelado su cita.',
        footer_text: 'Sistema de Citas - Ama Nacer',
        footer_signature: 'Notificación Automática'
    }
}
