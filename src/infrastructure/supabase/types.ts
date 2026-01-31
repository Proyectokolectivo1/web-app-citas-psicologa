// Auto-generated Supabase types
// Run: npx supabase gen types typescript --project-id your-project-id > src/infrastructure/supabase/types.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    residence: string | null
                    avatar_url: string | null
                    role: 'psychologist' | 'patient'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    residence?: string | null
                    avatar_url?: string | null
                    role?: 'psychologist' | 'patient'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    phone?: string | null
                    residence?: string | null
                    avatar_url?: string | null
                    role?: 'psychologist' | 'patient'
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            appointments: {
                Row: {
                    id: string
                    patient_id: string
                    start_time: string
                    end_time: string
                    appointment_type: 'virtual' | 'presencial'
                    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    notes: string | null
                    google_event_id: string | null
                    cancellation_reason: string | null
                    cancelled_by: 'patient' | 'psychologist' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    start_time: string
                    end_time: string
                    appointment_type: 'virtual' | 'presencial'
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    notes?: string | null
                    google_event_id?: string | null
                    cancellation_reason?: string | null
                    cancelled_by?: 'patient' | 'psychologist' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    start_time?: string
                    end_time?: string
                    appointment_type?: 'virtual' | 'presencial'
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    notes?: string | null
                    google_event_id?: string | null
                    cancellation_reason?: string | null
                    cancelled_by?: 'patient' | 'psychologist' | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            resources: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    category: 'ansiedad' | 'autoestima' | 'duelo' | 'relaciones' | 'mindfulness' | 'general'
                    file_path: string
                    file_size: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    category: 'ansiedad' | 'autoestima' | 'duelo' | 'relaciones' | 'mindfulness' | 'general'
                    file_path: string
                    file_size?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    category?: 'ansiedad' | 'autoestima' | 'duelo' | 'relaciones' | 'mindfulness' | 'general'
                    file_path?: string
                    file_size?: number | null
                    created_at?: string
                }
                Relationships: []
            }
            patient_resources: {
                Row: {
                    id: string
                    patient_id: string
                    resource_id: string
                    assigned_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    resource_id: string
                    assigned_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    resource_id?: string
                    assigned_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "patient_resources_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "patient_resources_resource_id_fkey"
                        columns: ["resource_id"]
                        isOneToOne: false
                        referencedRelation: "resources"
                        referencedColumns: ["id"]
                    }
                ]
            }
            availability: {
                Row: {
                    id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    day_of_week?: number
                    start_time?: string
                    end_time?: string
                    is_active?: boolean
                }
                Relationships: []
            }
            settings: {
                Row: {
                    id: string
                    key: string
                    value: Json
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: Json
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: Json
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            block_range_availability: {
                Args: {
                    p_start_date: string
                    p_end_date: string
                }
                Returns: void
            }
            unblock_range_availability: {
                Args: {
                    p_start_date: string
                    p_end_date: string
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
