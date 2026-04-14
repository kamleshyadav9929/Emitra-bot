import { useState, useEffect, useMemo } from "react"
import Fuse from "fuse.js"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import {
    Search, Mic, LogIn, ChevronRight,
    CreditCard, Zap, GraduationCap, Shield, Car,
    FileSignature, FileText, Bell, User, X,
    LayoutDashboard, ArrowRight, Menu, LogOut, Settings, ShieldCheck, Headset, Globe, Layers
} from "lucide-react"

import "../portal.css"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import * as api from "../api"

import ServiceDetailModal from "../components/landing/ServiceDetailModal"
import RegistrationModal from "../components/landing/RegistrationModal"
import LoginModal from "../components/landing/LoginModal"
import StudentProfileDrawer from "../components/landing/StudentProfileDrawer"
import LandingBottomNav from "../components/landing/LandingBottomNav"

// ── Icon map — Bureau Blues only ───────────────────────────────────────────
const CATEGORY_META = {
    cert:      { icon: FileSignature },
    id:        { icon: CreditCard    },
    bills:     { icon: Zap          },
    forms:     { icon: GraduationCap},
    schemes:   { icon: Shield       },
    land_auto: { icon: Car          },
    default:   { icon: FileText     },
}

export default function Landing() {
    const navigate = useNavigate()
    const { t, lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn, logout } = useAuth()

    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [stats, setStats] = useState({ total_students: 0 })
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [showDrop, setShowDrop] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isRegOpen, setIsRegOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

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
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    const allServices = useMemo(() => {
        const flat = []
        Object.entries(services).forEach(([catKey, cat]) => {
            cat.services?.forEach(s => flat.push({ ...s, category: cat.label, catKey }))
        })
        return flat
    }, [services])

    const fuse = useMemo(() => new Fuse(allServices, { keys: ["name", "category"], threshold: 0.4 }), [allServices])
    const results = useMemo(() => search ? fuse.search(search).map(r => r.item).slice(0, 8) : [], [search, fuse])

    const handleApply = async (svc, category) => {
        try { await api.publicLogIntent(svc.name, category) } catch {}
        const msg = `Namaste! Mein *${svc.name}* (${category}) ke liye apply karna chahta hoon.`
        window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(msg)}`, "_blank")
    }

    return (
        <div className="h-screen flex font-inter overflow-hidden bg-[var(--color-surface-base)] relative">
            <Helmet><title>e-Mitra Desk | Digital Bureau</title></Helmet>

            {/* ── LEFT SIDEBAR (The "Good" Side Panel) ── */}
            <aside className="w-[260px] bg-white hidden lg:flex flex-col border-r border-[#ececec] shadow-sm z-20 shrink-0">
                {/* Logo & Bureau Tag */}
                <div className="h-[70px] flex items-center px-6 border-b border-gray-100 shrink-0">
                    <span className="text-[var(--color-primary)] font-black text-[20px] tracking-tight font-display">e-Mitra Digital</span>
                </div>

                {/* Profile Block */}
                <div className="p-6 border-b border-gray-100 flex flex-col gap-3 shrink-0">
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

                {/* Vertical Categories Menu */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-3">Service Catalog</h4>
                    <a href="#hero" className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#f3faff] text-[var(--color-primary)] rounded-[8px] font-bold text-[13px] transition-colors">
                        <LayoutDashboard size={16} /> Dashboard Home
                    </a>
                    <a href="#services" className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-[8px] transition-colors">
                        <GraduationCap size={16} className="text-gray-400" /> Explore Macro Cards
                    </a>
                    
                    <div className="mt-8 mb-3 px-3"><hr className="border-gray-100" /></div>
                    
                    {Object.entries(services).map(([key, cat]) => {
                        const Icon = (CATEGORY_META[key] || CATEGORY_META.default).icon
                        return (
                            <button key={key} onClick={() => navigate(`/services/${key}`)} className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-[8px] transition-colors group">
                                <div className="flex items-center gap-3 truncate">
                                    <Icon size={14} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                                    <span className="truncate">{cat.label}</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                            </button>
                        )
                    })}
                </nav>

                {/* Desktop Logout/Login sticky footer */}
                <div className="p-4 border-t border-gray-100 shrink-0">
                    {!isLoggedIn ? (
                        <button onClick={() => setIsLoginOpen(true)} className="w-full py-2.5 bg-[var(--color-primary)] text-white text-[13px] font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2">
                           Sign In <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button onClick={() => logout()} className="w-full py-2.5 bg-gray-50 text-gray-700 text-[13px] font-bold rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex justify-center items-center gap-2">
                           <LogOut size={14} /> Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT SCROLL AREA ── */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto scroll-smooth bg-[var(--color-surface-base)] relative">
                
                {/* Fixed Top Canvas Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-[70px] flex items-center justify-between px-6 md:px-10 shrink-0">
                    {/* Mobile Logo Toggle */}
                    <div className="flex items-center lg:hidden gap-3">
                        <span className="text-[var(--color-primary)] font-black text-[20px] tracking-tight font-display">e-Mitra Digital</span>
                    </div>

                    {/* Global Search Canvas Input */}
                    <div className="hidden md:flex flex-1 max-w-lg relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
                            onFocus={() => setShowDrop(true)}
                            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
                            placeholder="Direct global search... (e.g. Aadhar, Scheme)" 
                            className="w-full h-11 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 rounded-full pl-11 pr-4 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 transition-all outline-none"
                        />
                        <AnimatePresence>
                            {showDrop && search.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-0 right-0 top-full mt-3 bg-white rounded-xl shadow-ambient border border-gray-100 overflow-hidden z-50 max-h-72 overflow-y-auto"
                                >
                                    {results.length > 0 ? results.map((svc, i) => {
                                        const Icon = (CATEGORY_META[svc.catKey] || CATEGORY_META.default).icon
                                        return (
                                            <button key={i} onClick={() => { setSelectedService(svc); setShowDrop(false); setSearch("") }} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-low)] group transition-colors last:rounded-b-[16px]">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-primary-fixed)]">
                                                    <Icon size={14} className="text-[var(--color-primary)]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] font-bold text-gray-900 truncate">{svc.name}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)]">{svc.category}</p>
                                                </div>
                                                <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                                            </button>
                                        )
                                    }) : (
                                        <div className="px-4 py-8 text-center text-gray-400">No results found</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-end gap-4 flex-1 md:flex-none">
                        <button className="text-gray-400 hover:text-[var(--color-primary)] transition-colors relative">
                            <Bell size={18} />
                            {announcements.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                        </button>
                        <button onClick={toggleLanguage} className="hidden sm:flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[12px] font-bold">
                            <Globe size={16}/> {lang === 'EN' ? 'HIN' : 'ENG'}
                        </button>

                        {/* ── Student Auth CTA ── */}
                        {!isLoggedIn ? (
                            <button
                                id="navbar-signin-btn"
                                onClick={() => setIsLoginOpen(true)}
                                className="flex items-center gap-2 px-4 h-9 rounded-full bg-[var(--color-primary)] text-white text-[12px] font-black tracking-wide hover:shadow-md hover:-translate-y-px active:scale-95 transition-all"
                            >
                                <LogIn size={14} />
                                <span className="hidden xs:inline">Sign In</span>
                            </button>
                        ) : (
                            <button
                                id="navbar-profile-btn"
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

                {/* Sleek Live Updates Marquee */}
                {announcements.length > 0 && (
                    <div className="bg-[var(--color-surface-low)] border-b border-[var(--color-surface-lowest)] text-gray-600 overflow-hidden h-9 flex items-center shrink-0">
                        <div className="flex items-center gap-2 px-4 md:px-10 shrink-0 h-full border-r border-gray-200 bg-white">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-900 hidden sm:block">Live Updates</span>
                        </div>
                        <div className="overflow-hidden flex-1 h-full flex items-center">
                            <div className="marquee-track flex gap-12 sm:gap-16 whitespace-nowrap">
                                {[...announcements, ...announcements].map((a, i) => (
                                    <span key={i} className="text-[12px] font-bold text-gray-700 flex items-center gap-3">
                                        <span className="text-[var(--color-primary)]">•</span> {a.title} — {a.content}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CANVAS + RIGHT SIDEBAR ROW ── */}
                <div className="flex flex-1 min-h-0">

                {/* ── MAIN CANVAS ── */}
                <div className="flex-1 overflow-y-auto pb-32 p-4 md:p-8 lg:p-10">
                    
                    {/* ── BIG CATEGORY CARDS (Main Canvas view) ── */}
                    <section id="services" className="scroll-mt-24 mt-2">
                        <div className="mb-10 flex flex-col items-center text-center lg:items-start lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] mb-5">
                                <ShieldCheck size={14} className="text-[var(--color-primary)]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#164FA8]">Digital Governance</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#0A1A40] font-display mb-3">Service Directory</h1>
                            <p className="text-[14px] md:text-[15px] text-gray-500 max-w-lg font-medium">Access unified utility and educational services instantly.</p>
                        </div>
                        
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="h-64 bg-[var(--color-surface-low)] rounded-[20px] animate-pulse" /></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {Object.entries(services).map(([key, cat]) => {
                                    const Icon = (CATEGORY_META[key] || CATEGORY_META.default).icon

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => navigate(`/services/${key}`)}
                                            className="cursor-pointer group flex flex-col p-5 rounded-[16px] bg-white transition-all shadow-ambient hover:shadow-lg hover:-translate-y-1 hover:bg-[var(--color-primary-fixed)] relative overflow-hidden h-[160px]"
                                        >
                                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] shadow-ambient">
                                                    <Icon size={20} className="text-white" strokeWidth={1.8} />
                                                </div>
                                                <h3 className="text-[15px] font-black text-[#0A1A40] group-hover:text-[var(--color-primary)] transition-colors leading-tight font-display line-clamp-2">{cat.label}</h3>
                                            </div>

                                            <p className="text-[11px] text-gray-500 font-medium mb-3 flex-1 pr-2 leading-relaxed line-clamp-2 relative z-10">
                                                {cat.services?.map(s => s.name).join(", ") || `${cat.services?.length || 0} digital processes.`}
                                            </p>

                                            <div className="mt-auto flex justify-between items-center relative z-10">
                                                <button className="text-[11px] font-black text-[var(--color-primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Explore <ArrowRight size={12} />
                                                </button>
                                            </div>

                                            {/* Ghost background icon */}
                                            <Icon size={100} strokeWidth={1.2} className="absolute -bottom-5 -right-5 text-[var(--color-primary)] opacity-[0.12] rotate-[-8deg] pointer-events-none group-hover:scale-110 group-hover:opacity-[0.18] transition-all duration-500" />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {/* ── DARK PREMIUM CTA BLOCK ── */}
                    <section className="w-full relative mt-8">
                        <div className="bg-[#0A1A40] rounded-[32px] p-8 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"></div>
                            
                            <div className="flex-1 w-full lg:max-w-xl relative z-10 text-center lg:text-left">
                                <h2 className="text-3xl md:text-4xl font-black text-white font-display mb-4">Ready to start your application?</h2>
                                <p className="text-[14px] md:text-[16px] text-blue-100/70 font-medium mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
                                    Join thousands of students managing their digital credentials and applications through our secure bureau portal.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                    <button onClick={() => setIsRegOpen(true)} className="w-full sm:w-auto px-8 h-12 rounded-xl bg-[#164FA8] text-white font-bold text-[14px] hover:shadow-lg transition-all hover:bg-[#0B3A82]">
                                        Register Account
                                    </button>
                                    <button onClick={() => setIsLoginOpen(true)} className="w-full sm:w-auto px-8 h-12 rounded-xl bg-white/10 text-white font-bold text-[14px] hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm">
                                        Bureau Login
                                    </button>
                                </div>
                            </div>

                            <div className="w-full lg:w-auto flex flex-col gap-3 relative z-10 shrink-0">
                                {[
                                    { i: ShieldCheck, t: "SSL Encrypted Data Storage" },
                                    { i: Headset, t: "24/7 Dedicated Support Desk" },
                                    { i: Zap, t: "Instant Transaction Tracking" }
                                ].map((ft, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md w-full lg:w-72">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#d7e2ff]">
                                            <ft.i size={14} />
                                        </div>
                                        <span className="text-[12px] font-bold text-white/90">{ft.t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    
                </div>{/* end main canvas div */}

                {/* ── RIGHT SIDEBAR — Latest News ── */}
                <aside className="hidden xl:flex flex-col w-[300px] shrink-0 h-full overflow-y-auto bg-white border-l border-[var(--color-surface-low)] p-5 gap-6">

                    {/* Live Announcements */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">Live Updates</p>
                        </div>
                        <div className="space-y-3">
                            {announcements.length === 0 ? (
                                <div className="bg-[var(--color-surface-low)] rounded-[14px] p-4 text-center">
                                    <p className="text-[12px] text-gray-400 font-medium">No announcements yet</p>
                                </div>
                            ) : announcements.map((a, i) => (
                                <div key={i} className="bg-[var(--color-surface-low)] rounded-[14px] p-4 shadow-ambient hover:bg-[var(--color-primary-fixed)] transition-colors cursor-default">
                                    <p className="text-[11px] font-black text-[#0A1A40] leading-tight mb-1 font-display">{a.title}</p>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">{a.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Platform Stats */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-4">Bureau Stats</p>
                        <div className="space-y-3">
                            <div className="bg-[var(--color-primary-fixed)] rounded-[14px] p-4 shadow-ambient flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center shrink-0">
                                    <User size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#0A1A40] leading-none">{(stats.total_students || 0).toLocaleString()}</p>
                                    <p className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest mt-0.5">Registered Students</p>
                                </div>
                            </div>
                            <div className="bg-[var(--color-surface-low)] rounded-[14px] p-4 shadow-ambient flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center shrink-0">
                                    <Layers size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#0A1A40] leading-none">{Object.keys(services).length}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Service Categories</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exam Categories */}
                    {exams.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-4">Active Exam Tracks</p>
                            <div className="flex flex-wrap gap-2">
                                {exams.map((exam) => (
                                    <span key={exam.name || exam} className="px-3 py-1.5 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] text-[11px] font-black rounded-full shadow-ambient">
                                        {exam.name || exam}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Links */}
                    <div className="mt-auto">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] mb-3">Quick Links</p>
                        <div className="space-y-2">
                            {[
                                { icon: ShieldCheck, label: "Check Seva Status", action: () => {} },
                                { icon: Headset, label: "WhatsApp Support", action: () => window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}`, "_blank") },
                                { icon: Settings, label: "Manage Profile", action: () => isLoggedIn ? setIsProfileOpen(true) : setIsLoginOpen(true) },
                            ].map((link) => (
                                <button key={link.label} onClick={link.action}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-[var(--color-surface-low)] hover:bg-[var(--color-primary-fixed)] hover:text-[var(--color-primary)] text-gray-600 text-[12px] font-bold rounded-[12px] transition-all text-left shadow-ambient">
                                    <link.icon size={14} className="text-[var(--color-primary)] shrink-0" />
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                </div>{/* end canvas+sidebar row */}
            </main>

            {/* Modals & Nav */}
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
            
            {/* Shows heavily on Mobile since Side panel hides */}
            <div className="lg:hidden text-gray-500">
                <LandingBottomNav onLoginClick={() => setIsLoginOpen(true)} onProfileClick={() => setIsProfileOpen(true)} />
            </div>
        </div>
    )
}
