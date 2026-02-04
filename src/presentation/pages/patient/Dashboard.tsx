import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, FileText, Clock, ChevronRight, Sparkles, Phone, MapPin } from 'lucide-react'
import { useAuthStore, useAppointmentStore, useSettingsStore } from '../../../infrastructure/store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PatientDashboard() {
    const { profile } = useAuthStore()
    const { appointments, fetchAppointments, isLoading } = useAppointmentStore()
    const { supportContacts, fetchSupportContacts, fetchSetting } = useSettingsStore()

    const [locationUrl, setLocationUrl] = useState('https://maps.google.com/?q=6.174649,-75.346703')

    useEffect(() => {
        const loadLoc = async () => {
            const val = await fetchSetting('location_url')
            if (val) setLocationUrl(val)
        }
        loadLoc()
    }, [])

    useEffect(() => {
        if (profile?.id) {
            fetchAppointments(profile.id)
            fetchSupportContacts()
        }
    }, [profile?.id, fetchAppointments, fetchSupportContacts])

    // Get upcoming appointments
    const upcomingAppointments = appointments
        .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed' && new Date(apt.startTime) > new Date())
        .slice(0, 3)

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        completed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }

    const statusLabels = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada',
        completed: 'Completada'
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-8 text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 opacity-10">
                    <Sparkles className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                    <p className="text-white/80 text-sm mb-1">Bienvenido/a de vuelta,</p>
                    <h1 className="font-display text-3xl font-semibold mb-4">
                        {profile?.fullName?.split(' ')[0] || 'Usuario'}
                    </h1>
                    <p className="text-white/70 max-w-md">
                        Es un gusto verte. Aquí puedes gestionar tus citas y acceder a tus recursos de bienestar.
                    </p>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-4"
            >
                <Link to="/patient/appointments">
                    <motion.div
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-4">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-1">Mis Citas</h3>
                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                            Ver y agendar citas
                        </p>
                        <ChevronRight className="w-5 h-5 text-[var(--color-primary)] mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                </Link>

                <Link to="/patient/resources">
                    <motion.div
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 mb-4">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-1">Recursos</h3>
                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                            Material de apoyo
                        </p>
                        <ChevronRight className="w-5 h-5 text-[var(--color-primary)] mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                </Link>
            </motion.div>

            {/* Support Contacts */}
            {supportContacts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-500">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-semibold">Líneas de Apoyo</h2>
                            <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                Contactos disponibles para ti
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {supportContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-slate-100">{contact.role}</p>
                                    <p className="text-sm text-slate-500">{contact.name}</p>
                                </div>
                                <a
                                    href={`tel:${contact.phone}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                    Llamar
                                </a>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Upcoming Appointments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-semibold">Próximas Citas</h2>
                    <Link to="/patient/appointments" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
                        Ver todas <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
                    </div>
                ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingAppointments.map((apt, index) => (
                            <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[var(--color-primary)]/10"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {format(apt.startTime, "EEEE d 'de' MMMM", { locale: es })}
                                            </p>
                                            <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                                {format(apt.startTime, 'HH:mm')} - {format(apt.endTime, 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[apt.status]}`}>
                                        {statusLabels[apt.status]}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                            {apt.appointmentType === 'virtual' ? '📹 Virtual' : '📍 Presencial'}
                                        </span>
                                        {apt.appointmentType === 'presencial' && (
                                            <button
                                                onClick={() => window.open(locationUrl, '_blank')}
                                                className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                Ver Mapa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-[var(--color-primary)]/10">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="font-semibold mb-2">No tienes citas próximas</h3>
                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-4">
                            Agenda tu próxima sesión para continuar tu proceso
                        </p>
                        <Link to="/patient/appointments">
                            <motion.button
                                className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Agendar Cita
                            </motion.button>
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
