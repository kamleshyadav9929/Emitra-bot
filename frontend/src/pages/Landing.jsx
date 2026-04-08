import { useState, useEffect, useMemo } from "react"
import Fuse from "fuse.js"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import {
    Search, Mic, LogIn, Layers, ChevronRight,
    CreditCard, Zap, GraduationCap, Shield, Car,
    FileSignature, FileText, Bell, Globe, User,
    X, ArrowRight, Clock
} from "lucide-react"

import "../portal.css"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import * as api from "../api"

import ServiceDetailModal from "../components/landing/ServiceDetailModal"
import RegistrationModal from "../components/landing/RegistrationModal"
import StatusPortal from "../components/landing/StatusPortal"
import LoginModal from "../components/landing/LoginModal"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"
import LandingBottomNav from "../components/landing/LandingBottomNav"
import PortalSidebar from "../components/landing/PortalSidebar"
import PortalRightPanel from "../components/landing/PortalRightPanel"

// ── Icon map ────────────────────────────────────────────────────────────────
const CATEGORY_META = {
    cert:      { icon: FileSignature, color: "from-violet-500 to-purple-600",  bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200"  },
    id:        { icon: CreditCard,    color: "from-blue-500 to-blue-700",       bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-200"    },
    bills:     { icon: Zap,           color: "from-amber-400 to-orange-500",    bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200"   },
    forms:     { icon: GraduationCap, color: "from-green-500 to-emerald-600",   bg: "bg-green-50",   text: "text-green-700",   ring: "ring-green-200"   },
    schemes:   { icon: Shield,        color: "from-red-500 to-rose-600",        bg: "bg-red-50",     text: "text-red-700",     ring: "ring-red-200"     },
    land_auto: { icon: Car,           color: "from-teal-500 to-cyan-600",       bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200"    },
    default:   { icon: FileText,      color: "from-slate-400 to-slate-600",     bg: "bg-slate-50",   text: "text-slate-700",   ring: "ring-slate-200"   },
}

// ── Category tile ─────────────────────────────────────────────────────────────
function CategoryTile({ catKey, label, serviceCount, delay, onClick }) {
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const Icon = meta.icon

    return (
        <motion.button
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: delay * 0.06, ease: "easeOut" }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`icon-pulse group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-[var(--border)] hover:border-transparent hover:shadow-lg hover:shadow-slate-200/80 transition-all duration-200 cursor-pointer text-center overflow-hidden`}
        >
            {/* Icon circle */}
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                <Icon size={22} className="text-white" strokeWidth={1.8} />
            </div>

            {/* Name */}
            <p className="text-[10px] font-bold text-slate-700 group-hover:text-slate-900 leading-tight line-clamp-2 transition-colors">
                {label}
            </p>

            {/* Count badge */}
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                {serviceCount} services
            </span>

            {/* Hover arrow */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={11} className={meta.text} />
            </div>
        </motion.button>
    )
}

// ── Search result row ─────────────────────────────────────────────────────────
function SearchResultRow({ svc, onSelect }) {
    const meta = CATEGORY_META[svc.catKey] || CATEGORY_META.default
    const Icon = meta.icon
    return (
        <button
            onClick={() => onSelect(svc)}
            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group transition-colors border-b border-slate-50 last:border-0"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                <Icon size={14} className={meta.text} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800 truncate">{svc.name}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${meta.text}`}>{svc.category}</p>
            </div>
            <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
        </button>
    )
}

// ── Announcement bar ─────────────────────────────────────────────────────────
function AnnouncementBar({ announcements }) {
    if (!announcements?.length) return null
    const doubled = [...announcements, ...announcements] // for seamless loop
    return (
        <div className="bg-[var(--navy)] text-white overflow-hidden h-7 flex items-center">
            <div className="flex items-center gap-2 px-3 shrink-0 bg-[var(--amber)] h-full">
                <Bell size={11} className="text-[var(--navy-dark)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--navy-dark)]">Notice</span>
            </div>
            <div className="overflow-hidden flex-1 h-full flex items-center">
                <div className="marquee-track flex gap-12 whitespace-nowrap">
                    {doubled.map((a, i) => (
                        <span key={i} className="text-[10px] font-medium text-white/80">
                            {a.title} — {a.content}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function Landing() {
    const navigate = useNavigate()
    const { t, lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn } = useAuth()

    // Data states
    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0 })
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // UI states
    const [search, setSearch] = useState("")
    const [showDrop, setShowDrop] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [isRegOpen, setIsRegOpen] = useState(false)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [showStatus, setShowStatus] = useState(false)
    const [statusPhone, setStatusPhone] = useState("")
    const [history, setHistory] = useState(null)
    const [isSearching, setIsSearching] = useState(false)

    // Fetch
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            try {
                const [svc, ex, ann, st, cfg] = await Promise.all([
                    api.getPublicServices(),
                    api.getPublicExams(),
                    api.getPublicAnnouncements(),
                    api.getPublicStats(),
                    api.getPublicConfig()
                ])
                setServices(svc.services || {})
                setExams(ex.exams || [])
                setAnnouncements(ann.announcements || [])
                setStats(st.stats || { total_students: 0 })
                setConfig(cfg || {})
                setError(null)
            } catch {
                setError("Server connection failed.")
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    // Fuse search
    const allServices = useMemo(() => {
        const flat = []
        Object.entries(services).forEach(([catKey, cat]) => {
            cat.services?.forEach(s => flat.push({ ...s, category: cat.label, catKey }))
        })
        return flat
    }, [services])

    const fuse = useMemo(() =>
        new Fuse(allServices, { keys: ["name", "category"], threshold: 0.4 }),
        [allServices]
    )

    const results = useMemo(() =>
        search ? fuse.search(search).map(r => r.item).slice(0, 7) : [],
        [search, fuse]
    )

    const handleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) return alert("Voice search not supported.")
        const r = new SR(); r.lang = "en-IN"; r.interimResults = false
        r.onstart = () => setIsListening(true)
        r.onend = () => setIsListening(false)
        r.onerror = () => setIsListening(false)
        r.onresult = e => { setSearch(e.results[0][0].transcript.replace(/\.$/, "")); setShowDrop(true) }
        r.start()
    }

    const handleApply = async (svc, category) => {
        try { await api.publicLogIntent(svc.name, category) } catch {}
        const msg = `Namaste! Mein *${svc.name}* (${category}) ke liye apply karna chahta hoon.`
        window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(msg)}`, "_blank")
    }

    const handleCheckStatus = async () => {
        if (!/^[6-9]\d{9}$/.test(statusPhone)) return
        setIsSearching(true)
        try { const d = await api.publicCheckStatus(statusPhone); setHistory(d.history || []) }
        catch { setHistory([]) }
        finally { setIsSearching(false) }
    }

    const totalServices = useMemo(() =>
        Object.values(services).reduce((s, c) => s + (c.services?.length || 0), 0),
        [services]
    )

    return (
        <div className="min-h-screen" style={{ background: "var(--surface)" }}>
            <Helmet>
                <title>Krishna E-Mitra | Digital Government Services Portal</title>
                <meta name="description" content="Apply for government certificates, IDs, and exams from the comfort of your home." />
            </Helmet>

            {/* ══════════════════════════════════════════════════════════════
                HEADER
            ══════════════════════════════════════════════════════════════ */}
            <header
                className="fixed inset-x-0 top-0 z-50 bg-white border-b border-[var(--border)]"
                style={{ height: "var(--header-h)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
                <div className="h-full flex items-center gap-3 px-4">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2 shrink-0" style={{ width: "calc(var(--sidebar-w) - 1rem)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--navy)" }}>
                            <Layers size={14} className="text-white" />
                        </div>
                        <div className="hidden lg:block leading-none">
                            <p className="text-[11px] font-black uppercase tracking-tight" style={{ color: "var(--navy)" }}>Krishna E-Mitra</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Digital Seva Portal</p>
                        </div>
                    </a>

                    {/* Search bar */}
                    <div className="flex-1 max-w-2xl mx-auto relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
                            onFocus={() => setShowDrop(true)}
                            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
                            placeholder="Search services, certificates, IDs..."
                            className="w-full h-9 bg-slate-50 border border-[var(--border)] focus:bg-white focus:border-[var(--navy)]/30 focus:ring-2 focus:ring-[var(--navy)]/10 rounded-lg pl-9 pr-10 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all"
                        />
                        {search ? (
                            <button onClick={() => { setSearch(""); setShowDrop(false) }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={13} />
                            </button>
                        ) : (
                            <button onClick={handleVoice}
                                className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-slate-600"}`}>
                                <Mic size={13} />
                            </button>
                        )}

                        {/* Search dropdown */}
                        <AnimatePresence>
                            {showDrop && search.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-[var(--border)] shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto"
                                >
                                    {results.length > 0 ? results.map((svc, i) => (
                                        <SearchResultRow key={i} svc={svc} onSelect={s => { setSelectedService(s); setShowDrop(false); setSearch("") }} />
                                    )) : (
                                        <div className="px-4 py-8 text-center">
                                            <Search size={24} className="text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm font-semibold text-slate-400">No results for "{search}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        {/* Lang toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="hidden sm:flex items-center gap-1.5 px-3 h-8 border border-[var(--border)] rounded-lg text-[10px] font-black hover:bg-slate-50 transition-colors text-slate-600"
                        >
                            <Globe size={11} />
                            <span>{lang === "EN" ? "हिंदी" : "English"}</span>
                        </button>

                        {/* Notifications */}
                        <button className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--border)] items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative">
                            <Bell size={13} />
                            {announcements.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                            )}
                        </button>

                        {/* Auth */}
                        {isLoggedIn ? (
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="flex items-center gap-2 px-3 h-8 rounded-lg border border-[var(--border)] hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: "var(--navy)" }}>
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 hidden sm:block max-w-[70px] truncate">{user?.name?.split(" ")[0]}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-white text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
                                style={{ background: "var(--navy)" }}
                            >
                                <LogIn size={11} />
                                <span>Login</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Announcement bar (below header) */}
            <div className="fixed inset-x-0 z-40" style={{ top: "var(--header-h)" }}>
                <AnnouncementBar announcements={announcements} />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                BODY = Sidebar + Main + RightPanel
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex" style={{ paddingTop: `calc(var(--header-h) + ${announcements.length > 0 ? "28px" : "0px"})` }}>

                {/* LEFT SIDEBAR */}
                <PortalSidebar
                    services={services}
                    activeCategory="ALL"
                    config={config}
                    isLoggedIn={isLoggedIn}
                    user={user}
                    onLoginClick={() => setIsLoginOpen(true)}
                    onWhatsApp={() => window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}`, "_blank")}
                    onTrack={() => setShowStatus(true)}
                />

                {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0 p-5 pb-24 md:pb-6">

                    {/* Welcome bar if logged in */}
                    {isLoggedIn && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 rounded-2xl p-4 flex items-center justify-between"
                            style={{ background: "var(--navy)" }}
                        >
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-0.5">Welcome back</p>
                                <p className="text-sm font-black text-white">{user?.name}</p>
                            </div>
                            <button onClick={() => setIsProfileOpen(true)}
                                className="text-[9px] font-black text-white/50 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                                View Profile <ChevronRight size={10} />
                            </button>
                        </motion.div>
                    )}

                    {/* Section header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Browse By Category</p>
                            <h1 className="text-xl font-black text-slate-800">All Services</h1>
                        </div>
                        {!loading && !error && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white border border-[var(--border)] px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-400" />
                                {totalServices} services available
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="skeleton aspect-square rounded-2xl" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="bg-white border border-red-100 rounded-2xl p-8 text-center max-w-md mx-auto">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                                <X size={20} className="text-red-400" />
                            </div>
                            <h2 className="font-black text-slate-800 mb-1">Connection Failed</h2>
                            <p className="text-sm text-slate-500 mb-4">{error}</p>
                            <button onClick={() => window.location.reload()}
                                className="px-5 py-2 rounded-lg text-white text-[11px] font-black uppercase tracking-wider transition-all hover:opacity-90"
                                style={{ background: "var(--navy)" }}>
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ── SERVICE CATEGORY GRID ── */}
                    {!loading && !error && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {Object.entries(services).map(([key, cat], idx) => (
                                <CategoryTile
                                    key={key}
                                    catKey={key}
                                    label={cat.label}
                                    serviceCount={cat.services?.length || 0}
                                    delay={idx}
                                    onClick={() => navigate(`/services/${key}`)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Status tracker panel */}
                    <AnimatePresence>
                        {showStatus && (
                            <motion.div
                                id="status-panel"
                                key="status"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="mt-8 bg-white border border-[var(--border)] rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Track Your Application</h2>
                                    <button onClick={() => setShowStatus(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={16} />
                                    </button>
                                </div>
                                <StatusPortal
                                    phone={statusPhone}
                                    setPhone={setStatusPhone}
                                    history={history}
                                    onSearch={handleCheckStatus}
                                    isSearching={isSearching}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CTA footer strip */}
                    {!loading && !error && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="mt-8 bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-black text-slate-800">Ready to go digital?</p>
                                <p className="text-sm text-slate-500 mt-0.5">Apply instantly via WhatsApp or Telegram Bot</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <a
                                    href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"}
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-5 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
                                    style={{ background: "var(--navy)" }}
                                >
                                    Telegram Bot
                                </a>
                                <a
                                    href={`https://wa.me/${config.whatsapp_number || "916377964293"}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-5 py-2 rounded-xl border border-[var(--border)] text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                                >
                                    WhatsApp
                                </a>
                            </div>
                        </motion.div>
                    )}
                </main>

                {/* RIGHT PANEL */}
                <PortalRightPanel
                    stats={stats}
                    config={config}
                    onRegister={() => setIsRegOpen(true)}
                    onTrack={() => setShowStatus(true)}
                />
            </div>

            {/* Modals */}
            <ServiceDetailModal
                service={selectedService}
                category={selectedService?.category}
                onClose={() => setSelectedService(null)}
                onApply={handleApply}
                config={config}
            />
            <RegistrationModal isOpen={isRegOpen} onClose={() => setIsRegOpen(false)} exams={exams} config={config} />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <StudentProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <LandingBottomNav onLoginClick={() => setIsLoginOpen(true)} onProfileClick={() => setIsProfileOpen(true)} />
        </div>
    )
}
