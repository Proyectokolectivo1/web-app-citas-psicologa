import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,      // Automatically refresh tokens before expiry
        persistSession: true,         // Store session in localStorage
        detectSessionInUrl: true,     // Handle OAuth redirects
        storage: localStorage,        // Use localStorage for persistence (survives browser close)
        storageKey: 'ama-nacer-auth-session',  // Custom storage key
        flowType: 'pkce'              // More secure flow type
    }
})

// Storage bucket names
export const STORAGE_BUCKETS = {
    RESOURCES: 'resources',
    AVATARS: 'avatars'
} as const

// Helper to get public URL for storage files
export function getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}
