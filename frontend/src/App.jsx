import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Sidebar, BottomNav } from "./components/Sidebar"
import CommandPalette from "./components/CommandPalette"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"
import ServiceRequests from "./pages/ServiceRequests"
import BotManager from "./pages/BotManager"
import Login from "./pages/Login"
import Landing from "./pages/Landing" // [NEW] Public Landing
import { Layers } from "lucide-react"

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
        <div className="flex flex-col md:flex-row bg-white text-black min-h-screen">
            {!isLoginPage && <Sidebar />}
            {!isLoginPage && isCommandPaletteOpen && (
                <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
            )}
            <main className={`flex-1 min-w-0 flex flex-col ${!isLoginPage ? "md:ml-[220px]" : ""}`}>
                {!isLoginPage && (
                    <div className="md:hidden flex items-center gap-3 px-5 py-4 border-b border-[#E5E5E3] bg-white sticky top-0 z-40">
                        <div className="w-7 h-7 bg-black flex items-center justify-center">
                            <Layers size={14} className="text-white" />
                        </div>
                        <span className="text-[14px] font-semibold">Admin Panel</span>
                    </div>
                )}
                <div className={`max-w-5xl mx-auto w-full ${!isLoginPage ? "px-4 sm:px-5 md:px-8 py-6 md:py-8" : "flex-1 flex flex-col"}`}>
                    {children}
                </div>
            </main>
            {!isLoginPage && <BottomNav />}
        </div>
    )
}

function StudentLayout({ children }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const navLinks = [
        { label: 'Sevayen', href: '#services' },
        { label: 'Track Status', href: '#status' },
        { label: 'Updates', href: '#updates' },
    ]

    return (
        <div className="bg-white text-black min-h-screen selection:bg-black selection:text-white">
            <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm shadow-black/5 border-b border-black/5' : 'bg-white border-b border-black/5'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
                    
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-7 h-7 bg-black flex items-center justify-center rounded-md">
                            <Layers size={13} className="text-white" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[13px] font-black tracking-tight uppercase">Krishna E-Mitra</span>
                            <span className="text-[9px] font-bold text-ink-4 uppercase tracking-widest">Digital Seva Portal</span>
                        </div>
                    </a>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ label, href }) => (
                            <a
                                key={label}
                                href={href}
                                className="px-4 py-2 text-[11px] font-bold tracking-widest uppercase text-ink-2 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <a
                            href="https://wa.me/916377964293"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-black/85 transition-all active:scale-95"
                        >
                            WhatsApp Help
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-black/5 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-black transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>

                {/* Mobile Drawer */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-80 border-t border-black/5' : 'max-h-0'}`}>
                    <div className="px-6 py-4 space-y-1 bg-white">
                        {navLinks.map(({ label, href }) => (
                            <a
                                key={label}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-[12px] font-black uppercase tracking-widest text-ink-2 hover:text-black hover:bg-black/5 rounded-xl transition-all"
                            >
                                {label}
                            </a>
                        ))}
                        <div className="pt-3 border-t border-black/5">
                            <a
                                href="https://wa.me/916377964293"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-black text-white px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl"
                            >
                                WhatsApp Help
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                {children}
            </main>
        </div>
    )
}

function App() {
    return (
        <Routes>
            {/* ── Public Student Portal ─────────────────────────────────────── */}
            <Route path="/" element={<StudentLayout><Landing /></StudentLayout>} />
            
            {/* ── Admin Auth ────────────────────────────────────────────────── */}
            <Route path="/login" element={<AdminLayout><Login /></AdminLayout>} />
            
            {/* ── Admin Dashboard (Nested) ──────────────────────────────────── */}
            <Route path="/admin" element={<PrivateRoute><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/send" element={<PrivateRoute><AdminLayout><SendNotification /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/students" element={<PrivateRoute><AdminLayout><Students /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/requests" element={<PrivateRoute><AdminLayout><ServiceRequests /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/logs" element={<PrivateRoute><AdminLayout><Logs /></AdminLayout></PrivateRoute>} />
            <Route path="/admin/bot-manager" element={<PrivateRoute><AdminLayout><BotManager /></AdminLayout></PrivateRoute>} />
            
            {/* Fallback to Public Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
