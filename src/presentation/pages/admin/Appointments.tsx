import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
    Calendar as CalendarIcon,
    Check,
    X,
    Video,
    MapPin,
    Filter,
    Clock,
    AlertCircle,
    Phone,
    Home,
    Trash2
} from 'lucide-react'
import { useAppointmentStore } from '../../../infrastructure/store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment, Profile } from '../../../domain/entities'
import { supabase } from '../../../infrastructure/supabase/client'
import { Plus } from 'lucide-react'

export default function AdminAppointments() {
    const {
        appointments,
        fetchAppointments,
        confirmAppointment,
        cancelAppointment,
        rescheduleAppointment,
        createAppointment,
        isLoading
    } = useAppointmentStore()

    // UI State
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [view, setView] = useState<'calendar' | 'list'>('calendar')

    // Modals State
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
    const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '09:00', duration: 60 })

    const [isCancelOpen, setIsCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState('')

    // Manual Creation State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({
        patientId: '',
        date: '',
        time: '09:00',
        appointmentType: 'virtual' as 'virtual' | 'presencial',
        notes: ''
    })
    const [patients, setPatients] = useState<Profile[]>([])

    useEffect(() => {
        fetchAppointments()
        fetchPatients()
    }, [fetchAppointments])

    const fetchPatients = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'patient')
            .order('full_name', { ascending: true })

        if (data) {
            setPatients(data.map(p => ({
                id: p.id,
                email: p.email,
                fullName: p.full_name,
                phone: p.phone,
                residence: (p as any).residence,
                avatarUrl: p.avatar_url,
                role: p.role,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at)
            })))
        }
    }

    // --- Action Handlers ---

    const handleConfirm = async (apt: Appointment) => {
        await confirmAppointment(apt.id)
        if (selectedAppointment?.id === apt.id) setSelectedAppointment(null)
    }

    const openCancel = (apt: Appointment) => {
        setSelectedAppointment(apt)
        setIsCancelOpen(true)
    }

    const handleCancelConfirm = async () => {
        if (!selectedAppointment) return
        await cancelAppointment({
            appointmentId: selectedAppointment.id,
            reason: cancelReason,
            cancelledBy: 'psychologist'
        })
        setIsCancelOpen(false)
        setSelectedAppointment(null)
        setCancelReason('')
    }

    const openReschedule = (apt: Appointment) => {
        setSelectedAppointment(apt)
        setRescheduleForm({
            date: format(apt.startTime, 'yyyy-MM-dd'),
            time: format(apt.startTime, 'HH:mm'),
            duration: 60 // Default duration
        })
        setIsRescheduleOpen(true)
    }

    const handleRescheduleConfirm = async () => {
        if (!selectedAppointment) return

        const [year, month, day] = rescheduleForm.date.split('-').map(Number)
        const [hours, minutes] = rescheduleForm.time.split(':').map(Number)

        const newStart = new Date(year, month - 1, day, hours, minutes)
        const newEnd = new Date(newStart.getTime() + rescheduleForm.duration * 60000)

        await rescheduleAppointment(selectedAppointment.id, newStart, newEnd)
        setIsRescheduleOpen(false)
        setSelectedAppointment(null)
    }

    const handleCreate = async () => {
        if (!createForm.patientId || !createForm.date || !createForm.time) return

        try {
            const [year, month, day] = createForm.date.split('-').map(Number)
            const [hours, minutes] = createForm.time.split(':').map(Number)

            const start = new Date(year, month - 1, day, hours, minutes)
            const end = new Date(start.getTime() + 60 * 60000) // Default 1 hour

            await createAppointment({
                patientId: createForm.patientId,
                startTime: start,
                endTime: end,
                appointmentType: createForm.appointmentType,
                notes: createForm.notes
            })

            setIsCreateOpen(false)
            setCreateForm({ patientId: '', date: '', time: '09:00', appointmentType: 'virtual', notes: '' })
            alert('Cita creada exitosamente')
        } catch (error) {
            console.error(error)
            alert('Error al crear la cita')
        }
    }

    // --- Data Processing ---

    const calendarEvents = appointments
        .filter(apt => filterStatus === 'all' || apt.status === filterStatus)
        .map(apt => {
            // Color mapping based on status
            let bgColor = '#f59e0b' // Default: amber for pending
            let txtColor = '#ffffff'

            if (apt.status === 'confirmed') {
                bgColor = '#22c55e' // Green
            } else if (apt.status === 'cancelled') {
                bgColor = '#ef4444' // Red
            } else if (apt.status === 'completed') {
                bgColor = '#64748b' // Slate/gray
            }

            return {
                id: apt.id,
                title: apt.patient?.fullName || 'Paciente',
                start: apt.startTime,
                end: apt.endTime,
                backgroundColor: bgColor,
                borderColor: bgColor,
                textColor: txtColor,
                extendedProps: { appointment: apt }
            }
        })

    const filteredAppointments = appointments
        .filter(apt => filterStatus === 'all' || apt.status === filterStatus)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        completed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Citas</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Gestiona todas las citas de tus pacientes
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:opacity-90 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nueva Cita</span>
                    </button>

                    {/* Filter */}
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-1 border border-[var(--color-primary)]/10">
                        <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-[var(--color-primary)] text-white' : ''}`}>Todas</button>
                        <button onClick={() => setFilterStatus('pending')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : ''}`}>Pendientes</button>
                        <button onClick={() => setFilterStatus('confirmed')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'confirmed' ? 'bg-green-500 text-white' : ''}`}>Confirmadas</button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-xl p-1 border border-[var(--color-primary)]/10">
                        <button onClick={() => setView('calendar')} className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-[var(--color-primary)] text-white' : ''}`}>
                            <CalendarIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-[var(--color-primary)] text-white' : ''}`}>
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
                </div>
            ) : view === 'calendar' ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
                >
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek'
                        }}
                        buttonText={{
                            today: 'Hoy',
                            month: 'Mes',
                            week: 'Semana',
                            day: 'Día'
                        }}
                        locale={es}
                        events={calendarEvents}
                        eventClick={(info) => {
                            setSelectedAppointment(info.event.extendedProps.appointment)
                        }}
                        height="auto"
                        slotMinTime="08:00:00"
                        slotMaxTime="20:00:00"
                        allDaySlot={false}
                        weekends={true}
                        nowIndicator={true}
                    />
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {filteredAppointments.map((apt, index) => (
                        <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[var(--color-primary)]/10"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${apt.appointmentType === 'virtual'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                                        : 'bg-green-50 dark:bg-green-900/20 text-green-500'
                                        }`}>
                                        {apt.appointmentType === 'virtual' ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{apt.patient?.fullName || 'Paciente'}</h3>
                                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                            {format(apt.startTime, "EEEE d 'de' MMMM", { locale: es })} • {format(apt.startTime, 'HH:mm')} - {format(apt.endTime, 'HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[apt.status]}`}>
                                        {apt.status === 'pending' ? 'Pendiente' : apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                                    </span>

                                    {apt.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                onClick={() => handleConfirm(apt)}
                                                className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-500 hover:bg-green-100"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Confirmar"
                                            >
                                                <Check className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openReschedule(apt)}
                                                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Reagendar"
                                            >
                                                <CalendarIcon className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openCancel(apt)}
                                                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                title="Cancelar"
                                            >
                                                <X className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Appointment Details Modal (from Calendar Click) */}
            <AnimatePresence>
                {selectedAppointment && !isRescheduleOpen && !isCancelOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedAppointment(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-start">
                                <div>
                                    <h3 className="font-display text-lg font-semibold">{selectedAppointment.patient?.fullName}</h3>
                                    <p className="text-sm text-slate-500">{selectedAppointment.patient?.email}</p>
                                </div>
                                <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Patient Contact Info */}
                                {selectedAppointment.patient?.phone && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Phone className="w-5 h-5 text-[var(--color-primary)]" />
                                            <a href={`tel:${selectedAppointment.patient.phone}`} className="hover:text-[var(--color-primary)]">
                                                {selectedAppointment.patient.phone}
                                            </a>
                                        </div>
                                        <motion.a
                                            href={`tel:${selectedAppointment.patient.phone}`}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/50"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Phone className="w-4 h-4" />
                                            Llamar
                                        </motion.a>
                                    </div>
                                )}
                                {(selectedAppointment.patient as any)?.residence && (
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Home className="w-5 h-5 text-[var(--color-primary)]" />
                                        <span>{(selectedAppointment.patient as any).residence}</span>
                                    </div>
                                )}

                                {/* Divider */}
                                {(selectedAppointment.patient?.phone || (selectedAppointment.patient as any)?.residence) && (
                                    <hr className="border-slate-200 dark:border-zinc-700" />
                                )}

                                {/* Appointment Info */}
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <CalendarIcon className="w-5 h-5" />
                                    <span>{format(selectedAppointment.startTime, "EEEE d 'de' MMMM", { locale: es })}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Clock className="w-5 h-5" />
                                    <span>{format(selectedAppointment.startTime, 'HH:mm')} - {format(selectedAppointment.endTime, 'HH:mm')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    {selectedAppointment.appointmentType === 'virtual' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                    <span className="capitalize">{selectedAppointment.appointmentType}</span>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[selectedAppointment.status]}`}>
                                        {selectedAppointment.status === 'pending' ? 'Pendiente' : selectedAppointment.status === 'confirmed' ? 'Confirmada' : selectedAppointment.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                                    </span>
                                </div>

                                {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellationReason && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600">
                                        <span className="font-semibold">Motivo de cancelación:</span> {selectedAppointment.cancellationReason}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 flex justify-between gap-2">
                                {/* Cancel/Delete button - available for non-cancelled appointments */}
                                {selectedAppointment.status !== 'cancelled' && (
                                    <button
                                        onClick={() => openCancel(selectedAppointment)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-600 font-medium hover:bg-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Cancelar Cita
                                    </button>
                                )}

                                <div className="flex gap-2 ml-auto">
                                    {selectedAppointment.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleConfirm(selectedAppointment)}
                                                className="px-4 py-2 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => openReschedule(selectedAppointment)}
                                                className="px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600"
                                            >
                                                Reagendar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reschedule Modal */}
            <AnimatePresence>
                {isRescheduleOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 space-y-4"
                        >
                            <h3 className="text-lg font-semibold">Reagendar Cita</h3>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Nueva Fecha</label>
                                <input
                                    type="date"
                                    value={rescheduleForm.date}
                                    onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Nueva Hora</label>
                                <input
                                    type="time"
                                    value={rescheduleForm.time}
                                    onChange={e => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setIsRescheduleOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                                <button
                                    onClick={handleRescheduleConfirm}
                                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel Modal */}
            <AnimatePresence>
                {isCancelOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 space-y-4"
                        >
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertCircle className="w-6 h-6" />
                                <h3 className="text-lg font-semibold">Cancelar Cita</h3>
                            </div>

                            <p className="text-sm text-slate-500">
                                ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
                            </p>

                            <textarea
                                placeholder="Motivo de cancelación (opcional)..."
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setIsCancelOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg">Volver</button>
                                <button
                                    onClick={handleCancelConfirm}
                                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                                >
                                    Confirmar Cancelación
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Manual Appointment Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold">Nueva Cita Manual</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Paciente</label>
                                    <select
                                        value={createForm.patientId}
                                        onChange={e => setCreateForm({ ...createForm, patientId: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent"
                                    >
                                        <option value="">Selecciona un paciente...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={createForm.date}
                                            onChange={e => setCreateForm({ ...createForm, date: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hora</label>
                                        <input
                                            type="time"
                                            value={createForm.time}
                                            onChange={e => setCreateForm({ ...createForm, time: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de Cita</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setCreateForm({ ...createForm, appointmentType: 'virtual' })}
                                            className={`px-4 py-2 rounded-xl border transition-all ${createForm.appointmentType === 'virtual'
                                                ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Video className="w-4 h-4" />
                                                Virtual
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setCreateForm({ ...createForm, appointmentType: 'presencial' })}
                                            className={`px-4 py-2 rounded-xl border transition-all ${createForm.appointmentType === 'presencial'
                                                ? 'bg-green-50 border-green-500 text-green-600 dark:bg-green-900/20'
                                                : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Presencial
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Notas (Opcional)</label>
                                    <textarea
                                        value={createForm.notes}
                                        onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                                        placeholder="Detalles adicionales..."
                                        className="w-full h-20 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!createForm.patientId || !createForm.date || !createForm.time}
                                    className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                                >
                                    Crear Cita
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
