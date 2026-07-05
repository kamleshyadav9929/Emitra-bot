import { Routes, Route, useNavigate, useLocation, Navigate, Link } from "react-router-dom"
import { useEffect, useState } from "react"
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
import Landing from "./pages/Landing" // [NEW] Public Landing
import ServicesPage from "./pages/ServicesPage" // [NEW] Category Services Page
import { Layers, Bell, Search, User } from "lucide-react"
import { LanguageProvider } from "./context/LanguageContext"
import { AuthProvider } from "./context/AuthContext"

// ── Shared Private Route Wrapper ─────────────────────────────────────────────
function PrivateRoute({ children }) {
    const token = localStorage.getItem("admin_token")
    if (!token) return <Navigate to="/login" replace />
    return children
}

// ── Layout Components ─────────────────────────────────────────────────────────

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
        <div className="flex flex-col md:flex-row bg-[#F8FAFC] text-black min-h-screen">
            {!isLoginPage && <Sidebar />}
            {!isLoginPage && isCommandPaletteOpen && (
                <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
            )}
            <main className={`flex-1 min-w-0 flex flex-col ${!isLoginPage ? "md:ml-[260px]" : ""}`}>
                {/* Max-w and padding changes */}
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
