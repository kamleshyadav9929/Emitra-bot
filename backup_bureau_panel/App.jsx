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

function TopNavbar() {
    const location = useLocation()
    
    const getLinkClass = (path) => {
        const isActive = location.pathname === path
        return `h-full flex items-center px-5 font-bold text-[14px] transition-all border-b-[3px] pt-[3px] ${
            isActive ? "text-[#164FA8] border-[#164FA8]" : "text-gray-500 hover:text-gray-900 border-transparent"
        }`
    }

    return (
        <header className="bg-white border-b border-gray-200 h-[80px] flex items-center justify-between px-8 sticky top-0 z-20">
            {/* Nav Links */}
            <div className="flex items-center gap-10 h-full">
                <div className="flex flex-col -mt-1 leading-none tracking-tight">
                    <span className="text-[#164FA8] font-black text-[22px] tracking-tight">e-Mitra</span>
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

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF0FA] text-[#164FA8] border border-[#d2e0f8] flex items-center justify-center">
                        <User size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-gray-900 leading-tight">Admin User</span>
                        <span className="text-[9px] font-bold text-gray-400 tracking-wider">SUPER ADMIN</span>
                    </div>
                </div>
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
        <div className="flex flex-col md:flex-row bg-[#F8FAFC] text-black min-h-screen">
            {!isLoginPage && <Sidebar />}
            {!isLoginPage && isCommandPaletteOpen && (
                <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
            )}
            <main className={`flex-1 min-w-0 flex flex-col ${!isLoginPage ? "md:ml-[260px]" : ""}`}>
                {!isLoginPage && <TopNavbar />}
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
