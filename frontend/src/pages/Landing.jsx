import { useState, useEffect, useMemo } from "react"
import Fuse from "fuse.js"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import {
    Search,
    Mic,
    LogIn,
    User,
    ChevronRight,
    Layers,
    CreditCard,
    Zap,
    GraduationCap,
    Home,
    Car,
    FileSignature,
    FileText,
    MessageCircle,
    Phone,
    MapPin,
    Users,
    TrendingUp,
    Star,
    UserPlus
} from "lucide-react"

// Hooks & Context
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import * as api from "../api"

// Components
import AnnouncementTicker from "../components/landing/AnnouncementTicker"
import ServiceDetailModal from "../components/landing/ServiceDetailModal"
import RegistrationModal from "../components/landing/RegistrationModal"
import StatusPortal from "../components/landing/StatusPortal"
import LoginModal from "../components/landing/LoginModal"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"
import LandingBottomNav from "../components/landing/LandingBottomNav"
import PortalSidebar from "../components/landing/PortalSidebar"
import PortalRightPanel from "../components/landing/PortalRightPanel"

// Category icon map
const CATEGORY_ICONS = {
    id: CreditCard,
    bills: Zap,
    forms: GraduationCap,
    schemes: Home,
    land_auto: Car,
    cert: FileSignature,
    default: FileText
}

// Big category tile for the landing grid
function CategoryTile({ catKey, label, serviceCount, delay, onClick }) {
    const Icon = CATEGORY_ICONS[catKey] || CATEGORY_ICONS.default
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay * 0.07 }}
            whileHover={{ y: -6, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.94 }}
            onClick={onClick}
            className="group flex flex-col items-center gap-3 p-4 md:p-6 rounded-3xl bg-white border border-black/[0.07] hover:border-black/25 hover:shadow-xl hover:shadow-black/8 transition-all duration-200 cursor-pointer text-center"
        >
            {/* Big circle icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/[0.04] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
                <Icon size={26} className="md:w-8 md:h-8 transition-all duration-300" strokeWidth={1.6} />
            </div>
            {/* Category name */}
            <p className="text-[11px] md:text-xs font-black uppercase tracking-wide leading-tight text-black/75 group-hover:text-black">
                {label}
            </p>
            {/* Service count badge */}
            <span className="text-[9px] font-bold text-black/30 uppercase tracking-widest">
                {serviceCount} services
            </span>
        </motion.button>
    )
}

export default function Landing() {
    const navigate = useNavigate()
    const { t, lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn } = useAuth()

    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [config, setConfig] = useState({})

    const [search, setSearch] = useState("")
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [isRegOpen, setIsRegOpen] = useState(false)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [showStatusPanel, setShowStatusPanel] = useState(false)
    const [statusPhone, setStatusPhone] = useState("")
    const [history, setHistory] = useState(null)
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
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
            } catch (err) {
                console.error("Failed to fetch landing data", err)
                setError("Could not connect to server.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Fuse search across all services
    const allServices = useMemo(() => {
        const flat = []
        Object.entries(services).forEach(([catKey, cat]) => {
            cat.services?.forEach(svc => flat.push({ ...svc, category: cat.label, catKey }))
        })
        return flat
    }, [services])

    const fuse = useMemo(() =>
        new Fuse(allServices, { keys: ['name', 'category'], threshold: 0.4, includeScore: true }),
        [allServices]
    )

    const searchResults = useMemo(() => {
        if (!search) return []
        return fuse.search(search).map(r => r.item).slice(0, 8)
    }, [search, fuse])

    const handleVoiceSearch = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { alert("Voice search not supported."); return }
        const rec = new SR()
        rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1
        rec.onstart = () => setIsListening(true)
        rec.onend = () => setIsListening(false)
        rec.onerror = () => setIsListening(false)
        rec.onresult = (e) => { setSearch(e.results[0][0].transcript.replace(/\.$/, '')); setShowSearchDropdown(true) }
        rec.start()
    }

    const handleApply = async (svc, category) => {
        try { await api.publicLogIntent(svc.name, category) } catch (e) {}
        const msg = `Namaste! Mein *${svc.name}* (${category}) ke liye apply karna chahta hoon.`
        window.open(`https://wa.me/${config.whatsapp_number || '916377964293'}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    const handleCheckStatus = async () => {
        if (!/^[6-9]\d{9}$/.test(statusPhone)) return
        setIsSearching(true)
        try { const data = await api.publicCheckStatus(statusPhone); setHistory(data.history || []) }
        catch { setHistory([]) }
        finally { setIsSearching(false) }
    }

    const handleTrackStatus = () => { setShowStatusPanel(true); setTimeout(() => document.getElementById('status-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100) }

    return (
        <div className="bg-[#f7f7f6] min-h-screen">
            <Helmet>
                <title>Krishna E-Mitra | Digital Government Services Portal</title>
                <meta name="description" content="Apply for government certificates, IDs, and exams from the comfort of your home." />
            </Helmet>

            {/* ── HEADER ─────────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-black/[0.06] shadow-sm shadow-black/[0.03]">
                <div className="h-14 flex items-center gap-3 px-3 md:px-5">
                    {/* Logo (mobile only — sidebar has it on desktop) */}
                    <a href="/" className="flex items-center gap-2 shrink-0 lg:hidden">
                        <div className="w-7 h-7 bg-black flex items-center justify-center rounded-lg">
                            <Layers size={12} className="text-white" />
                        </div>
                        <span className="text-[12px] font-black tracking-tight uppercase hidden sm:block">Krishna E-Mitra</span>
                    </a>
                    {/* Desktop spacer matching sidebar width */}
                    <div className="hidden lg:block w-56 xl:w-64 shrink-0" />

                    {/* Search */}
                    <div className="flex-1 max-w-2xl relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setShowSearchDropdown(true) }}
                            onFocus={() => setShowSearchDropdown(true)}
                            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                            placeholder={t('search_placeholder') || "Search services..."}
                            className="w-full bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white focus:border-black/10 focus:ring-1 focus:ring-black/5 border border-transparent outline-none rounded-full py-2 pl-9 pr-10 text-[12px] font-medium transition-all"
                        />
                        <button
                            onClick={handleVoiceSearch}
                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-black text-white animate-pulse' : 'text-black/30 hover:bg-black/[0.06] hover:text-black'}`}
                        >
                            <Mic size={13} />
                        </button>

                        <AnimatePresence>
                            {showSearchDropdown && search.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                                >
                                    {searchResults.length > 0 ? searchResults.map((svc, idx) => (
                                        <button key={idx}
                                            onClick={() => { setSelectedService(svc); setShowSearchDropdown(false); setSearch("") }}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-black/[0.05] last:border-0 flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="font-bold text-sm">{svc.name}</div>
                                                <div className="text-[10px] text-black/40 uppercase tracking-wider font-semibold">{svc.category}</div>
                                            </div>
                                            <ChevronRight size={14} className="text-black/20 group-hover:text-black" />
                                        </button>
                                    )) : (
                                        <div className="px-4 py-6 text-center text-black/50">
                                            <p className="text-sm font-semibold">No results for "{search}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button onClick={toggleLanguage} className="hidden sm:flex items-center gap-1 px-3 py-1.5 border border-black/10 rounded-full text-[10px] font-black hover:bg-black/[0.04] transition-all">
                            <span className={lang === 'EN' ? 'opacity-100' : 'opacity-30'}>EN</span>
                            <span className="opacity-20">/</span>
                            <span className={lang === 'HI' ? 'opacity-100' : 'opacity-30'}>हि</span>
                        </button>
                        <button
                            onClick={() => isLoggedIn ? setIsProfileOpen(true) : setIsLoginOpen(true)}
                            className="flex items-center gap-2 active:scale-95 transition-all"
                        >
                            {isLoggedIn ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 border border-black/10 rounded-full hover:bg-black/[0.04] transition-all">
                                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                                        <span className="text-white text-[9px] font-black">{user?.name?.charAt(0)?.toUpperCase()}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block max-w-[80px] truncate">{user?.name?.split(" ")[0]}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-full hover:bg-black/80 transition-all">
                                    <LogIn size={11} />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Log In</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
                {announcements.length > 0 && <AnnouncementTicker announcements={announcements} />}
            </header>

            {/* ── BODY: 3-COLUMN PORTAL ───────────────────────────────────────── */}
            <div className="flex pt-14">

                {/* Left Sidebar */}
                <PortalSidebar
                    services={services}
                    activeCategory="ALL"
                    onSelect={key => navigate(key === "ALL" ? "/" : `/services/${key}`)}
                    onWhatsApp={() => window.open(`https://wa.me/${config.whatsapp_number || '916377964293'}`, '_blank')}
                    onTrack={handleTrackStatus}
                    config={config}
                />

                {/* Main Content */}
                <main className="flex-1 min-w-0 px-4 md:px-6 xl:px-8 py-6 pb-24 md:pb-8">

                    {/* Welcome banner */}
                    {isLoggedIn && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-center justify-between bg-black text-white rounded-2xl px-5 py-3"
                        >
                            <div>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Welcome back</p>
                                <p className="text-sm font-black">{user?.name}</p>
                            </div>
                            <button onClick={() => setIsProfileOpen(true)} className="text-[10px] font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-1">
                                View Profile <ChevronRight size={11} />
                            </button>
                        </motion.div>
                    )}

                    {/* Section Label */}
                    <div className="mb-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Browse By Category</p>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight">All Services</h1>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Loading...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-white border-2 border-red-100 p-8 rounded-2xl text-center space-y-4 max-w-md mx-auto">
                            <h2 className="text-lg font-black uppercase">Connection Error</h2>
                            <p className="text-sm text-black/50">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-black/80 transition-all">Retry</button>
                        </div>
                    )}

                    {/* ── CATEGORY ICON GRID ──────────────────────────────────── */}
                    {!loading && !error && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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

                    {/* Status Panel */}
                    {showStatusPanel && (
                        <div id="status-panel" className="mt-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-black uppercase tracking-widest">Track Your Application</h2>
                                <button onClick={() => setShowStatusPanel(false)} className="text-[9px] font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors">✕ Close</button>
                            </div>
                            <StatusPortal phone={statusPhone} setPhone={setStatusPhone} history={history} onSearch={handleCheckStatus} isSearching={isSearching} />
                        </div>
                    )}

                    {/* Footer CTA */}
                    {!loading && !error && (
                        <div className="mt-14 border border-black/[0.06] bg-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider">Ready to go digital?</p>
                                <p className="text-[10px] text-black/40 mt-0.5">Apply instantly via Telegram or WhatsApp</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"} target="_blank" rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black/80 active:scale-95 transition-all">
                                    Telegram Bot
                                </a>
                                <a href={`https://wa.me/${config.whatsapp_number || '916377964293'}`} target="_blank" rel="noopener noreferrer"
                                    className="px-5 py-2.5 border-2 border-black/10 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-black/30 hover:bg-black/[0.03] active:scale-95 transition-all">
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Panel */}
                <PortalRightPanel
                    stats={stats}
                    config={config}
                    onRegister={() => setIsRegOpen(true)}
                    onTrack={handleTrackStatus}
                />
            </div>

            {/* Modals */}
            <ServiceDetailModal service={selectedService} category={selectedService?.category} onClose={() => setSelectedService(null)} onApply={handleApply} config={config} />
            <RegistrationModal isOpen={isRegOpen} onClose={() => setIsRegOpen(false)} exams={exams} config={config} />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <StudentProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <LandingBottomNav onLoginClick={() => setIsLoginOpen(true)} onProfileClick={() => setIsProfileOpen(true)} />
        </div>
    )
}
