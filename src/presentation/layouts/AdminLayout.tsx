import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Flower2,
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Clock,
    Settings,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../infrastructure/store'

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/patients', icon: Users, label: 'Pacientes' },
    { to: '/admin/appointments', icon: Calendar, label: 'Citas' },
    { to: '/admin/resources', icon: FileText, label: 'Recursos' },
    { to: '/admin/availability', icon: Clock, label: 'Disponibilidad' },
    { to: '/admin/settings', icon: Settings, label: 'Configuración' },
]

export default function AdminLayout() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved) return saved === 'dark'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }, [isDark])

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                setIsDark(e.matches)
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const toggleDarkMode = () => {
        setIsDark(!isDark)
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] transition-colors duration-500 flex">
            {/* Sidebar - Desktop */}
            <aside
                className={`admin-sidebar hidden md:flex flex-col bg-white dark:bg-[#1A1714] border-r border-slate-200/80 dark:border-[#2D2926] transition-all duration-300 shadow-sm ${sidebarCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-[#2D2926]">
                    <motion.div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                        <Flower2 className="w-6 h-6 text-white" />
                    </motion.div>
                    {!sidebarCollapsed && (
                        <motion.span
                            className="font-display font-bold text-lg tracking-wide uppercase text-[var(--color-primary)]"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            Ama-Nacer
                        </motion.span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-4 space-y-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252220] hover:text-slate-900 dark:hover:text-slate-200'
                                } ${sidebarCollapsed ? 'justify-center' : ''}`
                            }
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110`} />
                            {!sidebarCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-slate-100 dark:border-[#2D2926] space-y-2">
                    {/* Theme Toggle in Sidebar */}
                    <button
                        onClick={toggleDarkMode}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${isDark
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isDark ? (
                                <motion.div
                                    key="sun"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Sun className="w-5 h-5" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="moon"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Moon className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!sidebarCollapsed && (isDark ? 'Modo Claro' : 'Modo Oscuro')}
                    </button>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-[#252220] hover:text-slate-700 dark:hover:text-slate-300 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        {!sidebarCollapsed && 'Colapsar'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 px-6 py-4 flex justify-between items-center bg-white/95 dark:bg-[#1A1714]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#2D2926] shadow-sm">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-[#252220] hover:bg-slate-200 dark:hover:bg-[#2D2926] transition-colors"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {mobileMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                >
                                    <X className="w-5 h-5" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                >
                                    <Menu className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>

                    <div className="flex-1 md:ml-0" />

                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-semibold shadow-md shadow-[var(--color-primary)]/20">
                                {profile?.fullName?.charAt(0) || 'P'}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile?.fullName || 'Psicóloga'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Administradora
                                </p>
                            </div>
                        </div>

                        {/* Mobile Theme Toggle */}
                        <motion.button
                            onClick={toggleDarkMode}
                            className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-[#252220] hover:bg-slate-200 dark:hover:bg-[#2D2926] transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                        </motion.button>

                        {/* Sign Out */}
                        <motion.button
                            onClick={handleSignOut}
                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </motion.button>
                    </div>
                </header>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 top-[73px] z-30 bg-white dark:bg-[#1A1714] p-4"
                        >
                            <div className="flex flex-col gap-2">
                                {navItems.map((item, index) => (
                                    <motion.div
                                        key={item.to}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <NavLink
                                            to={item.to}
                                            end={item.end}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all ${isActive
                                                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252220]'
                                                }`
                                            }
                                        >
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </NavLink>
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: navItems.length * 0.05 }}
                                    className="mt-4 pt-4 border-t border-slate-200 dark:border-[#2D2926]"
                                >
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Cerrar Sesión
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Page Content */}
                <main className="admin-content flex-1 p-6 transition-colors duration-500">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
