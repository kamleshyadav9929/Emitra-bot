import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import { ServiceCardSkeleton, AnnouncementSkeleton } from "../../components/common/Skeleton"
import LoginModal from "../../components/student/LoginModal"
import {
    Send, Clock, Bell, Globe, ExternalLink,
    ChevronDown, Check, LogOut, User, Search,
    X, Loader2, ArrowRight, Shield, MessageSquare, ClipboardCheck, Sparkles
} from "lucide-react"
import { useLanguage } from "../../context/LanguageContext"
import { useAuth } from "../../context/AuthContext"
import * as api from "../../api"
import Logo from "../../components/common/Logo"

const formatTelegramMessage = (text) => {
    if (!text) return "";
    let formatted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10.5px] font-mono'>$1</code>");

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function Landing() {
    const navigate = useNavigate()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const { lang, toggleLanguage } = useLanguage()
    const { user, isLoggedIn, logout } = useAuth()

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

    const [searchQuery, setSearchQuery] = useState("")
    const [filterCategory, setFilterCategory] = useState("ALL")
    const [serviceSearch, setServiceSearch] = useState("")
    const [serviceCatFilter, setServiceCatFilter] = useState("ALL")
    const [expandedFaq, setExpandedFaq] = useState(null)

    const [showRequestModal, setShowRequestModal] = useState(false)
    const [requestModalSvc, setRequestModalSvc] = useState(null)
    const [requestModalCatKey, setRequestModalCatKey] = useState("")
    const [requestModalCatLabel, setRequestModalCatLabel] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

    const hasMatchingServices = useMemo(() => {
        return Object.entries(services).some(([catKey, cat]) => {
            const isVisible = serviceCatFilter === "ALL" || serviceCatFilter === catKey
            if (!isVisible) return false
            return (cat.services || []).some(s =>
                s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase()))
            )
        })
    }, [services, serviceSearch, serviceCatFilter])

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

    const scrollToSection = (id) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

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

    const handleRequestServiceWhatsApp = (svc, catKey, catLabel) => {
        setRequestModalSvc(svc)
        setRequestModalCatKey(catKey)
        setRequestModalCatLabel(catLabel)
        setShowRequestModal(true)
    }

    const handleModalSubmit = async (e) => {
        e.preventDefault()
        if (!customerName.trim() || !customerPhone.trim()) return
        setIsSubmittingRequest(true)
        try {
            await api.publicLogIntent(
                requestModalSvc.name,
                requestModalCatKey,
                `${customerName.trim()} | ${customerPhone.trim()}`
            )
            const text = lang === 'EN'
                ? `Hello! I am ${customerName.trim()} (${customerPhone.trim()}). I would like to request the service: "${requestModalSvc.name}" under the category "${requestModalCatLabel}". Please let me know the requirements and fee payment process.`
                : `नमस्ते! मैं ${customerName.trim()} (${customerPhone.trim()}) हूँ। मैं श्रेणी "${requestModalCatLabel}" के अंतर्गत "${requestModalSvc.name}" सेवा के लिए आवेदन करना चाहता हूँ। कृपया आवश्यक दस्तावेज और शुल्क भुगतान प्रक्रिया बताएं।`
            const waMsg = encodeURIComponent(text)
            window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${waMsg}`, "_blank")
            setShowRequestModal(false)
            setCustomerName("")
            setCustomerPhone("")
        } catch (err) {
            console.error("Failed to log request intent", err)
        } finally {
            setIsSubmittingRequest(false)
        }
    }

    const triggerSignIn = () => {
        setShowLoginModal(true)
    }

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(ann => {
            const matchesSearch = (ann.title && ann.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (ann.content && ann.content.toLowerCase().includes(searchQuery.toLowerCase()))
            if (filterCategory === "ALL") return matchesSearch
            if (filterCategory === "exams") return matchesSearch && (ann.exam_target && ann.exam_target !== "ALL")
            if (filterCategory === "general") return matchesSearch && (ann.exam_target === "ALL" || !ann.exam_target)
            return matchesSearch
        })
    }, [announcements, searchQuery, filterCategory])

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
                : "हम केवल नाममात्र का सरकारी पोर्टल शुल्क और प्रसंस्करण के लिए न्यूनतम सेवा शुल्क लेते हैं। फॉर्म जमा करने से पहले सभी शुल्क पारदर्शी रूप से दिखाए जाने हैं।"
        }
    ]

    return (
        <div 
            className="min-h-screen bg-gradient-to-b from-[#f3faff] via-white to-[#f6fbff] text-[#071e27] font-sans overflow-x-hidden selection:bg-[#164FA8]/20"
            style={{
                '--font-sans': '"Mersad", sans-serif',
                '--font-display': '"Mersad", sans-serif'
            }}
        >
            {/* ── HEADER ── */}
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-[#c2c6d4]/20 px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Logo className="w-10 h-10 rounded-xl" />
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

            {/* ── HERO SECTION ── */}
            <div className="relative bg-[#070b19] overflow-hidden text-white border-b border-white/5 py-16 lg:py-24">
                {/* Glow circles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/10 blur-[130px] animate-slow-glow" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-600/10 blur-[130px] animate-slow-glow" />
                </div>

                <section className="relative px-6 lg:px-12 max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Hero Left */}
                    <div className="lg:col-span-7 space-y-8 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider">
                            <Sparkles size={12} className="animate-spin" /> {lang === "EN" ? "Krishna Emitra 2.0 Assistant" : "कृष्णा ई-मित्र 2.0 सहायक"}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-[52px] leading-[1.08] font-black tracking-tight font-display bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                            {lang === "EN" 
                                ? "Track exam deadlines. File applications. From home."
                                : "परीक्षा की तारीखें। सरकारी फॉर्म। अब सीधे घर बैठे।"}
                        </h1>

                        <p className="text-[15px] text-slate-400 leading-relaxed max-w-2xl font-normal">
                            {lang === "EN"
                                ? "SSC, Railways, NEET counselling, and state services — all official updates and seamless form filing delivered straight to your Telegram, completely free."
                                : "SSC, रेलवे, NEET काउंसलिंग और राज्य सेवाएँ — सभी आधिकारिक अपडेट और आसान फॉर्म फिलिंग सीधे आपके टेलीग्राम पर, पूरी तरह से निःशुल्क।"}
                        </p>

                        {/* 2-Step Interactive Wizard */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                            {/* Step 1: Connect Bot */}
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-[#0088cc] text-[10px] font-bold flex items-center justify-center text-white">1</span>
                                        <h3 className="text-[13px] font-bold text-white">{lang === "EN" ? "Link Telegram Assistant" : "टेलीग्राम असिस्टेंट जोड़ें"}</h3>
                                    </div>
                                    <p className="text-[11.5px] text-slate-400 leading-normal font-normal">
                                        {lang === "EN" ? "Receive deadlines, alerts & form PDFs." : "परीक्षा की अंतिम तिथि व फॉर्म PDF प्राप्त करें।"}
                                    </p>
                                </div>
                                <button
                                    onClick={handleJoinTelegram}
                                    className="w-full py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[12px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border-none shadow-sm cursor-pointer"
                                >
                                    <Send size={13} /> {lang === "EN" ? "Open Telegram Bot" : "टेलीग्राम बोट खोलें"}
                                </button>
                            </div>

                            {/* Step 2: Sign In */}
                            <div 
                                onClick={isLoggedIn ? () => navigate("/dashboard") : triggerSignIn}
                                className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-4 flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all duration-300"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white">2</span>
                                        <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                                            {lang === "EN" ? "Enter Student Panel" : "विद्यार्थी पैनल में जाएँ"}
                                            {isLoggedIn && <Check size={12} className="text-emerald-400" />}
                                        </h3>
                                    </div>
                                    <p className="text-[11.5px] text-slate-400 leading-normal font-normal">
                                        {lang === "EN" ? "Secure digital documents & filing history." : "दस्तावेज स्टोर करें व पुराना इतिहास देखें।"}
                                    </p>
                                </div>
                                <div className="w-full py-2.5 bg-white/10 border border-white/10 text-white text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-white/20 transition-all">
                                    <User size={13} /> {isLoggedIn ? (lang === "EN" ? "Open Dashboard" : "डैशबोर्ड खोलें") : (lang === "EN" ? "Sign In Now" : "लॉगिन करें")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Right - 3D Dashboard Mockup */}
                    <div className="lg:col-span-5 relative flex justify-center items-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-3xl blur-3xl transform scale-95 opacity-50" />
                        <div className="relative w-full max-w-[420px] animate-float-3d">
                            <img 
                                src="/dashboard-mockup.png" 
                                alt="Student Dashboard Preview"
                                className="w-full h-auto rounded-[24px] shadow-[0_50px_100px_-15px_rgba(0,0,0,0.6)] border border-white/10 select-none pointer-events-none"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* ── BENTO PROCESS GRID ── */}
            <section id="how-it-works" className="bg-[#f8fcff] border-y border-[#c2c6d4]/10 py-24 px-6 lg:px-12 text-center">
                <div className="max-w-[1240px] mx-auto space-y-16">
                    <div className="space-y-3">
                        <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "Workflow" : "कार्यप्रणाली"}</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0A1A40] font-display">
                            {lang === "EN" ? "How We Make Filing Effortless" : "हम फॉर्म भरना कैसे आसान बनाते हैं"}
                        </h2>
                        <p className="text-[14px] text-gray-500 max-w-xl mx-auto">
                            {lang === "EN"
                                ? "No physical queues. No complex portals. Get it done in three visual steps."
                                : "कियोस्क की लंबी लाइनें नहीं। कोई जटिल सरकारी पोर्टल नहीं। बस इन तीन चरणों में पूरा करें।"}
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-[1100px] mx-auto text-left">
                        {/* Bento Card 1: Connect */}
                        <div className="md:col-span-5 bg-gradient-to-br from-[#0B0F19] to-slate-900 border border-white/5 rounded-[28px] p-8 relative overflow-hidden h-[400px] text-white bento-glow-card">
                            <div className="bg-white/10 backdrop-blur-md text-[#38bdf8] border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold w-fit uppercase tracking-wider">
                                {lang === "EN" ? "Step 1" : "चरण १"}
                            </div>
                            <h3 className="text-2xl font-bold font-display text-white mt-6 mb-3">
                                {lang === "EN" ? "Connect Alerts" : "अलर्ट से जुड़ें"}
                            </h3>
                            <p className="text-[13px] text-slate-400 leading-relaxed font-normal">
                                {lang === "EN"
                                    ? "Add our Telegram bot. Get notifications about exam releases, dates, and PDFs directly in chat."
                                    : "टेलीग्राम असिस्टेंट से जुड़ें। परीक्षा विज्ञापन, एडमिट कार्ड और अंतिम तिथि के सीधे अलर्ट पाएं।"}
                            </p>

                            {/* Chat Mockup visual */}
                            <div className="absolute bottom-6 left-6 right-6 bg-slate-950/70 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-2.5 shadow-2xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#0088cc] flex items-center justify-center text-[10px] text-white">✈</div>
                                    <span className="text-[10px] font-bold text-white">Krishna Assistant</span>
                                    <span className="text-[8px] text-slate-500 ml-auto">{lang === "EN" ? "Online" : "सक्रिय"}</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10.5px] text-slate-350 leading-relaxed">
                                        🔔 <b>{lang === "EN" ? "SSC CGL 2026 Notification Out!" : "SSC CGL 2026 अधिसूचना जारी!"}</b><br />
                                        {lang === "EN" ? "Filing Deadline:" : "फॉर्म भरने की अंतिम तिथि:"} <b>12th August</b>
                                    </p>
                                </div>
                                <div className="h-7 bg-[#0088cc] text-white text-[9.5px] font-bold rounded-lg flex items-center justify-center shadow-md">
                                    {lang === "EN" ? "Apply Now" : "आवेदन करें"}
                                </div>
                            </div>
                        </div>

                        {/* Bento Card 2: Request */}
                        <div className="md:col-span-7 bg-gradient-to-br from-[#051F14] to-slate-900 border border-white/5 rounded-[28px] p-8 relative overflow-hidden h-[400px] text-white bento-glow-card">
                            <div className="bg-white/10 backdrop-blur-md text-[#34d399] border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold w-fit uppercase tracking-wider">
                                {lang === "EN" ? "Step 2" : "चरण २"}
                            </div>
                            <h3 className="text-2xl font-bold font-display text-white mt-6 mb-3">
                                {lang === "EN" ? "Filing & Tracking" : "फॉर्म व लाइव ट्रैकिंग"}
                            </h3>
                            <p className="text-[13px] text-slate-400 leading-relaxed font-normal">
                                {lang === "EN"
                                    ? "Select any service. Provide details and upload document copies safely. Our verified operator processes it."
                                    : "सेवा का चयन करें, आवश्यक दस्तावेज अपलोड करें। हमारे सत्यापित ऑपरेटर द्वारा फॉर्म प्रोसेस किया जाएगा।"}
                            </p>

                            {/* Tracker Mockup visual */}
                            <div className="absolute bottom-6 left-6 right-6 bg-slate-950/70 backdrop-blur border border-white/10 rounded-2xl p-4.5 space-y-3.5 shadow-2xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400">ID: #KE-3829</span>
                                    <span className="text-[8px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider animate-pulse">
                                        {lang === "EN" ? "In Progress" : "प्रक्रिया में"}
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    <h5 className="text-[12px] font-bold text-white">{lang === "EN" ? "Domicile Certificate (Mool Niwas)" : "मूल निवास प्रमाण पत्र"}</h5>
                                    <p className="text-[9.5px] text-slate-500">{lang === "EN" ? "Govt Services Desk" : "सरकारी सेवा विभाग"}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                        <span>{lang === "EN" ? "Uploaded" : "अपलोड"}</span>
                                        <span>{lang === "EN" ? "Verify" : "सत्यापन"}</span>
                                        <span>{lang === "EN" ? "Kiosk Submit" : "सब्मिट"}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                                        <div className="h-full bg-emerald-500 w-[35%] rounded-full" />
                                        <div className="h-full bg-emerald-500 w-[35%] rounded-full animate-pulse" />
                                        <div className="h-full bg-slate-700 w-[30%] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bento Card 3: Secure Locker */}
                        <div className="md:col-span-12 bg-gradient-to-br from-[#1C1204] to-slate-900 border border-white/5 rounded-[28px] p-8 relative overflow-hidden min-h-[180px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white bento-glow-card">
                            <div className="space-y-2">
                                <div className="bg-white/10 backdrop-blur-md text-[#fbbf24] border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold w-fit uppercase tracking-wider">
                                    {lang === "EN" ? "Step 3" : "चरण ३"}
                                </div>
                                <h3 className="text-2xl font-bold font-display text-white">
                                    {lang === "EN" ? "Secure Digital Document Locker" : "सुरक्षित डिजिटल लॉकर"}
                                </h3>
                                <p className="text-[13px] text-slate-400 leading-relaxed font-normal max-w-xl">
                                    {lang === "EN"
                                        ? "Your marksheets, photo, and government IDs are locked safely. Re-use them instantly for any future applications without re-uploading."
                                        : "मार्कशीट, फोटो और आईडी डिजिटल लॉकर में सुरक्षित स्टोर हो जाते हैं। दोबारा अपलोड किए बिना किसी भी नए फॉर्म में सीधा इस्तेमाल करें।"}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 w-full md:w-auto shrink-0 shadow-xl">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-white">{lang === "EN" ? "AES-256 Locker" : "AES-256 सुरक्षित लॉकर"}</p>
                                    <p className="text-[10px] text-slate-500">{lang === "EN" ? "Fully Encrypted Data" : "पूर्णतः एन्क्रिप्टेड डेटा"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SERVICES CATALOG ── */}
            <section id="what-we-do" className="py-24 px-6 lg:px-12 max-w-[1240px] mx-auto text-center space-y-16">
                <div className="space-y-4">
                    <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "Catalog" : "सूची पत्र"}</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#0A1A40] font-display">
                        {lang === "EN" ? "Explore E-Mitra Services" : "ई-मित्र सेवाओं की सूची"}
                    </h2>
                    <p className="text-[13.5px] text-gray-500 font-normal max-w-xl mx-auto">
                        {lang === "EN"
                            ? "Browse official application filing desk services. Submit requests and check requirements."
                            : "आधिकारिक फॉर्म भरने की सेवाओं को ऑनलाइन देखें। अपने आवश्यक दस्तावेजों की जांच करें।"}
                    </p>
                </div>

                {/* Search & Filter bar */}
                {!loading && Object.keys(services).length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-[#c2c6d4]/20 p-4 rounded-2xl shadow-sm max-w-4xl mx-auto">
                        <div className="relative w-full sm:w-80">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={serviceSearch}
                                onChange={e => setServiceSearch(e.target.value)}
                                placeholder={lang === 'EN' ? 'Search services...' : 'सेवाएं खोजें...'}
                                className="w-full bg-slate-50 border border-slate-200 text-[13px] text-[#071e27] placeholder:text-gray-400 pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#164FA8] focus:ring-2 focus:ring-[#164FA8]/10 transition-all font-medium"
                            />
                        </div>

                        <div className="w-full sm:w-auto">
                            <select
                                value={serviceCatFilter}
                                onChange={e => setServiceCatFilter(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 text-[13px] text-[#071e27] rounded-xl focus:outline-none focus:border-[#164FA8] focus:ring-2 focus:ring-[#164FA8]/10 transition-all cursor-pointer font-semibold"
                            >
                                <option value="ALL">{lang === 'EN' ? 'All Categories' : 'सभी श्रेणियां'}</option>
                                {Object.entries(services).map(([k, cat]) => (
                                    <option key={k} value={k}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Grid Lists */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <ServiceCardSkeleton />
                        <ServiceCardSkeleton />
                        <ServiceCardSkeleton />
                    </div>
                ) : Object.keys(services).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm font-semibold">No services available at the moment.</p>
                    </div>
                ) : !hasMatchingServices ? (
                    <div className="text-center py-16 bg-white border border-dashed border-[#c2c6d4]/30 rounded-2xl text-gray-400 max-w-4xl mx-auto">
                        <Search size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-bold">{lang === 'EN' ? 'No services match your search query.' : 'आपकी खोज से मेल खाने वाली कोई सेवा नहीं मिली।'}</p>
                    </div>
                ) : (
                    <div className="space-y-16 text-left max-w-6xl mx-auto">
                        {Object.entries(services).map(([catKey, cat]) => {
                            const matchingServices = (cat.services || []).filter(s =>
                                s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                                (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase()))
                            )
                            const isVisible = serviceCatFilter === "ALL" || serviceCatFilter === catKey

                            if (matchingServices.length === 0 || !isVisible) return null

                            return (
                                <div key={catKey} className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-[#c2c6d4]/20 pb-2">
                                        <span className="w-1.5 h-6 bg-[#164FA8] rounded-full"></span>
                                        <h3 className="text-base font-bold text-[#0A1A40] tracking-tight font-display">{cat.label}</h3>
                                        <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                            {matchingServices.length} {matchingServices.length === 1 ? "Service" : "Services"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {matchingServices.map((svc, idx) => (
                                            <div key={idx} className="bg-white border border-[#c2c6d4]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                        <span>{cat.label}</span>
                                                        {svc.price && (
                                                            <span className="text-[#164FA8] bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-150 font-bold">
                                                                {lang === "EN" ? "Fee" : "शुल्क"}: {svc.price}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-base font-bold text-[#0A1A40] group-hover:text-[#164FA8] transition-colors leading-snug">{svc.name}</h4>
                                                    <p className="text-[12.5px] text-gray-500 font-normal leading-relaxed">{svc.description || "Official filing and registration services."}</p>
                                                </div>

                                                <button
                                                    onClick={() => handleRequestServiceWhatsApp(svc, catKey, cat.label)}
                                                    className="mt-6 w-full py-2.5 bg-[#164FA8] hover:bg-[#0A1A40] text-white text-[12.5px] font-bold rounded-xl transition-all shadow-sm border-none cursor-pointer text-center"
                                                >
                                                    {lang === 'EN' ? 'Request via WhatsApp' : 'व्हाट्सएप से अनुरोध करें'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* ── LIVE NOTIFICATIONS FEED ── */}
            <section id="notifications" className="py-24 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c2c6d4]/20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Notice Board Info */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "Real-time updates" : "वास्तविक समय अपडेट"}</p>
                            <h2 className="text-3xl font-black text-[#0A1A40] font-display flex items-center gap-2">
                                {lang === "EN" ? "Live Notice Board" : "लाइव सूचना बोर्ड"}
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                            </h2>
                            <p className="text-[13px] text-gray-500 font-normal leading-relaxed">
                                {lang === "EN" 
                                    ? "Official exam circulars, admit card releases, result sheets, and counselling downloads."
                                    : "आधिकारिक परीक्षा अधिसूचनाएं, एडमिट कार्ड, परीक्षा परिणाम व काउंसलिंग की खबरें।"}
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={lang === "EN" ? "Search announcements..." : "सूचना खोजें..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#164FA8]/25 focus:border-[#164FA8] transition-all font-medium text-[#071e27]"
                            />
                        </div>

                        {/* Filter Categories */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterCategory("ALL")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${filterCategory === "ALL"
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                    }`}
                            >
                                {lang === "EN" ? "All" : "सभी"} ({announcements.length})
                            </button>
                            <button
                                onClick={() => setFilterCategory("exams")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${filterCategory === "exams"
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                    }`}
                            >
                                {lang === "EN" ? "Exam Circulars" : "परीक्षा विज्ञापन"}
                            </button>
                            <button
                                onClick={() => setFilterCategory("general")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${filterCategory === "general"
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                    }`}
                            >
                                {lang === "EN" ? "General Alerts" : "सामान्य खबरें"}
                            </button>
                        </div>
                    </div>

                    {/* Announcements Feed Container */}
                    <div className="lg:col-span-8 bg-white border border-[#c2c6d4]/20 rounded-3xl shadow-sm p-6 space-y-4 max-h-[500px] overflow-y-auto pr-3 text-left">
                        <div className="border-b pb-3 flex justify-between items-center">
                            <span className="text-[12px] font-black text-[#0A1A40] uppercase tracking-wider">{lang === "EN" ? "Recent Circulars" : "हालिया घोषणाएं"}</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{lang === "EN" ? "Live Feed" : "लाइव समाचार"}</span>
                        </div>

                        {loading ? (
                            <AnnouncementSkeleton count={3} />
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <Bell className="mx-auto text-gray-300 mb-2" size={24} />
                                <p className="text-[12px] font-bold">{lang === "EN" ? "No matches found" : "कोई सूचना नहीं मिली"}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAnnouncements.map((ann, idx) => (
                                    <div key={idx} className="border border-slate-100 rounded-xl p-5 bg-slate-50/40 hover:bg-slate-50/80 transition-colors space-y-3">
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
                                        <div className="text-[12px] text-slate-600 font-normal leading-relaxed whitespace-pre-wrap break-words font-sans">
                                            {formatTelegramMessage(ann.content)}
                                        </div>

                                        {ann.links && (
                                            <a
                                                href={ann.links}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#164FA8] hover:underline text-[12px] font-bold inline-flex items-center gap-1 mt-1"
                                            >
                                                {lang === "EN" ? "Download Official Circular" : "आधिकारिक अधिसूचना डाउनलोड करें"} <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── IMPORTANT RESOURCES ── */}
            <section id="resources" className="bg-[#f8fcff] border-y border-[#c2c6d4]/10 py-24 px-6 lg:px-12 text-center">
                <div className="max-w-[1240px] mx-auto space-y-12">
                    <div className="space-y-3">
                        <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "Portals" : "प्रमुख वेबसाइट्स"}</p>
                        <h2 className="text-3xl font-black text-[#0A1A40] font-display">
                            {lang === "EN" ? "Important Government Gateways" : "महत्वपूर्ण सरकारी लिंक्स"}
                        </h2>
                        <p className="text-[13.5px] text-gray-500 max-w-xl mx-auto">
                            {lang === "EN"
                                ? "Access central and state quota registration desks directly."
                                : "केंद्रीय और राज्य कोटा भर्ती बोर्डों के सीधे प्रवेश द्वार।"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-5 max-w-5xl mx-auto text-left">
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
            <section id="faq" className="py-24 px-6 lg:px-12 max-w-[800px] mx-auto space-y-12">
                <div className="text-center space-y-3">
                    <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "Help" : "सहायता"}</p>
                    <h2 className="text-3xl font-black text-[#0A1A40] font-display">{lang === "EN" ? "Frequently Asked Questions" : "अक्सर पूछे जाने वाले सवाल"}</h2>
                    <p className="text-[13px] text-gray-500 font-normal">
                        {lang === "EN" 
                            ? "Everything you need to know about notifications locker and filings."
                            : "डिजिटल लॉकर, फॉर्म भरने व नोटिफिकेशन से जुड़े आपके सवालों के जवाब।"}
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
            <section className="px-6 lg:px-12 pb-24 max-w-[1240px] mx-auto">
                <div className="bg-gradient-to-r from-[#164FA8] to-[#0A1A40] rounded-[32px] text-white p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />

                    <h3 className="text-2xl lg:text-3xl font-black font-display tracking-tight">
                        {lang === "EN" ? "Ready to file forms from home?" : "क्या आप घर बैठे फॉर्म भरना चाहते हैं?"}
                    </h3>
                    <p className="text-[13px] text-white/70 max-w-md mx-auto font-normal leading-relaxed">
                        {lang === "EN"
                            ? "Set up your student profile and link your Telegram account to start receiving alerts instantly."
                            : "अपना स्टूडेंट प्रोफाइल बनाएं और तुरंत परीक्षा अपडेट प्राप्त करने के लिए टेलीग्राम असिस्टेंट से जुड़ें।"}
                    </p>

                    <div className="flex justify-center gap-4">
                        {isLoggedIn ? (
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-6 py-3 bg-white text-[#164FA8] hover:bg-slate-50 text-[12px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer"
                            >
                                {lang === "EN" ? "Access Student Panel" : "विद्यार्थी पैनल खोलें"}
                            </button>
                        ) : (
                            <button
                                onClick={triggerSignIn}
                                className="px-6 py-3 bg-white text-[#164FA8] hover:bg-slate-50 text-[12px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer"
                            >
                                {lang === "EN" ? "Create Free Account" : "निशुल्क अकाउंट बनाएं"}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-slate-900 border-t border-slate-800 text-white/50 text-[12px] font-normal py-16 px-6 lg:px-12">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#164FA8] text-white flex items-center justify-center font-extrabold text-sm">
                                K
                            </div>
                            <span className="font-bold text-white tracking-tight">Krishna Emitra Digital</span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed">
                            {lang === "EN"
                                ? "A secure, prompt, and convenient platform designed to file and track recruitment forms and counselling."
                                : "सरकारी नौकरी फॉर्म एवं कॉलेज काउंसलिंग आवेदन भरने व लाइव अपडेट पाने का सुरक्षित पोर्टल।"}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-[12.5px]">{lang === "EN" ? "Our Center Address" : "हमारा केंद्र पता"}</h4>
                        <p className="text-[11.5px] leading-relaxed">
                            📍 Shop No. 12, Main Market,<br />
                            Jodhpur, Rajasthan, India
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-[12.5px]">{lang === "EN" ? "Operator Contact" : "ऑपरेटर संपर्क"}</h4>
                        <p className="text-[11.5px]">
                            📞 Phone: +91 {config.whatsapp_number || "916377964293"}<br />
                            ✉️ Email: support@krishnaemitra.com
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-[12.5px]">{lang === "EN" ? "Automated Desks" : "सहायक सेवाएं"}</h4>
                        <a href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"} target="_blank" rel="noreferrer" className="block text-[#38bdf8] hover:underline">Telegram Assistant Bot</a>
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

            {/* ── SERVICE REQUEST MODAL ── */}
            {showRequestModal && requestModalSvc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-[#0A1A40]/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowRequestModal(false)}
                    />

                    <div className="relative bg-white border border-[#c2c6d4]/30 rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full z-10 text-left">
                        <button
                            onClick={() => setShowRequestModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-[#0A1A40] transition-colors p-1 bg-transparent border-none cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-[#164FA8] bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                    {requestModalCatLabel}
                                </span>
                                <h3 className="text-xl font-black text-[#0A1A40] font-display">
                                    {lang === 'EN' ? 'Confirm Request' : 'अनुरोध की पुष्टि करें'}
                                </h3>
                                <p className="text-[12px] text-gray-500 font-medium">
                                    {lang === 'EN'
                                        ? `You are requesting: "${requestModalSvc.name}". Enter your name and phone number to automatically send this request to our admin desk.`
                                        : `आप "${requestModalSvc.name}" का अनुरोध कर रहे हैं। इस अनुरोध को हमारे एडमिन डेस्क पर भेजने के लिए अपना नाम और फोन नंबर दर्ज करें।`}
                                </p>
                            </div>

                            <form onSubmit={handleModalSubmit} className="space-y-4">
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        {lang === 'EN' ? 'Full Name' : 'पूरा नाम'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        placeholder={lang === 'EN' ? 'Enter your name' : 'अपना नाम दर्ज करें'}
                                        className="w-full bg-slate-50 border border-slate-200 text-[13px] text-[#071e27] placeholder:text-gray-400 px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#164FA8] focus:ring-2 focus:ring-[#164FA8]/10 transition-all font-medium"
                                    />
                                </div>

                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        {lang === 'EN' ? 'Phone Number (WhatsApp)' : 'फ़ोन नंबर (व्हाट्सएप)'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-bold">+91</span>
                                        <input
                                            type="tel"
                                            required
                                            pattern="[6-9][0-9]{9}"
                                            value={customerPhone}
                                            onChange={e => setCustomerPhone(e.target.value)}
                                            placeholder={lang === 'EN' ? '10-digit number' : '10-अंकीय नंबर'}
                                            className="w-full bg-slate-50 border border-slate-200 text-[13px] text-[#071e27] placeholder:text-gray-400 pl-14 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#164FA8] focus:ring-2 focus:ring-[#164FA8]/10 transition-all font-mono font-medium"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingRequest}
                                    className="w-full mt-2 py-3 bg-[#164FA8] hover:bg-[#0A1A40] text-white text-[13px] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
                                >
                                    {isSubmittingRequest ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            <span>{lang === 'EN' ? 'Processing...' : 'प्रक्रिया जारी है...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{lang === 'EN' ? 'Continue to WhatsApp' : 'व्हाट्सएप पर आगे बढ़ें'}</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </div>
    )
}
