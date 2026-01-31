import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Check, X, AlertCircle } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAppointmentStore } from '../../../infrastructure/store'
import type { AvailabilitySlot } from '../../../domain/entities'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
]

export default function AdminAvailability() {
    const {
        availability,
        availabilityOverrides,
        fetchAvailability,
        updateAvailability,
        fetchAvailabilityOverrides,
        upsertAvailabilityOverride,
        blockAvailabilityRange,
        deleteAvailabilityOverridesInRange,
        isLoading,
        error,
        clearError
    } = useAppointmentStore()

    const [editingSlots, setEditingSlots] = useState<AvailabilitySlot[]>([])
    const [hasChanges, setHasChanges] = useState(false)
    const [viewMode, setViewMode] = useState<'weekly' | 'calendar'>('weekly')

    // Override Modal State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
    const [overrideForm, setOverrideForm] = useState<{
        isUnavailable: boolean
        slots: { startTime: string; endTime: string }[]
    }>({ isUnavailable: false, slots: [] })

    // Block Month Modal State
    const [isBlockMonthModalOpen, setIsBlockMonthModalOpen] = useState(false)
    const [startBlockMonth, setStartBlockMonth] = useState(new Date().getMonth())
    const [startBlockYear, setStartBlockYear] = useState(new Date().getFullYear())
    const [endBlockMonth, setEndBlockMonth] = useState(new Date().getMonth())
    const [endBlockYear, setEndBlockYear] = useState(new Date().getFullYear())

    useEffect(() => {
        fetchAvailability()
        fetchAvailabilityOverrides()
    }, [fetchAvailability, fetchAvailabilityOverrides])

    useEffect(() => {
        // Deep copy availability to editingSlots
        setEditingSlots(availability.map(a => ({ ...a })))
    }, [availability])

    // --- Weekly Schedule Handlers ---

    const handleToggleDay = (dayOfWeek: number) => {
        const daySlots = editingSlots.filter(s => s.dayOfWeek === dayOfWeek)
        const hasActive = daySlots.some(s => s.isActive)

        if (hasActive) {
            // Deactivate ALL slots for this day
            const updated = editingSlots.map(s =>
                s.dayOfWeek === dayOfWeek ? { ...s, isActive: false } : s
            )
            setEditingSlots(updated)
        } else {
            // Activate current slots or create a new one if none exist
            if (daySlots.length > 0) {
                const updated = editingSlots.map(s =>
                    s.dayOfWeek === dayOfWeek ? { ...s, isActive: true } : s
                )
                setEditingSlots(updated)
            } else {
                const newSlot: AvailabilitySlot = {
                    id: crypto.randomUUID(),
                    dayOfWeek,
                    startTime: '09:00',
                    endTime: '17:00',
                    isActive: true
                }
                setEditingSlots([...editingSlots, newSlot])
            }
        }
        setHasChanges(true)
    }

    const handleTimeChange = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
        const updated = editingSlots.map(s =>
            s.id === slotId ? { ...s, [field]: value } : s
        )
        setEditingSlots(updated)
        setHasChanges(true)
    }

    const handleAddSlot = (dayOfWeek: number) => {
        const newSlot: AvailabilitySlot = {
            id: crypto.randomUUID(),
            dayOfWeek,
            startTime: '09:00',
            endTime: '13:00',
            isActive: true
        }
        setEditingSlots([...editingSlots, newSlot])
        setHasChanges(true)
    }

    const handleRemoveSlot = (slotId: string) => {
        setEditingSlots(editingSlots.filter(s => s.id !== slotId))
        setHasChanges(true)
    }

    const handleSaveWeekly = async () => {
        await updateAvailability(editingSlots)
        setHasChanges(false)
    }

    // --- Calendar Override Handlers ---

    const handleDateClick = (arg: any) => {
        const date = arg.date
        // Adjust for timezone if needed, usually FullCalendar gives local date at 00:00
        const dateStr = format(date, 'yyyy-MM-dd')
        const existingOverride = availabilityOverrides.find(o => o.date === dateStr)

        setSelectedDate(date)
        setOverrideForm({
            isUnavailable: existingOverride?.isUnavailable || false,
            // Default slots if not unavailable and no existing slots
            slots: existingOverride?.slots && existingOverride.slots.length > 0
                ? existingOverride.slots
                : [{ startTime: '09:00', endTime: '17:00' }]
        })
        setIsOverrideModalOpen(true)
    }

    const handleSaveOverride = async () => {
        if (!selectedDate) return

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            console.log('Saving override for:', dateStr)

            await upsertAvailabilityOverride({
                date: dateStr,
                isUnavailable: overrideForm.isUnavailable,
                slots: overrideForm.slots
            })
            setIsOverrideModalOpen(false)
        } catch (error) {
            console.error('Failed to save override:', error)
            // Error is already set in store and displayed in UI
        }
    }

    const handleDeleteOverride = async () => {
        if (!selectedDate) return
        if (!confirm('¿Estás seguro que deseas eliminar esta excepción y restaurar el horario habitual?')) return

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            // Using deleteInRange for a single day effectively deletes the specific override
            await deleteAvailabilityOverridesInRange(dateStr, dateStr)
            setIsOverrideModalOpen(false)
        } catch (error) {
            console.error('Failed to delete override:', error)
        }
    }

    const handleBlockMonth = async () => {
        try {
            // Start Date: 1st of Start Month
            const startDate = `${startBlockYear}-${String(startBlockMonth + 1).padStart(2, '0')}-01`

            // End Date: Last day of End Month
            const daysInEndMonth = new Date(endBlockYear, endBlockMonth + 1, 0).getDate()
            const endDate = `${endBlockYear}-${String(endBlockMonth + 1).padStart(2, '0')}-${String(daysInEndMonth).padStart(2, '0')}`

            const startLabel = format(new Date(startBlockYear, startBlockMonth), 'MMMM yyyy', { locale: es })
            const endLabel = format(new Date(endBlockYear, endBlockMonth), 'MMMM yyyy', { locale: es })

            if (confirm(`¿Estás seguro que deseas bloquear el periodo de ${startLabel} hasta ${endLabel}? Esto anulará cualquier configuración previa.`)) {
                await blockAvailabilityRange(startDate, endDate)
                setIsBlockMonthModalOpen(false)
                alert('Periodo bloqueado exitosamente')
            }
        } catch (error) {
            console.error('Failed to block period:', error)
        }
    }

    const handleUnblockMonth = async () => {
        try {
            // Start Date: 1st of Start Month
            const startDate = `${startBlockYear}-${String(startBlockMonth + 1).padStart(2, '0')}-01`

            // End Date: Last day of End Month
            const daysInEndMonth = new Date(endBlockYear, endBlockMonth + 1, 0).getDate()
            const endDate = `${endBlockYear}-${String(endBlockMonth + 1).padStart(2, '0')}-${String(daysInEndMonth).padStart(2, '0')}`

            const startLabel = format(new Date(startBlockYear, startBlockMonth), 'MMMM yyyy', { locale: es })
            const endLabel = format(new Date(endBlockYear, endBlockMonth), 'MMMM yyyy', { locale: es })

            if (confirm(`¿Estás seguro que deseas DESBLOQUEAR el periodo de ${startLabel} hasta ${endLabel}? Se eliminarán todas las excepciones configuradas.`)) {
                await deleteAvailabilityOverridesInRange(startDate, endDate)
                setIsBlockMonthModalOpen(false)
                alert('Periodo desbloqueado exitosamente')
            }
        } catch (error) {
            console.error('Failed to unblock month:', error)
        }
    }

    // Computed Events for Calendar
    const calendarEvents = availabilityOverrides.map(o => ({
        title: o.isUnavailable ? 'Cerrado' : 'Especial',
        start: o.date,
        allDay: true,
        backgroundColor: o.isUnavailable ? '#ef4444' : '#f59e0b',
        borderColor: 'transparent',
        display: 'block',
        textColor: '#ffffff'
    }))

    return (
        <div className="space-y-6 max-w-4xl mx-auto relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Disponibilidad</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Configura tus horarios de atención y excepciones
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-[var(--color-primary)]/10">
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'weekly'
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'text-[var(--color-text-secondary-light)] hover:bg-slate-50 dark:hover:bg-zinc-800'
                            }`}
                    >
                        Semanal
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar'
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'text-[var(--color-text-secondary-light)] hover:bg-slate-50 dark:hover:bg-zinc-800'
                            }`}
                    >
                        Calendario / Feriados
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1"></div>
                    <button
                        onClick={() => setIsBlockMonthModalOpen(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Gestionar Mes
                    </button>
                </div>
            </div>

            {/* Views */}
            <AnimatePresence mode="wait">
                {viewMode === 'weekly' ? (
                    <motion.div
                        key="weekly"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-end">
                            {hasChanges && (
                                <button
                                    onClick={handleSaveWeekly}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-105 transition-transform"
                                >
                                    <Check className="w-5 h-5" />
                                    Guardar Cambios
                                </button>
                            )}
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10">
                            <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                                Horario Recurrente
                            </h2>
                            <div className="space-y-4">
                                {DAYS_OF_WEEK.map((day) => {
                                    const daySlots = editingSlots.filter(s => s.dayOfWeek === day.value && s.isActive)
                                    const isActive = daySlots.length > 0

                                    return (
                                        <div
                                            key={day.value}
                                            className={`p-4 rounded-xl border-2 transition-all ${isActive
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                                : 'border-slate-100 dark:border-zinc-800'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleToggleDay(day.value)}
                                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isActive
                                                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                                            : 'border-slate-300 dark:border-zinc-600'
                                                            }`}
                                                    >
                                                        {isActive && <Check className="w-4 h-4" />}
                                                    </button>
                                                    <span className={`font-medium ${isActive ? '' : 'text-slate-400'}`}>
                                                        {day.label}
                                                    </span>
                                                </div>

                                                {isActive && (
                                                    <button
                                                        onClick={() => handleAddSlot(day.value)}
                                                        className="text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg transition"
                                                    >
                                                        + Agregar Horario
                                                    </button>
                                                )}
                                            </div>

                                            {isActive && (
                                                <div className="space-y-2 pl-10">
                                                    {daySlots.map((slot, index) => (
                                                        <div key={slot.id || index} className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) => handleTimeChange(slot.id, 'startTime', e.target.value)}
                                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                            />
                                                            <span className="text-slate-400">-</span>
                                                            <input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) => handleTimeChange(slot.id, 'endTime', e.target.value)}
                                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                            />
                                                            <button
                                                                onClick={() => handleRemoveSlot(slot.id)}
                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                                title="Eliminar horario"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
                    >
                        <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Haz clic en un día para marcarlo como <strong>Feriado</strong> o configurar un <strong>Horario Especial</strong>.</p>
                        </div>

                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={es}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth'
                            }}
                            buttonText={{
                                today: 'Hoy',
                                month: 'Mes'
                            }}
                            dateClick={handleDateClick}
                            events={calendarEvents}
                            height="auto"
                            selectable={true}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Override Modal */}
            <AnimatePresence>
                {isOverrideModalOpen && selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-display text-lg font-semibold">
                                    Editar {format(selectedDate, "d 'de' MMMM", { locale: es })}
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsOverrideModalOpen(false)
                                        if (error) clearError()
                                    }}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}
                                {/* Is Unavailable Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800 cursor-pointer" onClick={() => setOverrideForm(f => ({ ...f, isUnavailable: !f.isUnavailable }))}>
                                    <div>
                                        <p className="font-medium">Marcar como No Disponible</p>
                                        <p className="text-xs text-slate-500">Feriados, vacaciones o días libres</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${overrideForm.isUnavailable
                                        ? 'bg-red-500 border-red-500 text-white'
                                        : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                                        }`}>
                                        {overrideForm.isUnavailable && <Check className="w-4 h-4" />}
                                    </div>
                                </div>

                                {/* Custom Slots (if available) */}
                                {!overrideForm.isUnavailable && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Horario Especial</p>
                                            <button
                                                onClick={() => setOverrideForm(f => ({
                                                    ...f,
                                                    slots: [...f.slots, { startTime: '09:00', endTime: '13:00' }]
                                                }))}
                                                className="text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg transition"
                                            >
                                                + Agregar Horario
                                            </button>
                                        </div>
                                        {overrideForm.slots.map((slot, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => setOverrideForm(f => ({
                                                        ...f,
                                                        slots: f.slots.map((s, i) => i === idx ? { ...s, startTime: e.target.value } : s)
                                                    }))}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                />
                                                <span className="text-slate-400">-</span>
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => setOverrideForm(f => ({
                                                        ...f,
                                                        slots: f.slots.map((s, i) => i === idx ? { ...s, endTime: e.target.value } : s)
                                                    }))}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                />
                                                <button
                                                    onClick={() => setOverrideForm(f => ({
                                                        ...f,
                                                        slots: f.slots.filter((_, i) => i !== idx)
                                                    }))}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setIsOverrideModalOpen(false)
                                        if (error) clearError()
                                    }}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800"
                                >
                                    Cancelar
                                </button>
                                {availabilityOverrides.some(o => selectedDate && o.date === format(selectedDate, 'yyyy-MM-dd')) && (
                                    <button
                                        onClick={handleDeleteOverride}
                                        disabled={isLoading}
                                        className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 font-medium disabled:opacity-50 border border-red-200 dark:border-red-900/30"
                                    >
                                        Restaurar Horario Normal
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveOverride}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Month Modal */}
            <AnimatePresence>
                {isBlockMonthModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="font-display text-lg font-semibold">
                                    Gestionar Periodo de Disponibilidad
                                </h3>
                                <button
                                    onClick={() => setIsBlockMonthModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Start Date */}
                                <div className="space-y-4">
                                    <p className="font-semibold text-sm uppercase tracking-wider text-slate-500">Desde</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mes</label>
                                            <select
                                                value={startBlockMonth}
                                                onChange={(e) => setStartBlockMonth(Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                            >
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i} value={i}>
                                                        {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Año</label>
                                            <select
                                                value={startBlockYear}
                                                onChange={(e) => setStartBlockYear(Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                            >
                                                {[...Array(5)].map((_, i) => {
                                                    const y = new Date().getFullYear() + i
                                                    return <option key={y} value={y}>{y}</option>
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="space-y-4">
                                    <p className="font-semibold text-sm uppercase tracking-wider text-slate-500">Hasta</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mes</label>
                                            <select
                                                value={endBlockMonth}
                                                onChange={(e) => setEndBlockMonth(Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                            >
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i} value={i}>
                                                        {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Año</label>
                                            <select
                                                value={endBlockYear}
                                                onChange={(e) => setEndBlockYear(Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                            >
                                                {[...Array(5)].map((_, i) => {
                                                    const y = new Date().getFullYear() + i
                                                    return <option key={y} value={y}>{y}</option>
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 text-sm rounded-lg flex gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>Se aplicará la acción seleccionada a todo el rango de fechas.</p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
                                <button
                                    onClick={handleUnblockMonth}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 font-medium disabled:opacity-50 border border-green-200 dark:border-green-900/30"
                                >
                                    Desbloquear
                                </button>
                                <button
                                    onClick={handleBlockMonth}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Bloquear Periodo
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
