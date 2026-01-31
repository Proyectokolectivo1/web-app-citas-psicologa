import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Save, Check, AlertCircle, FileText, RefreshCw } from 'lucide-react'
import { useEmailTemplateStore, EmailTemplate, DEFAULT_TEMPLATES } from '../../../infrastructure/store/emailTemplateStore'

const TEMPLATE_LABELS: Record<EmailTemplate['template_type'], { title: string; description: string; icon: string }> = {
    confirmation: {
        title: 'Confirmación de Cita',
        description: 'Email enviado cuando se confirma una nueva cita',
        icon: '✅'
    },
    cancellation: {
        title: 'Cancelación de Cita',
        description: 'Email enviado cuando se cancela una cita',
        icon: '❌'
    },
    reschedule: {
        title: 'Reagendamiento de Cita',
        description: 'Email enviado cuando se reagenda una cita',
        icon: '📅'
    },
    admin_cancellation_notice: {
        title: 'Notificación de Cancelación (Admin)',
        description: 'Email enviado a la psicóloga cuando un paciente cancela',
        icon: '⚠️'
    }
}

export function EmailTemplatesSettings() {
    const { templates, isLoading, error, fetchTemplates, updateTemplate } = useEmailTemplateStore()
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
    const [editedTemplate, setEditedTemplate] = useState<Partial<EmailTemplate>>({})
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    useEffect(() => {
        if (templates.length > 0 && !selectedTemplate) {
            setSelectedTemplate(templates[0])
            setEditedTemplate(templates[0])
        }
    }, [templates, selectedTemplate])

    const handleSelectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate(template)
        setEditedTemplate(template)
        setSaveSuccess(false)
    }

    const handleSave = async () => {
        if (!selectedTemplate) return

        setSaving(true)
        try {
            await updateTemplate(selectedTemplate.id, editedTemplate)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (err) {
            console.error('Error saving template:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleResetToDefault = () => {
        if (!selectedTemplate) return
        const defaultTemplate = DEFAULT_TEMPLATES[selectedTemplate.template_type]
        setEditedTemplate({
            ...selectedTemplate,
            ...defaultTemplate
        })
    }

    if (isLoading && templates.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                    <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Plantillas de Email
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Personaliza los mensajes de las notificaciones por correo
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="lg:col-span-1 space-y-3">
                    {templates.map((template) => {
                        const label = TEMPLATE_LABELS[template.template_type]
                        const isSelected = selectedTemplate?.id === template.id

                        return (
                            <motion.button
                                key={template.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectTemplate(template)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                        ? 'bg-primary/10 border-primary shadow-md'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{label.icon}</span>
                                    <div>
                                        <h3 className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                            {label.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {label.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>

                {/* Template Editor */}
                <div className="lg:col-span-2">
                    {selectedTemplate ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Editar Plantilla
                                </h3>
                                <button
                                    onClick={handleResetToDefault}
                                    className="text-sm text-gray-500 hover:text-primary flex items-center gap-1"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Restaurar
                                </button>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Asunto del Email
                                </label>
                                <input
                                    type="text"
                                    value={editedTemplate.subject || ''}
                                    onChange={(e) => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                />
                            </div>

                            {/* Greeting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Saludo
                                </label>
                                <input
                                    type="text"
                                    value={editedTemplate.greeting || ''}
                                    onChange={(e) => setEditedTemplate({ ...editedTemplate, greeting: e.target.value })}
                                    placeholder="Ej: Hola, Querido/a, Estimado/a"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                />
                            </div>

                            {/* Main Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mensaje Principal
                                </label>
                                <textarea
                                    rows={3}
                                    value={editedTemplate.main_message || ''}
                                    onChange={(e) => setEditedTemplate({ ...editedTemplate, main_message: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                                />
                            </div>

                            {/* Footer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Texto del Pie
                                    </label>
                                    <input
                                        type="text"
                                        value={editedTemplate.footer_text || ''}
                                        onChange={(e) => setEditedTemplate({ ...editedTemplate, footer_text: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Firma
                                    </label>
                                    <input
                                        type="text"
                                        value={editedTemplate.footer_signature || ''}
                                        onChange={(e) => setEditedTemplate({ ...editedTemplate, footer_signature: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${saveSuccess
                                            ? 'bg-green-500 text-white'
                                            : 'bg-primary text-white hover:bg-primary-dark'
                                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : saveSuccess ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            ¡Guardado!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Selecciona una plantilla para editarla
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
