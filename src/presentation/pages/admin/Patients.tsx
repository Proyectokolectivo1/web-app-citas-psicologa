import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Mail, Phone, Calendar, MoreVertical, MapPin, Trash2, PhoneCall, X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../../infrastructure/supabase/client'
import type { Profile } from '../../../domain/entities'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminPatients() {
    const [patients, setPatients] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchPatients()
    }, [])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchPatients = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'patient')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching patients:', error)
        }

        if (data) {
            setPatients(data.map(p => ({
                id: p.id,
                email: p.email,
                fullName: p.full_name,
                phone: p.phone,
                residence: (p as any).residence,
                avatarUrl: p.avatar_url,
                role: p.role,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at)
            })))
        }
        setIsLoading(false)
    }

    const handleDeletePatient = async (patientId: string) => {
        setIsDeleting(true)
        try {
            // First cancel all appointments for this patient
            await supabase
                .from('appointments')
                .update({ status: 'cancelled', cancellation_reason: 'Usuario eliminado' })
                .eq('patient_id', patientId)

            // Delete the profile (this won't delete auth user, just the profile)
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', patientId)

            if (error) throw error

            // Remove from local state
            setPatients(prev => prev.filter(p => p.id !== patientId))
            setDeleteConfirmId(null)
        } catch (error) {
            console.error('Error deleting patient:', error)
            alert('Error al eliminar el paciente')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCall = (phone: string | null) => {
        if (phone) {
            window.open(`tel:${phone}`, '_self')
        }
    }

    const filteredPatients = patients.filter(p =>
        p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery) ||
        p.residence?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Pacientes</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        {filteredPatients.length} de {patients.length} pacientes
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, email, teléfono o residencia..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Patients List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid gap-4">
                    {filteredPatients.map((patient, index) => (
                        <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-semibold">
                                        {patient.fullName?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{patient.fullName || 'Sin nombre'}</h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                {patient.email}
                                            </span>
                                            {patient.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-4 h-4" />
                                                    {patient.phone}
                                                </span>
                                            )}
                                            {patient.residence && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {patient.residence}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Desde {format(patient.createdAt, "MMM yyyy", { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Button */}
                                <div className="relative" ref={openMenuId === patient.id ? menuRef : null}>
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === patient.id ? null : patient.id)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {openMenuId === patient.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 z-50 overflow-hidden"
                                            >
                                                {patient.phone ? (
                                                    <button
                                                        onClick={() => {
                                                            handleCall(patient.phone)
                                                            setOpenMenuId(null)
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-700 text-left text-green-600"
                                                    >
                                                        <PhoneCall className="w-4 h-4" />
                                                        <span>Llamar paciente</span>
                                                    </button>
                                                ) : (
                                                    <div className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 cursor-not-allowed">
                                                        <PhoneCall className="w-4 h-4" />
                                                        <span>Sin teléfono</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setDeleteConfirmId(patient.id)
                                                        setOpenMenuId(null)
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Eliminar usuario</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-[var(--color-primary)]/10">
                    <Users className="w-16 h-16 mx-auto mb-4 text-[var(--color-primary)]/40" />
                    <h3 className="font-display text-xl font-semibold mb-2">No hay pacientes</h3>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        {searchQuery ? 'No se encontraron resultados para tu búsqueda' : 'Los pacientes aparecerán aquí cuando se registren'}
                    </p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !isDeleting && setDeleteConfirmId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl font-semibold">¿Eliminar paciente?</h3>
                                    <p className="text-sm text-[var(--color-text-secondary-light)]">
                                        Esta acción no se puede deshacer
                                    </p>
                                </div>
                            </div>

                            <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-6">
                                Se eliminará el perfil del paciente y todas sus citas serán canceladas automáticamente.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeletePatient(deleteConfirmId)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
