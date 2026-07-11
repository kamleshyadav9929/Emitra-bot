import { Routes, Route, useNavigate, useLocation, Navigate, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth as useClerkAuth, useUser, Show, UserButton } from "@clerk/react"
import { AdminSidebar } from "./components/admin/AdminSidebar"
import CommandPalette from "./components/admin/CommandPalette"
import Dashboard from "./pages/admin/Dashboard"
import SendNotification from "./pages/admin/SendNotification"
import Students from "./pages/admin/Students"
import Logs from "./pages/admin/Logs"
import ServiceRequests from "./pages/admin/ServiceRequests"
import BotManager from "./pages/admin/BotManager"
import AdminServices from "./pages/admin/AdminServices"
import AdminApplications from "./pages/admin/AdminApplications"
import AdminExams from "./pages/admin/AdminExams"
import Login from "./pages/admin/Login"
import StudentPanel from "./pages/student/StudentPanel"
import Landing from "./pages/student/Landing"

import { Layers, Bell, Search, Menu } from "lucide-react"
import { LanguageProvider } from "./context/LanguageContext"
import { AuthProvider, useAuth as useStudentAuth } from "./context/AuthContext"  // student portal auth (separate from Clerk admin auth)

// Dynamic home page: renders StudentPanel if logged in, Landing page if logged out
function StudentPortalHome() {
    const { isLoggedIn, isLoaded } = useStudentAuth()
    if (!isLoaded) return <ClerkLoadingSpinner />
    return isLoggedIn ? <StudentPanel /> : <Landing />
}

// Private route for student dashboard
function StudentDashboardRoute() {
    const { isLoggedIn, isLoaded } = useStudentAuth()
    if (!isLoaded) return <ClerkLoadingSpinner />
    return isLoggedIn ? <StudentPanel /> : <Navigate to="/" replace />
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
import { PageSkeleton } from "./components/common/Skeleton"

function ClerkLoadingSpinner() {
    return <PageSkeleton />
}

// ── Admin allowlist — loaded from env at build time ──────────────────────────
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

// ── Access Denied screen ──────────────────────────────────────────────────────
function AccessDenied() {
    const { signOut } = useClerkAuth()
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-base)] px-6">
            <div className="flex flex-col items-center gap-6 max-w-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <span className="text-3xl">🚫</span>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Access Denied</p>
                    <h1 className="text-2xl font-black text-[#0A1A40] font-display mb-3">Not Authorised</h1>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                        Your account does not have admin privileges.<br />
                        Please contact the bureau administrator.
                    </p>
                </div>
                <button
                    onClick={() => signOut({ redirectUrl: "/login" })}
                    className="px-6 py-2.5 rounded-xl bg-[#0A1A40] text-white text-[12px] font-black tracking-wide hover:bg-[#164FA8] transition-all"
                >
                    Sign out &amp; go back
                </button>
            </div>
        </div>
    )
}

// ── Private Route (admin-only, Clerk-powered) ──────────────────────────────────
function PrivateRoute({ children }) {
    const { isSignedIn, isLoaded } = useClerkAuth()
    const { user } = useUser()

    if (!isLoaded) return <ClerkLoadingSpinner />
    if (!isSignedIn) return <Navigate to="/login" replace />

    // Check email against allowlist
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || ""
    const isAdmin = ADMIN_EMAILS.includes(email)
    if (!isAdmin) return <AccessDenied />

    return children
}

// ── Layout Components ─────────────────────────────────────────────────────────

function AdminLayout({ children }) {
    const location = useLocation()
    const navigate = useNavigate()
    const isLoginPage = location.pathname === "/login"
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    useEffect(() => {
        const handleKeys = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "k") {
                event.preventDefault()
                setIsCommandPaletteOpen((prev) => !prev)
                return
            }
            if (event.key === "Escape") { setIsCommandPaletteOpen(false); return }
            if (["INPUT", "TEXTAREA"].includes(event.target.tagName)) return
            if (event.key === "1") navigate("/admin")
            if (event.key === "2") navigate("/admin/send")
            if (event.key === "3") navigate("/admin/students")
            if (event.key === "4") navigate("/admin/requests")
            if (event.key === "5") navigate("/admin/bot-manager")
        }
        window.addEventListener("keydown", handleKeys)
        return () => window.removeEventListener("keydown", handleKeys)
    }, [navigate])

    return (
        <div className="flex flex-col lg:flex-row bg-[var(--color-surface-base)] text-[var(--color-on-surface)] min-h-screen">
            {!isLoginPage && (
                <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            )}
            {!isLoginPage && isCommandPaletteOpen && (
                <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
            )}
            <main className={`flex-1 min-w-0 flex flex-col ${!isLoginPage ? "lg:ml-[280px]" : ""}`}>
                {!isLoginPage && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white text-gray-600 border border-[var(--color-outline-variant)] rounded-xl shadow-sm hover:text-[var(--color-primary)] transition-all cursor-pointer"
                        aria-label="Open Menu"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div className={`max-w-[1200px] w-full mx-auto ${!isLoginPage ? "px-4 sm:px-10 py-6 sm:py-10" : "flex-1 flex flex-col"}`}>
                    {children}
                </div>
            </main>
        </div>
    )
}


function App() {
    return (
        <LanguageProvider>
        <AuthProvider>
        <Routes>
            {/* ── Public Student Portal ─────────────────────────────────────── */}
            <Route path="/" element={<StudentPortalHome />} />
            <Route path="/:tab" element={<StudentPanel />} />
            <Route path="/services/:category" element={<StudentPanel />} />


            {/* ── Admin Auth ────────────────────────────────────────────────── */}
            <Route path="/login" element={<AdminLayout><Login /></AdminLayout>} />

            {/* ── Admin Dashboard (Nested) ──────────────────────────────────── */}
            <Route path="/admin" element={<PrivateRoute><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/send" element={<PrivateRoute><AdminLayout><SendNotification /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/students" element={<PrivateRoute><AdminLayout><Students /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/requests" element={<PrivateRoute><AdminLayout><ServiceRequests /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/exam-forms" element={<PrivateRoute><AdminLayout><AdminApplications /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/exam-manager" element={<PrivateRoute><AdminLayout><AdminExams /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/logs" element={<PrivateRoute><AdminLayout><Logs /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/services" element={<PrivateRoute><AdminLayout><AdminServices /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/bot-manager" element={<PrivateRoute><AdminLayout><BotManager /></AdminLayout></PrivateRoute>} />

            {/* Fallback to Public Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
        </LanguageProvider>
    )
}

export default App
