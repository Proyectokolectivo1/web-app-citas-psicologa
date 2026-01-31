import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Check,
    RefreshCw
} from 'lucide-react'
import { useAuthStore, useAppointmentStore, useSettingsStore } from '../../../infrastructure/store'
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TimeSlot, Appointment } from '../../../domain/entities'

export default function PatientAppointments() {
    const { profile } = useAuthStore()
    const {
        appointments,
        availability,
        availabilityOverrides,
        isLoading,
        error,
        fetchAppointments,
        fetchAvailability,
        fetchAvailabilityOverrides,
        getAvailableSlots,
        createAppointment,
        cancelAppointment,
        rescheduleAppointment,
        clearError
    } = useAppointmentStore()
    const { fetchSetting } = useSettingsStore()

    // Calendar & Booking State
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
    const [prices, setPrices] = useState({ virtual: 0, presencial: 0 })

    useEffect(() => {
        const loadPrices = async () => {
            try {
                const vVal = await fetchSetting('virtual_price')
                const pVal = await fetchSetting('presencial_price')

                // Handle potential different data types (string vs object) from DB
                const parsePrice = (val: any) => {
                    if (!val) return 0
                    if (typeof val === 'number') return val
                    if (typeof val === 'string') {
                        try {
                            const parsed = JSON.parse(val)
                            return parsed.amount || 0
                        } catch {
                            return 0
                        }
                    }
                    return val.amount || 0
                }

                setPrices({
                    virtual: parsePrice(vVal),
                    presencial: parsePrice(pVal)
                })
            } catch (e) {
                console.error('Error loading prices', e)
            }
        }
        loadPrices()
    }, [])

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Form State
    const [appointmentType, setAppointmentType] = useState<'virtual' | 'presencial'>('virtual')
    const [notes, setNotes] = useState('')

    // Modals & Actions State
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)

    const [showCancelModal, setShowCancelModal] = useState(false)
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
    const [cancelReason, setCancelReason] = useState('')

    const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null)
    const [rescheduleSuccess, setRescheduleSuccess] = useState(false)

    useEffect(() => {
        if (profile?.id) {
            fetchAppointments(profile.id)
        }
        fetchAvailability()
        fetchAvailabilityOverrides()
    }, [profile?.id, fetchAppointments, fetchAvailability, fetchAvailabilityOverrides])

    useEffect(() => {
        const loadSlots = async () => {
            const slots = await getAvailableSlots(selectedDate, 60)
            setTimeSlots(slots)
        }
        loadSlots()
    }, [selectedDate, appointments, availability, availabilityOverrides, getAvailableSlots])

    // --- Actions ---

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setSelectedSlot(null)
    }

    const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7))
    const handleNextWeek = () => setWeekStart(addDays(weekStart, 7))
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const handleSlotSelect = (slot: TimeSlot) => {
        if (slot.isAvailable) {
            setSelectedSlot(slot)
            setShowBookingModal(true)
        }
    }

    const startReschedule = (apt: Appointment) => {
        setAppointmentToReschedule(apt)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // clear any stale state
        setSelectedSlot(null)
        setNotes('')
    }

    const cancelRescheduleMode = () => {
        setAppointmentToReschedule(null)
        setSelectedSlot(null)
    }

    const handleBookAppointment = async () => {
        if (!selectedSlot || !profile?.id) return

        try {
            if (appointmentToReschedule) {
                // Reschedule Flow
                await rescheduleAppointment(
                    appointmentToReschedule.id,
                    selectedSlot.startTime,
                    selectedSlot.endTime
                )
                setRescheduleSuccess(true)
                setAppointmentToReschedule(null)
            } else {
                // New Booking Flow
                await createAppointment({
                    patientId: profile.id,
                    startTime: selectedSlot.startTime,
                    endTime: selectedSlot.endTime,
                    appointmentType,
                    notes: notes || undefined
                })
                setBookingSuccess(true)
            }

            // Cleanup / Success Feedback
            setShowBookingModal(false)
            setSelectedSlot(null)
            setNotes('')
            setTimeout(() => {
                setBookingSuccess(false)
                setRescheduleSuccess(false)
            }, 5000)

        } catch (err) {
            // Error handled in store (sets 'error' state)
        }
    }

    const handleCancelClick = (apt: Appointment) => {
        setAppointmentToCancel(apt)
        setShowCancelModal(true)
    }

    const handleConfirmCancel = async () => {
        if (!appointmentToCancel) return

        try {
            await cancelAppointment({
                appointmentId: appointmentToCancel.id,
                reason: cancelReason || undefined,
                cancelledBy: 'patient'
            })
            setShowCancelModal(false)
            setAppointmentToCancel(null)
            setCancelReason('')
        } catch (err) {
            // Error handled
        }
    }

    const myAppointments = appointments
        .filter(apt => apt.status !== 'cancelled')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        completed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-2xl font-semibold">Mis Citas</h1>
                <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                    Agenda y gestiona tus sesiones
                </p>
            </div>

            {/* Success Feedback */}
            <AnimatePresence>
                {bookingSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/10"
                    >
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">¡Cita agendada exitosamente!</p>
                            <p className="text-sm opacity-90">Recibirás un correo de confirmación de Google Calendar.</p>
                        </div>
                    </motion.div>
                )}
                {rescheduleSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/10"
                    >
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">¡Cita reagendada!</p>
                            <p className="text-sm opacity-90">Tu horario se ha actualizado.</p>
                        </div>
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/10"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                        <button onClick={clearError} className="ml-auto p-1 hover:bg-black/5 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Calendar Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 border transition-all ${appointmentToReschedule
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-[var(--color-primary)]/10'
                    }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                            {appointmentToReschedule ? 'Selecciona una nueva fecha y hora' : 'Seleccionar Fecha'}
                        </h2>
                        {appointmentToReschedule && (
                            <p className="text-sm text-blue-600 mt-1">
                                Estás cambiando tu cita del <strong>{format(appointmentToReschedule.startTime, "d 'de' MMMM", { locale: es })}</strong>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl">
                        <button onClick={handlePrevWeek} className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium min-w-[150px] text-center">
                            {format(weekStart, "MMMM yyyy", { locale: es })}
                        </span>
                        <button onClick={handleNextWeek} className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {appointmentToReschedule && (
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={cancelRescheduleMode}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                        >
                            Cancelar Reagendamiento
                        </button>
                    </div>
                )}

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2 mb-8">
                    {weekDays.map((day) => {
                        const isPast = isBefore(day, new Date()) && !isToday(day)
                        const isSelected = isSameDay(day, selectedDate)

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => !isPast && handleDateSelect(day)}
                                disabled={isPast}
                                className={`p-3 rounded-2xl text-center transition-all border ${isPast
                                    ? 'opacity-40 cursor-not-allowed border-transparent'
                                    : isSelected
                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20'
                                        : isToday(day)
                                            ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] border-[var(--color-primary)]/20'
                                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <p className="text-xs uppercase mb-1 font-medium opacity-80">
                                    {format(day, 'EEE', { locale: es })}
                                </p>
                                <p className="text-xl font-bold">{format(day, 'd')}</p>
                            </button>
                        )
                    })}
                </div>

                {/* Time Slots */}
                <div>
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        Horarios Disponibles
                    </h3>

                    {timeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {timeSlots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSlotSelect(slot)}
                                    disabled={!slot.isAvailable}
                                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${slot.isAvailable
                                        ? 'bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md'
                                        : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-300 dark:text-zinc-700 cursor-not-allowed decoration-slate-300 line-through'
                                        }`}
                                >
                                    {format(slot.startTime, 'HH:mm')}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                            <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                No hay horarios disponibles para esta fecha
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* My Appointments List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Mis Citas Programadas
                </h2>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
                    </div>
                ) : myAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {myAppointments.map((apt) => (
                            <motion.div
                                key={apt.id}
                                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-[var(--color-primary)]/10 shadow-sm"
                                whileHover={{ scale: 1.005 }}
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${apt.appointmentType === 'virtual'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                                            : 'bg-green-50 dark:bg-green-900/20 text-green-500'
                                            }`}>
                                            {apt.appointmentType === 'virtual' ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">
                                                {format(apt.startTime, "EEEE d 'de' MMMM", { locale: es })}
                                            </p>
                                            <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                                {format(apt.startTime, 'HH:mm')} - {format(apt.endTime, 'HH:mm')} • {apt.appointmentType === 'virtual' ? 'Videollamada' : 'Presencial'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[apt.status]}`}>
                                            {apt.status === 'pending' ? 'Pendiente' : apt.status === 'confirmed' ? 'Confirmada' : 'Completada'}
                                        </span>

                                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                            <div className="flex gap-2 ml-auto sm:ml-2">
                                                <button
                                                    onClick={() => startReschedule(apt)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition cursor-pointer"
                                                    title="Reagendar Cita"
                                                >
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelClick(apt)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition cursor-pointer"
                                                    title="Cancelar Cita"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-[var(--color-primary)]/10">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No tienes citas programadas</p>
                        <p className="text-slate-400 dark:text-slate-500">Selecciona una fecha en el calendario para comenzar.</p>
                    </div>
                )}
            </motion.div>

            {/* Booking / Confirmation Modal */}
            <AnimatePresence>
                {showBookingModal && selectedSlot && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowBookingModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-semibold">
                                    {appointmentToReschedule ? 'Confirmar Cambio' : 'Agendar Cita'}
                                </h2>
                                <button onClick={() => setShowBookingModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Summary Card */}
                                <div className="bg-gradient-to-br from-[var(--color-primary)]/10 to-blue-500/5 rounded-2xl p-5 border border-[var(--color-primary)]/20">
                                    <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-2">HORARIO SELECCIONADO</p>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                                        <p className="font-medium text-lg text-slate-800 dark:text-slate-200">
                                            {format(selectedSlot.startTime, "EEEE d 'de' MMMM", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                            {format(selectedSlot.startTime, 'HH:mm')} - {format(selectedSlot.endTime, 'HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                {!appointmentToReschedule && (
                                    <>
                                        {/* Type Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3 text-slate-600 dark:text-slate-400">Modalidad</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setAppointmentType('virtual')}
                                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${appointmentType === 'virtual'
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                                        : 'border-slate-100 dark:border-zinc-800 text-slate-400 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <Video className="w-6 h-6" />
                                                    <span className="text-sm font-semibold">Virtual</span>
                                                    {prices.virtual > 0 && (
                                                        <span className="text-xs font-medium opacity-80">{formatPrice(prices.virtual)}</span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setAppointmentType('presencial')}
                                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${appointmentType === 'presencial'
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                                        : 'border-slate-100 dark:border-zinc-800 text-slate-400 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <MapPin className="w-6 h-6" />
                                                    <span className="text-sm font-semibold">Presencial</span>
                                                    {prices.presencial > 0 && (
                                                        <span className="text-xs font-medium opacity-80">{formatPrice(prices.presencial)}</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">Notas adicionales (opcional)</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Ej: Es mi primera vez..."
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none resize-none transition-all"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Action Button */}
                                <motion.button
                                    onClick={handleBookAppointment}
                                    disabled={isLoading}
                                    className="w-full bg-[var(--color-primary)] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-50 disabled:shadow-none"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isLoading
                                        ? 'Procesando...'
                                        : appointmentToReschedule
                                            ? 'Confirmar Cambio de Horario'
                                            : 'Agendar Cita'
                                    }
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {showCancelModal && appointmentToCancel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl border-2 border-red-100 dark:border-red-900/10"
                        >
                            <div className="flex items-center gap-3 text-red-500 mb-6">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h2 className="font-display text-xl font-semibold">Cancelar Cita</h2>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                ¿Estás seguro de que deseas cancelar tu cita del <strong>{format(appointmentToCancel.startTime, "d 'de' MMMM", { locale: es })}</strong>? Esta acción liberará el horario para otros pacientes.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 text-slate-600">Motivo (opcional)</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Cuéntanos el motivo..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 outline-none resize-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                                >
                                    Volver
                                </button>
                                <motion.button
                                    onClick={handleConfirmCancel}
                                    disabled={isLoading}
                                    className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-red-500/20 hover:bg-red-600 transition disabled:opacity-50"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isLoading ? 'Cancelando...' : 'Sí, Cancelar'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
