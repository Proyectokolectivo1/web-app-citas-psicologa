import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Save, Check, RefreshCw, Type, Quote, DollarSign, Sparkles, Heart, Shield, Clock } from 'lucide-react'
import { useSettingsStore } from '../../../infrastructure/store'

interface LandingContent {
    // Hero Section
    hero_title: string
    hero_subtitle: string
    hero_location: string

    // Mission Section
    mission_title: string
    mission_subtitle: string
    mission_quote: string

    // Features
    feature1_title: string
    feature1_subtitle: string
    feature2_title: string
    feature2_subtitle: string
    feature3_title: string
    feature3_subtitle: string

    // Appointment Types & Pricing
    tariffs_label: string
    virtual_title: string
    virtual_description: string
    virtual_badge: string
    virtual_price: string
    presencial_title: string
    presencial_description: string
    presencial_price: string
    session_duration: string
    session_type_label: string

    // Final Quote
    final_quote: string

    // CTA
    cta_button_text: string
    cta_availability_text: string
}

const DEFAULT_CONTENT: LandingContent = {
    hero_title: 'Hola, soy tu guía',
    hero_subtitle: 'Un espacio seguro en Los Ángeles para redescubrir tu bienestar y salud mental.',
    hero_location: 'Los Ángeles',

    mission_title: 'Misión Terapéutica',
    mission_subtitle: 'Acompañamiento Profesional',
    mission_quote: '"Creo firmemente que cada persona tiene el potencial de transformarse. Mi enfoque integra la psicología clínica con una visión humana y cálida para acompañar tu proceso."',

    feature1_title: 'Espacio Seguro',
    feature1_subtitle: 'Confidencialidad total',
    feature2_title: 'Profesional',
    feature2_subtitle: '+10 años experiencia',
    feature3_title: 'Flexible',
    feature3_subtitle: 'Virtual o presencial',

    tariffs_label: `Tarifas ${new Date().getFullYear()}`,
    virtual_title: 'Cita Virtual',
    virtual_description: 'Atención flexible desde cualquier lugar. Sesiones por videollamada con la misma calidad y calidez.',
    virtual_badge: 'Preferida',
    virtual_price: '120.000 COP',
    presencial_title: 'Cita Presencial',
    presencial_description: 'Sesión física en consultorio ubicado en Los Ángeles. Un ambiente cálido y profesional.',
    presencial_price: '110.000 COP',
    session_duration: '60 min',
    session_type_label: 'Sesión Individual',

    final_quote: '"Un nuevo sol es la oportunidad de re-nacer cada día."',

    cta_button_text: 'Agendar Cita Ahora',
    cta_availability_text: 'Horarios disponibles hoy'
}

export function LandingContentSettings() {
    const { fetchSetting, updateSetting } = useSettingsStore()
    const [content, setContent] = useState<LandingContent>(DEFAULT_CONTENT)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [activeSection, setActiveSection] = useState<'hero' | 'mission' | 'features' | 'appointments' | 'cta'>('hero')

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        setIsLoading(true)
        try {
            const savedContent = await fetchSetting('landing_content')
            if (savedContent) {
                try {
                    const parsed = typeof savedContent === 'string' ? JSON.parse(savedContent) : savedContent
                    setContent({ ...DEFAULT_CONTENT, ...parsed })
                } catch {
                    setContent(DEFAULT_CONTENT)
                }
            }
        } catch (error) {
            console.error('Error loading landing content:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateSetting('landing_content', JSON.stringify(content))
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (error) {
            console.error('Error saving landing content:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setContent(DEFAULT_CONTENT)
    }

    const updateField = <K extends keyof LandingContent>(field: K, value: LandingContent[K]) => {
        setContent(prev => ({ ...prev, [field]: value }))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    const sections = [
        { id: 'hero', label: 'Hero', icon: Type },
        { id: 'mission', label: 'Misión', icon: Quote },
        { id: 'features', label: 'Características', icon: Sparkles },
        { id: 'appointments', label: 'Citas', icon: DollarSign },
        { id: 'cta', label: 'CTA', icon: FileText }
    ] as const

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Contenido de la Landing
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Personaliza todos los textos de la página principal
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Restaurar
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 ${saved
                            ? 'bg-green-500 text-white'
                            : 'bg-primary text-white hover:bg-primary-dark'
                            }`}
                    >
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saved ? 'Guardado' : 'Guardar'}
                    </motion.button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {sections.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={`flex-1 min-w-[120px] py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${activeSection === id
                            ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content Editor */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                {/* Hero Section */}
                {activeSection === 'hero' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Type className="w-5 h-5 text-primary" />
                            Sección Hero
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título Principal
                            </label>
                            <input
                                type="text"
                                value={content.hero_title}
                                onChange={(e) => updateField('hero_title', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                                placeholder="Hola, soy tu guía"
                            />
                            <p className="text-xs text-gray-400 mt-1">Usa "guía" para que aparezca en cursiva</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Subtítulo
                            </label>
                            <textarea
                                value={content.hero_subtitle}
                                onChange={(e) => updateField('hero_subtitle', e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ubicación
                            </label>
                            <input
                                type="text"
                                value={content.hero_location}
                                onChange={(e) => updateField('hero_location', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                                placeholder="Los Ángeles"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Mission Section */}
                {activeSection === 'mission' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Quote className="w-5 h-5 text-primary" />
                            Sección Misión
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título
                            </label>
                            <input
                                type="text"
                                value={content.mission_title}
                                onChange={(e) => updateField('mission_title', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Subtítulo
                            </label>
                            <input
                                type="text"
                                value={content.mission_subtitle}
                                onChange={(e) => updateField('mission_subtitle', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cita / Descripción
                            </label>
                            <textarea
                                value={content.mission_quote}
                                onChange={(e) => updateField('mission_quote', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Frase Final
                            </label>
                            <input
                                type="text"
                                value={content.final_quote}
                                onChange={(e) => updateField('final_quote', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Features Section */}
                {activeSection === 'features' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Características
                        </h3>

                        {/* Feature 1 */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Heart className="w-5 h-5" />
                                <span className="font-medium">Característica 1</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={content.feature1_title}
                                        onChange={(e) => updateField('feature1_title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Subtítulo</label>
                                    <input
                                        type="text"
                                        value={content.feature1_subtitle}
                                        onChange={(e) => updateField('feature1_subtitle', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Shield className="w-5 h-5" />
                                <span className="font-medium">Característica 2</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={content.feature2_title}
                                        onChange={(e) => updateField('feature2_title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Subtítulo</label>
                                    <input
                                        type="text"
                                        value={content.feature2_subtitle}
                                        onChange={(e) => updateField('feature2_subtitle', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">Característica 3</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={content.feature3_title}
                                        onChange={(e) => updateField('feature3_title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Subtítulo</label>
                                    <input
                                        type="text"
                                        value={content.feature3_subtitle}
                                        onChange={(e) => updateField('feature3_subtitle', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Appointments Section */}
                {activeSection === 'appointments' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Tipos de Cita y Tarifas
                        </h3>

                        {/* General Pricing Settings */}
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl space-y-4">
                            <span className="text-yellow-600 font-medium">💰 Configuración General de Precios</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Etiqueta de Tarifas</label>
                                    <input
                                        type="text"
                                        value={content.tariffs_label}
                                        onChange={(e) => updateField('tariffs_label', e.target.value)}
                                        placeholder="Tarifas 2026"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Duración Sesión</label>
                                    <input
                                        type="text"
                                        value={content.session_duration}
                                        onChange={(e) => updateField('session_duration', e.target.value)}
                                        placeholder="60 min"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tipo de Sesión</label>
                                <input
                                    type="text"
                                    value={content.session_type_label}
                                    onChange={(e) => updateField('session_type_label', e.target.value)}
                                    placeholder="Sesión Individual"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        {/* Virtual */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-4">
                            <span className="text-blue-600 font-medium">💻 Cita Virtual</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={content.virtual_title}
                                        onChange={(e) => updateField('virtual_title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Precio</label>
                                    <input
                                        type="text"
                                        value={content.virtual_price}
                                        onChange={(e) => updateField('virtual_price', e.target.value)}
                                        placeholder="120.000 COP"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
                                <textarea
                                    value={content.virtual_description}
                                    onChange={(e) => updateField('virtual_description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Etiqueta/Badge</label>
                                <input
                                    type="text"
                                    value={content.virtual_badge}
                                    onChange={(e) => updateField('virtual_badge', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        {/* Presencial */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl space-y-4">
                            <span className="text-green-600 font-medium">🏥 Cita Presencial</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={content.presencial_title}
                                        onChange={(e) => updateField('presencial_title', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Precio</label>
                                    <input
                                        type="text"
                                        value={content.presencial_price}
                                        onChange={(e) => updateField('presencial_price', e.target.value)}
                                        placeholder="110.000 COP"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
                                <textarea
                                    value={content.presencial_description}
                                    onChange={(e) => updateField('presencial_description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* CTA Section */}
                {activeSection === 'cta' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Llamada a la Acción (CTA)
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Texto del Botón
                            </label>
                            <input
                                type="text"
                                value={content.cta_button_text}
                                onChange={(e) => updateField('cta_button_text', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Texto de Disponibilidad
                            </label>
                            <input
                                type="text"
                                value={content.cta_availability_text}
                                onChange={(e) => updateField('cta_availability_text', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Preview */}
                        <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                            <p className="text-sm text-gray-500 mb-4">Vista previa:</p>
                            <button className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg">
                                {content.cta_button_text}
                            </button>
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                                    {content.cta_availability_text}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export type { LandingContent }
export { DEFAULT_CONTENT }
