import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Folder, Search, ChevronLeft, Moon, Sun, Book } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useResourceStore } from '../../../infrastructure/store'
import { RESOURCE_CATEGORY_LABELS, RESOURCE_CATEGORY_COLORS, PatientResource } from '../../../domain/entities'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PatientResources() {
    const { profile } = useAuthStore()
    const { patientResources, fetchPatientResources, getDownloadUrl, isLoading } = useResourceStore()

    useEffect(() => {
        if (profile?.id) {
            fetchPatientResources(profile.id)
        }
    }, [profile?.id, fetchPatientResources])

    const handleDownload = async (filePath: string, title: string) => {
        try {
            const url = await getDownloadUrl(filePath)
            const link = document.createElement('a')
            link.href = url
            link.download = `${title}.pdf`
            link.target = '_blank'
            link.click()
        } catch (err) {
            console.error('Download error:', err)
        }
    }

    return (
        <>
            {/* Desktop View (Unchanged) */}
            <div className="hidden md:block">
                <DesktopView
                    patientResources={patientResources}
                    isLoading={isLoading}
                    handleDownload={handleDownload}
                />
            </div>

            {/* Mobile View (New Design) */}
            <div className="block md:hidden -mx-4 -my-8 min-h-screen bg-[#FCF9F5] dark:bg-[#1C1B19] transition-colors duration-300">
                <MobileView
                    patientResources={patientResources}
                    isLoading={isLoading}
                    handleDownload={handleDownload}
                />
            </div>
        </>
    )
}

// ==========================================
// DESKTOP COMPONENT (Existing Implementation)
// ==========================================
function DesktopView({ patientResources, isLoading, handleDownload }: {
    patientResources: PatientResource[],
    isLoading: boolean,
    handleDownload: (path: string, title: string) => void
}) {
    const resourcesByCategory = patientResources.reduce((acc, pr) => {
        if (pr.resource) {
            const category = pr.resource.category
            if (!acc[category]) acc[category] = []
            acc[category].push(pr)
        }
        return acc
    }, {} as Record<string, typeof patientResources>)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-2xl font-semibold">Mis Recursos</h1>
                <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                    Material de apoyo asignado para tu proceso terapéutico
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 animate-breathe" />
                </div>
            ) : patientResources.length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(resourcesByCategory).map(([category, resources]) => (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Folder className="w-5 h-5 text-[var(--color-primary)]" />
                                <h2 className="font-display text-lg font-semibold">
                                    {RESOURCE_CATEGORY_LABELS[category as keyof typeof RESOURCE_CATEGORY_LABELS]}
                                </h2>
                                <span className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                    ({resources.length})
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {resources.map((pr, index) => (
                                    <motion.div
                                        key={pr.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 flex-shrink-0">
                                                <FileText className="w-6 h-6" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-1 truncate">{pr.resource?.title}</h3>
                                                        {pr.resource?.description && (
                                                            <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-2 line-clamp-2">
                                                                {pr.resource.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                                            <span className={`px-2 py-1 rounded-full ${RESOURCE_CATEGORY_COLORS[pr.resource?.category!]}`}>
                                                                {RESOURCE_CATEGORY_LABELS[pr.resource?.category as keyof typeof RESOURCE_CATEGORY_LABELS]}
                                                            </span>
                                                            <span>
                                                                Asignado {format(pr.assignedAt, "d 'de' MMMM", { locale: es })}
                                                            </span>
                                                            {pr.resource?.fileSize && (
                                                                <span>{Math.round(pr.resource.fileSize / 1024)} KB</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <motion.button
                                                            onClick={() => handleDownload(pr.resource!.filePath, pr.resource!.title)}
                                                            className="p-3 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            title="Descargar PDF"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-[var(--color-primary)]/10"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">Sin recursos asignados</h3>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] max-w-md mx-auto">
                        Tu psicóloga te asignará material de apoyo durante tu proceso terapéutico. Los recursos aparecerán aquí.
                    </p>
                </motion.div>
            )}
        </div>
    )
}

// ==========================================
// MOBILE COMPONENT (New Design)
// ==========================================
function MobileView({ patientResources, isLoading, handleDownload }: {
    patientResources: PatientResource[],
    isLoading: boolean,
    handleDownload: (path: string, title: string) => void
}) {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('todos')

    // Filter Logic
    const filteredResources = patientResources.filter(pr => {
        const matchesSearch = pr.resource?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pr.resource?.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'todos' || pr.resource?.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const categories = ['todos', ...new Set(patientResources.map(pr => pr.resource?.category).filter(Boolean))] as string[]

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark')
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 font-sans text-slate-800 dark:text-slate-100">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-[#FCF9F5]/90 dark:bg-[#1C1B19]/90 backdrop-blur-md border-b border-[#B89C7E]/10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-[#B89C7E]/10"
                >
                    <ChevronLeft className="w-5 h-5 text-[#B89C7E]" />
                </button>
                <h1 className="font-display text-xl font-bold text-[#B89C7E] tracking-wide">Biblioteca</h1>
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-[#B89C7E]/10"
                >
                    <Sun className="w-5 h-5 text-[#D4AF37] dark:hidden" />
                    <Moon className="w-5 h-5 text-[#D4AF37] hidden dark:block" />
                </button>
            </header>

            <main>
                {/* Branding */}
                <div className="px-6 pt-8 pb-4 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                            <Book className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                    </div>
                    <p className="font-display italic text-[#B89C7E] dark:text-[#B89C7E]/80 text-sm tracking-widest">
                        Un nuevo sol es re-nacer
                    </p>
                </div>

                {/* Search */}
                <div className="px-6 py-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89C7E]/60 group-focus-within:text-[#D4AF37] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-800/50 border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm ring-1 ring-[#B89C7E]/10 focus:ring-2 focus:ring-[#D4AF37]/40 transition-all placeholder:text-[#B89C7E]/40 text-sm outline-none"
                            placeholder="Buscar recursos o libros..."
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 mb-8 overflow-x-auto flex gap-3 hide-scrollbar pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-[#D4AF37] text-white shadow-md'
                                : 'bg-white dark:bg-zinc-800 text-[#B89C7E] border border-[#B89C7E]/10'
                                }`}
                        >
                            {cat === 'todos' ? 'Todos' : RESOURCE_CATEGORY_LABELS[cat as keyof typeof RESOURCE_CATEGORY_LABELS] || cat}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                        </div>
                    ) : filteredResources.length > 0 ? (
                        filteredResources.map((pr) => (
                            <div
                                key={pr.id}
                                className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-sm border border-[#B89C7E]/5 transition-transform active:scale-[0.98]"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Cover Placeholder */}
                                    <div className="w-full aspect-[21/9] sm:aspect-[3/4] bg-gradient-to-br from-[#B89C7E]/20 to-[#D4AF37]/20 relative overflow-hidden flex items-center justify-center">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                        <FileText className="w-12 h-12 text-[#D4AF37]/50" />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
                                    </div>

                                    <div className="p-6 flex flex-col justify-between flex-1">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] mb-2 block">
                                                {RESOURCE_CATEGORY_LABELS[pr.resource?.category as keyof typeof RESOURCE_CATEGORY_LABELS]}
                                            </span>
                                            <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">
                                                {pr.resource?.title}
                                            </h3>
                                            {pr.resource?.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                                    {pr.resource.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[11px] font-medium text-[#B89C7E] flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                {pr.resource?.fileSize ? `${Math.round(pr.resource.fileSize / 1024)} KB` : 'PDF'}
                                            </span>
                                            <button
                                                onClick={() => handleDownload(pr.resource!.filePath, pr.resource!.title)}
                                                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                            >
                                                <Download className="w-4 h-4" />
                                                Descargar PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-[#B89C7E]">No se encontraron recursos</p>
                        </div>
                    )}
                </div>

                {/* Support Card */}
                <div className="mx-6 mt-12 mb-6 p-8 rounded-[2.5rem] bg-gradient-to-br from-[#B89C7E]/5 to-[#D4AF37]/5 border border-[#B89C7E]/10 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#D4AF37] mb-4 block">psychology</span>
                    <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">¿Necesitas apoyo adicional?</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">Estamos aquí para acompañarte en tu proceso.</p>
                    <button
                        onClick={() => navigate('/patient/appointments')}
                        className="w-full bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900 py-4 rounded-2xl font-bold text-sm shadow-xl transition-transform active:scale-95"
                    >
                        Agendar una Cita
                    </button>
                </div>
            </main>
        </div>
    )
}
