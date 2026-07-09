import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import { useClerk } from "@clerk/react"
import {
    Send, Clock, Bell, Globe, ExternalLink,
    ChevronDown, Check, LogOut, User, Search,
    X, Loader2, ArrowRight
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
    const { openSignIn } = useClerk()
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
    const [serviceSearch, setServiceSearch] = useState("")
    const [serviceCatFilter, setServiceCatFilter] = useState("ALL")
    const [expandedFaq, setExpandedFaq] = useState(null)

    // Service request modal state
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [requestModalSvc, setRequestModalSvc] = useState(null)
    const [requestModalCatKey, setRequestModalCatKey] = useState("")
    const [requestModalCatLabel, setRequestModalCatLabel] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

    // Filtered services presence check
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

    const handleWhatsAppFiling = () => {
        const waMsg = encodeURIComponent("Hello! I want to submit my documents and complete my service filing request.")
        window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${waMsg}`, "_blank")
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

    const handleJoinTelegram = () => {
        setStep2Done(true)
        localStorage.setItem("emitra_step2_tg", "true")
        setActiveStep(3)
        window.open(config.telegram_bot_url || "https://t.me/Kamlesh6377_bot", "_blank")
    }

    const triggerSignIn = () => {
        openSignIn({
            afterSignInUrl: window.location.origin + "/dashboard",
            afterSignUpUrl: window.location.origin + "/dashboard",
        })
    }

    // Filter Announcements/Notifications
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
            <div className="w-full bg-cover bg-center bg-no-repeat relative border-b border-[#c2c6d4]/10" style={{ backgroundImage: "url('/hero-bg.png')" }}>
                <section className="relative px-6 lg:px-12 py-12 lg:py-24 max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Hero Left */}
                    <div className="lg:col-span-7 space-y-6 text-left">
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
            </div>

            {/* ── WHAT WE DO & HOW WE DO IT ── */}
            <section id="what-we-do" className="bg-[#f8fcff] border-y border-[#c2c6d4]/10 py-20 px-6 lg:px-12">
                <div className="max-w-[1240px] mx-auto space-y-20">

                    {/* How It Works - Process Flow */}
                    <div id="how-it-works" className="space-y-12">
                        <div className="text-center max-w-xl mx-auto space-y-3">
                            <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "How It Works" : "यह कैसे काम करता है"}</p>
                            <h3 className="text-3xl font-black text-[#0A1A40] font-display">
                                {lang === "EN" ? "Our Seamless 4-Step Process" : "हमारी सरल 4-चरणीय प्रक्रिया"}
                            </h3>
                            <p className="text-[13px] text-gray-500 font-normal leading-relaxed">
                                {lang === "EN"
                                    ? "How we process your application form filing request from start to finish."
                                    : "शुरू से अंत तक आपकी आवेदन प्रक्रिया को हम कैसे पूरा करते हैं।"}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative text-center">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden lg:block absolute top-[28px] left-[15%] right-[15%] h-[1.5px] bg-[#c2c6d4]/20 -z-10" />

                            {/* STEP 1 */}
                            <div className="flex flex-col items-center space-y-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-slate-900 border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    01
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">
                                    {lang === 'EN' ? 'Add Telegram Bot' : 'टेलीग्राम बॉट जोड़ें'}
                                </h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs min-h-[50px]">
                                    {lang === 'EN'
                                        ? 'Start our interactive bot on Telegram to receive live alerts and pick filing services.'
                                        : 'लाइव अलर्ट प्राप्त करने और सेवाएं चुनने के लिए टेलीग्राम पर हमारे इंटरैक्टिव बॉट को शुरू करें।'}
                                </p>
                                <button
                                    onClick={handleJoinTelegram}
                                    className="mt-2 text-[#164FA8] hover:text-[#0A1A40] text-[12px] font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline"
                                >
                                    {lang === 'EN' ? 'Open Telegram Bot' : 'टेलीग्राम बॉट खोलें'} <ExternalLink size={12} />
                                </button>
                            </div>

                            {/* STEP 2 */}
                            <div className="flex flex-col items-center space-y-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-[#164FA8] border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    02
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">
                                    {lang === 'EN' ? 'Request a Service' : 'सेवा का अनुरोध करें'}
                                </h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs min-h-[50px]">
                                    {lang === 'EN'
                                        ? 'Select the specific government form, exam filing, or state service you wish to request.'
                                        : 'उस विशिष्ट सरकारी फॉर्म या सेवा का चयन करें जिसके लिए आप आवेदन करना चाहते हैं।'}
                                </p>
                                <button
                                    onClick={() => scrollToSection("services-catalog")}
                                    className="mt-2 text-[#164FA8] hover:text-[#0A1A40] text-[12px] font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline"
                                >
                                    {lang === 'EN' ? 'Browse Catalog' : 'कैटलॉग ब्राउज़ करें'} <ChevronDown size={12} />
                                </button>
                            </div>

                            {/* STEP 3 */}
                            <div className="flex flex-col items-center space-y-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-[#164FA8] border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    03
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">
                                    {lang === 'EN' ? 'Complete via WhatsApp' : 'व्हाट्सएप पर पूरा करें'}
                                </h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs min-h-[50px]">
                                    {lang === 'EN'
                                        ? 'Connect on WhatsApp to securely upload your documents and complete the filing details with our operator.'
                                        : 'सुरक्षित रूप से दस्तावेज़ अपलोड करने और हमारे ऑपरेटर के साथ आवेदन विवरण पूरा करने के लिए व्हाट्सएप पर जुड़ें।'}
                                </p>
                                <button
                                    onClick={handleWhatsAppFiling}
                                    className="mt-2 text-[#164FA8] hover:text-[#0A1A40] text-[12px] font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline"
                                >
                                    {lang === 'EN' ? 'Chat on WhatsApp' : 'व्हाट्सएप चैट करें'} <ExternalLink size={12} />
                                </button>
                            </div>

                            {/* STEP 4 */}
                            <div className="flex flex-col items-center space-y-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-emerald-500 border-4 border-white shadow-md text-white flex items-center justify-center font-bold text-sm">
                                    04
                                </div>
                                <h4 className="text-[13.5px] font-bold text-[#0A1A40]">
                                    {lang === 'EN' ? 'Get Final Receipt' : 'अंतिम रसीद प्राप्त करें'}
                                </h4>
                                <p className="text-[11.5px] text-gray-500 font-normal leading-relaxed max-w-xs min-h-[50px]">
                                    {lang === 'EN'
                                        ? 'Once verified and submitted, get your official government transaction receipt and filled PDF printout.'
                                        : 'सत्यापन और सबमिशन के बाद, सीधे अपने चैट में आधिकारिक सरकारी लेनदेन रसीद और भरा हुआ आवेदन पीडीएफ प्राप्त करें।'}
                                </p>
                                <button
                                    onClick={isLoggedIn ? () => navigate("/dashboard") : triggerSignIn}
                                    className="mt-2 text-[#164FA8] hover:text-[#0A1A40] text-[12px] font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline"
                                >
                                    {lang === 'EN' ? 'Student Portal' : 'छात्र पोर्टल'} <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-t border-[#c2c6d4]/20 pt-8" id="services-catalog" />

                    {/* Available Services Grouped by Category */}
                    <div className="space-y-12">
                        <div className="text-center max-w-2xl mx-auto space-y-4">
                            <p className="text-[11px] font-black text-[#164FA8] uppercase tracking-[0.2em]">{lang === "EN" ? "Our Services" : "हमारी सेवाएँ"}</p>
                            <h2 className="text-3xl md:text-4xl font-black text-[#0A1A40] font-display">
                                {lang === "EN" ? "Available Services" : "उपलब्ध सेवाएँ"}
                            </h2>
                            <p className="text-[13.5px] text-gray-500 font-normal leading-relaxed">
                                {lang === "EN"
                                    ? "Browse and request official government documentation, application filings, and counselling services online."
                                    : "आधिकारिक सरकारी दस्तावेज़, आवेदन पत्र और काउंसलिंग सेवाओं को ऑनलाइन ब्राउज़ करें और अनुरोध करें।"}
                            </p>
                        </div>

                        {/* Services Search & Filter Controls */}
                        {!loading && Object.keys(services).length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-[#c2c6d4]/20 p-4 rounded-2xl shadow-sm animate-fadeIn">
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

                        {/* Available Services Grouped by Category Grid */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <div className="w-6 h-6 border-2 border-[#164FA8] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">Loading Services...</span>
                            </div>
                        ) : Object.keys(services).length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-sm font-semibold">No services available at the moment.</p>
                            </div>
                        ) : !hasMatchingServices ? (
                            <div className="text-center py-16 bg-white border border-dashed border-[#c2c6d4]/30 rounded-2xl text-gray-400">
                                <Search size={28} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm font-bold">{lang === 'EN' ? 'No services match your search query.' : 'आपकी खोज से मेल खाने वाली कोई सेवा नहीं मिली।'}</p>
                            </div>
                        ) : (
                            <div className="space-y-12 text-left">
                                {Object.entries(services).map(([catKey, cat]) => {
                                    const matchingServices = (cat.services || []).filter(s =>
                                        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                                        (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase()))
                                    )
                                    const isVisible = serviceCatFilter === "ALL" || serviceCatFilter === catKey

                                    if (matchingServices.length === 0 || !isVisible) return null

                                    return (
                                        <div key={catKey} className="space-y-6 animate-fadeIn">
                                            {/* Category Section Header */}
                                            <div className="flex items-center gap-3 border-b border-[#c2c6d4]/20 pb-2">
                                                <span className="w-1.5 h-6 bg-[#164FA8] rounded-full"></span>
                                                <h3 className="text-base font-bold text-[#0A1A40] tracking-tight font-display">{cat.label}</h3>
                                                <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                                    {matchingServices.length} {matchingServices.length === 1 ? "Service" : "Services"}
                                                </span>
                                            </div>

                                            {/* Category Cards Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {matchingServices.map((svc, idx) => (
                                                    <div key={idx} className="bg-white border border-[#c2c6d4]/20 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                                <span>{cat.label}</span>
                                                                {svc.price && (
                                                                    <span className="text-[#164FA8] bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-150 font-bold">
                                                                        Fee: {svc.price}
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
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${filterCategory === "ALL"
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                    }`}
                            >
                                All Notices ({announcements.length})
                            </button>
                            <button
                                onClick={() => setFilterCategory("exams")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${filterCategory === "exams"
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                                    }`}
                            >
                                Exam Bulletins
                            </button>
                            <button
                                onClick={() => setFilterCategory("general")}
                                className={`px-4 py-2 text-[11px] font-bold rounded-lg border transition-all ${filterCategory === "general"
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

            {/* ── SERVICE REQUEST MODAL ── */}
            {showRequestModal && requestModalSvc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#0A1A40]/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowRequestModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white border border-[#c2c6d4]/30 rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full z-10">
                        {/* Close button */}
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
        </div>
    )
}
