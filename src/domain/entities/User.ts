// User entity - represents authenticated users
export interface User {
    id: string
    email: string
    createdAt: Date
}

// Profile entity - extended user data
export interface Profile {
    id: string
    email: string
    fullName: string | null
    phone: string | null
    residence?: string | null
    avatarUrl: string | null
    role: 'psychologist' | 'patient'
    createdAt: Date
    updatedAt: Date
}

// Create profile input
export interface CreateProfileInput {
    id: string
    email: string
    fullName: string
    phone?: string
    residence?: string
    role?: 'psychologist' | 'patient'
}

// Update profile input
export interface UpdateProfileInput {
    fullName?: string
    phone?: string
    residence?: string
    avatarUrl?: string
}
