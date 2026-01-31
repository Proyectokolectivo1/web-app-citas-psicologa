import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Calendar,
    FileText,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react'
import { useAppointmentStore, useResourceStore } from '../../../infrastructure/store'
import { supabase } from '../../../infrastructure/supabase/client'
import { format, isThisMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminDashboard() {
    const { appointments, fetchAppointments } = useAppointmentStore()
    const { resources, fetchResources } = useResourceStore()
    const [patientCount, setPatientCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([
                fetchAppointments(),
                fetchResources(),
                fetchPatientCount()
            ])
            setIsLoading(false)
        }
        loadData()
    }, [fetchAppointments, fetchResources])

    const fetchPatientCount = async () => {
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'patient')
        setPatientCount(count || 0)
    }

    // Calculate stats
    const monthlyAppointments = appointments.filter(apt => isThisMonth(apt.startTime))
    const confirmedCount = monthlyAppointments.filter(apt => apt.status === 'confirmed').length
    const pendingCount = monthlyAppointments.filter(apt => apt.status === 'pending').length
    const cancelledCount = monthlyAppointments.filter(apt => apt.status === 'cancelled').length

    const todayAppointments = appointments.filter(apt => {
        const today = new Date()
        return apt.startTime.toDateString() === today.toDateString() && apt.status !== 'cancelled'
    })

    const stats = [
        {
            label: 'Pacientes Activos',
            value: patientCount,
            icon: Users,
            color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
        },
        {
            label: 'Citas Este Mes',
            value: monthlyAppointments.length,
            icon: Calendar,
            color: 'bg-green-50 dark:bg-green-900/20 text-green-500'
        },
        {
            label: 'Recursos Disponibles',
            value: resources.length,
            icon: FileText,
            color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
        },
        {
            label: 'Citas Hoy',
            value: todayAppointments.length,
            icon: Clock,
            color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
        }
    ]

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        completed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
                <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                    Resumen de tu práctica - {format(new Date(), "MMMM yyyy", { locale: es })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
                    >
                        <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-3xl font-bold mb-1">{stat.value}</p>
                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Monthly Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                    Resumen del Mes
                </h2>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{confirmedCount}</p>
                        <p className="text-sm text-green-600/70 dark:text-green-400/70">Confirmadas</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                        <p className="text-sm text-amber-600/70 dark:text-amber-400/70">Pendientes</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                        <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{cancelledCount}</p>
                        <p className="text-sm text-red-600/70 dark:text-red-400/70">Canceladas</p>
                    </div>
                </div>
            </motion.div>

            {/* Today's Appointments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--color-primary)]/10"
            >
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                    Citas de Hoy
                </h2>

                {todayAppointments.length > 0 ? (
                    <div className="space-y-3">
                        {todayAppointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                                        {apt.patient?.fullName?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <p className="font-medium">{apt.patient?.fullName || 'Paciente'}</p>
                                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                            {format(apt.startTime, 'HH:mm')} - {format(apt.endTime, 'HH:mm')} • {apt.appointmentType === 'virtual' ? 'Virtual' : 'Presencial'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[apt.status]}`}>
                                    {apt.status === 'pending' ? 'Pendiente' : apt.status === 'confirmed' ? 'Confirmada' : 'Completada'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-8 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        No tienes citas programadas para hoy
                    </p>
                )}
            </motion.div>
        </div>
    )
}
