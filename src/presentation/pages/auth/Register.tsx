import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Flower2, AlertCircle, User, Phone, MapPin } from 'lucide-react'
import { useAuthStore } from '../../../infrastructure/store'

const COUNTRY_CODES = [
    { code: '+57', flag: '🇨🇴', label: 'Colombia' },
    { code: '+54', flag: '🇦🇷', label: 'Argentina' },
    { code: '+52', flag: '🇲🇽', label: 'México' },
    { code: '+51', flag: '🇵🇪', label: 'Perú' },
    { code: '+56', flag: '🇨🇱', label: 'Chile' },
    { code: '+593', flag: '🇪🇨', label: 'Ecuador' },
    { code: '+1', flag: '🇺🇸', label: 'USA' },
    { code: '+34', flag: '🇪🇸', label: 'España' },
]

export default function Register() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [countryCode, setCountryCode] = useState('+57')
    const [phone, setPhone] = useState('')
    const [residence, setResidence] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState('')
    const { signUp, isLoading, error, clearError } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        setLocalError('')

        if (!phone) {
            setLocalError('El teléfono es obligatorio')
            return
        }

        if (!residence) {
            setLocalError('El lugar de residencia es obligatorio')
            return
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden')
            return
        }

        if (password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        try {
            const fullPhone = `${countryCode} ${phone}`
            await signUp(email, password, fullName, fullPhone, residence)
            navigate('/patient')
        } catch (err) {
            // Error is handled in the store
        }
    }

    const displayError = localError || error

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
                    <h1 className="font-display text-3xl font-semibold mb-2">Crear Cuenta</h1>
                    <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                        Regístrate para agendar tu primera cita
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Alert */}
                    {displayError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {displayError}
                        </motion.div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Nombre completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Tu nombre"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                            />
                        </div>
                    </div>

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

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Teléfono
                        </label>
                        <div className="flex gap-2">
                            <div className="relative w-32 flex-shrink-0">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-full h-full pl-3 pr-8 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {COUNTRY_CODES.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.flag} {country.code}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-slate-500">
                                    ▼
                                </div>
                            </div>
                            <div className="relative flex-1">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="300 000 0000"
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-primary)]/20 bg-white dark:bg-zinc-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Residence */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Lugar de residencia
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]" />
                            <input
                                type="text"
                                value={residence}
                                onChange={(e) => setResidence(e.target.value)}
                                placeholder="Ciudad, Barrio"
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
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
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
                            'Crear Cuenta'
                        )}
                    </motion.button>
                </form>

                {/* Login Link */}
                <p className="text-center mt-6 text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}
