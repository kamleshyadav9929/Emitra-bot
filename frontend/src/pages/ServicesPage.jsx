import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import {
    ArrowLeft,
    Search,
    Layers,
    LogIn,
    User,
    CreditCard,
    Zap,
    GraduationCap,
    Home,
    Car,
    FileSignature,
    FileText,
    ChevronRight,
    MessageCircle,
    Mic,
    X
} from "lucide-react"

import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import * as api from "../api"

import AnnouncementTicker from "../components/landing/AnnouncementTicker"
import ServiceDetailModal from "../components/landing/ServiceDetailModal"
import LoginModal from "../components/landing/LoginModal"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"
import LandingBottomNav from "../components/landing/LandingBottomNav"
import PortalSidebar from "../components/landing/PortalSidebar"
import PortalRightPanel from "../components/landing/PortalRightPanel"

const CATEGORY_ICONS = {
    id: CreditCard,
    bills: Zap,
    forms: GraduationCap,
    schemes: Home,
    land_auto: Car,
    cert: FileSignature,
    default: FileText
}

// Individual service row card
function ServiceRow({ name, description, price, category, delay, onApply, onClick }) {
    const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: delay * 0.04 }}
            className="group bg-white border border-black/[0.07] hover:border-black/20 hover:shadow-lg hover:shadow-black/5 rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all duration-200 cursor-pointer"
            onClick={onClick}
        >
            {/* Icon circle */}
            <div className="w-11 h-11 rounded-full bg-black/[0.04] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
                <Icon size={17} className="transition-all duration-300" strokeWidth={1.7} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-black leading-tight line-clamp-1">{name}</p>
                {description && (
                    <p className="text-[11px] text-black/40 mt-0.5 line-clamp-1">{description}</p>
                )}
            </div>

            {/* Price */}
            {price && (
                <span className="hidden sm:inline-flex text-[10px] font-bold text-black/30 border border-black/10 px-2.5 py-1 rounded-full shrink-0">
                    ₹{price}
                </span>
            )}

            {/* Apply CTA */}
            <button
                onClick={e => { e.stopPropagation(); onApply() }}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-black/80 active:scale-95 transition-all"
            >
                Apply
                <MessageCircle size={11} />
            </button>
        </motion.div>
    )
}

export default function ServicesPage() {
    const { category: catKey } = useParams()
    const navigate = useNavigate()
    const { t, lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn } = useAuth()

    const [services, setServices] = useState({})
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0 })
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedService, setSelectedService] = useState(null)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isListening, setIsListening] = useState(false)

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
                setStats(st.stats || { total_students: 0 })
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

    // Current category data
    const currentCat = services[catKey]
    const CatIcon = CATEGORY_ICONS[catKey] || CATEGORY_ICONS.default

    // Filter services by search
    const filteredServices = currentCat?.services?.filter(svc =>
        !searchQuery || svc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    const handleApply = async (svc) => {
        try { await api.publicLogIntent(svc.name, currentCat?.label) } catch {}
        const msg = `Namaste! Mein *${svc.name}* (${currentCat?.label}) ke liye apply karna chahta hoon.`
        window.open(`https://wa.me/${config.whatsapp_number || '916377964293'}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    const handleVoiceSearch = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { alert("Voice search not supported."); return }
        const rec = new SR()
        rec.lang = 'en-IN'; rec.interimResults = false
        rec.onstart = () => setIsListening(true)
        rec.onend = () => setIsListening(false)
        rec.onerror = () => setIsListening(false)
        rec.onresult = e => setSearchQuery(e.results[0][0].transcript.replace(/\.$/, ''))
        rec.start()
    }

    const pageTitle = currentCat?.label
        ? `${currentCat.label} | Krishna E-Mitra`
        : "Services | Krishna E-Mitra"

    return (
        <div className="bg-[#f7f7f6] min-h-screen">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={`Browse ${currentCat?.label || 'all'} government services on Krishna E-Mitra.`} />
            </Helmet>

            {/* ── HEADER ────────────────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-black/[0.06] shadow-sm shadow-black/[0.03]">
                <div className="h-14 flex items-center gap-3 px-3 md:px-5">
                    {/* Mobile logo */}
                    <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0 lg:hidden active:scale-95 transition-all">
                        <div className="w-7 h-7 bg-black flex items-center justify-center rounded-lg">
                            <Layers size={12} className="text-white" />
                        </div>
                    </button>
                    {/* Desktop spacer */}
                    <div className="hidden lg:block w-56 xl:w-64 shrink-0" />

                    {/* Back + Category label */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors active:scale-95"
                        >
                            <ArrowLeft size={14} />
                            <span className="hidden sm:inline">All Services</span>
                        </button>
                        <span className="text-black/20 text-sm">/</span>
                        <div className="flex items-center gap-2">
                            <CatIcon size={13} className="text-black/50" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-black line-clamp-1 max-w-[120px] sm:max-w-none">
                                {currentCat?.label || catKey}
                            </span>
                        </div>
                    </div>

                    {/* Search for this category */}
                    <div className="flex-1 max-w-md mx-auto relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={`Search in ${currentCat?.label || 'services'}...`}
                            className="w-full bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white focus:border-black/10 focus:ring-1 focus:ring-black/5 border border-transparent outline-none rounded-full py-2 pl-9 pr-10 text-[12px] font-medium transition-all"
                        />
                        {searchQuery ? (
                            <button onClick={() => setSearchQuery("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-black/30 hover:bg-black/[0.06] hover:text-black transition-all">
                                <X size={12} />
                            </button>
                        ) : (
                            <button onClick={handleVoiceSearch} className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-black text-white animate-pulse' : 'text-black/30 hover:bg-black/[0.06] hover:text-black'}`}>
                                <Mic size={13} />
                            </button>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button onClick={toggleLanguage} className="hidden sm:flex items-center gap-1 px-3 py-1.5 border border-black/10 rounded-full text-[10px] font-black hover:bg-black/[0.04] transition-all">
                            <span className={lang === 'EN' ? 'opacity-100' : 'opacity-30'}>EN</span>
                            <span className="opacity-20">/</span>
                            <span className={lang === 'HI' ? 'opacity-100' : 'opacity-30'}>हि</span>
                        </button>
                        <button onClick={() => isLoggedIn ? setIsProfileOpen(true) : setIsLoginOpen(true)} className="flex items-center gap-2 active:scale-95 transition-all">
                            {isLoggedIn ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 border border-black/10 rounded-full hover:bg-black/[0.04] transition-all">
                                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                                        <span className="text-white text-[9px] font-black">{user?.name?.charAt(0)?.toUpperCase()}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">{user?.name?.split(" ")[0]}</span>
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

            {/* ── BODY ──────────────────────────────────────────────────────── */}
            <div className="flex pt-14">

                {/* Left Sidebar */}
                <PortalSidebar
                    services={services}
                    activeCategory={catKey}
                    onSelect={key => navigate(key === "ALL" ? "/" : `/services/${key}`)}
                    onWhatsApp={() => window.open(`https://wa.me/${config.whatsapp_number || '916377964293'}`, '_blank')}
                    onTrack={() => {}}
                    config={config}
                />

                {/* Main */}
                <main className="flex-1 min-w-0 px-4 md:px-6 xl:px-8 py-6 pb-24 md:pb-8">

                    {/* Category Hero Banner */}
                    {currentCat && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 flex items-center gap-5 bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6"
                        >
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                                <CatIcon size={24} strokeWidth={1.6} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-0.5">Service Category</p>
                                <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{currentCat.label}</h1>
                                <p className="text-[11px] text-black/40 mt-1.5">
                                    {filteredServices.length} {searchQuery ? "matching" : "available"} service{filteredServices.length !== 1 ? "s" : ""}
                                    {searchQuery && <button onClick={() => setSearchQuery("")} className="ml-2 text-black underline hover:no-underline">Clear filter</button>}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Loading Services...</p>
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

                    {/* Category not found */}
                    {!loading && !error && !currentCat && (
                        <div className="text-center py-32 space-y-4">
                            <p className="text-4xl">🔍</p>
                            <h2 className="text-xl font-black uppercase tracking-tight">Category Not Found</h2>
                            <p className="text-black/40 text-sm">The category "{catKey}" doesn't exist.</p>
                            <button onClick={() => navigate("/")} className="mt-4 px-6 py-2.5 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-black/80 transition-all">← Back to Home</button>
                        </div>
                    )}

                    {/* Service List */}
                    {!loading && !error && currentCat && (
                        <AnimatePresence mode="wait">
                            {filteredServices.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-center py-20 space-y-3"
                                >
                                    <div className="w-14 h-14 bg-black/[0.04] rounded-2xl flex items-center justify-center mx-auto">
                                        <Search size={22} className="text-black/20" />
                                    </div>
                                    <h3 className="font-black text-base uppercase tracking-tight">No Results</h3>
                                    <p className="text-sm text-black/40">No services match "{searchQuery}"</p>
                                    <button onClick={() => setSearchQuery("")} className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black underline transition-colors">Clear search</button>
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-2.5"
                                >
                                    {filteredServices.map((svc, idx) => (
                                        <ServiceRow
                                            key={`${catKey}-${idx}`}
                                            {...svc}
                                            category={catKey}
                                            delay={idx}
                                            onClick={() => setSelectedService({ ...svc, category: currentCat.label, catKey })}
                                            onApply={() => handleApply(svc)}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Other Categories — quick jump */}
                    {!loading && !error && Object.keys(services).length > 1 && (
                        <div className="mt-12">
                            <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-4">Other Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(services).filter(([k]) => k !== catKey).map(([key, cat]) => {
                                    const OtherIcon = CATEGORY_ICONS[key] || CATEGORY_ICONS.default
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => navigate(`/services/${key}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.07] rounded-full text-[10px] font-black uppercase tracking-wider text-black/60 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                                        >
                                            <OtherIcon size={11} />
                                            {cat.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Panel */}
                <PortalRightPanel
                    stats={stats}
                    config={config}
                    onRegister={() => {}}
                    onTrack={() => {}}
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
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <StudentProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <LandingBottomNav onLoginClick={() => setIsLoginOpen(true)} onProfileClick={() => setIsProfileOpen(true)} />
        </div>
    )
}
