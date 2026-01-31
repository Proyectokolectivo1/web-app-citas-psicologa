import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './infrastructure/store/authStore'

// Layouts
import PublicLayout from './presentation/layouts/PublicLayout'
import PatientLayout from './presentation/layouts/PatientLayout'
import AdminLayout from './presentation/layouts/AdminLayout'

// Public Pages
import Landing from './presentation/pages/public/Landing'
import Login from './presentation/pages/auth/Login'
import Register from './presentation/pages/auth/Register'
import ResetPassword from './presentation/pages/auth/ResetPassword'

// Patient Pages
import PatientDashboard from './presentation/pages/patient/Dashboard'
import PatientAppointments from './presentation/pages/patient/Appointments'
import PatientResources from './presentation/pages/patient/Resources'

// Admin Pages
import AdminDashboard from './presentation/pages/admin/Dashboard'
import AdminPatients from './presentation/pages/admin/Patients'
import AdminAppointments from './presentation/pages/admin/Appointments'
import AdminResources from './presentation/pages/admin/Resources'
import AdminAvailability from './presentation/pages/admin/Availability'
import AdminSettings from './presentation/pages/admin/Settings'


// Protected Route Component
function ProtectedRoute({
    children,
    requiredRole
}: {
    children: React.ReactNode
    requiredRole?: 'patient' | 'psychologist'
}) {
    const { user, profile, isLoading } = useAuthStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 animate-breathe" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole && profile?.role !== requiredRole) {
        return <Navigate to={profile?.role === 'psychologist' ? '/admin' : '/patient'} replace />
    }

    return <>{children}</>
}

function App() {
    const initialize = useAuthStore(state => state.initialize)

    useEffect(() => {
        initialize()
    }, [initialize])

    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Patient Routes */}
            <Route
                path="/patient"
                element={
                    <ProtectedRoute requiredRole="patient">
                        <PatientLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<PatientDashboard />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="resources" element={<PatientResources />} />
            </Route>

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="psychologist">
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<AdminDashboard />} />
                <Route path="patients" element={<AdminPatients />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="resources" element={<AdminResources />} />
                <Route path="availability" element={<AdminAvailability />} />
                <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
