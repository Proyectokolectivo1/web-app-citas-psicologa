import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Mail, Phone, Calendar, MoreVertical, MapPin } from 'lucide-react'
import { supabase } from '../../../infrastructure/supabase/client'
import type { Profile } from '../../../domain/entities'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminPatients() {
    const [patients, setPatients] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'patient')
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

    const filteredPatients = patients.filter(p =>
        p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
    )

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Pacientes</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        {patients.length} pacientes registrados
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
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                />
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

                                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
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
        </div>
    )
}
