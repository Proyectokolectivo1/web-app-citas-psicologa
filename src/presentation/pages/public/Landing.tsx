import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Video,
    MapPin,
    Calendar,
    Quote,
    Brain,
    Sparkles,
    ChevronRight,
    Heart,
    Shield,
    Clock
} from 'lucide-react'
import { useAuthStore, useSettingsStore } from '../../../infrastructure/store'
import { DEFAULT_CONTENT, type LandingContent } from '../../components/admin/LandingContentSettings'

export default function Landing() {
    const { user, initialize } = useAuthStore()
    const { fetchSetting } = useSettingsStore()
    const [heroImage, setHeroImage] = useState<string | null>(null)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [content, setContent] = useState<LandingContent>(DEFAULT_CONTENT)

    useEffect(() => {
        const loadSettings = async () => {
            // Load profile image
            const url = await fetchSetting('psychologist_image_url')
            if (url) {
                setHeroImage(url)
            } else {
                // Only use default if no custom image is set
                setHeroImage("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80")
            }

            // Load landing content
            const landingContent = await fetchSetting('landing_content')
            if (landingContent) {
                try {
                    const parsed = typeof landingContent === 'string' ? JSON.parse(landingContent) : landingContent
                    setContent({ ...DEFAULT_CONTENT, ...parsed })
                } catch (e) {
                    console.error('Error parsing landing content:', e)
                }
            }
        }
        loadSettings()
    }, [fetchSetting])

    useEffect(() => {
        initialize()
    }, [initialize])

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }

    return (
        <div className="w-full pb-32 lg:pb-8">
            {/* Hero Section - Desktop: Side by side, Mobile: Stacked */}
            <motion.section
                className="px-6 pt-6 pb-12 lg:pt-16 lg:pb-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
                        {/* Profile Image */}
                        <motion.div
                            className="relative w-full max-w-md mx-auto lg:mx-0 lg:w-2/5 mb-8 lg:mb-0"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5">
                                {/* Skeleton placeholder while loading */}
                                {!imageLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 animate-pulse" />
                                    </div>
                                )}
                                {heroImage && (
                                    <img
                                        alt="Psicóloga"
                                        className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        src={heroImage}
                                        onLoad={() => setImageLoaded(true)}
                                    />
                                )}
                            </div>

                            {/* Logo Badge */}
                            <motion.div
                                className="absolute -bottom-6 -right-2 lg:right-4 w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-lg border border-[var(--color-primary)]/20 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.5 }}
                            >
                                <div className="text-[var(--color-primary)]">
                                    <Sparkles className="w-12 h-12" />
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Heading & Info - Desktop: Right side */}
                        <div className="lg:w-3/5 lg:pl-8">
                            <motion.div className="text-center lg:text-left" {...fadeInUp} transition={{ delay: 0.3 }}>
                                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-[var(--color-text-primary-light)] dark:text-white leading-tight">
                                    {content.hero_title.includes('guía') ? (
                                        <>{content.hero_title.split('guía')[0]}<span className="italic text-[var(--color-primary)]">guía</span>{content.hero_title.split('guía')[1]}</>
                                    ) : content.hero_title}
                                </h1>
                                <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] leading-relaxed max-w-[320px] lg:max-w-lg mx-auto lg:mx-0 mb-8 lg:text-lg">
                                    {content.hero_subtitle}
                                </p>

                                {/* Desktop CTA - Hidden on mobile */}
                                <div className="hidden lg:block">
                                    <Link to={user ? '/patient/appointments' : '/register'}>
                                        <motion.button
                                            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Calendar className="w-5 h-5" />
                                            {content.cta_button_text}
                                            <ChevronRight className="w-4 h-4" />
                                        </motion.button>
                                    </Link>
                                    <div className="flex items-center gap-1.5 mt-4">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                                            {content.cta_availability_text}
                                        </p>
                                    </div>
                                    {!user && (
                                        <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-3">
                                            ¿Ya tienes cuenta?{' '}
                                            <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
                                                Inicia sesión
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Features - Desktop only */}
                            <motion.div
                                className="hidden lg:grid lg:grid-cols-3 gap-6 mt-12"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{content.feature1_title}</p>
                                        <p className="text-xs text-slate-500">{content.feature1_subtitle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{content.feature2_title}</p>
                                        <p className="text-xs text-slate-500">{content.feature2_subtitle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{content.feature3_title}</p>
                                        <p className="text-xs text-slate-500">{content.feature3_subtitle}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Mission Card */}
            <motion.section
                className="px-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-zinc-900/50 p-6 lg:p-10 rounded-3xl border border-[var(--color-primary)]/10 shadow-[var(--shadow-card)] relative overflow-hidden">
                        <div className="absolute -top-4 -left-4 opacity-5 text-[var(--color-primary)] scale-150">
                            <Quote className="w-24 h-24" />
                        </div>

                        <div className="lg:flex lg:items-start lg:gap-10">
                            <div className="flex items-center gap-4 mb-4 lg:mb-0 relative z-10 lg:flex-shrink-0">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                    <Brain className="w-6 h-6 lg:w-8 lg:h-8" />
                                </div>
                                <div className="lg:hidden">
                                    <h3 className="font-display font-semibold text-lg leading-tight">{content.mission_title}</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)] font-bold">
                                        {content.mission_subtitle}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="hidden lg:block mb-3">
                                    <h3 className="font-display font-semibold text-2xl leading-tight">{content.mission_title}</h3>
                                    <p className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-bold">
                                        {content.mission_subtitle}
                                    </p>
                                </div>
                                <p className="text-sm lg:text-base text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] leading-relaxed italic">
                                    {content.mission_quote}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Appointment Types */}
            <motion.section
                className="px-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="font-display text-2xl lg:text-3xl font-semibold">Agendar Cita</h2>
                        <span className="text-[10px] lg:text-xs uppercase tracking-widest text-slate-400">{content.tariffs_label}</span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
                        {/* Virtual Appointment */}
                        <motion.div
                            className="group relative bg-white dark:bg-zinc-900 p-5 lg:p-8 rounded-3xl border border-[var(--color-primary)]/10 shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/40 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex justify-between items-start mb-3 lg:mb-4">
                                <div className="p-2 lg:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Video className="w-5 h-5 lg:w-7 lg:h-7 text-blue-500" />
                                </div>
                                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] lg:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-[var(--color-primary)]/20">
                                    {content.virtual_badge}
                                </span>
                            </div>

                            <h3 className="font-display text-xl lg:text-2xl font-bold mb-1 lg:mb-2">{content.virtual_title}</h3>
                            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-4 lg:mb-6">
                                {content.virtual_description}
                            </p>

                            <div className="flex justify-between items-center border-t border-slate-50 dark:border-zinc-800 pt-3 lg:pt-4">
                                <div className="flex flex-col">
                                    <span className="text-[var(--color-primary)] font-bold text-xl lg:text-2xl">{content.virtual_price}</span>
                                    <span className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-tighter">{content.session_type_label}</span>
                                </div>
                                <span className="text-xs lg:text-sm font-medium px-2 py-1 lg:px-3 lg:py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-500">
                                    {content.session_duration}
                                </span>
                            </div>
                        </motion.div>

                        {/* In-Person Appointment */}
                        <motion.div
                            className="group relative bg-white dark:bg-zinc-900 p-5 lg:p-8 rounded-3xl border border-[var(--color-primary)]/10 shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/40 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex justify-between items-start mb-3 lg:mb-4">
                                <div className="p-2 lg:p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <MapPin className="w-5 h-5 lg:w-7 lg:h-7 text-green-500" />
                                </div>
                            </div>

                            <h3 className="font-display text-xl lg:text-2xl font-bold mb-1 lg:mb-2">{content.presencial_title}</h3>
                            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mb-4 lg:mb-6">
                                {content.presencial_description}
                            </p>

                            <div className="flex justify-between items-center border-t border-slate-50 dark:border-zinc-800 pt-3 lg:pt-4">
                                <div className="flex flex-col">
                                    <span className="text-[var(--color-primary)] font-bold text-xl lg:text-2xl">{content.presencial_price}</span>
                                    <span className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-tighter">{content.session_type_label}</span>
                                </div>
                                <span className="text-xs lg:text-sm font-medium px-2 py-1 lg:px-3 lg:py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-md text-slate-500">
                                    {content.session_duration}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Quote */}
            <motion.section
                className="px-8 text-center mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <div className="max-w-2xl mx-auto">
                    <Sparkles className="w-10 h-10 lg:w-12 lg:h-12 text-[var(--color-primary)]/40 mx-auto mb-2" />
                    <p className="font-display text-lg lg:text-xl italic text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] leading-snug">
                        {content.final_quote}
                    </p>
                </div>
            </motion.section>

            {/* Fixed Bottom CTA - Mobile only */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--color-background-light)] dark:from-[var(--color-background-dark)] via-[var(--color-background-light)]/95 dark:via-[var(--color-background-dark)]/95 to-transparent z-40">
                <div className="max-w-md mx-auto flex flex-col items-center">
                    <Link to={user ? '/patient/appointments' : '/register'} className="w-full">
                        <motion.button
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Calendar className="w-5 h-5" />
                            {content.cta_button_text}
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </Link>

                    <div className="flex items-center gap-1.5 mt-3">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                            {content.cta_availability_text}
                        </p>
                    </div>

                    {!user && (
                        <p className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-2">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
                                Inicia sesión
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
