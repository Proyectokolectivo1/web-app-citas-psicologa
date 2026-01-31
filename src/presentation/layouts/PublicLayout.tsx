import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Flower2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function PublicLayout() {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('theme')
        if (saved) return saved === 'dark'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        // Apply theme on mount and changes
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }, [isDark])

    // Listen for system theme changes
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

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] transition-colors duration-500">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-[var(--color-background-light)]/90 dark:bg-[var(--color-background-dark)]/90 backdrop-blur-xl border-b border-[var(--color-primary)]/10 dark:border-[var(--color-primary)]/20">
                <motion.a
                    href="/"
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Flower2 className="w-6 h-6 text-[var(--color-primary)]" />
                    <span className="font-display font-bold text-lg tracking-wide uppercase text-[var(--color-primary)]">
                        Ama-Nacer
                    </span>
                </motion.a>

                <motion.button
                    onClick={toggleDarkMode}
                    className="relative p-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-300 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {isDark ? (
                            <motion.div
                                key="sun"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Sun className="w-5 h-5 text-amber-400" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="moon"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon className="w-5 h-5 text-slate-600" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </nav>

            {/* Page Content */}
            <main className="transition-colors duration-500">
                <Outlet />
            </main>
        </div>
    )
}
