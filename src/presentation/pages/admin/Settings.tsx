import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Settings, DollarSign, Clock, Save, Check, ExternalLink, AlertCircle, Image as ImageIcon, Sparkles, Upload, Phone, Trash2, Plus, UserPlus, MapPin } from 'lucide-react'
import { supabase } from '../../../infrastructure/supabase/client'
import { useSettingsStore } from '../../../infrastructure/store'
import { EmailTemplatesSettings } from '../../components/admin/EmailTemplatesSettings'
import { LandingContentSettings } from '../../components/admin/LandingContentSettings'

interface AppSettings {
    appointment_duration: { minutes: number }
    virtual_price: { amount: number; currency: string }
    presencial_price: { amount: number; currency: string }
    google_calendar_connected: { connected: boolean }
    location_url?: string
}

export default function AdminSettings() {
    const {
        fetchSetting,
        updateSetting,
        uploadImage,
        supportContacts,
        fetchSupportContacts,
        addSupportContact,
        deleteSupportContact
    } = useSettingsStore()

    const [imageUrl, setImageUrl] = useState('')
    const [imageFeedback, setImageFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [newContact, setNewContact] = useState({ role: '', name: '', phone: '' })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const defaultImage = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
    const [settings, setSettings] = useState<AppSettings>({
        appointment_duration: { minutes: 60 },
        virtual_price: { amount: 120000, currency: 'COP' },
        presencial_price: { amount: 110000, currency: 'COP' },
        google_calendar_connected: { connected: false },
        location_url: 'https://maps.google.com/?q=6.174649,-75.346703'
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetchSettings()
        loadProfileImage()
        fetchSupportContacts()
    }, [])

    const loadProfileImage = async () => {
        const url = await fetchSetting('psychologist_image_url')
        if (url) setImageUrl(url)
    }

    const handleAddContact = async () => {
        if (!newContact.role || !newContact.name || !newContact.phone) return

        try {
            await addSupportContact(newContact)
            setNewContact({ role: '', name: '', phone: '' })
        } catch (e) {
            console.error('Error adding contact', e)
        }
    }

    const handleDeleteContact = async (id: string) => {
        try {
            await deleteSupportContact(id)
        } catch (e) {
            console.error('Error deleting contact', e)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsSaving(true)
            setImageFeedback(null)

            const publicUrl = await uploadImage(file, 'profile')

            if (publicUrl) {
                setImageUrl(publicUrl)
                await updateSetting('psychologist_image_url', publicUrl)
                setImageFeedback({ type: 'success', message: 'Imagen actualizada correctamente' })
            }
        } catch (error) {
            setImageFeedback({ type: 'error', message: 'Error al subir la imagen' })
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('settings')
            .select('*')

        if (data) {
            const newSettings = { ...settings }
            data.forEach((row: any) => {
                const key = row.key as keyof AppSettings
                if (key in newSettings) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (newSettings as any)[key] = row.value
                }
            })
            setSettings(newSettings)
        }
        setIsLoading(false)
    }

    const handleSave = async () => {
        setIsSaving(true)

        const updates = Object.entries(settings).map(([key, value]) => ({
            key,
            value
        }))

        for (const update of updates) {
            await supabase
                .from('settings')
                .upsert({ key: update.key, value: update.value })
        }

        setIsSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }



    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Configuración</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Ajusta los parámetros de tu práctica
                    </p>
                </div>

                <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {saved ? (
                        <>
                            <Check className="w-5 h-5" />
                            Guardado
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar
                        </>
                    )}
                </motion.button>
            </div>

            {/* Image Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10 shadow-sm"
            >
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Imagen de Perfil</h2>
                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                            Esta imagen aparecerá en la página principal.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* Preview */}
                    <div className="relative group">
                        <div className="aspect-[4/5] w-48 rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 relative">
                            <img
                                src={imageUrl || defaultImage}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl p-2 shadow-lg border border-[var(--color-primary)]/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <label className="block text-sm font-medium mb-2">URL de la imagen</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-slate-50 dark:bg-zinc-900/50 focus:border-[var(--color-primary)] outline-none transition-all text-sm font-mono text-[var(--color-text-secondary-light)]"
                                />
                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        await updateSetting('psychologist_image_url', imageUrl);
                                        setImageFeedback({ type: 'success', message: 'URL guardada' });
                                        setIsSaving(false);
                                    }}
                                    className="px-4 bg-[var(--color-primary)] text-white rounded-xl"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">O subir nueva imagen:</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Subir Archivo
                                </button>
                                {imageUrl && (
                                    <button
                                        onClick={async () => {
                                            setImageUrl('');
                                            await updateSetting('psychologist_image_url', '');
                                            setImageFeedback({ type: 'success', message: 'Imagen eliminada (usando defecto)' });
                                        }}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Restaurar Defecto
                                    </button>
                                )}
                            </div>
                        </div>

                        {imageFeedback && (
                            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${imageFeedback.type === 'success'
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                {imageFeedback.message}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>


            {/* Support Contacts */}
            < motion.div
                initial={{ opacity: 0, y: 20 }
                }
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[var(--color-primary)]" />
                    Contactos de Apoyo
                </h2>

                <div className="space-y-6">
                    {/* Add Contact Form */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1.5">Rol / Título</label>
                            <input
                                type="text"
                                value={newContact.role}
                                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                                placeholder="Ej: Psiquiatra"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1.5">Nombre</label>
                            <input
                                type="text"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                placeholder="Nombre completo"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1.5">Teléfono</label>
                            <input
                                type="tel"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                placeholder="+57 300..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                        <button
                            onClick={handleAddContact}
                            disabled={!newContact.role || !newContact.name || !newContact.phone}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[42px]"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar
                        </button>
                    </div>

                    {/* Contacts List */}
                    <div className="space-y-3">
                        {supportContacts.length === 0 ? (
                            <p className="text-center text-slate-500 py-4 italic">No hay contactos de apoyo registrados.</p>
                        ) : (
                            supportContacts.map((contact) => (
                                <div key={contact.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800 rounded-xl hover:border-[var(--color-primary)]/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                            <UserPlus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{contact.role}</p>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span>{contact.name}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="font-mono">{contact.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteContact(contact.id)}
                                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Eliminar contacto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div >

            {/* Appointment Settings */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                    Configuración de Citas
                </h2>

                <div className="space-y-6">
                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Duración de sesión (minutos)</label>
                        <input
                            type="number"
                            value={settings.appointment_duration.minutes}
                            onChange={(e) => setSettings(s => ({
                                ...s,
                                appointment_duration: { minutes: parseInt(e.target.value) || 60 }
                            }))}
                            min={30}
                            max={120}
                            step={15}
                            className="w-full max-w-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                        />
                    </div>
                </div>
            </motion.div >

            {/* Location Settings */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
                    Ubicación del Consultorio
                </h2>

                <div>
                    <label className="block text-sm font-medium mb-2">URL de Google Maps</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={settings.location_url || ''}
                            onChange={(e) => setSettings(s => ({
                                ...s,
                                location_url: e.target.value
                            }))}
                            placeholder="https://maps.google.com/..."
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                        />
                        <button
                            onClick={() => window.open(settings.location_url || 'https://maps.google.com', '_blank')}
                            className="px-4 bg-slate-100 dark:bg-zinc-800 rounded-xl hover:bg-slate-200 transition-colors"
                            title="Probar enlace"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Este enlace se mostrará a los pacientes con citas presenciales.</p>
                </div>
            </motion.div >

            {/* Pricing Settings */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[var(--color-primary)]" />
                    Tarifas
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Virtual Price */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Cita Virtual (COP)</label>
                        <input
                            type="number"
                            value={settings.virtual_price.amount}
                            onChange={(e) => setSettings(s => ({
                                ...s,
                                virtual_price: { ...s.virtual_price, amount: parseInt(e.target.value) || 0 }
                            }))}
                            min={0}
                            step={1000}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                        />
                    </div>

                    {/* In-Person Price */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Cita Presencial (COP)</label>
                        <input
                            type="number"
                            value={settings.presencial_price.amount}
                            onChange={(e) => setSettings(s => ({
                                ...s,
                                presencial_price: { ...s.presencial_price, amount: parseInt(e.target.value) || 0 }
                            }))}
                            min={0}
                            step={1000}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                        />
                    </div>
                </div>
            </motion.div >

            {/* Google Calendar Integration */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[var(--color-primary)]" />
                    Integraciones
                </h2>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold">Google Calendar</h3>
                            <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                Integración vía Service Account (Server-side)
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <motion.button
                            onClick={async () => {
                                setIsSaving(true)
                                try {
                                    // Use raw fetch to force Anon Key and avoid auth issues
                                    const response = await fetch(
                                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/Crear-evento-calendario`,
                                        {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                                            },
                                            body: JSON.stringify({
                                                event: {
                                                    summary: 'Test Cita - Montes Lab',
                                                    description: 'Esta es una prueba de integración.',
                                                    start: {
                                                        dateTime: new Date().toISOString(),
                                                        timeZone: 'America/Bogota'
                                                    },
                                                    end: {
                                                        dateTime: new Date(Date.now() + 3600000).toISOString(),
                                                        timeZone: 'America/Bogota'
                                                    },
                                                    attendees: []
                                                }
                                            })
                                        }
                                    )

                                    const data = await response.json()

                                    if (!response.ok) {
                                        throw new Error(data.error || 'Error en la petición')
                                    }

                                    alert(`Prueba exitosa! Evento creado: ${data.eventId}\nLink: ${data.googleLink || 'N/A'}`)
                                } catch (error: any) {
                                    console.error('Test error:', error)
                                    alert(`Error en prueba: ${error.message}`)
                                } finally {
                                    setIsSaving(false)
                                }
                            }}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Sparkles className="w-4 h-4" />
                            Probar Integración
                        </motion.button>

                        <motion.button
                            onClick={() => window.open('https://calendar.google.com', '_blank')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[var(--color-primary)] text-white"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Abrir Calendar
                        </motion.button>
                    </div>
                </div>

                <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium mb-1">Información</p>
                        <p>La integración usa una Service Account. Asegúrate de haber compartido tu calendario con el email de servicio y configurado las variables de entorno en Supabase.</p>
                    </div>
                </div>
            </motion.div>

            {/* Email Templates Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6 shadow-[var(--shadow-card)]"
            >
                <EmailTemplatesSettings />
            </motion.div>

            {/* Landing Page Content Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6 shadow-[var(--shadow-card)]"
            >
                <LandingContentSettings />
            </motion.div>
        </div>
    )
}

