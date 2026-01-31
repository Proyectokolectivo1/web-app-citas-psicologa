import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../supabase/client'
import type { Profile } from '../../domain/entities'
import type { User } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    profile: Profile | null
    isLoading: boolean
    error: string | null

    // Actions
    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, fullName: string, phone?: string, residence?: string) => Promise<void>
    signOut: () => Promise<void>
    fetchProfile: (userId: string) => Promise<void>
    updateProfile: (data: Partial<Profile>) => Promise<void>
    checkEmailExists: (email: string) => Promise<boolean>
    resetPassword: (email: string) => Promise<void>
    clearError: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            profile: null,
            isLoading: true,
            error: null,

            initialize: async () => {
                try {
                    // Don't reinitialize if already done
                    const currentState = get()
                    if (currentState.user && currentState.profile) {
                        set({ isLoading: false })
                        return
                    }

                    set({ isLoading: true, error: null })

                    // Get current session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                    if (sessionError) throw sessionError

                    if (session?.user) {
                        set({ user: session.user })
                        await get().fetchProfile(session.user.id)
                    }

                    // Listen for auth changes - use subscription for proper cleanup
                    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                        console.log('Auth state change:', event)

                        // Use queueMicrotask to ensure state updates happen after current execution
                        queueMicrotask(async () => {
                            if (event === 'SIGNED_IN' && session?.user) {
                                set({ user: session.user, isLoading: false })
                                await get().fetchProfile(session.user.id)
                            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                                set({ user: session.user })
                                console.log('Session token refreshed successfully')
                            } else if (event === 'SIGNED_OUT') {
                                // Clear all state immediately
                                set({ user: null, profile: null, isLoading: false })
                            } else if (event === 'USER_UPDATED' && session?.user) {
                                set({ user: session.user })
                                await get().fetchProfile(session.user.id)
                            }
                        })
                    })

                        // Store subscription for potential cleanup
                        ; (window as any).__authSubscription = subscription
                } catch (error) {
                    console.error('Auth initialization error:', error)
                    set({ error: 'Error al inicializar autenticación' })
                } finally {
                    set({ isLoading: false })
                }
            },

            signIn: async (email: string, password: string) => {
                try {
                    set({ isLoading: true, error: null })

                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    })

                    if (error) throw error

                    if (data.user) {
                        // Update state immediately, don't wait for listener
                        set({ user: data.user })
                        await get().fetchProfile(data.user.id)
                    }
                } catch (error: any) {
                    console.error('Sign in error:', error)
                    set({ error: error.message || 'Error al iniciar sesión' })
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            signUp: async (email: string, password: string, fullName: string, phone?: string, residence?: string) => {
                try {
                    set({ isLoading: true, error: null })

                    // Create auth user
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: fullName,
                                phone: phone,
                                residence: residence
                            }
                        }
                    })

                    if (error) throw error

                    if (data.user) {
                        // Create profile record (upsert to handle trigger conflicts)
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: data.user.id,
                                email: email,
                                full_name: fullName,
                                phone: phone || null,
                                residence: residence || null,
                                role: 'patient' // Default role for open registration
                            })

                        if (profileError) throw profileError

                        set({ user: data.user })
                        await get().fetchProfile(data.user.id)
                    }
                } catch (error: any) {
                    console.error('Sign up error:', error)
                    set({ error: error.message || 'Error al registrarse' })
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            signOut: async () => {
                try {
                    // Clear state FIRST before calling API - this ensures immediate UI update
                    set({ user: null, profile: null, isLoading: true, error: null })

                    const { error } = await supabase.auth.signOut()
                    if (error) {
                        console.error('Sign out API error:', error)
                        // Even if API fails, keep the user logged out locally
                    }
                } catch (error: any) {
                    console.error('Sign out error:', error)
                    // Don't re-set user, keep them logged out
                } finally {
                    set({ isLoading: false })
                }
            },

            fetchProfile: async (userId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .maybeSingle()

                    if (error) throw error

                    if (data) {
                        const profile: Profile = {
                            id: data.id,
                            email: data.email,
                            fullName: data.full_name,
                            phone: data.phone,
                            residence: data.residence,
                            avatarUrl: data.avatar_url,
                            role: data.role,
                            createdAt: new Date(data.created_at),
                            updatedAt: new Date(data.updated_at)
                        }
                        set({ profile })
                    } else {
                        // Profile missing (Zombie user case) - Attempt to create it
                        const currentUser = get().user
                        if (currentUser && currentUser.id === userId) {
                            console.log('Profile missing, creating default profile...')
                            const { error: createError } = await supabase
                                .from('profiles')
                                .upsert({
                                    id: userId,
                                    email: currentUser.email || '',
                                    full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario',
                                    phone: currentUser.user_metadata?.phone || null,
                                    role: 'patient'
                                })

                            if (!createError) {
                                // Recursive call to fetch again after creation
                                await get().fetchProfile(userId)
                            } else {
                                console.error('Failed to auto-create profile:', createError)
                            }
                        }
                    }
                } catch (error: any) {
                    console.error('Fetch profile error:', error)
                }
            },

            updateProfile: async (data: Partial<Profile>) => {
                try {
                    set({ isLoading: true, error: null })

                    const { profile } = get()
                    if (!profile) throw new Error('No profile found')

                    const updateData: any = {}
                    if (data.fullName !== undefined) updateData.full_name = data.fullName
                    if (data.phone !== undefined) updateData.phone = data.phone
                    if (data.residence !== undefined) updateData.residence = data.residence
                    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl

                    const { error } = await supabase
                        .from('profiles')
                        .update(updateData)
                        .eq('id', profile.id)

                    if (error) throw error

                    set({
                        profile: { ...profile, ...data, updatedAt: new Date() }
                    })
                } catch (error: any) {
                    console.error('Update profile error:', error)
                    set({ error: error.message || 'Error al actualizar perfil' })
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            checkEmailExists: async (email: string) => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', email.toLowerCase().trim())
                        .single()

                    if (error || !data) {
                        return false
                    }

                    return true
                } catch (error) {
                    console.error('Check email exists error:', error)
                    return false
                }
            },

            resetPassword: async (email: string) => {
                try {
                    set({ isLoading: true, error: null })

                    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
                        redirectTo: `${window.location.origin}/reset-password`
                    })

                    if (error) throw error
                } catch (error: any) {
                    console.error('Reset password error:', error)
                    set({ error: error.message || 'Error al enviar el correo de recuperación' })
                    throw error
                } finally {
                    set({ isLoading: false })
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'ama-nacer-auth',
            partialize: (_state) => ({}) // Don't persist sensitive state, rely on Supabase session
        }
    )
)
