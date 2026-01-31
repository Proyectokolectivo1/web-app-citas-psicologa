import { create } from 'zustand'
import { supabase, STORAGE_BUCKETS } from '../supabase/client'
import type {
    Resource,
    CreateResourceInput,
    UpdateResourceInput,
    PatientResource,
    AssignResourceInput
} from '../../domain/entities'

interface ResourceState {
    resources: Resource[]
    patientResources: PatientResource[]
    isLoading: boolean
    error: string | null

    // Actions
    fetchResources: () => Promise<void>
    fetchPatientResources: (patientId: string) => Promise<void>
    createResource: (input: CreateResourceInput) => Promise<Resource>
    updateResource: (id: string, input: UpdateResourceInput) => Promise<void>
    deleteResource: (id: string) => Promise<void>

    // Assignment
    assignResource: (input: AssignResourceInput) => Promise<void>
    unassignResource: (patientId: string, resourceId: string) => Promise<void>

    // Download
    getDownloadUrl: (filePath: string) => Promise<string>

    clearError: () => void
}

export const useResourceStore = create<ResourceState>((set, get) => ({
    resources: [],
    patientResources: [],
    isLoading: false,
    error: null,

    fetchResources: async () => {
        try {
            set({ isLoading: true, error: null })

            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            const resources: Resource[] = (data || []).map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                category: row.category,
                filePath: row.file_path,
                fileSize: row.file_size,
                createdAt: new Date(row.created_at)
            }))

            set({ resources })
        } catch (error: any) {
            console.error('Fetch resources error:', error)
            set({ error: error.message || 'Error al cargar recursos' })
        } finally {
            set({ isLoading: false })
        }
    },

    fetchPatientResources: async (patientId: string) => {
        try {
            set({ isLoading: true, error: null })

            const { data, error } = await supabase
                .from('patient_resources')
                .select(`
          *,
          resource:resources(*)
        `)
                .eq('patient_id', patientId)
                .order('assigned_at', { ascending: false })

            if (error) throw error

            const patientResources: PatientResource[] = (data || []).map(row => ({
                id: row.id,
                patientId: row.patient_id,
                resourceId: row.resource_id,
                assignedAt: new Date(row.assigned_at),
                resource: row.resource ? {
                    id: row.resource.id,
                    title: row.resource.title,
                    description: row.resource.description,
                    category: row.resource.category,
                    filePath: row.resource.file_path,
                    fileSize: row.resource.file_size,
                    createdAt: new Date(row.resource.created_at)
                } : undefined
            }))

            set({ patientResources })
        } catch (error: any) {
            console.error('Fetch patient resources error:', error)
            set({ error: error.message || 'Error al cargar recursos asignados' })
        } finally {
            set({ isLoading: false })
        }
    },

    createResource: async (input: CreateResourceInput) => {
        try {
            set({ isLoading: true, error: null })

            // Upload file to storage
            const fileExt = input.file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
            const filePath = `pdfs/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.RESOURCES)
                .upload(filePath, input.file)

            if (uploadError) throw uploadError

            // Create resource record
            const { data, error } = await supabase
                .from('resources')
                .insert({
                    title: input.title,
                    description: input.description || null,
                    category: input.category,
                    file_path: filePath,
                    file_size: input.file.size
                })
                .select()
                .single()

            if (error) throw error

            const resource: Resource = {
                id: data.id,
                title: data.title,
                description: data.description,
                category: data.category,
                filePath: data.file_path,
                fileSize: data.file_size,
                createdAt: new Date(data.created_at)
            }

            set(state => ({
                resources: [resource, ...state.resources]
            }))

            return resource
        } catch (error: any) {
            console.error('Create resource error:', error)
            set({ error: error.message || 'Error al crear recurso' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    updateResource: async (id: string, input: UpdateResourceInput) => {
        try {
            set({ isLoading: true, error: null })

            const updateData: any = {}
            if (input.title !== undefined) updateData.title = input.title
            if (input.description !== undefined) updateData.description = input.description
            if (input.category !== undefined) updateData.category = input.category

            const { error } = await supabase
                .from('resources')
                .update(updateData)
                .eq('id', id)

            if (error) throw error

            set(state => ({
                resources: state.resources.map(res =>
                    res.id === id ? { ...res, ...input } : res
                )
            }))
        } catch (error: any) {
            console.error('Update resource error:', error)
            set({ error: error.message || 'Error al actualizar recurso' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    deleteResource: async (id: string) => {
        try {
            set({ isLoading: true, error: null })

            // Get resource to delete file
            const resource = get().resources.find(r => r.id === id)

            if (resource) {
                // Delete file from storage
                await supabase.storage
                    .from(STORAGE_BUCKETS.RESOURCES)
                    .remove([resource.filePath])
            }

            // Delete resource record (cascade will delete patient_resources)
            const { error } = await supabase
                .from('resources')
                .delete()
                .eq('id', id)

            if (error) throw error

            set(state => ({
                resources: state.resources.filter(res => res.id !== id)
            }))
        } catch (error: any) {
            console.error('Delete resource error:', error)
            set({ error: error.message || 'Error al eliminar recurso' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    assignResource: async (input: AssignResourceInput) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await supabase
                .from('patient_resources')
                .insert({
                    patient_id: input.patientId,
                    resource_id: input.resourceId
                })

            if (error) throw error

            // Refresh patient resources
            await get().fetchPatientResources(input.patientId)
        } catch (error: any) {
            console.error('Assign resource error:', error)
            set({ error: error.message || 'Error al asignar recurso' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    unassignResource: async (patientId: string, resourceId: string) => {
        try {
            set({ isLoading: true, error: null })

            const { error } = await supabase
                .from('patient_resources')
                .delete()
                .eq('patient_id', patientId)
                .eq('resource_id', resourceId)

            if (error) throw error

            set(state => ({
                patientResources: state.patientResources.filter(
                    pr => !(pr.patientId === patientId && pr.resourceId === resourceId)
                )
            }))
        } catch (error: any) {
            console.error('Unassign resource error:', error)
            set({ error: error.message || 'Error al desasignar recurso' })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    getDownloadUrl: async (filePath: string) => {
        try {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKETS.RESOURCES)
                .createSignedUrl(filePath, 3600) // 1 hour expiry

            if (error) throw error

            return data.signedUrl
        } catch (error: any) {
            console.error('Get download URL error:', error)
            throw error
        }
    },

    clearError: () => set({ error: null })
}))
