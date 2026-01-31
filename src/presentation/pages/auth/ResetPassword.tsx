import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Flower2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../../infrastructure/supabase/client'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [isValidSession, setIsValidSession] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        // Check if we have a valid recovery session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                // Check URL for recovery token (Supabase adds these params)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const type = hashParams.get('type')
                const accessToken = hashParams.get('access_token')

                if (type === 'recovery' && accessToken) {
                    // Set the session from the recovery token
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || ''
                    })

                    if (!error) {
                        setIsValidSession(true)
                    } else {
                        setMessage('El enlace de recuperación ha expirado o es inválido.')
                        setStatus('error')
                    }
                } else if (session) {
                    // User might already be authenticated from clicking the link
                    setIsValidSession(true)
                } else {
                    setMessage('El enlace de recuperación ha expirado o es inválido. Por favor solicita uno nuevo.')
                    setStatus('error')
                }
            } catch (error) {
                console.error('Session check error:', error)
                setMessage('Error al verificar la sesión. Por favor intenta nuevamente.')
                setStatus('error')
            } finally {
                setCheckingSession(false)
            }
        }

        // Listen for password recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true)
                setCheckingSession(false)
            }
        })

        checkSession()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setStatus('error')
            setMessage('Las contraseñas no coinciden')
            return
        }

        if (password.length < 6) {
            setStatus('error')
            setMessage('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setIsLoading(true)
        setStatus('idle')
        setMessage('')

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setStatus('success')
            setMessage('¡Tu contraseña ha sido actualizada exitosamente!')

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (error: any) {
            console.error('Update password error:', error)
            setStatus('error')
            setMessage(error.message || 'Error al actualizar la contraseña. Por favor intenta nuevamente.')
        } finally {
            setIsLoading(false)
        }
    }

    // Loading state while checking session
    if (checkingSession) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                    </div>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Verificando enlace de recuperación...
                    </p>
                </div>
            </div>
        )
    }

    // Invalid/expired session
    if (!isValidSession && status === 'error') {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
                <motion.div
                    className="w-full max-w-md text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="font-display text-2xl font-semibold mb-3">Enlace Inválido</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-6">
                        {message}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        Volver al inicio de sesión
                    </button>
                </motion.div>
            </div>
        )
    }

    // Success state
    if (status === 'success') {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
                <motion.div
                    className="w-full max-w-md text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="font-display text-2xl font-semibold mb-3">¡Contraseña Actualizada!</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-2">
                        {message}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Serás redirigido al inicio de sesión en unos segundos...
                    </p>
                </motion.div>
            </div>
        )
    }

    // Password reset form
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
                    <h1 className="font-display text-3xl font-semibold mb-2">Nueva Contraseña</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Alert */}
                    {status === 'error' && message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {message}
                        </motion.div>
                    )}

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    if (status === 'error') {
                                        setStatus('idle')
                                        setMessage('')
                                    }
                                }}
                                placeholder="Mínimo 6 caracteres"
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

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Confirmar contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    if (status === 'error') {
                                        setStatus('idle')
                                        setMessage('')
                                    }
                                }}
                                placeholder="Repite tu nueva contraseña"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                            />
                        </div>
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
                            'Actualizar Contraseña'
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}
