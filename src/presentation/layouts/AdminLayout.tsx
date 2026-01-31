import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    const [isDark, setIsDark] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark')
        setIsDark(isDarkMode)
    }, [])

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark')
        setIsDark(!isDark)
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] transition-colors duration-300 flex">
            {/* Sidebar - Desktop */}
            <aside
                className={`hidden md:flex flex-col bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border-r border-[var(--color-primary)]/10 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="p-6 flex items-center gap-3 border-b border-[var(--color-primary)]/10">
                    <Flower2 className="w-8 h-8 text-[var(--color-primary)] flex-shrink-0" />
                    {!sidebarCollapsed && (
                        <span className="font-display font-bold text-lg tracking-wide uppercase text-[var(--color-primary)]">
                            Ama-Nacer
                        </span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20'
                                    : 'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-primary)]/10'
                                } ${sidebarCollapsed ? 'justify-center' : ''}`
                            }
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!sidebarCollapsed && item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse Toggle */}
                <div className="p-4 border-t border-[var(--color-primary)]/10">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-primary)]/10 transition-all"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        {!sidebarCollapsed && 'Colapsar'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 px-6 py-4 flex justify-between items-center bg-[var(--color-surface-light)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-md border-b border-[var(--color-primary)]/10">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 md:ml-0" />

                    <div className="flex items-center gap-3">
                        {/* User Info */}
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium text-sm">
                                {profile?.fullName?.charAt(0) || 'P'}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{profile?.fullName || 'Psicóloga'}</p>
                                <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                    Administradora
                                </p>
                            </div>
                        </div>

                        <motion.button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-[var(--color-primary)]" /> : <Moon className="w-5 h-5" />}
                        </motion.button>

                        <motion.button
                            onClick={handleSignOut}
                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <LogOut className="w-5 h-5" />
                        </motion.button>
                    </div>
                </header>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="md:hidden fixed inset-0 top-[65px] z-30 bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] p-4"
                    >
                        <div className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all ${isActive
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-primary)]/10'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </NavLink>
                            ))}
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"
                            >
                                <LogOut className="w-5 h-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Page Content */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
