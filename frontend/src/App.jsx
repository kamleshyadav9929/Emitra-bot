import { Routes, Route, useNavigate, useLocation, Navigate, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth, useUser, Show, UserButton } from "@clerk/react"
import { Sidebar, BottomNav } from "./components/Sidebar"
import CommandPalette from "./components/CommandPalette"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"
import ServiceRequests from "./pages/ServiceRequests"
import BotManager from "./pages/BotManager"
import AdminServices from "./pages/AdminServices"
import Login from "./pages/Login"
import Landing from "./pages/Landing"
import ServicesPage from "./pages/ServicesPage"
import { Layers, Bell, Search } from "lucide-react"
import { LanguageProvider } from "./context/LanguageContext"
import { AuthProvider } from "./context/AuthContext"  // student portal auth (separate from Clerk admin auth)

// ── Loading Spinner ───────────────────────────────────────────────────────────
function ClerkLoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-base)]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-[3px] border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin" />
                <span className="text-[12px] text-gray-400 font-bold tracking-widest uppercase">Loading</span>
            </div>
        </div>
    )
}

// ── Admin allowlist — loaded from env at build time ──────────────────────────
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

// ── Access Denied screen ──────────────────────────────────────────────────────
function AccessDenied() {
    const { signOut } = useAuth()
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
    const { isSignedIn, isLoaded } = useAuth()
    const { user } = useUser()
    const [isBackendAuthed, setIsBackendAuthed] = useState(false)

    useEffect(() => {
        if (isSignedIn && user) {
            const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || ""
            const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email)
            if (isAdmin) {
                // Automatically get the backend token using the secret key so legacy Python APIs work
                import("./api").then(api => {
                    api.loginAdmin(import.meta.env.VITE_SECRET_KEY || "emitra2025").then(res => {
                        if (res.token) {
                            localStorage.setItem("admin_token", res.token)
                            setIsBackendAuthed(true)
                        }
                    }).catch(console.error)
                })
            }
        }
    }, [isSignedIn, user])

    if (!isLoaded) return <ClerkLoadingSpinner />
    if (!isSignedIn) return <Navigate to="/login" replace />

    // Check email against allowlist
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || ""
    const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email)
    if (!isAdmin) return <AccessDenied />

    // Wait until the backend token is fetched so children components don't make unauthorized API calls
    if (!isBackendAuthed && !localStorage.getItem("admin_token")) {
        return <ClerkLoadingSpinner />
    }

    return children
}

// ── Layout Components ─────────────────────────────────────────────────────────

function TopNavbar() {
    const location = useLocation()

    const getLinkClass = (path) => {
        const isActive = location.pathname === path
        return `h-full flex items-center px-5 font-bold text-[14px] transition-all border-b-[3px] pt-[3px] ${
            isActive ? "text-[var(--color-primary)] border-[var(--color-primary)]" : "text-gray-500 hover:text-[var(--color-on-surface)] border-transparent"
        }`
    }

    return (
        <header className="bg-[var(--color-surface-base)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)] h-[80px] flex items-center justify-between px-8 sticky top-0 z-20">
            {/* Nav Links */}
            <div className="flex items-center gap-10 h-full">
                <div className="flex flex-col -mt-1 leading-none tracking-tight">
                    <span className="text-[var(--color-primary)] font-black text-[22px] tracking-tight font-display">e-Mitra</span>
                    <span className="text-gray-500 font-bold text-[11px] tracking-widest uppercase mt-0.5">Admin Panel</span>
                </div>

                <nav className="flex h-full ml-4">
                    <Link to="/admin" className={getLinkClass("/admin")}>
                        Dashboard
                    </Link>
                    <Link to="/admin/services" className={getLinkClass("/admin/services")}>
                        Services
                    </Link>
                    <Link to="#" className="h-full flex items-center px-5 text-gray-400 hover:text-gray-900 font-bold text-[14px] transition-colors border-b-[3px] border-transparent pt-[3px]">
                        Support
                    </Link>
                    <Link to="#" className="h-full flex items-center px-5 text-gray-400 hover:text-gray-900 font-bold text-[14px] transition-colors border-b-[3px] border-transparent pt-[3px]">
                        Resources
                    </Link>
                </nav>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-6">
                <div className="relative border-b border-gray-200 py-1 flex items-center gap-3">
                    <Search className="text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        className="bg-transparent text-[13px] border-none focus:outline-none w-48 text-gray-800 placeholder:text-gray-400"
                    />
                </div>
                <button className="text-gray-500 hover:text-gray-900 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-8 w-px bg-gray-200"></div>

                {/* Clerk UserButton — handles avatar, account & sign out */}
                <Show when="signed-in">
                    <div className="flex items-center gap-3">
                        <UserButton
                            afterSignOutUrl="/login"
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8 ring-2 ring-[#d2e0f8]",
                                },
                            }}
                        />
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-gray-900 leading-tight">Admin</span>
                            <span className="text-[9px] font-bold text-gray-400 tracking-wider">SUPER ADMIN</span>
                        </div>
                    </div>
                </Show>
            </div>
        </header>
    )
}

function AdminLayout({ children }) {
    const location = useLocation()
    const navigate = useNavigate()
    const isLoginPage = location.pathname === "/login"
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

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
        <div className="flex flex-col md:flex-row bg-[var(--color-surface-base)] text-[var(--color-on-surface)] min-h-screen">
            {!isLoginPage && <Sidebar />}
            {!isLoginPage && isCommandPaletteOpen && (
                <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
            )}
            <main className={`flex-1 min-w-0 flex flex-col ${!isLoginPage ? "md:ml-[260px]" : ""}`}>
                {!isLoginPage && <TopNavbar />}
                <div className={`max-w-[1200px] w-full ${!isLoginPage ? "px-6 sm:px-10 py-10" : "flex-1 flex flex-col"}`}>
                    {children}
                </div>
            </main>
            {!isLoginPage && <BottomNav />}
        </div>
    )
}


function App() {
    return (
        <LanguageProvider>
        <AuthProvider>
        <Routes>
            {/* ── Public Student Portal ─────────────────────────────────────── */}
            <Route path="/" element={<Landing />} />
            <Route path="/services/:category" element={<ServicesPage />} />

            {/* ── Admin Auth ────────────────────────────────────────────────── */}
            <Route path="/login" element={<AdminLayout><Login /></AdminLayout>} />

            {/* ── Admin Dashboard (Nested) ──────────────────────────────────── */}
            <Route path="/admin" element={<PrivateRoute><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/send" element={<PrivateRoute><AdminLayout><SendNotification /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/students" element={<PrivateRoute><AdminLayout><Students /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/requests" element={<PrivateRoute><AdminLayout><ServiceRequests /></AdminLayout></PrivateRoute>} />
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
