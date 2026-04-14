import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { AnimatePresence, motion } from "motion/react"
import {
    Search, Mic, X, LogIn, Bell, Globe, User,
    ChevronRight, ArrowRight, ArrowLeft, Zap,
    CreditCard, GraduationCap, Shield, Car,
    FileSignature, FileText, LayoutDashboard, LogOut
} from "lucide-react"

import "../portal.css"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import * as api from "../api"

import LoginModal from "../components/landing/LoginModal"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"
import LandingBottomNav from "../components/landing/LandingBottomNav"
import ServiceIconGrid from "../components/landing/ServiceIconGrid"

// ── Category metadata — matches Landing.jsx exactly ──────────────────────────
const CATEGORY_META = {
    cert:      { icon: FileSignature, bg: "bg-[#eef2ff]", text: "text-[#4f46e5]", border: "border-[#e0e7ff]" },
    id:        { icon: CreditCard,    bg: "bg-[#f0f9ff]", text: "text-[#0ea5e9]", border: "border-[#e0f2fe]" },
    bills:     { icon: Zap,           bg: "bg-[#fff7ed]", text: "text-[#ea580c]", border: "border-[#ffedd5]" },
    forms:     { icon: GraduationCap, bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", border: "border-[#dcfce7]" },
    schemes:   { icon: Shield,        bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fee2e2]" },
    land_auto: { icon: Car,           bg: "bg-[#f0fdfa]", text: "text-[#0d9488]", border: "border-[#ccfbf1]" },
    default:   { icon: FileText,      bg: "bg-[#f3faff]", text: "text-[var(--color-primary)]", border: "border-[#d7e2ff]" },
}

export default function ServicesPage() {
    const { category: catKey } = useParams()
    const navigate = useNavigate()
    const { lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn, logout } = useAuth()

    const [services, setServices] = useState({})
    const [announcements, setAnnouncements] = useState([])
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isListening, setIsListening] = useState(false)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [svc, ann, cfg] = await Promise.all([
                    api.getPublicServices(),
                    api.getPublicAnnouncements(),
                    api.getPublicConfig()
                ])
                setServices(svc.services || {})
                setAnnouncements(ann.announcements || [])
                setConfig(cfg || {})
                setError(null)
            } catch {
                setError("Could not connect to server.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const currentCat = services[catKey]
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const CatIcon = meta.icon

    const filteredServices = currentCat?.services?.filter(svc =>
        !searchQuery || svc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    const handleApply = async (svc) => {
        try { await api.publicLogIntent(svc.name, currentCat?.label) } catch {}
        const catLabel = svc.category || currentCat?.label
        const msg = `Namaste! Mein *${svc.name}* (${catLabel}) ke liye apply karna chahta hoon.`
        window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(msg)}`, "_blank")
    }

    const handleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) return alert("Voice not supported")
        const r = new SR(); r.lang = "en-IN"
        r.onstart = () => setIsListening(true)
        r.onend = () => setIsListening(false)
        r.onerror = () => setIsListening(false)
        r.onresult = e => setSearchQuery(e.results[0][0].transcript.replace(/\.$/, ""))
        r.start()
    }

    return (
        <div className="h-screen flex font-inter overflow-hidden bg-[var(--color-surface-base)] relative">
            <Helmet>
                <title>{currentCat?.label ? `${currentCat.label} | e-Mitra Digital` : "Services | e-Mitra Digital"}</title>
                <meta name="description" content={`Browse ${currentCat?.label || "all"} government services on e-Mitra.`} />
            </Helmet>

            {/* ── LEFT SIDEBAR — identical to Landing.jsx ── */}
            <aside className="w-[260px] bg-white hidden lg:flex flex-col shadow-ambient z-20 shrink-0">
                {/* Logo */}
                <div className="h-[70px] flex items-center px-6 shrink-0">
                    <span className="text-[var(--color-primary)] font-black text-[20px] tracking-tight font-display">e-Mitra Digital</span>
                </div>

                {/* Profile Block */}
                <div className="p-6 bg-[var(--color-surface-low)] flex flex-col gap-3 shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[#0056b3] text-white rounded-full flex items-center justify-center font-black text-[16px] shadow-sm">
                        {isLoggedIn ? user?.name?.charAt(0) : <User size={20} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[14px] font-black text-gray-900 truncate tracking-tight">
                            {isLoggedIn ? user?.name : "Welcome, Student"}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                            {isLoggedIn ? "Verified Access" : "Guest Mode"}
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-3">Service Catalog</h4>
                    <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-[var(--color-surface-low)] hover:text-gray-900 rounded-[8px] transition-colors">
                        <LayoutDashboard size={16} className="text-gray-400" /> Dashboard Home
                    </button>

                    <div className="mt-4 mb-3 px-1">
                        <div className="h-px bg-[var(--color-surface-base)]" />
                    </div>

                    {Object.entries(services).map(([key, cat]) => {
                        const Icon = CATEGORY_META[key]?.icon || CATEGORY_META.default.icon
                        const isActive = key === catKey
                        return (
                            <button
                                key={key}
                                onClick={() => navigate(`/services/${key}`)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-bold rounded-[8px] transition-colors group ${
                                    isActive
                                        ? "bg-[var(--color-primary-fixed)] text-[var(--color-primary)]"
                                        : "text-gray-600 hover:bg-[var(--color-surface-low)] hover:text-gray-900"
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <Icon size={14} className={isActive ? "text-[var(--color-primary)]" : "text-gray-400 group-hover:text-[var(--color-primary)] transition-colors"} />
                                    <span className="truncate">{cat.label}</span>
                                </div>
                                <ChevronRight size={13} className={isActive ? "text-[var(--color-primary)]" : "text-gray-300"} />
                            </button>
                        )
                    })}
                </nav>

                {/* Sidebar footer */}
                <div className="p-4 bg-[var(--color-surface-low)] shrink-0">
                    {!isLoggedIn ? (
                        <button onClick={() => setIsLoginOpen(true)} className="w-full py-2.5 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold rounded-xl shadow-ambient hover:shadow-lg transition-all flex justify-center items-center gap-2">
                            Sign In <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button onClick={() => { logout(); }} className="w-full py-2.5 bg-[var(--color-surface-lowest)] text-gray-700 text-[13px] font-bold rounded-xl shadow-ambient hover:bg-red-50 hover:text-red-600 transition-all flex justify-center items-center gap-2">
                            <LogOut size={14} /> Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA — identical structure to Landing ── */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto scroll-smooth bg-[var(--color-surface-base)] relative">

                {/* Sticky Header — exact same as Landing.jsx */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md h-[70px] flex items-center justify-between px-6 md:px-10 shrink-0 shadow-[0_4px_24px_rgba(7,30,39,0.05)]">
                    {/* Mobile logo */}
                    <div className="flex items-center lg:hidden gap-2">
                        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-gray-500 hover:text-[var(--color-primary)] transition-colors mr-2">
                            <ArrowLeft size={16} />
                        </button>
                        <span className="text-[var(--color-primary)] font-black text-[18px] tracking-tight font-display">e-Mitra Digital</span>
                    </div>

                    {/* Breadcrumb + Search (desktop) */}
                    <div className="hidden md:flex flex-1 items-center gap-4 max-w-lg">
                        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 hover:text-[var(--color-primary)] transition-colors shrink-0">
                            <ArrowLeft size={14} /> All Services
                        </button>
                        <span className="text-gray-300">/</span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 ${meta.bg}`}>
                            <CatIcon size={11} className={meta.text} />
                            <span className={`text-[10px] font-black ${meta.text} uppercase tracking-wide`}>
                                {currentCat?.label || catKey}
                            </span>
                        </div>
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={`Search in ${currentCat?.label || "services"}...`}
                                className="w-full h-10 bg-[var(--color-surface-low)] border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 rounded-full pl-10 pr-10 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 transition-all outline-none shadow-ambient"
                            />
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
                                    <X size={13} />
                                </button>
                            ) : (
                                <button onClick={handleVoice} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-gray-600"}`}>
                                    <Mic size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right icons */}
                    <div className="flex items-center justify-end gap-4 flex-1 md:flex-none">
                        <button className="text-gray-400 hover:text-[var(--color-primary)] transition-colors relative">
                            <Bell size={18} />
                            {announcements.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                        </button>
                        <button onClick={toggleLanguage} className="hidden sm:flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[12px] font-bold">
                            <Globe size={16} /> {lang === 'EN' ? 'HIN' : 'ENG'}
                        </button>

                        {/* Student Auth CTA */}
                        {!isLoggedIn ? (
                            <button
                                id="services-signin-btn"
                                onClick={() => setIsLoginOpen(true)}
                                className="flex items-center gap-2 px-4 h-9 rounded-full bg-[var(--color-primary)] text-white text-[12px] font-black tracking-wide hover:shadow-md hover:-translate-y-px active:scale-95 transition-all"
                            >
                                <LogIn size={14} />
                                <span className="hidden xs:inline">Sign In</span>
                            </button>
                        ) : (
                            <button
                                id="services-profile-btn"
                                onClick={() => setIsProfileOpen(true)}
                                className="flex items-center gap-2.5 pl-1.5 pr-3 h-9 rounded-full bg-[var(--color-primary-fixed)] border border-[var(--color-outline-variant)] hover:shadow-sm transition-all"
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#0056b3] text-white flex items-center justify-center font-black text-[11px] shadow-sm">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[12px] font-black text-[var(--color-primary)] max-w-[80px] truncate hidden sm:block">
                                    {user?.name?.split(' ')[0]}
                                </span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Announcements ticker */}
                {announcements.length > 0 && (
                    <div className="bg-[var(--color-surface-low)] text-gray-600 overflow-hidden h-9 flex items-center shrink-0">
                        <div className="flex items-center gap-2 px-4 md:px-10 shrink-0 h-full border-r border-[var(--color-surface-base)] bg-white">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-900 hidden sm:block">Live Updates</span>
                        </div>
                        <div className="overflow-hidden flex-1 h-full flex items-center">
                            <div className="marquee-track flex gap-12 whitespace-nowrap">
                                {[...announcements, ...announcements].map((a, i) => (
                                    <span key={i} className="text-[12px] font-bold text-gray-700 flex items-center gap-3">
                                        <span className="text-[var(--color-primary)]">•</span> {a.title} — {a.content}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 md:p-8 lg:p-12 pb-32 max-w-4xl mx-auto w-full flex flex-col gap-8">

                    {/* Category banner */}
                    {currentCat && !loading && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 p-5 rounded-[20px] shadow-ambient bg-[var(--color-primary-fixed)]"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-ambient flex items-center justify-center shrink-0">
                                <CatIcon size={26} className="text-[var(--color-primary)]" strokeWidth={1.7} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Service Category</p>
                                <h1 className="text-2xl font-black font-display leading-tight text-[#0A1A40]">{currentCat.label}</h1>
                                <p className="text-[12px] text-[var(--color-primary)] font-bold mt-1">
                                    {filteredServices.length} {searchQuery ? "matching" : "available"} service{filteredServices.length !== 1 ? "s" : ""}
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery("")} className="ml-2 font-bold text-[var(--color-primary)] hover:underline">Clear search</button>
                                    )}
                                </p>
                            </div>
                            <button onClick={() => navigate("/")} className="shrink-0 hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                <ArrowLeft size={13} /> Back
                            </button>
                        </motion.div>
                    )}

                    {/* Mobile search */}
                    <div className="md:hidden relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Search in ${currentCat?.label || "services"}...`}
                            className="w-full h-11 bg-[var(--color-surface-lowest)] border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 rounded-full pl-11 pr-4 text-[13px] font-medium shadow-ambient outline-none"
                        />
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-[var(--color-surface-low)] rounded-[14px] animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="bg-[var(--color-surface-lowest)] shadow-ambient rounded-[20px] p-8 text-center">
                            <h2 className="font-black text-[#0A1A40] mb-2 font-display">Connection Failed</h2>
                            <p className="text-sm text-gray-500 mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-[12px] text-white text-[11px] font-black uppercase tracking-wider bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)]">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Category not found */}
                    {!loading && !error && !currentCat && (
                        <div className="text-center py-24">
                            <Search size={40} className="text-gray-200 mx-auto mb-4" />
                            <h2 className="text-xl font-black text-gray-700 mb-2 font-display">Category Not Found</h2>
                            <p className="text-gray-400 text-sm mb-6">"{catKey}" doesn't exist.</p>
                            <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-[14px] text-white font-black text-[11px] uppercase tracking-wider bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)]">
                                ← Back to Home
                            </button>
                        </div>
                    )}

                    {/* Service list */}
                    {!loading && !error && currentCat && (
                        <AnimatePresence mode="wait">
                            {filteredServices.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-center py-20 bg-[var(--color-surface-lowest)] shadow-ambient rounded-[20px]">
                                    <Search size={32} className="text-gray-200 mx-auto mb-3" />
                                    <h3 className="font-black text-gray-400">No results for "{searchQuery}"</h3>
                                    <button onClick={() => setSearchQuery("")} className="mt-3 text-[11px] font-bold text-gray-400 hover:text-[var(--color-primary)] hover:underline transition-colors">Clear search</button>
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <ServiceIconGrid
                                        services={{ [catKey]: { ...currentCat, services: filteredServices } }}
                                        activeCategory={catKey}
                                        onServiceClick={handleApply}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Other categories */}
                    {!loading && !error && Object.keys(services).length > 1 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Other Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(services).filter(([k]) => k !== catKey).map(([key, cat]) => {
                                    const OIcon = (CATEGORY_META[key] || CATEGORY_META.default).icon
                                    return (
                                        <button key={key} onClick={() => navigate(`/services/${key}`)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-[12px] text-[11px] font-bold bg-[var(--color-primary-fixed)] text-[var(--color-primary)] shadow-ambient hover:bg-[var(--color-primary)] hover:text-white transition-all">
                                            <OIcon size={11} />
                                            {cat.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <StudentProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <LandingBottomNav onLoginClick={() => setIsLoginOpen(true)} onProfileClick={() => setIsProfileOpen(true)} />
        </div>
    )
}
