import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun, Flower2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function PublicLayout() {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark')
        setIsDark(isDarkMode)
    }, [])

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark')
        setIsDark(!isDark)
    }

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] transition-colors duration-300">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-[var(--color-background-light)]/80 dark:bg-[var(--color-background-dark)]/80 backdrop-blur-md border-b border-[var(--color-primary)]/10">
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
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isDark ? (
                        <Sun className="w-5 h-5 text-[var(--color-primary)]" />
                    ) : (
                        <Moon className="w-5 h-5 text-[var(--color-text-secondary-light)]" />
                    )}
                </motion.button>
            </nav>

            {/* Page Content */}
            <main>
                <Outlet />
            </main>


        </div>
    )
}
