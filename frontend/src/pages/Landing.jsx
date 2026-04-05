import { useState, useEffect, useMemo } from "react"
import Fuse from "fuse.js"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import { 
    ArrowRight, 
    Search, 
    Smartphone,
    Users,
    TrendingUp,
    Star,
    FileText,
    ChevronRight,
    XCircle,
    Layers,
    Mic,
    LogIn,
    User
} from "lucide-react"

// Hooks
import useCountUp from "../hooks/useCountUp"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"

// API
import * as api from "../api"

// Components
import AnnouncementTicker from "../components/landing/AnnouncementTicker"
import ServiceCard from "../components/landing/ServiceCard"
import ServiceDetailModal from "../components/landing/ServiceDetailModal"
import RegistrationModal from "../components/landing/RegistrationModal"
import StatCard from "../components/landing/StatCard"
import ExamUpdateCard from "../components/landing/ExamUpdateCard"
import StatusPortal from "../components/landing/StatusPortal"
import LoginModal from "../components/landing/LoginModal"
import LandingBottomNav from "../components/landing/LandingBottomNav"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"

export default function Landing() {
    // ── State ────────────────────────────────────────────────────────────────
    const { t, lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn } = useAuth()
    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0, pending_requests: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [config, setConfig] = useState({})
    
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("ALL")
    const [isListening, setIsListening] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [isRegOpen, setIsRegOpen] = useState(false)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    // Status Tracking State
    const [statusPhone, setStatusPhone] = useState("")
    const [history, setHistory] = useState(null)
    const [isSearching, setIsSearching] = useState(false)

    // ── Data Fetching ────────────────────────────────────────────────────────
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
                setError("Could not connect to the server. Please check your connection.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // ── Logic ────────────────────────────────────────────────────────────────
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)

    const allServices = useMemo(() => {
        const flat = []
        Object.entries(services).forEach(([catKey, cat]) => {
            cat.services?.forEach(svc => {
                flat.push({ ...svc, category: cat.label, catKey })
            })
        })
        return flat
    }, [services])

    const fuse = useMemo(() => {
        return new Fuse(allServices, {
            keys: ['name', 'category'],
            threshold: 0.4,
            includeScore: true
        })
    }, [allServices])

    const searchResults = useMemo(() => {
        if (!search) return []
        return fuse.search(search).map(result => result.item).slice(0, 8)
    }, [search, fuse])

    const filteredServices = useMemo(() => {
        const result = {}
        Object.entries(services).forEach(([key, cat]) => {
            if (activeTab !== "ALL" && key !== activeTab) return
            result[key] = cat
        })
        return result
    }, [services, activeTab])

    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice search.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN'; 
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e) => {
            console.error("Speech recognition error", e.error);
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const cleanText = transcript.replace(/\.$/, '');
            setSearch(cleanText);
            setShowSearchDropdown(true);
        };

        recognition.start();
    }

    const handleApply = async (svc, category) => {
        try {
            await api.publicLogIntent(svc.name, category)
        } catch (e) {}

        const msg = `Namaste! Mein *${svc.name}* (${category}) ke liye apply karna chahta hoon.`
        window.open(`https://wa.me/${config.whatsapp_number || '916377964293'}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    const handleCheckStatus = async () => {
        if (!/^[6-9]\d{9}$/.test(statusPhone)) return
        setIsSearching(true)
        try {
            const data = await api.publicCheckStatus(statusPhone)
            setHistory(data.history || [])
        } catch (e) {
            setHistory([])
        } finally {
            setIsSearching(false)
        }
    }

    // ── Navbar State ───────────────────────────────────────────────
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const navLinks = [
        { label: 'Services', href: '#services' },
        { label: 'Track Status', href: '#status' }
    ]

    return (
        <div className="bg-white scroll-smooth pt-16 pb-20 md:pb-0">
            <Helmet>
                <title>Krishna E-Mitra | Digital Government Services Portal</title>
                <meta name="description" content="Apply for government certificates, IDs, and exams from the comfort of your home with Krishna E-Mitra." />
            </Helmet>

            {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
            <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm shadow-black/5 border-b border-black/5' : 'bg-white border-b border-black/5'}`}>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
                    
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="w-7 h-7 bg-black flex items-center justify-center rounded-md">
                            <Layers size={13} className="text-white" />
                        </div>
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className="text-[13px] font-black tracking-tight uppercase">Krishna E-Mitra</span>
                            <span className="text-[9px] font-bold text-ink-4 uppercase tracking-widest">Digital Seva Portal</span>
                        </div>
                    </a>

                    {/* Google-like Search Bar */}
                    <div className="flex-1 max-w-2xl mx-1 sm:mx-auto relative transition-all duration-300">
                        <Search size={16} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none w-4 h-4 md:w-[18px] md:h-[18px]" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowSearchDropdown(true);
                            }}
                            onFocus={() => setShowSearchDropdown(true)}
                            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                            placeholder={t('search_placeholder')} 
                            className="w-full bg-[#f1f3f4] hover:bg-[#e9eaec] focus:bg-white border border-transparent focus:border-black/10 focus:shadow-sm focus:ring-1 focus:ring-black/5 outline-none rounded-full py-2 md:py-2.5 pl-9 md:pl-12 pr-10 md:pr-14 text-xs md:text-sm font-medium transition-all"
                        />
                        
                        {/* Mic Icon */}
                        <button
                            onClick={handleVoiceSearch}
                            className={`absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 w-7 h-7 md:w-[34px] md:h-[34px] flex items-center justify-center rounded-full transition-all duration-300 ${isListening ? 'bg-black text-white shadow-lg animate-pulse' : 'text-ink-3 hover:bg-black/5 hover:text-black'}`}
                            title="Search with Voice"
                        >
                            <Mic size={16} className={isListening ? "scale-110" : "scale-100"} />
                        </button>
                        
                        <AnimatePresence>
                            {showSearchDropdown && search.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden z-50 flex flex-col max-h-[60vh] overflow-y-auto"
                                >
                                    {searchResults.length > 0 ? (
                                        searchResults.map((svc, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedService(svc)
                                                    setShowSearchDropdown(false)
                                                    setSearch("")
                                                }}
                                                className="text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-black/5 last:border-0 flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="font-bold text-sm text-black">{svc.name}</div>
                                                    <div className="text-[10px] text-ink-3 uppercase tracking-wider font-semibold">{svc.category}</div>
                                                </div>
                                                <ChevronRight size={16} className="text-ink-4 group-hover:text-black" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-center text-ink-3">
                                            <p className="text-sm font-semibold">No services found for "{search}"</p>
                                            <p className="text-[10px] uppercase tracking-widest mt-1">Try a different name</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-black/10 rounded-full text-[10px] font-black hover:bg-black/5 transition-all outline-none"
                            title="Toggle Hindi/English"
                        >
                            <span className={`transition-opacity ${lang === 'EN' ? 'opacity-100' : 'opacity-40'}`}>EN</span>
                            <span className="opacity-30">/</span>
                            <span className={`transition-opacity ${lang === 'HI' ? 'opacity-100' : 'opacity-40'}`}>हि</span>
                        </button>

                        {/* Desktop Nav Links */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    className="px-4 py-2 text-[11px] font-bold tracking-widest uppercase text-ink-2 hover:text-black hover:bg-black/5 rounded-full transition-all"
                                >
                                    {label === 'Services' ? t('services_nav') : t('track_status')}
                                </a>
                            ))}
                        </nav>

                        {/* Desktop WhatsApp */}
                        <a
                            href="https://wa.me/916377964293"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-2 bg-black text-white px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-black/85 transition-all active:scale-95"
                        >
                            {t('whatsapp_help')}
                        </a>

                        {/* Login / Avatar — visible on all screen sizes */}
                        <button
                            onClick={() => isLoggedIn ? setIsProfileOpen(true) : setIsLoginOpen(true)}
                            className="flex items-center justify-center transition-all active:scale-95"
                            title={isLoggedIn ? `Logged in as ${user?.name}` : "Log in"}
                        >
                            {isLoggedIn ? (
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                    <span className="text-white text-[11px] font-black leading-none">
                                        {user?.name?.charAt(0)?.toUpperCase() || <User size={12} />}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 rounded-full hover:bg-black/5 transition-all">
                                    <LogIn size={12} className="text-ink-2" />
                                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Log In</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

            </header>            {/* ── HERO SECTION ───────────────────────────────────────────────── */}
            <section className="relative px-6 py-16 md:py-24 lg:py-0 lg:h-[calc(100vh-40px)] flex flex-col justify-center overflow-hidden bg-white">
                
                {/* Animated Background Elements - Hidden on mobile for performance */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden lg:block">
                    <motion.div 
                        animate={{ 
                            x: [0, 150, 0], 
                            y: [0, 100, 0],
                            rotate: [0, 180, 0]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px]"
                    />
                    <motion.div 
                        animate={{ 
                            x: [0, -120, 0], 
                            y: [0, 180, 0],
                        }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/4 -right-32 w-[800px] h-[800px] bg-slate-100/30 rounded-full blur-[120px]"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.04]" />
                </div>

                <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-24 items-center relative z-10">
                    
                    {/* LEFT: Branding & Text */}
                    <div className="space-y-8 lg:space-y-12 text-center lg:text-left">
                        <div className="space-y-4 lg:space-y-6">
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-5xl lg:text-7xl font-display font-black tracking-tight leading-[0.85] lg:leading-[0.8] uppercase"
                            >
                                {lang === 'EN' ? (
                                    <>
                                        Government<br />
                                        <span className="relative inline-block">
                                            Services
                                            <span className="absolute -bottom-1 left-0 h-[3px] lg:h-[4px] w-full bg-black/10 rounded-full" />
                                        </span>
                                        ,<br />
                                        <span className="text-ink-3">From Home.</span>
                                    </>
                                ) : (
                                    <>
                                        सरकारी<br />
                                        <span className="relative inline-block">
                                            सेवाएँ
                                            <span className="absolute -bottom-1 left-0 h-[3px] lg:h-[4px] w-full bg-black/10 rounded-full" />
                                        </span>
                                        ,<br />
                                        <span className="text-ink-3">अब घर बैठे।</span>
                                    </>
                                )}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-xs md:text-base text-ink-2 max-w-sm lg:max-w-md leading-relaxed font-sans mx-auto lg:mx-0"
                            >
                                {t('services_subtitle')}
                            </motion.p>
                        </div>

                        {/* CTA Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-10 justify-center lg:justify-start"
                        >
                            <button
                                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group flex items-center justify-center gap-3 bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-black/90 active:scale-[0.98] transition-all rounded-2xl shadow-xl shadow-black/15"
                            >
                                Apply Now
                                <span className="w-6 h-6 bg-white/15 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <ArrowRight size={12} />
                                </span>
                            </button>
                            <a
                                href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 border-2 border-black/10 px-8 py-4 font-black uppercase tracking-widest text-xs hover:border-black/30 hover:bg-black/[0.03] active:scale-[0.98] transition-all rounded-2xl"
                            >
                                <Smartphone size={14} />
                                Telegram Bot
                            </a>
                        </motion.div>
                    </div>

                    {/* RIGHT: Stats Panel */}
                    <div className="hidden md:flex flex-col justify-between py-6 lg:py-12 pl-12">
                        <div className="space-y-0">
                            <StatCard
                                value={stats.total_students}
                                suffix="+"
                                label="Students Registered"
                                sublabel="& growing daily"
                                icon={Users}
                                delay={0.4}
                            />
                            <div className="h-px bg-black/5 my-3 lg:my-5" />
                            <StatCard
                                value={50}
                                suffix="+"
                                label="Sarkari Sevaen"
                                sublabel="across 6 categories"
                                icon={FileText}
                                delay={0.5}
                            />
                            <div className="h-px bg-black/5 my-3 lg:my-5" />
                            <StatCard
                                value={100}
                                suffix="%"
                                label="Digital Process"
                                sublabel="zero paperwork"
                                icon={TrendingUp}
                                delay={0.6}
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-6"
                        >
                            <div className="p-4 bg-black rounded-2xl space-y-2 text-white">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />
                                    ))}
                                    <span className="text-white/40 text-[9px] font-bold ml-auto">5.0</span>
                                </div>
                                <p className="text-[11px] font-semibold leading-snug">"Kal apply kiya aaj certificate aa gaya!"</p>
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">— Krishna E-Mitra User</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Decorative Scroll Hint */}
                <motion.div 
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block"
                >
                    <div className="w-px h-16 bg-gradient-to-b from-black/20 to-transparent" />
                </motion.div>
            </section>



            {loading && (
                <div className="max-w-7xl mx-auto px-6 py-24 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-ink-3 font-bold uppercase tracking-widest text-xs">Loading Services...</p>
                </div>
            )}

            {error && (
                <div className="max-w-7xl mx-auto px-6 py-24">
                    <div className="bg-red-50 border-2 border-red-200 p-12 rounded-[40px] text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-display font-black uppercase tracking-tight">Connectivity Error</h2>
                        <p className="text-red-700 max-w-md mx-auto">{error}</p>
                        <div className="bg-red-100/50 p-4 rounded-xl font-mono text-[10px] text-red-800 break-all">
                            Target API: {api.BASE_URL}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Verify VITE_API_URL in your hosting dashboard</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-6 px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-700 transition-all"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && Object.keys(filteredServices).length === 0 && (
                <div className="max-w-7xl mx-auto px-6 py-24 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} />
                    </div>
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight">No Services Found</h2>
                    <p className="text-ink-3">Try searching for something else or contact support.</p>
                </div>
            )}
            <section id="services" className="px-6 py-32 bg-white">
                <div className="max-w-7xl mx-auto space-y-16">
                    
                    {/* Filter Header */}
                    <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end border-b-4 border-black pb-8 md:pb-12">
                        <div className="space-y-3 md:space-y-4">
                            <h2 className="text-2xl md:text-4xl font-display font-black tracking-tighter uppercase leading-none">Services</h2>
                            <p className="hidden md:block text-ink-2 font-medium">Browse our full range of 50+ government services.</p>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-wrap gap-2">
                        <button 
                            onClick={() => setActiveTab("ALL")}
                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full border-2 ${
                                activeTab === "ALL" ? 'bg-black text-white border-black' : 'border-black/5 hover:border-black/20 text-ink-3'
                            }`}
                        >
                            Total Services
                        </button>
                        {Object.entries(services).map(([key, cat]) => (
                            <button
                                key={`chip-${key}`}
                                onClick={() => {
                                    document.getElementById(`category-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-ink-3 border-2 border-black/5 rounded-full hover:border-black transition-all"
                            >
                                {cat.label.split(' ')[1]}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-32 pt-12">
                        {Object.entries(filteredServices).map(([key, cat]) => (
                            <div key={key} id={`category-${key}`} className="space-y-10 scroll-mt-32">
                                <div className="flex items-center gap-6">
                                    <span className="text-4xl font-display font-black opacity-10 leading-none">
                                        {Object.keys(services).indexOf(key) + 1 < 10 ? `0${Object.keys(services).indexOf(key) + 1}` : Object.keys(services).indexOf(key) + 1}
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-display font-black tracking-tight uppercase">{cat.label}</h3>
                                    <div className="h-0.5 flex-1 bg-black/5"></div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {cat.services?.map((svc, idx) => (
                                        <ServiceCard 
                                            key={`${key}-${idx}`} 
                                            {...svc} 
                                            category={key}
                                            onClick={() => setSelectedService({...svc, category: cat.label})} 
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATUS PORTAL SECTION ───────────────────────────────────────── */}
            <section id="status" className="px-6 py-32 bg-slate-50/50">
                <div className="max-w-7xl mx-auto">
                    <StatusPortal 
                        phone={statusPhone}
                        setPhone={setStatusPhone}
                        history={history}
                        onSearch={handleCheckStatus}
                        isSearching={isSearching}
                    />
                </div>
            </section>

            {/* Footer / CTA */}
            <section className="px-6 py-24 bg-surface mt-24">
                <div className="max-w-7xl mx-auto border border-black/5 bg-white p-12 md:p-24 flex flex-col items-center text-center space-y-12 rounded-[40px]">
                    <h2 className="text-4xl md:text-7xl font-display font-extrabold tracking-tighter uppercase leading-[0.9]">Ready to go digital?</h2>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <a 
                            href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-sm active:scale-95 transition-all flex items-center gap-3 rounded-2xl shadow-2xl shadow-black/20"
                        >
                            Open Telegram Bot <ArrowRight size={18} />
                        </a>
                        <a 
                            href={`https://wa.me/${config.whatsapp_number || '916377964293'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-2 border-black text-black px-12 py-5 font-black uppercase tracking-widest text-sm active:scale-95 transition-all flex items-center gap-3 rounded-2xl ring-offset-2 ring-black/5 hover:bg-black hover:text-white"
                        >
                            WhatsApp Help <ArrowRight size={18} />
                        </a>
                    </div>
                </div>
            </section>

            <ServiceDetailModal 
                service={selectedService} 
                category={selectedService?.category}
                onClose={() => setSelectedService(null)} 
                onApply={handleApply}
                config={config}
            />

            <RegistrationModal 
                isOpen={isRegOpen} 
                onClose={() => setIsRegOpen(false)} 
                exams={exams}
                config={config}
            />

            {/* ── Auth & Navigation ─────────────────────────────────── */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
            />

            <StudentProfileDrawer
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />

            <LandingBottomNav
                onLoginClick={() => setIsLoginOpen(true)}
                onProfileClick={() => setIsProfileOpen(true)}
            />
        </div>
    )
}
