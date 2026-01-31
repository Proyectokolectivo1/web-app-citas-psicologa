// Resource entity - PDF documents and materials
export interface Resource {
    id: string
    title: string
    description: string | null
    category: ResourceCategory
    filePath: string
    fileSize: number | null
    createdAt: Date
}

export type ResourceCategory =
    | 'ansiedad'
    | 'autoestima'
    | 'duelo'
    | 'relaciones'
    | 'mindfulness'
    | 'general'

// Create resource input
export interface CreateResourceInput {
    title: string
    description?: string
    category: ResourceCategory
    file: File
}

// Update resource input
export interface UpdateResourceInput {
    title?: string
    description?: string
    category?: ResourceCategory
}

// Patient resource assignment
export interface PatientResource {
    id: string
    patientId: string
    resourceId: string
    assignedAt: Date
    resource?: Resource
}

// Assign resource input
export interface AssignResourceInput {
    patientId: string
    resourceId: string
}

// Resource category labels (Spanish)
export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
    ansiedad: 'Ansiedad',
    autoestima: 'Autoestima',
    duelo: 'Duelo',
    relaciones: 'Relaciones',
    mindfulness: 'Mindfulness',
    general: 'General'
}

// Resource category colors
export const RESOURCE_CATEGORY_COLORS: Record<ResourceCategory, string> = {
    ansiedad: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    autoestima: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    duelo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    relaciones: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    mindfulness: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    general: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
}
