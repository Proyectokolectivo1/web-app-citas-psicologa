// Appointment entity - represents scheduled appointments
export interface Appointment {
    id: string
    patientId: string
    startTime: Date
    endTime: Date
    appointmentType: 'virtual' | 'presencial'
    status: AppointmentStatus
    notes: string | null
    googleEventId: string | null
    cancellationReason: string | null
    cancelledBy: 'patient' | 'psychologist' | null
    createdAt: Date
    // Joined data
    patient?: {
        fullName: string
        email: string
        phone: string | null
    }
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

// Create appointment input
export interface CreateAppointmentInput {
    patientId: string
    startTime: Date
    endTime: Date
    appointmentType: 'virtual' | 'presencial'
    notes?: string
}

// Cancel appointment input
export interface CancelAppointmentInput {
    appointmentId: string
    reason?: string
    cancelledBy: 'patient' | 'psychologist'
}

// Availability slot - psychologist's working hours
export interface AvailabilitySlot {
    id: string
    dayOfWeek: number // 0 = Sunday, 6 = Saturday
    startTime: string // "09:00"
    endTime: string   // "17:00"
    isActive: boolean
}

// Availability override - holidays or specific date changes
export interface AvailabilityOverride {
    id: string
    date: string // YYYY-MM-DD
    slots: { startTime: string; endTime: string }[]
    isUnavailable: boolean
}

// Time slot for booking UI
export interface TimeSlot {
    startTime: Date
    endTime: Date
    isAvailable: boolean
}

// Appointment pricing
export interface AppointmentPricing {
    virtual: number
    presencial: number
    currency: string
    duration: number // minutes
}

export const DEFAULT_PRICING: AppointmentPricing = {
    virtual: 120000,
    presencial: 110000,
    currency: 'COP',
    duration: 60
}
