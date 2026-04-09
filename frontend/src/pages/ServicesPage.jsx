import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import {
    ArrowLeft, Search, Layers, LogIn, Globe,
    CreditCard, Zap, GraduationCap, Shield, Car,
    FileSignature, FileText, MessageCircle, Mic,
    X, ChevronLeft, Bell
} from "lucide-react"

import "../portal.css"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import * as api from "../api"

import ServiceDetailModal from "../components/landing/ServiceDetailModal"
import LoginModal from "../components/landing/LoginModal"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"
import LandingBottomNav from "../components/landing/LandingBottomNav"
import PortalSidebar from "../components/landing/PortalSidebar"
import PortalRightPanel from "../components/landing/PortalRightPanel"

// ── Category metadata (same as Landing.jsx) ────────────────────────────────
const CATEGORY_META = {
    cert:      { icon: FileSignature, color: "from-violet-500 to-purple-600",  bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-200"  },
    id:        { icon: CreditCard,    color: "from-blue-500 to-blue-700",       bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200"    },
    bills:     { icon: Zap,           color: "from-amber-400 to-orange-500",    bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200"   },
    forms:     { icon: GraduationCap, color: "from-green-500 to-emerald-600",   bg: "bg-green-50",   text: "text-green-600",   border: "border-green-200"   },
    schemes:   { icon: Shield,        color: "from-red-500 to-rose-600",        bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200"     },
    land_auto: { icon: Car,           color: "from-teal-500 to-cyan-600",       bg: "bg-teal-50",    text: "text-teal-600",    border: "border-teal-200"    },
    default:   { icon: FileText,      color: "from-slate-400 to-slate-600",     bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200"   },
}

// ── Service row card ──────────────────────────────────────────────────────────
function ServiceRow({ name, description, price, catKey, delay, index = 0, onApply, onClick }) {
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const Icon = meta.icon

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, delay: delay * 0.03, ease: "easeOut" }}
            className="group relative bg-white border border-black/[0.07] hover:border-black/20 hover:shadow-lg hover:shadow-black/[0.06] rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden"
            onClick={onClick}
        >
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black scale-y-0 group-hover:scale-y-100 transition-transform duration-250 origin-bottom rounded-l-2xl" />

            <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
                {/* Sequential number */}
                <span className="text-[11px] font-black text-black/20 tabular-nums w-6 shrink-0 group-hover:text-black/40 transition-colors">
                    {String(index + 1).padStart(2, "0")}
                </span>

                {/* Icon: square, inverts on hover */}
                <div className="w-9 h-9 rounded-xl bg-black/[0.04] group-hover:bg-black flex items-center justify-center shrink-0 transition-all duration-250">
                    <Icon size={15} className="text-black/40 group-hover:text-white transition-colors duration-250" strokeWidth={1.8} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-black/85 leading-tight line-clamp-1 group-hover:text-black transition-colors">
                        {name}
                    </p>
                    {description && (
                        <p className="text-[10px] text-black/35 mt-0.5 line-clamp-1">{description}</p>
                    )}
                </div>

                {/* Price */}
                {price && (
                    <span className="hidden sm:block text-[9px] font-black px-2.5 py-1 rounded-full border border-black/[0.08] text-black/35 shrink-0 group-hover:border-black/20 group-hover:text-black/55 transition-all">
                        ₹{price}
                    </span>
                )}

                {/* Apply CTA */}
                <button
                    onClick={e => { e.stopPropagation(); onApply() }}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-black/80 active:scale-95 transition-all"
                >
                    <MessageCircle size={11} />
                    Apply
                </button>
            </div>
        </motion.div>
    )
}


export default function ServicesPage() {
    const { category: catKey } = useParams()
    const navigate = useNavigate()
    const { lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn } = useAuth()

    const [services, setServices] = useState({})
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0 })
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isListening, setIsListening] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [svc, ann, st, cfg] = await Promise.all([
                    api.getPublicServices(),
                    api.getPublicAnnouncements(),
                    api.getPublicStats(),
                    api.getPublicConfig()
                ])
                setServices(svc.services || {})
                setAnnouncements(ann.announcements || [])
                setStats(st.stats || {})
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
        const msg = `Namaste! Mein *${svc.name}* (${currentCat?.label}) ke liye apply karna chahta hoon.`
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

    const pageTitle = currentCat?.label ? `${currentCat.label} | Krishna E-Mitra` : "Services | Krishna E-Mitra"

    return (
        <div className="min-h-screen" style={{ background: "var(--surface)" }}>
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={`Browse ${currentCat?.label || "all"} government services on Krishna E-Mitra.`} />
            </Helmet>

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <header
                className="fixed inset-x-0 top-0 z-50 bg-white border-b border-[var(--border)]"
                style={{ height: "var(--header-h)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
                <div className="h-full flex items-center gap-3 px-4">
                    {/* Logo */}
                    <div className="hidden lg:flex items-center gap-2 shrink-0" style={{ width: "calc(var(--sidebar-w) - 1rem)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--navy)" }}>
                            <Layers size={14} className="text-white" />
                        </div>
                        <div className="leading-none">
                            <p className="text-[11px] font-black uppercase tracking-tight" style={{ color: "var(--navy)" }}>Krishna E-Mitra</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Digital Seva Portal</p>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 shrink-0 min-w-0">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-[var(--navy)] transition-colors"
                        >
                            <ChevronLeft size={14} />
                            <span className="hidden sm:block">All Services</span>
                        </button>
                        <span className="text-slate-300">/</span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${meta.bg}`}>
                            <CatIcon size={11} className={meta.text} />
                            <span className={`text-[10px] font-black ${meta.text} uppercase tracking-wide line-clamp-1 max-w-[100px] sm:max-w-[200px]`}>
                                {currentCat?.label || catKey}
                            </span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-md mx-auto relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Search in ${currentCat?.label || "services"}...`}
                            className="w-full h-9 bg-slate-50 border border-[var(--border)] focus:bg-white focus:border-[var(--navy)]/30 focus:ring-2 focus:ring-[var(--navy)]/10 rounded-lg pl-9 pr-10 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all"
                        />
                        {searchQuery ? (
                            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={13} />
                            </button>
                        ) : (
                            <button onClick={handleVoice} className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-slate-600"}`}>
                                <Mic size={13} />
                            </button>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button onClick={toggleLanguage} className="hidden sm:flex items-center gap-1.5 px-3 h-8 border border-[var(--border)] rounded-lg text-[10px] font-black hover:bg-slate-50 transition-colors text-slate-600">
                            <Globe size={11} />
                            <span>{lang === "EN" ? "हिंदी" : "English"}</span>
                        </button>
                        {isLoggedIn ? (
                            <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 px-3 h-8 rounded-lg border border-[var(--border)] hover:bg-slate-50 transition-colors">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: "var(--navy)" }}>
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 hidden sm:block max-w-[70px] truncate">{user?.name?.split(" ")[0]}</span>
                            </button>
                        ) : (
                            <button onClick={() => setIsLoginOpen(true)} className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-white text-[10px] font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all" style={{ background: "var(--navy)" }}>
                                <LogIn size={11} />
                                <span>Login</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── BODY ──────────────────────────────────────────────────── */}
            <div className="flex" style={{ paddingTop: "var(--header-h)" }}>

                {/* Sidebar */}
                <PortalSidebar
                    services={services}
                    activeCategory={catKey}
                    config={config}
                    isLoggedIn={isLoggedIn}
                    user={user}
                    onLoginClick={() => setIsLoginOpen(true)}
                    onWhatsApp={() => window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}`, "_blank")}
                    onTrack={() => navigate("/")}
                />

                {/* Main */}
                <main className="flex-1 min-w-0 p-5 pb-24 md:pb-6">

                    {/* Category hero */}
                    {currentCat && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 bg-white border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-md shrink-0`}>
                                <CatIcon size={24} className="text-white" strokeWidth={1.7} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Service Category</p>
                                <h1 className="text-xl font-black text-slate-800">{currentCat.label}</h1>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {filteredServices.length} {searchQuery ? "matching" : "available"} service{filteredServices.length !== 1 ? "s" : ""}
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery("")} className={`ml-2 font-bold ${meta.text} hover:underline`}>Clear</button>
                                    )}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-2.5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="skeleton h-16 rounded-xl" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="bg-white border border-red-100 rounded-2xl p-8 text-center max-w-md mx-auto">
                            <h2 className="font-black text-slate-800 mb-2">Connection Failed</h2>
                            <p className="text-sm text-slate-500 mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-lg text-white text-[11px] font-black uppercase tracking-wider" style={{ background: "var(--navy)" }}>Retry</button>
                        </div>
                    )}

                    {/* Category not found */}
                    {!loading && !error && !currentCat && (
                        <div className="text-center py-24">
                            <p className="text-5xl mb-4">🔍</p>
                            <h2 className="text-xl font-black text-slate-700 mb-2">Category Not Found</h2>
                            <p className="text-slate-500 text-sm mb-6">"{catKey}" doesn't exist.</p>
                            <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white font-black text-[11px] uppercase tracking-wider" style={{ background: "var(--navy)" }}>← Back to Home</button>
                        </div>
                    )}

                    {/* Service list */}
                    {!loading && !error && currentCat && (
                        <AnimatePresence mode="wait">
                            {filteredServices.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-center py-20 bg-white border border-[var(--border)] rounded-2xl">
                                    <Search size={32} className="text-slate-200 mx-auto mb-3" />
                                    <h3 className="font-black text-slate-600">No results for "{searchQuery}"</h3>
                                    <button onClick={() => setSearchQuery("")} className={`mt-3 text-[11px] font-bold ${meta.text} hover:underline`}>Clear search</button>
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                    {filteredServices.map((svc, idx) => (
                                        <ServiceRow
                                            key={`${catKey}-${idx}`}
                                            {...svc}
                                            catKey={catKey}
                                            delay={idx}
                                            index={idx}
                                            onClick={() => setSelectedService({ ...svc, category: currentCat.label, catKey })}
                                            onApply={() => handleApply(svc)}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Other categories */}
                    {!loading && !error && Object.keys(services).length > 1 && (
                        <div className="mt-8">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Other Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(services).filter(([k]) => k !== catKey).map(([key, cat]) => {
                                    const m = CATEGORY_META[key] || CATEGORY_META.default
                                    const OIcon = m.icon
                                    return (
                                        <button key={key} onClick={() => navigate(`/services/${key}`)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold border ${m.bg} ${m.text} ${m.border} hover:shadow-sm transition-all`}>
                                            <OIcon size={11} />
                                            {cat.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </main>

                {/* Right panel */}
                <PortalRightPanel stats={stats} config={config} onRegister={() => {}} onTrack={() => navigate("/")} />
            </div>

            {/* Modals */}
            <ServiceDetailModal service={selectedService} category={selectedService?.category} onClose={() => setSelectedService(null)} onApply={handleApply} config={config} />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <StudentProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <LandingBottomNav onLoginClick={() => setIsLoginOpen(true)} onProfileClick={() => setIsProfileOpen(true)} />
        </div>
    )
}
