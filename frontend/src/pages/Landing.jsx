import { useState, useEffect, useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import { 
    ArrowRight, 
    Search, 
    Bell,
    Smartphone,
    Users,
    TrendingUp,
    Star,
    FileText,
    ChevronRight
} from "lucide-react"

// Hooks
import useCountUp from "../hooks/useCountUp"

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

export default function Landing() {
    // ── State ────────────────────────────────────────────────────────────────
    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0, pending_requests: 0 })
    const [config, setConfig] = useState({})
    
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("ALL")
    const [selectedService, setSelectedService] = useState(null)
    const [isRegOpen, setIsRegOpen] = useState(false)

    // Status Tracking State
    const [statusPhone, setStatusPhone] = useState("")
    const [history, setHistory] = useState(null)
    const [isSearching, setIsSearching] = useState(false)

    // ── Data Fetching ────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
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
            } catch (err) {
                console.error("Failed to fetch landing data", err)
            }
        }
        fetchData()
    }, [])

    // ── Logic ────────────────────────────────────────────────────────────────
    const filteredServices = useMemo(() => {
        const result = {}
        Object.entries(services).forEach(([key, cat]) => {
            if (activeTab !== "ALL" && key !== activeTab) return
            const filtered = (cat.services || []).filter(s => 
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                cat.label.toLowerCase().includes(search.toLowerCase())
            )
            if (filtered.length > 0) {
                result[key] = { ...cat, items: filtered }
            }
        })
        return result
    }, [services, search, activeTab])

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

    return (
        <div className="bg-white scroll-smooth">
            <Helmet>
                <title>Krishna E-Mitra | Digital Government Services Portal</title>
                <meta name="description" content="Apply for government certificates, IDs, and exams from the comfort of your home with Krishna E-Mitra." />
            </Helmet>

            <AnnouncementTicker announcements={announcements} />

            {/* ── HERO SECTION ───────────────────────────────────────────────── */}
            <section className="relative px-6 py-12 lg:py-0 min-h-[calc(100vh-60px)] lg:h-[calc(100vh-40px)] flex flex-col justify-center overflow-hidden bg-white">
                
                {/* Animated Background Elements */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
                    <div className="space-y-8 lg:space-y-12">
                        <div className="space-y-4 lg:space-y-6">
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-5xl md:text-7xl lg:text-[100px] font-display font-black tracking-tight leading-[0.85] lg:leading-[0.8] uppercase"
                            >
                                Sarkaari<br />
                                <span className="relative inline-block">
                                    Seva
                                    <span className="absolute -bottom-1 left-0 h-[3px] lg:h-[4px] w-full bg-black/10 rounded-full" />
                                </span>
                                ,<br />
                                <span className="text-ink-3">Ab Ghar Se.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-xs md:text-base text-ink-2 max-w-sm lg:max-w-md leading-relaxed font-sans"
                            >
                                Krishna E-Mitra ki 50+ sarkari sevaen ab ek jagah — apply karein, track karein, aur real-time exam updates paaein.
                            </motion.p>
                        </div>

                        {/* CTA Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-10"
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

            {announcements.length > 0 && (
                <section id="updates" className="relative py-24 bg-white border-b border-black/5 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/[0.04] rounded-full text-[10px] font-black uppercase tracking-widest text-ink-3">
                                    <Bell size={10} className="text-black" />
                                    Notifications
                                </div>
                                <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase">Latest Updates</h2>
                                <p className="text-ink-2 max-w-md">Stay ahead with real-time notifications for exams, results, and new government forms.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex flex-col items-end leading-none">
                                    <span className="text-[14px] font-black">{announcements.length}</span>
                                    <span className="text-[10px] text-ink-4 font-bold uppercase tracking-widest">Active Alerts</span>
                                </div>
                                <div className="h-10 w-px bg-black/10 hidden md:block"></div>
                                <a 
                                    href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:text-ink-3 transition-colors"
                                >
                                    View all in Bot <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto pb-8 mask-fade scrollbar-hide -mx-6 px-6">
                            {announcements.map(ann => <ExamUpdateCard key={ann.id} update={ann} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* ── SERVICES BENTO GRID ────────────────────────────────────────── */}
            <section id="services" className="px-6 py-32 bg-white">
                <div className="max-w-7xl mx-auto space-y-16">
                    
                    {/* Filter Header */}
                    <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end border-b-4 border-black pb-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-8xl font-display font-black tracking-tighter uppercase leading-none">Sevayen</h2>
                            <p className="text-ink-2 font-medium">Browse our full range of 50+ government services.</p>
                        </div>
                        <div className="w-full md:w-96 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-black transition-colors" size={20} />
                            <input 
                                type="text"
                                placeholder="Search sarkaari sevaen..."
                                className="w-full bg-slate-50 border-2 border-black/5 p-5 pl-16 rounded-2xl outline-none focus:border-black focus:bg-white transition-all font-display font-semibold"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                                    <span className="text-6xl font-display font-black opacity-10 leading-none">
                                        {Object.keys(services).indexOf(key) + 1 < 10 ? `0${Object.keys(services).indexOf(key) + 1}` : Object.keys(services).indexOf(key) + 1}
                                    </span>
                                    <h3 className="text-3xl font-display font-black tracking-tight uppercase">{cat.label}</h3>
                                    <div className="h-0.5 flex-1 bg-black/5"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="max-w-7xl mx-auto border border-black/5 bg-white p-12 md:p-24 flex flex-col items-center text-center space-y-12">
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
        </div>
    )
}
