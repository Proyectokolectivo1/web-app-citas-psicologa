import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText,
    Upload,
    Search,
    Trash2,
    Users,
    Plus,
    X,
    Folder
} from 'lucide-react'
import { useResourceStore } from '../../../infrastructure/store'
import { supabase } from '../../../infrastructure/supabase/client'
import { RESOURCE_CATEGORY_LABELS, RESOURCE_CATEGORY_COLORS, ResourceCategory } from '../../../domain/entities'
import type { Profile, Resource } from '../../../domain/entities'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminResources() {
    const { resources, fetchResources, createResource, deleteResource, assignResource, isLoading, error } = useResourceStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
    const [patients, setPatients] = useState<Profile[]>([])

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadDescription, setUploadDescription] = useState('')
    const [uploadCategory, setUploadCategory] = useState<ResourceCategory>('ansiedad')
    const [uploadFile, setUploadFile] = useState<File | null>(null)

    useEffect(() => {
        fetchResources()
        fetchPatients()
    }, [fetchResources])

    const fetchPatients = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'patient')

        if (data) {
            setPatients(data.map(p => ({
                id: p.id,
                email: p.email,
                fullName: p.full_name,
                phone: p.phone,
                avatarUrl: p.avatar_url,
                role: p.role,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at)
            })))
        }
    }

    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle) return

        try {
            await createResource({
                title: uploadTitle,
                description: uploadDescription || undefined,
                category: uploadCategory,
                file: uploadFile
            })

            setShowUploadModal(false)
            setUploadTitle('')
            setUploadDescription('')
            setUploadCategory('ansiedad')
            setUploadFile(null)
        } catch (err) {
            console.error('Error uploading resource:', err)
        }
    }

    const handleDelete = async (resource: Resource) => {
        if (confirm('¿Estás seguro de eliminar este recurso?')) {
            await deleteResource(resource.id)
        }
    }

    const [isAssigning, setIsAssigning] = useState(false)

    // ... existing handleAssign ...
    const handleAssign = async (patientId: string) => {
        if (selectedResource) {
            try {
                await assignResource({
                    resourceId: selectedResource.id,
                    patientId
                })
                setShowAssignModal(false)
                setSelectedResource(null)
                alert('Recurso asignado correctamente')
            } catch (err) {
                console.error('Error assigning resource:', err)
                alert('Error al asignar el recurso (posiblemente ya esté asignado)')
            }
        }
    }

    const handleAssignAll = async () => {
        if (!selectedResource || !confirm(`¿Estás seguro de asignar "${selectedResource.title}" a TODOS los pacientes (${patients.length})?`)) return

        setIsAssigning(true)
        try {
            let successCount = 0
            for (const patient of patients) {
                try {
                    await assignResource({
                        resourceId: selectedResource.id,
                        patientId: patient.id
                    })
                    successCount++
                } catch (e) {
                    console.log(`Skipping ${patient.email}:`, e)
                }
            }
            alert(`Recurso asignado exitosamente a ${successCount} pacientes.`)
            setShowAssignModal(false)
            setSelectedResource(null)
        } catch (err) {
            console.error('Error assigning all:', err)
            alert('Hubo un error al asignar los recursos')
        } finally {
            setIsAssigning(false)
        }
    }

    const filteredResources = resources.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const categories = Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[]

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Recursos</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Gestiona el material de apoyo para tus pacientes
                    </p>
                </div>

                <motion.button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="w-5 h-5" />
                    Subir Recurso
                </motion.button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar recursos..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                />
            </div>

            {/* Resources Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
                </div>
            ) : filteredResources.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredResources.map((resource, index) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 flex-shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold mb-1 truncate">{resource.title}</h3>
                                    {resource.description && (
                                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-2 line-clamp-2">
                                            {resource.description}
                                        </p>
                                    )}
                                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${RESOURCE_CATEGORY_COLORS[resource.category]}`}>
                                        {RESOURCE_CATEGORY_LABELS[resource.category]}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <span className="text-xs text-[var(--color-text-secondary-light)]">
                                    {format(resource.createdAt, "d MMM yyyy", { locale: es })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        onClick={() => {
                                            setSelectedResource(resource)
                                            setShowAssignModal(true)
                                        }}
                                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Asignar a paciente"
                                    >
                                        <Users className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleDelete(resource)}
                                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-[var(--color-primary)]/10">
                    <Folder className="w-16 h-16 mx-auto mb-4 text-[var(--color-primary)]/40" />
                    <h3 className="font-display text-xl font-semibold mb-2">No hay recursos</h3>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-4">
                        {searchQuery ? 'No se encontraron resultados' : 'Sube tu primer recurso para comenzar'}
                    </p>
                    {!searchQuery && (
                        <motion.button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Subir Recurso
                        </motion.button>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-semibold">Subir Recurso</h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        placeholder="Nombre del recurso"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                                    <textarea
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        placeholder="Breve descripción del recurso"
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Categoría</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setUploadCategory(cat)}
                                                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${uploadCategory === cat
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                                    : 'border-slate-200 dark:border-zinc-700'
                                                    }`}
                                            >
                                                {RESOURCE_CATEGORY_LABELS[cat]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Archivo PDF</label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                                        <Upload className="w-8 h-8 text-[var(--color-text-secondary-light)] mb-2" />
                                        <span className="text-sm text-[var(--color-text-secondary-light)]">
                                            {uploadFile ? uploadFile.name : 'Haz clic para seleccionar'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <motion.button
                                    onClick={handleUpload}
                                    disabled={isLoading || !uploadFile || !uploadTitle}
                                    className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-semibold disabled:opacity-50"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isLoading ? 'Subiendo...' : 'Subir Recurso'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assign Modal */}
            <AnimatePresence>
                {showAssignModal && selectedResource && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md max-h-[70vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-semibold">Asignar Recurso</h2>
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-4">
                                Selecciona un paciente para asignarle "{selectedResource.title}" o asígnalo a todos.
                            </p>

                            <button
                                onClick={handleAssignAll}
                                disabled={isAssigning || patients.length === 0}
                                className="w-full mb-4 py-3 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium hover:bg-[var(--color-primary)]/20 disabled:opacity-50"
                            >
                                {isAssigning ? 'Asignando...' : 'Asignar a todos los pacientes'}
                            </button>

                            <div className="space-y-2">
                                {patients.length > 0 ? patients.map(patient => (
                                    <motion.button
                                        key={patient.id}
                                        onClick={() => handleAssign(patient.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-left"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                            {patient.fullName?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <p className="font-medium">{patient.fullName || 'Sin nombre'}</p>
                                            <p className="text-sm text-[var(--color-text-secondary-light)]">{patient.email}</p>
                                        </div>
                                    </motion.button>
                                )) : (
                                    <p className="text-center py-8 text-[var(--color-text-secondary-light)]">
                                        No hay pacientes registrados
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
