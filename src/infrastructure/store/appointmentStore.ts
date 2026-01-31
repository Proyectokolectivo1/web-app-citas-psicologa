import { create } from 'zustand'
import { supabase } from '../supabase/client'
import type {
    Appointment,
    CreateAppointmentInput,
    CancelAppointmentInput,
    AvailabilitySlot,
    TimeSlot,
    AvailabilityOverride
} from '../../domain/entities'
import { addMinutes, format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'
import { generateConfirmationEmail, generateCancellationEmail, generateAdminCancellationNotice } from '../utils/emailTemplates'

interface AppointmentState {
    appointments: Appointment[]
    availability: AvailabilitySlot[]
    availabilityOverrides: AvailabilityOverride[]
    isLoading: boolean
    error: string | null

    // Actions
    fetchAppointments: (patientId?: string) => Promise<void>
    fetchAppointmentsByDate: (date: Date) => Promise<void>
    createAppointment: (input: CreateAppointmentInput) => Promise<Appointment>
    cancelAppointment: (input: CancelAppointmentInput) => Promise<void>
    confirmAppointment: (appointmentId: string) => Promise<void>
    completeAppointment: (appointmentId: string) => Promise<void>

    // Availability
    fetchAvailability: () => Promise<void>
    updateAvailability: (slots: AvailabilitySlot[]) => Promise<void>
    fetchAvailabilityOverrides: () => Promise<void>
    upsertAvailabilityOverride: (override: Omit<AvailabilityOverride, 'id'>) => Promise<void>
    bulkUpsertAvailabilityOverrides: (overrides: Omit<AvailabilityOverride, 'id'>[]) => Promise<void>
    blockAvailabilityRange: (startDate: string, endDate: string) => Promise<void>
    deleteAvailabilityOverridesInRange: (startDate: string, endDate: string) => Promise<void>
    getAvailableSlots: (date: Date, duration: number) => Promise<TimeSlot[]>
    rescheduleAppointment: (appointmentId: string, newStartTime: Date, newEndTime: Date) => Promise<void>

    // Overlap checking
    checkOverlap: (startTime: Date, endTime: Date, excludeId?: string) => Promise<boolean>

    clearError: () => void
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
    appointments: [],
    availability: [],
    availabilityOverrides: [],
    isLoading: false,
    error: null,

    fetchAppointments: async (patientId?: string) => {
        try {
            set({ isLoading: true, error: null })

            let query = supabase
                .from('appointments')
                .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(
            full_name,
            email,
            phone,
            residence
          )
        `)
                .order('start_time', { ascending: true })

            if (patientId) {
                query = query.eq('patient_id', patientId)
            }

            const { data, error } = await query

            if (error) throw error

            const appointments: Appointment[] = (data || []).map(row => ({
                id: row.id,
                patientId: row.patient_id,
                startTime: new Date(row.start_time),
                endTime: new Date(row.end_time),
                appointmentType: row.appointment_type,
                status: row.status,
                notes: row.notes,
                googleEventId: row.google_event_id,
                cancellationReason: row.cancellation_reason,
                cancelledBy: row.cancelled_by,
                createdAt: new Date(row.created_at),
                patient: row.patient ? {
                    fullName: row.patient.full_name || '',
                    email: row.patient.email,
                    phone: row.patient.phone,
                    residence: (row.patient as any).residence
                } : undefined
            }))

            set({ appointments })
        } catch (error: any) {
            console.error('Fetch appointments error:', error)
            set({ error: error.message || 'Error al cargar citas' })
        } finally {
            set({ isLoading: false })
        }
    },

    fetchAppointmentsByDate: async (date: Date) => {
        try {
            set({ isLoading: true, error: null })

            const dayStart = startOfDay(date).toISOString()
            const dayEnd = endOfDay(date).toISOString()

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(
            full_name,
            email,
            phone,
            residence
          )
        `)
                .gte('start_time', dayStart)
                .lte('start_time', dayEnd)
                .order('start_time', { ascending: true })

            if (error) throw error

            const appointments: Appointment[] = (data || []).map(row => ({
                id: row.id,
                patientId: row.patient_id,
                startTime: new Date(row.start_time),
                endTime: new Date(row.end_time),
                appointmentType: row.appointment_type,
                status: row.status,
                notes: row.notes,
                googleEventId: row.google_event_id,
                cancellationReason: row.cancellation_reason,
                cancelledBy: row.cancelled_by,
                createdAt: new Date(row.created_at),
                patient: row.patient ? {
                    fullName: row.patient.full_name || '',
                    email: row.patient.email,
                    phone: row.patient.phone,
                    residence: (row.patient as any).residence
                } : undefined
            }))

            set({ appointments })
        } catch (error: any) {
            console.error('Fetch appointments by date error:', error)
            set({ error: error.message || 'Error al cargar citas' })
        } finally {
            set({ isLoading: false })
        }
    },

    createAppointment: async (input: CreateAppointmentInput) => {
        try {
            // Validate availability properly before creating
            // const { availabilityOverrides, availability } = get()
            // (Optional: add more validation here if needed)

            set({ isLoading: true, error: null })

            // Check for overlapping appointments
            const hasOverlap = await get().checkOverlap(input.startTime, input.endTime)
            if (hasOverlap) {
                throw new Error('Ya existe una cita programada en ese horario. Por favor selecciona otro horario.')
            }

            const { data, error } = await supabase
                .from('appointments')
                .insert({
                    patient_id: input.patientId,
                    start_time: input.startTime.toISOString(),
                    end_time: input.endTime.toISOString(),
                    appointment_type: input.appointmentType,
                    notes: input.notes || null,
                    status: 'confirmed' // Auto-confirm appointments - no manual confirmation needed
                })
                .select('*, patient:profiles!appointments_patient_id_fkey(email, full_name, phone)')
                .single()

            if (error) throw error

            const appointment: Appointment = {
                id: data.id,
                patientId: data.patient_id,
                startTime: new Date(data.start_time),
                endTime: new Date(data.end_time),
                appointmentType: data.appointment_type,
                status: data.status,
                notes: data.notes,
                googleEventId: data.google_event_id,
                cancellationReason: data.cancellation_reason,
                cancelledBy: data.cancelled_by,
                createdAt: new Date(data.created_at),
                patient: data.patient ? {
                    fullName: data.patient.full_name || '',
                    email: data.patient.email,
                    phone: data.patient.phone ? String(data.patient.phone) : null
                } : undefined
            }

            set(state => ({
                appointments: [...state.appointments, appointment]
            }))

            // Process integrations asynchronously
            const processIntegrations = async () => {
                // Send confirmation email
                if (data?.patient?.email) {
                    console.log('Sending confirmation email to:', data.patient.email)
                    const emailHtml = generateConfirmationEmail({
                        patientName: data.patient.full_name || 'Paciente',
                        startTime: new Date(data.start_time),
                        endTime: new Date(data.end_time),
                        appointmentType: data.appointment_type as 'virtual' | 'in-person'
                    })
                    supabase.functions.invoke('send-email', {
                        body: {
                            to: data.patient.email,
                            subject: '✅ Cita Confirmada - Ama Nacer Psicología',
                            html: emailHtml
                        }
                    }).then(({ data: emailData, error: emailError }) => {
                        if (emailError) console.error('Email error:', emailError)
                        else console.log('Confirmation email sent:', emailData)
                    }).catch(e => console.error('Email error:', e))
                }

                // Sync with Google Calendar
                supabase.functions.invoke('create-google-event', {
                    body: {
                        event: {
                            summary: `🌸 Ama Nacer - ${data.appointment_type === 'virtual' ? 'Sesión Virtual' : 'Sesión Presencial'} - ${data.patient?.full_name || 'Paciente'}`,
                            description: `Cita de Psicología - Ama Nacer\\n\\n📋 Notas: ${data.notes || 'Ninguna'}\\n\\n📧 Email: ${data.patient?.email || 'No disponible'}\\n📱 Teléfono: ${data.patient?.phone || 'No disponible'}`,
                            start: {
                                dateTime: data.start_time,
                                timeZone: 'America/Bogota'
                            },
                            end: {
                                dateTime: data.end_time,
                                timeZone: 'America/Bogota'
                            },
                            attendees: data.patient?.email ? [
                                { email: data.patient.email, displayName: data.patient.full_name }
                            ] : []
                        }
                    }
                }).then(async ({ data: calendarData, error: calendarError }) => {
                    if (calendarError) {
                        console.error('Error creating Google Calendar event:', calendarError)
                    } else if (calendarData?.eventId) {
                        console.log('Google Calendar event created:', calendarData.eventId)
                        await supabase
                            .from('appointments')
                            .update({ google_event_id: calendarData.eventId })
                            .eq('id', data.id)
                    }
                }).catch(e => console.error('GCal sync error:', e))
            }

            // Trigger integrations without awaiting
            processIntegrations()

            return appointment
        } catch (error: any) {
            console.error('Create appointment error:', error)
            set({ error: error.message || 'Error al crear cita' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    cancelAppointment: async (input: CancelAppointmentInput) => {
        console.log('Starting cancel appointment:', input.appointmentId)
        try {
            set({ isLoading: true, error: null })

            // First, get the appointment with google_event_id from database
            const { data: appointmentData, error: fetchError } = await supabase
                .from('appointments')
                .select('*, patient:profiles!appointments_patient_id_fkey(email, full_name, phone)')
                .eq('id', input.appointmentId)
                .single()

            if (fetchError) {
                console.error('Error fetching appointment:', fetchError)
                throw fetchError
            }

            console.log('Appointment data:', appointmentData)

            // Update the appointment status
            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    status: 'cancelled',
                    cancellation_reason: input.reason || null,
                    cancelled_by: input.cancelledBy
                })
                .eq('id', input.appointmentId)

            if (updateError) {
                console.error('Error updating appointment:', updateError)
                throw updateError
            }

            console.log('Appointment cancelled in database')

            // Update local state
            set(state => ({
                appointments: state.appointments.map(apt =>
                    apt.id === input.appointmentId
                        ? {
                            ...apt,
                            status: 'cancelled' as const,
                            cancellationReason: input.reason || null,
                            cancelledBy: input.cancelledBy
                        }
                        : apt
                )
            }))

            // Sync with Google Calendar (async, don't block)
            if (appointmentData?.google_event_id) {
                console.log('Deleting Google Calendar event:', appointmentData.google_event_id)
                supabase.functions.invoke('create-google-event', {
                    body: {
                        action: 'delete',
                        eventId: appointmentData.google_event_id
                    }
                }).then(({ data, error }) => {
                    if (error) console.error('Error deleting GCal event:', error)
                    else console.log('GCal event deleted:', data)
                }).catch(e => console.error('GCal delete error:', e))
            }

            // Send cancellation email (async, don't block)
            if (appointmentData?.patient?.email) {
                console.log('Sending cancellation email to:', appointmentData.patient.email)
                const emailHtml = generateCancellationEmail({
                    patientName: appointmentData.patient.full_name || 'Paciente',
                    startTime: new Date(appointmentData.start_time),
                    reason: input.reason,
                    siteUrl: `${window.location.origin}/patient/appointments`
                })
                supabase.functions.invoke('send-email', {
                    body: {
                        to: appointmentData.patient.email,
                        subject: '❌ Cita Cancelada - Ama Nacer Psicología',
                        html: emailHtml
                    }
                }).then(({ data: emailData, error: emailError }) => {
                    if (emailError) console.error('Cancellation email error:', emailError)
                    else console.log('Cancellation email sent:', emailData)
                }).catch(e => console.error('Email error:', e))

                // Send notification to psychologist about the cancellation
                const psychologistEmail = 'sebastianmontesg@gmail.com' // TODO: Make configurable via settings
                console.log('Sending cancellation notice to psychologist:', psychologistEmail)
                const adminNoticeHtml = generateAdminCancellationNotice({
                    patientName: appointmentData.patient.full_name || 'Paciente',
                    patientEmail: appointmentData.patient.email,
                    patientPhone: appointmentData.patient.phone || undefined,
                    startTime: new Date(appointmentData.start_time),
                    reason: input.reason
                })
                supabase.functions.invoke('send-email', {
                    body: {
                        to: psychologistEmail,
                        subject: `⚠️ Cancelación: ${appointmentData.patient.full_name || 'Paciente'} canceló su cita`,
                        html: adminNoticeHtml
                    }
                }).then(({ data: noticeData, error: noticeError }) => {
                    if (noticeError) console.error('Admin notice email error:', noticeError)
                    else console.log('Admin notice email sent:', noticeData)
                }).catch(e => console.error('Admin notice error:', e))
            }

            console.log('Cancel appointment completed successfully')

        } catch (error: any) {
            console.error('Cancel appointment error:', error)
            set({ error: error.message || 'Error al cancelar cita' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    confirmAppointment: async (appointmentId: string) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', appointmentId)

            if (error) throw error

            set(state => ({
                appointments: state.appointments.map(apt =>
                    apt.id === appointmentId
                        ? { ...apt, status: 'confirmed' as const }
                        : apt
                )
            }))

            // Sync with Google Calendar (Create if missing, or update status)
            const appointment = get().appointments.find(a => a.id === appointmentId)
            if (appointment && appointment.patient) {
                // Determine action: create if no ID, otherwise update
                const action = appointment.googleEventId ? 'update' : 'create'

                supabase.functions.invoke('create-google-event', {
                    body: {
                        action: action,
                        eventId: appointment.googleEventId,
                        event: {
                            summary: `Consulta ${appointment.appointmentType === 'virtual' ? 'Virtual' : 'Presencial'} - ${appointment.patient.fullName} (Confirmada)`,
                            description: `Cita médica con Dr. Montes. Notas: ${appointment.notes || 'Ninguna'}. Estado: Confirmada`,
                            start: {
                                dateTime: appointment.startTime.toISOString(),
                                timeZone: 'America/Bogota'
                            },
                            end: {
                                dateTime: appointment.endTime.toISOString(),
                                timeZone: 'America/Bogota'
                            },
                            attendees: [
                                { email: appointment.patient.email, displayName: appointment.patient.fullName }
                            ]
                        }
                    }
                }).then(async ({ data: calendarData, error: calendarError }) => {
                    if (calendarError) {
                        console.error('Error syncing confirmed GCal event:', calendarError)
                    } else if (calendarData?.eventId && !appointment.googleEventId) {
                        // Save the new ID if we just created it
                        await supabase
                            .from('appointments')
                            .update({ google_event_id: calendarData.eventId })
                            .eq('id', appointmentId)
                    }
                })
            }
        } catch (error: any) {
            console.error('Confirm appointment error:', error)
            set({ error: error.message || 'Error al confirmar cita' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    completeAppointment: async (appointmentId: string) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appointmentId)

            if (error) throw error

            set(state => ({
                appointments: state.appointments.map(apt =>
                    apt.id === appointmentId
                        ? { ...apt, status: 'completed' as const }
                        : apt
                )
            }))
        } catch (error: any) {
            console.error('Complete appointment error:', error)
            set({ error: error.message || 'Error al completar cita' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    fetchAvailability: async () => {
        try {
            set({ isLoading: true, error: null })

            const { data, error } = await supabase
                .from('availability')
                .select('*')
                .order('day_of_week', { ascending: true })

            if (error) throw error

            const availability: AvailabilitySlot[] = (data || []).map(row => ({
                id: row.id,
                dayOfWeek: row.day_of_week,
                startTime: row.start_time,
                endTime: row.end_time,
                isActive: row.is_active
            }))

            set({ availability })
        } catch (error: any) {
            console.error('Fetch availability error:', error)
            set({ error: error.message || 'Error al cargar disponibilidad' })
        } finally {
            set({ isLoading: false })
        }
    },

    updateAvailability: async (slots: AvailabilitySlot[]) => {
        try {
            set({ isLoading: true, error: null })

            // Delete existing slots
            await supabase.from('availability').delete().gte('day_of_week', 0)

            // Insert new slots
            const { error } = await supabase
                .from('availability')
                .insert(slots.map(slot => ({
                    day_of_week: slot.dayOfWeek,
                    start_time: slot.startTime,
                    end_time: slot.endTime,
                    is_active: slot.isActive
                })))

            if (error) throw error

            await get().fetchAvailability()
        } catch (error: any) {
            console.error('Update availability error:', error)
            set({ error: error.message || 'Error al actualizar disponibilidad' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    fetchAvailabilityOverrides: async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('availability_overrides')
                .select('*')
                .gte('date', new Date().toISOString().split('T')[0])

            if (error) throw error

            const availabilityOverrides: AvailabilityOverride[] = (data || []).map((row: any) => ({
                id: row.id,
                date: row.date,
                slots: row.slots,
                isUnavailable: row.is_unavailable
            }))

            set({ availabilityOverrides })
        } catch (error: any) {
            console.error('Fetch overrides error:', error)
        }
    },

    async upsertAvailabilityOverride(override) {
        try {
            set({ isLoading: true, error: null })
            const { error } = await (supabase as any)
                .from('availability_overrides')
                .upsert({
                    date: override.date,
                    slots: override.slots,
                    is_unavailable: override.isUnavailable
                }, { onConflict: 'date' })

            if (error) throw error

            // Fire and forget refetch
            get().fetchAvailabilityOverrides().catch(e => console.error('Refetch failed', e))
        } catch (error: any) {
            console.error('Store upsert error:', error)
            set({ error: error.message || 'Error saving override' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    bulkUpsertAvailabilityOverrides: async (overrides: Omit<AvailabilityOverride, 'id'>[]) => {
        try {
            set({ isLoading: true, error: null })

            // Format for DB
            const dbRows = overrides.map(o => ({
                date: o.date,
                slots: o.slots,
                is_unavailable: o.isUnavailable
            }))

            const { error } = await (supabase as any)
                .from('availability_overrides')
                .upsert(dbRows, { onConflict: 'date' })

            if (error) throw error

            await get().fetchAvailabilityOverrides()
        } catch (error: any) {
            console.error('Bulk upsert error:', error)
            set({ error: error.message || 'Error al bloquear fechas' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    blockAvailabilityRange: async (startDate: string, endDate: string) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await supabase.rpc('block_range_availability', {
                p_start_date: startDate,
                p_end_date: endDate
            })

            if (error) throw error

            await get().fetchAvailabilityOverrides()
        } catch (error: any) {
            console.error('Block range error:', error)
            set({ error: error.message || 'Error al bloquear el rango de fechas' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    deleteAvailabilityOverridesInRange: async (startDate: string, endDate: string) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await supabase.rpc('unblock_range_availability', {
                p_start_date: startDate,
                p_end_date: endDate
            })

            if (error) throw error

            await get().fetchAvailabilityOverrides()
        } catch (error: any) {
            console.error('Delete overrides error:', error)
            set({ error: error.message || 'Error al desbloquear fechas' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    rescheduleAppointment: async (appointmentId, newStartTime, newEndTime) => {
        try {
            set({ isLoading: true, error: null })

            const hasOverlap = await get().checkOverlap(newStartTime, newEndTime, appointmentId)
            if (hasOverlap) throw new Error('Horario no disponible')

            const { error } = await supabase
                .from('appointments')
                .update({
                    start_time: newStartTime.toISOString(),
                    end_time: newEndTime.toISOString(),
                    status: 'pending' // Reset to pending on reschedule
                })
                .eq('id', appointmentId)

            if (error) throw error

            // Sync with Google Calendar
            const appointment = get().appointments.find(a => a.id === appointmentId)
            if (appointment?.googleEventId) {
                supabase.functions.invoke('create-google-event', {
                    body: {
                        action: 'update',
                        eventId: appointment.googleEventId,
                        event: {
                            start: { dateTime: newStartTime.toISOString(), timeZone: 'America/Bogota' },
                            end: { dateTime: newEndTime.toISOString(), timeZone: 'America/Bogota' }
                        }
                    }
                }).then(({ error }) => {
                    if (error) console.error('Error updating GCal event:', error)
                })
            }

            await get().fetchAppointments()
        } catch (error: any) {
            set({ error: error.message || 'Error rescheduling' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    getAvailableSlots: async (date: Date, duration: number = 60) => {
        const { availability, availabilityOverrides, appointments } = get()
        const dayOfWeek = date.getDay()
        const dateStr = format(date, 'yyyy-MM-dd')

        // 1. Check Overrides
        const override = availabilityOverrides.find(o => o.date === dateStr)

        let activeSlots: { startTime: string; endTime: string }[] = []

        if (override) {
            if (override.isUnavailable) return []
            activeSlots = override.slots
        } else {
            // 2. Regular Availability (Filter all slots for this day)
            activeSlots = availability
                .filter(a => a.dayOfWeek === dayOfWeek && a.isActive)
                .map(a => ({ startTime: a.startTime, endTime: a.endTime }))
        }

        if (activeSlots.length === 0) return []

        // Get existing appointments for this day
        const dayStart = startOfDay(date)
        const dayAppointments = appointments.filter(apt => {
            const aptDate = startOfDay(apt.startTime)
            return aptDate.getTime() === dayStart.getTime() && apt.status !== 'cancelled'
        })

        const slots: TimeSlot[] = []

        // Generate slots for EACH active block
        activeSlots.forEach(block => {
            const [startHour, startMin] = block.startTime.split(':').map(Number)
            const [endHour, endMin] = block.endTime.split(':').map(Number)

            let currentSlotStart = new Date(date)
            currentSlotStart.setHours(startHour, startMin, 0, 0)

            const dayEndTime = new Date(date)
            dayEndTime.setHours(endHour, endMin, 0, 0)

            while (isBefore(addMinutes(currentSlotStart, duration), dayEndTime) ||
                addMinutes(currentSlotStart, duration).getTime() === dayEndTime.getTime()) {
                const slotStart = new Date(currentSlotStart)

                // Filtrar horarios pasados (ej: si son las 10am, no mostrar 9am de hoy)
                if (isBefore(slotStart, new Date())) {
                    currentSlotStart = addMinutes(currentSlotStart, duration)
                    continue
                }

                const slotEnd = addMinutes(slotStart, duration)

                // Check if slot overlaps with any existing appointment
                const isAvailable = !dayAppointments.some(apt => {
                    return (
                        (isAfter(slotStart, apt.startTime) || slotStart.getTime() === apt.startTime.getTime()) &&
                        isBefore(slotStart, apt.endTime)
                    ) || (
                            isAfter(slotEnd, apt.startTime) &&
                            (isBefore(slotEnd, apt.endTime) || slotEnd.getTime() === apt.endTime.getTime())
                        ) || (
                            (isBefore(slotStart, apt.startTime) || slotStart.getTime() === apt.startTime.getTime()) &&
                            (isAfter(slotEnd, apt.endTime) || slotEnd.getTime() === apt.endTime.getTime())
                        )
                })

                slots.push({
                    startTime: slotStart,
                    endTime: slotEnd,
                    isAvailable
                })

                currentSlotStart = addMinutes(currentSlotStart, duration)
            }
        })

        return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    },

    checkOverlap: async (startTime: Date, endTime: Date, excludeId?: string) => {
        try {
            let query = supabase
                .from('appointments')
                .select('id')
                .neq('status', 'cancelled')
                .or(`and(start_time.lte.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`)

            if (excludeId) {
                query = query.neq('id', excludeId)
            }

            const { data, error } = await query

            if (error) throw error

            return (data?.length || 0) > 0
        } catch (error) {
            console.error('Check overlap error:', error)
            return false
        }
    },

    clearError: () => set({ error: null })
}))
