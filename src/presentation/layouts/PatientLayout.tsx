import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Flower2,
    LayoutDashboard,
    Calendar,
    FileText,
    LogOut,
    Moon,
    Sun,
    Menu,
    X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../infrastructure/store'

const navItems = [
    { to: '/patient', icon: LayoutDashboard, label: 'Inicio', end: true },
    { to: '/patient/appointments', icon: Calendar, label: 'Mis Citas' },
    { to: '/patient/resources', icon: FileText, label: 'Recursos' },
]

export default function PatientLayout() {
    const [isDark, setIsDark] = useState(false)
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
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] transition-colors duration-300">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-[var(--color-surface-light)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-md border-b border-[var(--color-primary)]/10">
                <div className="flex items-center gap-4">
                    <motion.a
                        href="/patient"
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                    >
                        <Flower2 className="w-6 h-6 text-[var(--color-primary)]" />
                        <span className="font-display font-bold text-lg tracking-wide uppercase text-[var(--color-primary)] hidden sm:block">
                            Ama-Nacer
                        </span>
                    </motion.a>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:bg-[var(--color-primary)]/10'
                                }`
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {/* User Info */}
                    <div className="hidden sm:flex items-center gap-3 mr-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-medium text-sm">
                            {profile?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                            {profile?.fullName?.split(' ')[0] || 'Usuario'}
                        </span>
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
                        className="hidden sm:flex p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <LogOut className="w-5 h-5" />
                    </motion.button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border-b border-[var(--color-primary)]/10 p-4"
                >
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
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
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Page Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}
