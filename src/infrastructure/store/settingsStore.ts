
import { create } from 'zustand'
import { supabase } from '../supabase/client'

export interface SupportContact {
    id: string
    name: string
    role: string
    phone: string
}

interface SettingsState {
    settings: Record<string, string>
    supportContacts: SupportContact[]
    isLoading: boolean
    error: string | null

    // Actions
    fetchSetting: (key: string) => Promise<string | null>
    updateSetting: (key: string, value: any) => Promise<void>

    // Support Contacts
    fetchSupportContacts: () => Promise<void>
    addSupportContact: (contact: Omit<SupportContact, 'id'>) => Promise<void>
    deleteSupportContact: (id: string) => Promise<void>

    // Storage
    uploadImage: (file: File, bucket: string) => Promise<string | null>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: {},
    supportContacts: [],
    isLoading: false,
    error: null,

    fetchSetting: async (key: string) => {
        try {
            // Check if already in state
            if (get().settings[key]) {
                return get().settings[key]
            }

            const { data, error } = await (supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .maybeSingle()) as any

            if (error) throw error

            if (data) {
                let stringValue: string

                // Handle different value types from Supabase
                if (typeof data.value === 'string') {
                    // Check if it's a double-encoded JSON string (starts with quote)
                    if (data.value.startsWith('"') && data.value.endsWith('"')) {
                        try {
                            stringValue = JSON.parse(data.value)
                        } catch {
                            stringValue = data.value
                        }
                    } else {
                        stringValue = data.value
                    }
                } else if (typeof data.value === 'object') {
                    stringValue = JSON.stringify(data.value)
                } else {
                    stringValue = String(data.value)
                }

                set(state => ({
                    settings: { ...state.settings, [key]: stringValue }
                }))
                return stringValue
            }
            return null
        } catch (error) {
            console.error('Error fetching setting:', key, error)
            return null
        }
    },

    updateSetting: async (key: string, value: any) => {
        try {
            set({ isLoading: true, error: null })

            // For string values like URLs, store them directly
            // For objects, store them as-is (Supabase will serialize to JSONB)
            let payload = value

            console.log('Preparing to upsert setting:', key, typeof value, value)

            // If it's a pure string (like a URL), store it directly
            // Don't double-encode it as JSON
            if (typeof value === 'string') {
                // Try to parse - if it's valid JSON object/array, use parsed version
                try {
                    const parsed = JSON.parse(value)
                    if (typeof parsed === 'object' && parsed !== null) {
                        payload = parsed
                    }
                    // If it's a primitive after parsing, keep the original string
                } catch {
                    // It's a plain string (URL, etc) - keep it as-is
                }
            }

            console.log('Final payload for Supabase:', payload)

            const { data, error } = await (supabase
                .from('settings')
                .upsert({ key, value: payload, updated_at: new Date().toISOString() })
                .select()) as any

            if (error) {
                console.error('[SettingsStore] Supabase upsert failed:', error)
                throw error
            }

            console.log('[SettingsStore] Upsert success:', data)

            // Update local state with string representation
            const storeValue = typeof value === 'string' ? value : JSON.stringify(value)

            set(state => ({
                settings: { ...state.settings, [key]: storeValue }
            }))
        } catch (error: any) {
            console.error('Error updating setting:', key, error)
            set({ error: error.message || 'Error al guardar la configuración' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    // Support Contacts
    fetchSupportContacts: async () => {
        try {
            const { data, error } = await (supabase
                .from('support_contacts' as any)
                .select('*')
                .order('created_at', { ascending: true })) as any

            if (error) throw error

            set({ supportContacts: data || [] })
        } catch (error: any) {
            console.error('Error fetching support contacts:', error)
        }
    },

    addSupportContact: async (contact) => {
        try {
            const { error } = await (supabase
                .from('support_contacts' as any)
                .insert(contact as any)) as any

            if (error) throw error

            await get().fetchSupportContacts()
        } catch (error: any) {
            console.error('Error adding contact:', error)
            throw error
        }
    },

    deleteSupportContact: async (id) => {
        try {
            const { error } = await (supabase
                .from('support_contacts' as any)
                .delete()
                .eq('id', id)) as any

            if (error) throw error

            await get().fetchSupportContacts()
        } catch (error: any) {
            console.error('Error deleting contact:', error)
            throw error
        }
    },

    uploadImage: async (file: File, path: string) => {
        try {
            set({ isLoading: true, error: null })

            // Resize image before upload to optimize storage and loading
            const resizedFile = await resizeImage(file, 800, 800, 0.85)

            // Create a unique file name (removed extra space bug)
            const fileExt = 'jpg' // Always save as jpg after resize
            const uniqueId = Math.random().toString(36).substring(2, 15)
            const timestamp = Date.now()
            const fileName = `${uniqueId}_${timestamp}.${fileExt}`
            const filePath = `${path}/${fileName}`

            console.log('Uploading image to:', filePath)

            const { error: uploadError } = await supabase.storage
                .from('public-images')
                .upload(filePath, resizedFile, {
                    contentType: 'image/jpeg',
                    upsert: true
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                throw uploadError
            }

            const { data } = supabase.storage
                .from('public-images')
                .getPublicUrl(filePath)

            if (!data) throw new Error('Error getting public URL')

            const publicUrl = data.publicUrl
            console.log('Image uploaded successfully:', publicUrl)
            return publicUrl
        } catch (error: any) {
            console.error('Error uploading image:', error)
            set({ error: error.message || 'Error al subir la imagen' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    }
}))

// Helper function to resize image
async function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img

                // Calculate new dimensions maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width)
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height)
                        height = maxHeight
                    }
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Could not get canvas context'))
                    return
                }

                // Draw image with white background (for transparency)
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, width, height)
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error('Could not create blob'))
                        }
                    },
                    'image/jpeg',
                    quality
                )
            }
            img.onerror = () => reject(new Error('Could not load image'))
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsDataURL(file)
    })
}
