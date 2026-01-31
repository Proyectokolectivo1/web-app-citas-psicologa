import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Flower2, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useAuthStore } from '../../../infrastructure/store'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetStatus, setResetStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
    const [resetMessage, setResetMessage] = useState('')
    const { signIn, isLoading, error, clearError, checkEmailExists, resetPassword } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()

        try {
            await signIn(email, password)
            // Get the profile after sign in to determine where to navigate
            const { profile } = useAuthStore.getState()
            if (profile?.role === 'psychologist') {
                navigate('/admin')
            } else {
                navigate('/patient')
            }
        } catch (err) {
            // Error is handled in the store
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!resetEmail.trim()) {
            setResetStatus('error')
            setResetMessage('Por favor ingresa tu correo electrónico')
            return
        }

        setResetStatus('checking')
        setResetMessage('Verificando correo electrónico...')

        try {
            // First check if email exists in database
            const exists = await checkEmailExists(resetEmail)

            if (!exists) {
                setResetStatus('error')
                setResetMessage('No encontramos una cuenta con este correo electrónico. Verifica que esté escrito correctamente.')
                return
            }

            // Email exists, send reset password email
            await resetPassword(resetEmail)

            setResetStatus('success')
            setResetMessage('¡Listo! Te hemos enviado un correo con las instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada y spam.')
        } catch (err) {
            setResetStatus('error')
            setResetMessage('Error al enviar el correo de recuperación. Por favor intenta nuevamente.')
        }
    }

    const closeForgotPassword = () => {
        setShowForgotPassword(false)
        setResetEmail('')
        setResetStatus('idle')
        setResetMessage('')
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Flower2 className="w-8 h-8 text-[var(--color-primary)]" />
                    </motion.div>
                    <h1 className="font-display text-3xl font-semibold mb-2">Bienvenido/a</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Ingresa a tu cuenta para continuar
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Alert */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Correo electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-12 pr-12 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:text-[var(--color-primary)]"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-[var(--color-primary)] hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-4 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </motion.button>
                </form>

                {/* Register Link */}
                <p className="text-center mt-6 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-[var(--color-primary)] font-medium hover:underline">
                        Regístrate
                    </Link>
                </p>
            </motion.div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotPassword && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={closeForgotPassword}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-xl font-semibold">Recuperar Contraseña</h2>
                                <button
                                    onClick={closeForgotPassword}
                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {resetStatus === 'success' ? (
                                // Success State
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-6">
                                        {resetMessage}
                                    </p>
                                    <button
                                        onClick={closeForgotPassword}
                                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            ) : (
                                // Form State
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                                        Ingresa el correo electrónico con el que te registraste. Verificaremos que exista en nuestra base de datos y te enviaremos las instrucciones para recuperar tu contraseña.
                                    </p>

                                    {/* Error/Status Message */}
                                    {resetStatus === 'error' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
                                        >
                                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <span>{resetMessage}</span>
                                        </motion.div>
                                    )}

                                    {resetStatus === 'checking' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm"
                                        >
                                            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                                            <span>{resetMessage}</span>
                                        </motion.div>
                                    )}

                                    {/* Email Input */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Correo electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => {
                                                    setResetEmail(e.target.value)
                                                    if (resetStatus === 'error') {
                                                        setResetStatus('idle')
                                                        setResetMessage('')
                                                    }
                                                }}
                                                placeholder="tu@email.com"
                                                required
                                                disabled={resetStatus === 'checking'}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={resetStatus === 'checking'}
                                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {resetStatus === 'checking' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Enviar Instrucciones'
                                        )}
                                    </button>

                                    {/* Cancel Button */}
                                    <button
                                        type="button"
                                        onClick={closeForgotPassword}
                                        className="w-full py-3 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] hover:text-[var(--color-primary)] transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
