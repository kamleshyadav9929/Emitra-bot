import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import {
    ArrowRight, MessageSquare, Send, CheckCircle2,
    Clock, Bell, ShieldCheck, Globe, HelpCircle,
    Download, ExternalLink, Award, FileText, ChevronRight,
    Users, ChevronDown, Check, Sparkles, LogOut, Info, BookOpen,
    User
} from "lucide-react"
import { useLanguage } from "../../context/LanguageContext"
import { useAuth } from "../../context/AuthContext"
import * as api from "../../api"

const formatTelegramMessage = (text) => {
    if (!text) return "";
    let formatted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
    // Bold *text*
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    // Underscore _italic_
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    // Code `code`
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono'>$1</code>");
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function Landing() {
    const navigate = useNavigate()
    const { lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn, logout } = useAuth()

    // Data from DB
    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)

    // Interactive Onboarding Steps
    const [step1Done, setStep1Done] = useState(() => localStorage.getItem("emitra_step1_wa") === "true")
    const [step2Done, setStep2Done] = useState(() => localStorage.getItem("emitra_step2_tg") === "true")
    const [activeStep, setActiveStep] = useState(() => {
        if (!localStorage.getItem("emitra_step1_wa")) return 1
        if (!localStorage.getItem("emitra_step2_tg")) return 2
        return 3
    })

    // UI state
    const [searchQuery, setSearchQuery] = useState("")
    const [filterCategory, setFilterCategory] = useState("ALL")
    const [expandedFaq, setExpandedFaq] = useState(null)

    // Fetch initial data
    useEffect(() => {
        const fetchLandingData = async () => {
            try {
                const [servicesRes, examsRes, announcementsRes, configRes] = await Promise.all([
                    api.getPublicServices().catch(() => ({ services: {} })),
                    api.getPublicExams().catch(() => ({ exams: [] })),
                    api.getPublicAnnouncements().catch(() => ({ announcements: [] })),
                    api.getPublicConfig().catch(() => ({}))
                ])
                setServices(servicesRes.services || {})
                setExams(examsRes.exams || [])
                setAnnouncements(announcementsRes.announcements || [])
                setConfig(configRes || {})
            } catch (err) {
                console.error("Failed to load landing data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchLandingData()
    }, [])

    // Scroll to section helper
    const scrollToSection = (id) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

    // Complete Onboarding Steps
    const handleJoinWhatsApp = () => {
        setStep1Done(true)
        localStorage.setItem("emitra_step1_wa", "true")
        setActiveStep(2)
        const waMsg = encodeURIComponent("Hello! I want to join the Krishna Emitra WhatsApp Broadcast alerts.")
        window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${waMsg}`, "_blank")
    }

    const handleJoinTelegram = () => {
        setStep2Done(true)
        localStorage.setItem("emitra_step2_tg", "true")
        setActiveStep(3)
        window.open(config.telegram_bot_url || "https://t.me/Kamlesh6377_bot", "_blank")
    }

    const triggerSignIn = () => {
        if (window.Clerk) {
            window.Clerk.openSignIn({
                afterSignInUrl: window.location.origin + "/dashboard",
                afterSignUpUrl: window.location.origin + "/dashboard",
            })
        }
    }

    // Filter Announcements/Notifications
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(ann => {
            const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 ann.content.toLowerCase().includes(searchQuery.toLowerCase())
            if (filterCategory === "ALL") return matchesSearch
            if (filterCategory === "exams") return matchesSearch && ann.title.toLowerCase().match(/(exam|result|admit|date|ssc|rrb|neet|upsc)/)
            if (filterCategory === "general") return matchesSearch && !ann.title.toLowerCase().match(/(exam|result|admit|date|ssc|rrb|neet|upsc)/)
            return matchesSearch
        })
    }, [announcements, searchQuery, filterCategory])

    // Deadlines ticker content
    const upcomingDeadlines = useMemo(() => {
        return exams
            .filter(ex => ex.end_date && new Date(ex.end_date) >= new Date())
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 5)
    }, [exams])

    const faqs = [
        {
            q: lang === "EN" ? "How does Krishna Emitra help me file forms?" : "कमलेश ई-मित्र फॉर्म भरने में मेरी मदद कैसे करता है?",
            a: lang === "EN" 
                ? "Instead of standing in long kiosk lines, you can submit your details and documents online through our secure portal or Telegram bot. Our verified Krishna Emitra kiosk operator will check and file the form officially on your behalf, and send you the receipt."
                : "कियोस्क की लंबी लाइनों में खड़े होने के बजाय, आप हमारे सुरक्षित पोर्टल या टेलीग्राम बॉट के माध्यम से अपने विवरण और दस्तावेज जमा कर सकते हैं। हमारा सत्यापित ई-मित्र संचालक आपकी ओर से आधिकारिक फॉर्म भरेगा और आपको रसीद भेज देगा।"
        },
        {
            q: lang === "EN" ? "Is my personal data and document safe in the locker?" : "क्या मेरा व्यक्तिगत डेटा और दस्तावेज लॉकर में सुरक्षित हैं?",
            a: lang === "EN"
                ? "Absolutely. All uploaded marksheets, photos, and ID cards are stored securely with strict accessibility controls. They are only accessed by the operator when filing government forms requested by you."
                : "बिल्कुल। सभी अपलोड की गई मार्कशीट, फोटो और आईडी कार्ड सुरक्षित रूप से संग्रहीत किए जाते हैं। वे केवल तभी एक्सेस किए जाते हैं जब आप फॉर्म भरने का अनुरोध करते हैं।"
        },
        {
            q: lang === "EN" ? "How do I get notified of application updates?" : "मुझे आवेदन अपडेट की सूचना कैसे मिलेगी?",
            a: lang === "EN"
                ? "You will get real-time status updates directly via our WhatsApp integration and Telegram bot broadcasts. You can also log into this website anytime to track details of your submitted forms."
                : "आपको हमारे व्हाट्सएप इंटीग्रेशन और टेलीग्राम बॉट ब्रॉडकास्ट के जरिए सीधे अपडेट मिलेंगे। आप अपनी जमा की गई फाइलों को देखने के लिए किसी भी समय इस वेबसाइट पर लॉगिन कर सकते हैं।"
        },
        {
            q: lang === "EN" ? "Are there fees for form filing services?" : "क्या फॉर्म भरने की सेवाओं के लिए कोई शुल्क है?",
            a: lang === "EN"
                ? "We only charge the nominal government portal fees plus a minimal service charge for processing and verification. All fees are transparently displayed before form submission."
                : "हम केवल नाममात्र का सरकारी पोर्टल शुल्क और प्रसंस्करण के लिए न्यूनतम सेवा शुल्क लेते हैं। फॉर्म जमा करने से पहले सभी शुल्क पारदर्शी रूप से दिखाए जाते हैं।"
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f3faff] via-white to-[#f6fbff] text-[#071e27] font-sans overflow-x-hidden selection:bg-[#164FA8]/20">
            {/* ── HEADER ── */}
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-[#c2c6d4]/20 px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#164FA8] to-[#0A1A40] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#164FA8]/10 shrink-0">
                        e
                    </div>
                    <div className="leading-none hidden sm:block">
                        <span className="text-lg font-black tracking-tight text-[#0A1A40] font-display">Krishna Emitra Digital</span>
                        <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase block mt-0.5">Kiosk & Alerts</span>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold text-gray-500">
                    <button onClick={() => scrollToSection("what-we-do")} className="hover:text-[#164FA8] transition-colors">What We Do</button>
                    <button onClick={() => scrollToSection("how-it-works")} className="hover:text-[#164FA8] transition-colors">How It Works</button>
                    <button onClick={() => scrollToSection("notifications")} className="hover:text-[#164FA8] transition-colors">Live Circulars</button>
                    <button onClick={() => scrollToSection("resources")} className="hover:text-[#164FA8] transition-colors">Resources</button>
                    <button onClick={() => scrollToSection("faq")} className="hover:text-[#164FA8] transition-colors">FAQs</button>
                </nav>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={toggleLanguage} className="text-slate-600 hover:text-slate-900 transition-colors text-[11px] font-black flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 sm:px-3 rounded-lg border border-slate-200 uppercase">
                        <Globe size={13} className="text-slate-400" /> {lang === 'EN' ? 'हिंदी' : 'English'}
                    </button>

                    <div className="h-6 w-px bg-slate-200" />

                    {isLoggedIn ? (
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-[#164FA8] hover:bg-[#0A1A40] text-white text-[12px] font-bold shadow-lg shadow-[#164FA8]/15 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                                title="Dashboard"
                            >
                                <User size={16} />
                                <span className="hidden sm:inline">Dashboard</span>
                            </button>
                            <button onClick={logout} className="p-2.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0" title="Log Out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={triggerSignIn}
                            className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[12px] font-bold shadow-sm flex items-center justify-center gap-1.5 transform active:scale-95 transition-all"
                            title="Sign In Portal"
                        >
                            <User size={16} />
                            <span className="hidden sm:inline">Sign In Portal</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ── DEADLINES TICKER ── */}
            {upcomingDeadlines.length > 0 && (
                <div className="bg-[#164FA8] text-white/95 text-[11px] font-semibold py-2 px-6 overflow-hidden flex items-center shadow-inner relative">
                    <div className="flex items-center gap-1.5 shrink-0 bg-[#164FA8] z-10 pr-4 mr-4 text-amber-300 font-bold uppercase tracking-wider relative">
                        <Clock size={12} className="animate-pulse" /> {lang === "EN" ? "Upcoming Deadlines" : "आगामी अंतिम तिथियां"}
                        {/* Soft visual shadow separator */}
                        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-black/10 pointer-events-none translate-x-full" />
                    </div>
                    <div className="flex items-center gap-12 whitespace-nowrap marquee-track">
                        {upcomingDeadlines.map((ex, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[11.5px]">
                                ⚡ <span className="font-extrabold text-white">{ex.name}</span>: {lang === "EN" ? "Closes on" : "अंतिम तिथि"} <span className="text-amber-300 font-bold">{new Date(ex.end_date).toLocaleDateString()}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── HERO & ONBOARDING SECTION ── */}
            <section className="relative px-6 lg:px-12 py-12 lg:py-24 max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Hero Left */}
                <div className="lg:col-span-7 space-y-6 text-left">
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-[10.5px] font-bold text-[#0066cc] uppercase tracking-wider">
                        <Sparkles size={12} className="text-[#0066cc]" /> {lang === "EN" ? "Verified Rajasthan e-Mitra services" : "सत्यापित राजस्थान ई-मित्र सेवाएं"}
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-[46px] font-semibold leading-[1.1] tracking-tight text-[#1d1d1f] font-display" style={{ letterSpacing: "-0.5px" }}>
                        Track your exam deadlines and govt forms, all in one place
                    </h1>
                    <p className="text-[15px] text-[#7a7a7a] leading-relaxed max-w-2xl font-normal">
                        SSC, Railway, NEET counselling, and state services — all updates delivered directly to your Telegram, for free.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button 
                            onClick={handleJoinTelegram}
                            className="px-6 py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-medium rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.97] cursor-pointer border-none flex items-center gap-2"
                        >
                            <Send size={14} /> Join Telegram assistant
                        </button>
                        <button 
                            onClick={() => scrollToSection("what-we-do")}
                            className="px-6 py-3 bg-white hover:bg-slate-50 text-[#0066cc] border border-[#0066cc] text-[13px] font-medium rounded-full shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                        >
                            Browse services
                        </button>
                    </div>

                    {/* Stats Counters */}
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-100 max-w-md">
                        <div>
                            <span className="block text-2xl font-semibold text-[#1d1d1f] tracking-tight">12,000+</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Students served</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-semibold text-[#1d1d1f] tracking-tight">10+</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Exams tracked</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-semibold text-[#1d1d1f] tracking-tight">Free</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Status alerts</span>
                        </div>
                    </div>
                </div>

                {/* Hero Right - Onboarding Card (The 2 Step Wizard) */}
                <div className="lg:col-span-5 relative">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 space-y-6 text-left">
                        <div>
                            <h3 className="text-lg font-semibold text-[#1d1d1f] font-display" style={{ letterSpacing: "-0.2px" }}>Get started in 2 steps</h3>
                            <p className="text-[12.5px] text-gray-400 mt-1">Get your student dashboard ready in two minutes.</p>
                        </div>

                        <div className="space-y-4">
                            {/* STEP 1: JOIN TELEGRAM */}
                            <div className="border border-slate-250 rounded-2xl p-5 bg-white flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066cc] border border-blue-100 flex items-center justify-center text-[12px] font-bold shrink-0">
                                        1
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[13px] font-semibold text-[#1d1d1f]">Join Telegram assistant</h4>
                                        <p className="text-[11.5px] text-gray-400 font-normal leading-normal">Exam dates and form PDFs directly in your chat.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleJoinTelegram}
                                    className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-[12.5px] font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border-none"
                                >
                                    <Send size={13} /> Open Telegram bot
                                </button>
                            </div>

                            {/* STEP 2: SIGN IN TO PANEL */}
                            <div 
                                onClick={isLoggedIn ? () => navigate("/dashboard") : triggerSignIn}
                                className="border border-slate-200 rounded-2xl p-5 bg-white flex gap-4 cursor-pointer hover:border-blue-200 hover:bg-slate-50/40 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[12px] font-bold shrink-0">
                                    2
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[13px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                                        Sign in to student panel {isLoggedIn && <Check size={12} className="text-emerald-500" />}
                                    </h4>
                                    <p className="text-[11.5px] text-gray-400 font-normal leading-normal">Full dashboard, service requests and history.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHAT WE DO & HOW WE DO IT ── */}
            <section id="what-we-do" className="bg-[#f8fcff] border-y border-[#c2c6d4]/10 py-20 px-6 lg:px-12">
                <div className="max-w-[1240px] mx-auto space-y-16">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                        <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">Our Services</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0A1A40] font-display">What We Do &amp; How We Do It</h2>
                        <p className="text-[13.5px] text-gray-500 font-normal leading-relaxed">
                            We bridge the gap between complex government filing systems and students. Here is how we make digital administration smooth and prompt.
                        </p>
                    </div>

                    {/* What We Do - Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border border-[#c2c6d4]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#164FA8] flex items-center justify-center shadow-sm">
                                <Award size={18} />
                            </div>
                            <h3 className="text-base font-bold text-[#0A1A40]">Exam Form Filing</h3>
                            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
                                Get your SSC, Railway, UPSC, and state-level recruitment forms filed with 100% accuracy. Our operators review and submit on time.
                            </p>
                        </div>

                        <div className="bg-white border border-[#c2c6d4]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                                <Users size={18} />
                            </div>
                            <h3 className="text-base font-bold text-[#0A1A40]">NEET UG Counselling</h3>
                            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
                                Visual rank predictors and choice-filling templates to secure seats in Rajasthan State quota and MCC All India quota.
                            </p>
                        </div>

                        <div className="bg-white border border-[#c2c6d4]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                <ShieldCheck size={18} />
                            </div>
                            <h3 className="text-base font-bold text-[#0A1A40]">Document Locker</h3>
                            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
                                Save your marksheets, caste certificates, photo, and signature securely in our encrypted locker. Never upload them twice!
                            </p>
                        </div>

                        <div className="bg-white border border-[#c2c6d4]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
                                <Bell size={18} />
                            </div>
                            <h3 className="text-base font-bold text-[#0A1A40]">Automatic Bot Broadcasts</h3>
                            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
                                Instant status checks, admit cards alerts, result links, and syllabus updates delivered straight to your WhatsApp and Telegram app.
                            </p>
                        </div>
                    </div>

                    {/* How It Works - Process Flow */}
                    <div id="how-it-works" className="pt-8 border-t border-[#c2c6d4]/20">
                        <div className="text-center max-w-md mx-auto mb-12">
                            <h3 className="text-xl font-black text-[#0A1A40] font-display">Our Seamless 4-Step Process</h3>
                            <p className="text-[11.5px] text-gray-400 mt-1 font-semibold">How we process your applications behind the scenes.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden lg:block absolute top-[28px] left-[15%] right-[15%] h-[1.5px] bg-[#c2c6d4]/20 -z-10" />

                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-14 h-14 rounded-full bg-slate-900 border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    01
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">Opt-In & Join</h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs">
                                    Join WhatsApp alerts & Telegram bot. Link your phone/email to set up preferences.
                                </p>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-14 h-14 rounded-full bg-[#164FA8] border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    02
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">Upload Documents</h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs">
                                    Securely upload your photo, certificates, and ID. Saved once for all future filings.
                                </p>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-14 h-14 rounded-full bg-[#164FA8] border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    03
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">Operator Submissions</h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs">
                                    Our kiosk operator reviews details, fills, and pays on the official portals.
                                </p>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-14 h-14 rounded-full bg-emerald-500 border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    04
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">Instant Receipt</h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs">
                                    Receive the PDF printout and official transaction receipt directly on Telegram & WhatsApp.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── LIVE NOTIFICATIONS BOARD ── */}
            <section id="notifications" className="py-20 px-6 lg:px-12 max-w-[1240px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Panel: Search & Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">Notice Board</p>
                            <h2 className="text-3xl font-black text-[#0A1A40] font-display">Live Circulars & Alerts</h2>
                            <p className="text-[12.5px] text-gray-500 font-normal leading-relaxed">
                                Get live government exam bulletins, admit cards opening warnings, results announcements, and important notification downloads.
                            </p>
                        </div>

                        {/* Search input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#164FA8]/20 focus:border-[#164FA8] transition-all"
                            />
                        </div>

                        {/* Category filter pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterCategory("ALL")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${
                                    filterCategory === "ALL" 
                                        ? "bg-slate-900 text-white border-slate-900" 
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                }`}
                            >
                                All Notices ({announcements.length})
                            </button>
                            <button
                                onClick={() => setFilterCategory("exams")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${
                                    filterCategory === "exams" 
                                        ? "bg-slate-900 text-white border-slate-900" 
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                }`}
                            >
                                Exam Bulletins
                            </button>
                            <button
                                onClick={() => setFilterCategory("general")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${
                                    filterCategory === "general" 
                                        ? "bg-slate-900 text-white border-slate-900" 
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                }`}
                            >
                                General Info
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Scrollable notifications feed */}
                    <div className="lg:col-span-8 bg-white border border-[#c2c6d4]/20 rounded-2xl shadow-sm p-6 space-y-4 max-h-[550px] overflow-y-auto pr-3">
                        <div className="border-b pb-3 flex justify-between items-center">
                            <span className="text-[12px] font-black text-[#0A1A40]">Recent Announcements</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Updates Feed</span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2">
                                <div className="w-5 h-5 border-2 border-[#164FA8] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Fetching circulars</span>
                            </div>
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <Bell className="mx-auto text-gray-300 mb-2" size={24} />
                                <p className="text-[12px] font-bold">No notifications found matching filter.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAnnouncements.map((ann, idx) => (
                                    <div key={idx} className="border border-slate-100 rounded-xl p-5 bg-slate-50/40 hover:bg-slate-50/95 transition-colors space-y-3 text-left">
                                        {/* Date and category header */}
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1.5 uppercase tracking-wider">
                                            <span className="px-2 py-0.5 bg-blue-50 text-[#164FA8] rounded uppercase">Govt Alert</span>
                                            <span>{new Date(ann.created_at || Date.now()).toLocaleString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}</span>
                                        </div>
                                        {ann.title && <h4 className="text-[14px] font-bold text-[#0A1A40] leading-snug">{ann.title}</h4>}
                                        <div className="text-[12px] text-slate-655 font-normal leading-relaxed whitespace-pre-wrap break-words font-sans">
                                            {formatTelegramMessage(ann.content)}
                                        </div>
                                        
                                        {ann.links && (
                                            <a 
                                                href={ann.links} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[#164FA8] hover:underline text-[12px] font-bold inline-flex items-center gap-1 mt-1"
                                            >
                                                Download Official Document <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── IMPORTANT RESOURCES & LINKS ── */}
            <section id="resources" className="bg-[#f8fcff] border-y border-[#c2c6d4]/10 py-20 px-6 lg:px-12">
                <div className="max-w-[1240px] mx-auto space-y-12">
                    <div className="text-center max-w-xl mx-auto space-y-3">
                        <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">Quick Resources</p>
                        <h2 className="text-3xl font-black text-[#0A1A40] font-display">Important Govt Portals</h2>
                        <p className="text-[13px] text-gray-500 font-normal">
                            Direct, authentic gateways to leading central and state government recruitment portals.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                        <a 
                            href="https://sso.rajasthan.gov.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white border border-[#c2c6d4]/20 p-5 rounded-2xl hover:border-[#164FA8] transition-all flex flex-col justify-between h-[130px] group shadow-sm"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase">State Quota</span>
                            <span className="font-bold text-[13.5px] text-[#0A1A40] group-hover:text-[#164FA8]">Rajasthan SSO</span>
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a 
                            href="https://ssc.gov.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white border border-[#c2c6d4]/20 p-5 rounded-2xl hover:border-[#164FA8] transition-all flex flex-col justify-between h-[130px] group shadow-sm"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Govt Jobs</span>
                            <span className="font-bold text-[13.5px] text-[#0A1A40] group-hover:text-[#164FA8]">SSC Portal</span>
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a 
                            href="https://neet.nta.nic.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white border border-[#c2c6d4]/20 p-5 rounded-2xl hover:border-[#164FA8] transition-all flex flex-col justify-between h-[130px] group shadow-sm"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Medical Exams</span>
                            <span className="font-bold text-[13.5px] text-[#0A1A40] group-hover:text-[#164FA8]">NEET UG (NTA)</span>
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a 
                            href="https://www.rrcb.gov.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white border border-[#c2c6d4]/20 p-5 rounded-2xl hover:border-[#164FA8] transition-all flex flex-col justify-between h-[130px] group shadow-sm"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Railways</span>
                            <span className="font-bold text-[13.5px] text-[#0A1A40] group-hover:text-[#164FA8]">RRB Recruitment</span>
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a 
                            href="https://www.ibps.in/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white border border-[#c2c6d4]/20 p-5 rounded-2xl hover:border-[#164FA8] transition-all flex flex-col justify-between h-[130px] group shadow-sm"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Banking</span>
                            <span className="font-bold text-[13.5px] text-[#0A1A40] group-hover:text-[#164FA8]">IBPS Exams</span>
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── FAQ SECTION ── */}
            <section id="faq" className="py-20 px-6 lg:px-12 max-w-[800px] mx-auto space-y-12">
                <div className="text-center space-y-3">
                    <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">Questions?</p>
                    <h2 className="text-3xl font-black text-[#0A1A40] font-display">Frequently Asked Questions</h2>
                    <p className="text-[13px] text-gray-500 font-normal">
                        Got questions about form filings, digital lockers, or notification broadcasts? We have got you covered.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                className="w-full p-5 flex items-center justify-between text-left font-bold text-[13.5px] text-[#0A1A40] hover:bg-slate-50/50"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${expandedFaq === idx ? "rotate-180" : ""}`} />
                            </button>
                            
                            <AnimatePresence>
                                {expandedFaq === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-100"
                                    >
                                        <div className="p-5 text-[12.5px] text-gray-500 font-normal leading-relaxed bg-slate-50/20">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FINAL CALL TO ACTION ── */}
            <section className="px-6 lg:px-12 pb-20 max-w-[1240px] mx-auto">
                <div className="bg-gradient-to-r from-[#164FA8] to-[#0A1A40] rounded-[24px] text-white p-8 lg:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
                    
                    <h3 className="text-2xl lg:text-3xl font-black font-display tracking-tight">Ready to file forms from home?</h3>
                    <p className="text-[13px] text-white/70 max-w-md mx-auto font-normal leading-relaxed">
                        Complete your digital setup by connecting your mobile and joining our WhatsApp group. File your exams seamlessly.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                        {isLoggedIn ? (
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-6 py-3 bg-white text-[#164FA8] hover:bg-slate-50 text-[12px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95"
                            >
                                Access Student Panel
                            </button>
                        ) : (
                            <button
                                onClick={triggerSignIn}
                                className="px-6 py-3 bg-white text-[#164FA8] hover:bg-slate-50 text-[12px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95"
                            >
                                Create Free Student Account
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-slate-900 border-t border-slate-800 text-white/50 text-[12px] font-normal py-16 px-6 lg:px-12">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#164FA8] text-white flex items-center justify-center font-extrabold text-sm">
                                e
                            </div>
                            <span className="font-bold text-white tracking-tight">Krishna Emitra Digital Portal</span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed">
                            A secure, prompt, and convenient platform designed to file and track recruitment forms and counselling.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-[12.5px]">Our Center Address</h4>
                        <p className="text-[11.5px] leading-relaxed">
                            📍 Shop No. 12, Main Market,<br />
                            Jodhpur, Rajasthan, India
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-[12.5px]">Operator Contact</h4>
                        <p className="text-[11.5px]">
                            📞 Phone: +91 {config.whatsapp_number || "916377964293"}<br />
                            ✉️ Email: support@krishnaemitra.com
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-[12.5px]">Automated Bots</h4>
                        <a href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"} target="_blank" rel="noreferrer" className="block text-[#2997ff] hover:underline">Telegram Assistant Bot</a>
                        <a href={`https://wa.me/${config.whatsapp_number || "916377964293"}`} target="_blank" rel="noreferrer" className="block text-[#25D366] hover:underline">WhatsApp Operator Desk</a>
                    </div>
                </div>

                <div className="max-w-[1240px] mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between gap-4 text-[10.5px]">
                    <p>© {new Date().getFullYear()} Krishna Emitra Digital Administration. All rights reserved.</p>
                    <div className="flex gap-4">
                        <span className="cursor-pointer hover:text-white">Privacy Policy</span>
                        <span>·</span>
                        <span className="cursor-pointer hover:text-white">Terms of Service</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
