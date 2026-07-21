import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import { ServiceCardSkeleton, AnnouncementSkeleton } from "../../components/common/Skeleton"
import LoginModal from "../../components/student/LoginModal"
import {
    Send, Clock, Bell, Globe, ExternalLink,
    ChevronDown, Check, LogOut, User, Search,
    X, Loader2, ArrowRight, Shield, MessageSquare, ClipboardCheck, Sparkles, Files, HelpCircle, Menu, ChevronUp,
    MapPin, Phone, Mail
} from "lucide-react"
import { useLanguage } from "../../context/LanguageContext"
import { useAuth } from "../../context/AuthContext"
import * as api from "../../api"
import Logo from "../../components/common/Logo"
import SoftAurora from "../../components/common/SoftAurora"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger)

const formatTelegramMessage = (text) => {
    if (!text) return "";
    let formatted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-zinc-800 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/5'>$1</code>");

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function Landing() {
    const navigate = useNavigate()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [showDeadlines, setShowDeadlines] = useState(true)
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
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
    const [expandedFaq, setExpandedFaq] = useState(null)

    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1)

    const autocompleteSuggestions = useMemo(() => {
        if (!serviceSearch.trim()) return []
        const suggestions = []
        Object.entries(services).forEach(([catKey, cat]) => {
            const isVisible = serviceCatFilter === "ALL" || serviceCatFilter === catKey
            if (!isVisible) return
            ;(cat.services || []).forEach(s => {
                if (
                    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                    (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase()))
                ) {
                    suggestions.push(s)
                }
            })
        })
        return suggestions.slice(0, 8)
    }, [services, serviceSearch, serviceCatFilter])

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
                    api.getPublicServices(),
                    api.getPublicExams(),
                    api.getPublicAnnouncements(),
                    api.getPublicConfig()
                ])
                setServices(servicesRes.services || {})
                setExams(examsRes.exams || [])
                setAnnouncements(announcementsRes.announcements || [])
                setConfig(configRes.config || {})
            } catch (err) {
                console.error("Failed to load landing data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchLandingData()
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setShowScrollTop(true)
            } else {
                setShowScrollTop(false)
            }
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // ─── GSAP SCROLL ANIMATIONS ───
    const pageRef = useRef(null)

    useGSAP(() => {
        if (!pageRef.current) return

        // Screen-size responsive values to prevent layout clipping and excessive scrolling on mobile/tablet
        const isMobile = window.innerWidth < 768
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
        
        const titleY = isMobile ? 30 : isTablet ? 50 : 85
        const subY = isMobile ? 20 : isTablet ? 30 : 45
        const btnY = isMobile ? 15 : isTablet ? 20 : 30
        const headingY = isMobile ? 25 : isTablet ? 40 : 60
        const cardY = isMobile ? 20 : isTablet ? 35 : 50
        const leftX = isMobile ? -25 : -60
        const rightX = isMobile ? 25 : 80

        // Hero title — cinematic slide up
        const heroTitle = pageRef.current.querySelector('[data-gsap="hero-title"]')
        if (heroTitle) {
            gsap.fromTo(heroTitle, 
                { y: titleY, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.4, ease: "expo.out", delay: 0.1 }
            )
        }

        // Hero subtitle — fade up
        const heroSub = pageRef.current.querySelector('[data-gsap="hero-sub"]')
        if (heroSub) {
            gsap.fromTo(heroSub,
                { y: subY, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.35 }
            )
        }

        // Hero CTA buttons — stagger with smooth power3 easing
        const heroBtns = pageRef.current.querySelectorAll('[data-gsap="hero-btn"]')
        if (heroBtns.length) {
            gsap.fromTo(heroBtns,
                { y: btnY, opacity: 0, scale: 0.97 },
                { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.55 }
            )
        }

        // Section headings — slide up on scroll
        pageRef.current.querySelectorAll('[data-gsap="section-heading"]').forEach(el => {
            gsap.fromTo(el,
                { y: headingY, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.0, ease: "power3.out",
                  scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" } }
            )
        })

        // Service cards — stagger reveal
        pageRef.current.querySelectorAll('[data-gsap="service-grid"]').forEach(grid => {
            const cards = grid.querySelectorAll('[data-gsap="service-card"]')
            if (cards.length) {
                gsap.fromTo(cards,
                    { y: cardY, opacity: 0, scale: 0.97 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.08,
                      scrollTrigger: { trigger: grid, start: "top 88%", toggleActions: "play none none none" } }
                )
            }
        })

        // Search bars — slide in from left
        pageRef.current.querySelectorAll('[data-gsap="search-bar"]').forEach(bar => {
            gsap.fromTo(bar,
                { x: leftX, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, ease: "power3.out",
                  scrollTrigger: { trigger: bar, start: "top 92%", toggleActions: "play none none none" } }
            )
        })

        // Notification left column — slide from left
        const notifLeft = pageRef.current.querySelector('[data-gsap="notif-left"]')
        if (notifLeft) {
            gsap.fromTo(notifLeft,
                { x: leftX, opacity: 0 },
                { x: 0, opacity: 1, duration: 1.1, ease: "power3.out",
                  scrollTrigger: { trigger: notifLeft, start: "top 88%", toggleActions: "play none none none" } }
            )
        }

        // Notification panel — slide from right
        const notifPanel = pageRef.current.querySelector('[data-gsap="notif-panel"]')
        if (notifPanel) {
            gsap.fromTo(notifPanel,
                { x: rightX, opacity: 0 },
                { x: 0, opacity: 1, duration: 1.1, ease: "power3.out",
                  scrollTrigger: { trigger: notifPanel, start: "top 88%", toggleActions: "play none none none" } }
            )
        }

        // Resource cards — stagger scale up
        const resourceGrid = pageRef.current.querySelector('[data-gsap="resource-grid"]')
        if (resourceGrid) {
            const rCards = resourceGrid.querySelectorAll('[data-gsap="resource-card"]')
            if (rCards.length) {
                gsap.fromTo(rCards,
                    { y: cardY, opacity: 0, scale: 0.92 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", stagger: 0.06,
                      scrollTrigger: { trigger: resourceGrid, start: "top 88%", toggleActions: "play none none none" } }
                )
            }
        }

        // FAQ items — stagger from below
        const faqList = pageRef.current.querySelector('[data-gsap="faq-list"]')
        if (faqList) {
            const faqItems = faqList.querySelectorAll('[data-gsap="faq-item"]')
            if (faqItems.length) {
                gsap.fromTo(faqItems,
                    { y: isMobile ? 15 : 25, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.08,
                      scrollTrigger: { trigger: faqList, start: "top 88%", toggleActions: "play none none none" } }
                )
            }
        }

        // CTA section — dramatic scale + fade
        const ctaSection = pageRef.current.querySelector('[data-gsap="cta-section"]')
        if (ctaSection) {
            gsap.fromTo(ctaSection,
                { y: headingY, opacity: 0, scale: 0.97 },
                { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "power3.out",
                  scrollTrigger: { trigger: ctaSection, start: "top 90%", toggleActions: "play none none none" } }
            )
        }

        // Footer columns — stagger up
        const footerGrid = pageRef.current.querySelector('[data-gsap="footer-grid"]')
        if (footerGrid) {
            gsap.fromTo(footerGrid.children,
                { y: isMobile ? 20 : 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1,
                  scrollTrigger: { trigger: footerGrid, start: "top 92%", toggleActions: "play none none none" } }
            )
        }

        // Filter buttons — stagger pop
        pageRef.current.querySelectorAll('[data-gsap="filter-group"]').forEach(group => {
            gsap.fromTo(group.children,
                { scale: 0.85, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.05,
                  scrollTrigger: { trigger: group, start: "top 92%", toggleActions: "play none none none" } }
            )
        })
    }, { dependencies: [loading], scope: pageRef })

    const scrollToSection = (id) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
        setShowMobileMenu(false)
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
        setShowMobileMenu(false)
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
            q: lang === "EN" ? "Is my personal data and document safe in the locker?" : "क्या मेरा व्यक्तिगत दस्तावेज लॉकर में सुरक्षित हैं?",
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
        <div ref={pageRef} className="min-h-screen bg-[#050508] text-slate-200 font-sans overflow-x-clip relative">


            {/* ── HEADER ── */}
            <header className="sticky top-0 z-40 bg-[#050508] border-b border-white/5 px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Logo className="w-9 h-9 rounded-full border border-white/10" />
                    <div className="leading-none text-left">
                        <span className="text-base font-black tracking-tight text-white font-display">Krishna Emitra</span>
                        <span className="text-[8.5px] text-slate-500 font-bold tracking-widest uppercase block mt-0.5">Digital Administration</span>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-2 text-[12.5px] font-bold text-slate-400">
                    <button onClick={() => scrollToSection("what-we-do")} className="px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer bg-transparent border-none">What We Do</button>
                    <button onClick={() => scrollToSection("notifications")} className="px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer bg-transparent border-none">Live Circulars</button>
                    <button onClick={() => scrollToSection("faq")} className="px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer bg-transparent border-none">FAQs</button>
                </nav>

                <div className="flex items-center gap-4">
                    <button onClick={toggleLanguage} className="hidden sm:flex relative items-center justify-center w-9 h-9 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer border border-blue-500/20">
                        <Globe size={16} />
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-600 shadow-sm leading-none">
                            {lang === 'EN' ? 'EN' : 'HI'}
                        </span>
                    </button>

                    <div className="hidden sm:block h-5 w-px bg-white/10" />

                    {isLoggedIn ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-5 py-2 rounded-xl bg-gradient-to-br from-[#1a73e8] to-[#1557b0] hover:shadow-lg hover:shadow-blue-500/10 text-white text-[12px] font-bold flex items-center justify-center gap-2 transform active:scale-95 transition-all border-none cursor-pointer"
                                title="Dashboard"
                            >
                                <span>Dashboard</span>
                            </button>
                            <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 text-slate-450 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer" title="Log Out">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={triggerSignIn}
                            className="px-5 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-[12px] font-bold flex items-center justify-center transform active:scale-95 transition-all border-none cursor-pointer shadow-md"
                            title="Sign In Portal"
                        >
                            <span>Sign In</span>
                        </button>
                    )}

                    {/* Mobile Hamburger menu toggle button */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                        {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* ── MOBILE MENU OVERLAY ── */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
                            onClick={() => setShowMobileMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed top-24 left-4 right-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 z-50 shadow-2xl flex flex-col gap-6"
                        >
                            <div className="flex flex-col gap-2">
                                <button onClick={() => { scrollToSection("what-we-do"); setShowMobileMenu(false); }} className="text-left py-3 px-4 rounded-xl hover:bg-white/5 text-[14px] font-bold text-slate-200 transition-colors bg-transparent border-none cursor-pointer">What We Do</button>
                                <button onClick={() => { scrollToSection("notifications"); setShowMobileMenu(false); }} className="text-left py-3 px-4 rounded-xl hover:bg-white/5 text-[14px] font-bold text-slate-200 transition-colors bg-transparent border-none cursor-pointer">Live Circulars</button>
                                <button onClick={() => { scrollToSection("faq"); setShowMobileMenu(false); }} className="text-left py-3 px-4 rounded-xl hover:bg-white/5 text-[14px] font-bold text-slate-200 transition-colors bg-transparent border-none cursor-pointer">FAQs</button>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-6">
                                <button onClick={toggleLanguage} className="flex relative items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer border border-blue-500/20">
                                    <Globe size={18} />
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-600 shadow-sm leading-none">
                                        {lang === 'EN' ? 'EN' : 'HI'}
                                    </span>
                                </button>
                                
                                {!isLoggedIn && (
                                    <button
                                        onClick={triggerSignIn}
                                        className="px-6 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-[13px] font-bold flex items-center justify-center transition-all border-none cursor-pointer shadow-md"
                                    >
                                        <span>Sign In</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── DEADLINES TICKER ── */}
            {showDeadlines && upcomingDeadlines.length > 0 && (
                <div className="hidden md:flex bg-slate-950/80 border-y border-white/5 text-slate-350 text-[10.5px] font-semibold py-2 px-6 items-center justify-between relative z-10 group">
                    <div className="flex overflow-hidden relative flex-1">
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 z-10 pr-4 mr-4 text-amber-400 font-bold uppercase tracking-wider relative font-display">
                            <Clock size={11} className="animate-pulse text-amber-400" /> {lang === "EN" ? "Upcoming Deadlines" : "आगामी अंतिम तिथियां"}
                        </div>
                        <div className={`flex items-center gap-12 whitespace-nowrap ${upcomingDeadlines.length > 1 ? "marquee-track" : ""}`}>
                            {(upcomingDeadlines.length > 1 ? [...upcomingDeadlines, ...upcomingDeadlines] : upcomingDeadlines).map((ex, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 text-[11px]">
                                    ⚡ <span className="font-extrabold text-white">{ex.name}</span>: <span className="text-slate-400">{lang === "EN" ? "Closes on" : "अंतिम तिथि"}</span> <span className="text-amber-400 font-bold">{new Date(ex.end_date).toLocaleDateString()}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowDeadlines(false)}
                        className="ml-4 p-1 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 border-none bg-transparent cursor-pointer"
                        title="Close Deadlines"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── HERO SECTION ── */}
            <div className="relative py-24 lg:py-36 z-10 text-center overflow-hidden">
                <div className="absolute inset-0 z-0 mix-blend-screen pointer-events-auto">
                    <SoftAurora color1="#1A1F35" color2="#311B92" speed={0.4} brightness={1.2} enableMouseInteraction={false} />
                </div>
                <section className="relative z-10 px-6 lg:px-12 max-w-[1000px] mx-auto space-y-12">
                    {/* Hero Header Content */}
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <h1 data-gsap="hero-title" className="text-4xl sm:text-7xl lg:text-[84px] leading-[0.95] font-black tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
                            {lang === "EN" 
                                ? "Your government applications, automated."
                                : "आपकी सरकारी नौकरी आवेदन, अब स्वचालित।"}
                        </h1>

                        <p data-gsap="hero-sub" className="text-[15px] sm:text-[17px] text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal pt-2">
                            {lang === "EN"
                                ? "SSC, Railways, NEET counselling, and state services. Track deadlines, store files, and submit application requests straight to our digital operator desk via Telegram."
                                : "SSC, रेलवे, NEET काउंसलिंग और राज्य सेवाएँ। परीक्षा अंतिम तिथि ट्रैक करें, दस्तावेज स्टोर करें और सीधे टेलीग्राम द्वारा हमारे ऑपरेटर को आवेदन भेजें।"}
                        </p>
                    </div>

                    {/* Integrated 2-Step Action Row */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto pt-4">
                        <button
                            data-gsap="hero-btn"
                            onClick={handleJoinTelegram}
                            className="w-full sm:w-auto px-7 py-3.5 bg-[#229ED9] hover:bg-[#1E8CC0] text-white text-[13px] font-bold rounded-full transition-colors duration-200 flex items-center justify-center gap-2 border-none shadow-lg shadow-[#229ED9]/20 active:scale-95 cursor-pointer"
                        >
                            <Send size={14} /> {lang === "EN" ? "Join Telegram assistant" : "टेलीग्राम असिस्टेंट से जुड़ें"}
                        </button>

                        <button
                            data-gsap="hero-btn"
                            onClick={isLoggedIn ? () => navigate("/dashboard") : triggerSignIn}
                            className="w-full sm:w-auto px-7 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[13px] font-bold rounded-full transition-colors duration-200 flex items-center justify-center gap-2 backdrop-blur-sm active:scale-95 cursor-pointer"
                        >
                            <User size={14} />
                            {isLoggedIn ? (lang === "EN" ? "Enter Student Dashboard" : "पैनल में प्रवेश करें") : (lang === "EN" ? "Sign In student portal" : "स्टूडेंट पोर्टल में लॉगिन")}
                            {isLoggedIn && <Check size={12} className="text-emerald-400" />}
                        </button>
                    </div>

                </section>
            </div>



            {/* ── SERVICES CATALOG ── */}
            <section id="what-we-do" className="border-t border-white/5 py-24 px-6 lg:px-12 max-w-[1240px] mx-auto text-center space-y-16 relative z-10">
                <div data-gsap="section-heading" className="space-y-4">
                    <p className="text-[11px] font-black text-[#6366f1] uppercase tracking-[0.2em]">{lang === "EN" ? "Catalog" : "सूची पत्र"}</p>
                    <h2 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight">
                        {lang === "EN" ? "Explore E-Mitra Services" : "ई-मित्र सेवाओं की सूची"}
                    </h2>
                    <p className="text-[13.5px] text-slate-300 max-w-xl mx-auto font-normal">
                        {lang === "EN"
                            ? "Browse official application filing desk services. Submit requests and check requirements."
                            : "आधिकारिक फॉर्म भरने की सेवाओं को ऑनलाइन देखें। अपने आवश्यक दस्तावेजों की जांच करें।"}
                    </p>
                </div>

                {/* Command-Palette style Search & Filter bar */}
                {!loading && Object.keys(services).length > 0 && (
                    <div data-gsap="search-bar" className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-6xl mx-auto">
                        <div className="relative flex-1 w-full">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={serviceSearch}
                                onChange={e => {
                                    setServiceSearch(e.target.value)
                                    setShowSearchDropdown(true)
                                    setFocusedSearchIndex(-1)
                                }}
                                onFocus={() => setShowSearchDropdown(true)}
                                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                                onKeyDown={(e) => {
                                    if (!showSearchDropdown || autocompleteSuggestions.length === 0) return
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault()
                                        setFocusedSearchIndex(prev => (prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev))
                                    } else if (e.key === "ArrowUp") {
                                        e.preventDefault()
                                        setFocusedSearchIndex(prev => (prev > 0 ? prev - 1 : prev))
                                    } else if (e.key === "Enter") {
                                        e.preventDefault()
                                        if (focusedSearchIndex >= 0 && focusedSearchIndex < autocompleteSuggestions.length) {
                                            setServiceSearch(autocompleteSuggestions[focusedSearchIndex].name)
                                            setShowSearchDropdown(false)
                                        }
                                    } else if (e.key === "Escape") {
                                        setShowSearchDropdown(false)
                                    }
                                }}
                                placeholder={lang === 'EN' ? 'Search services...' : 'सेवाएं खोजें...'}
                                className="w-full bg-zinc-900/40 border border-white/5 text-[14px] text-slate-100 placeholder:text-slate-500 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none transition-all font-medium"
                            />

                            <AnimatePresence>
                                {showSearchDropdown && serviceSearch.trim() && autocompleteSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-2 left-0 right-0 bg-[#0a0a0f] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 max-h-64 overflow-y-auto"
                                    >
                                        {autocompleteSuggestions.map((s, idx) => (
                                            <div
                                                key={idx}
                                                onMouseDown={() => {
                                                    setServiceSearch(s.name)
                                                    setShowSearchDropdown(false)
                                                }}
                                                className={`text-left px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer border-none flex items-center justify-between ${focusedSearchIndex === idx ? 'bg-white/10 text-white' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                            >
                                                <span className="truncate">{s.name}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="w-full sm:w-64 shrink-0 relative">
                            <button
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className="w-full px-4 py-3.5 flex items-center justify-between bg-zinc-900/40 border border-white/5 text-[14px] text-slate-300 rounded-2xl focus:outline-none transition-all cursor-pointer font-bold"
                            >
                                <span className="truncate">
                                    {serviceCatFilter === "ALL" ? (lang === 'EN' ? 'All Categories' : 'सभी श्रेणियां') : (services[serviceCatFilter]?.label || '')}
                                </span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isCategoryDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0f] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { setServiceCatFilter("ALL"); setIsCategoryDropdownOpen(false); }}
                                        className={`text-left px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer border-none ${serviceCatFilter === "ALL" ? 'bg-white/10 text-white' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                    >
                                        {lang === 'EN' ? 'All Categories' : 'सभी श्रेणियां'}
                                    </button>
                                    {Object.entries(services).map(([k, cat]) => (
                                        <button
                                            key={k}
                                            onClick={() => { setServiceCatFilter(k); setIsCategoryDropdownOpen(false); }}
                                            className={`text-left px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer border-none ${serviceCatFilter === k ? 'bg-white/10 text-white' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            )}
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
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-sm font-semibold">No services available at the moment.</p>
                    </div>
                ) : !hasMatchingServices ? (
                    <div className="text-center py-16 bg-zinc-950/20 border border-white/5 rounded-2xl text-slate-500 max-w-4xl mx-auto">
                        <Search size={28} className="mx-auto text-slate-650 mb-2" />
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
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                                        <span className="w-1.5 h-6 bg-[#0a4a83] rounded-full"></span>
                                        <h3 className="text-base font-bold text-white tracking-tight font-display">{cat.label}</h3>
                                        <span className="text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                            {matchingServices.length} {matchingServices.length === 1 ? "Service" : "Services"}
                                        </span>
                                    </div>

                                    <div data-gsap="service-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {matchingServices.map((svc, idx) => (
                                            <div
                                                key={idx}
                                                data-gsap="service-card"
                                                className="h-full bg-white/[0.03] border border-white/10 rounded-[22px] hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-[border-color,box-shadow] duration-500"
                                            >
                                                <div className="p-6 flex flex-col justify-between h-full group">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                            <span>{cat.label}</span>
                                                        </div>
                                                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{svc.name}</h4>
                                                        <p className="text-[12.5px] text-slate-400 font-normal leading-relaxed">{svc.description || "Official filing and registration services."}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRequestServiceWhatsApp(svc, catKey, cat.label)}
                                                        className="mt-6 w-full py-3 bg-white/5 hover:bg-white text-white hover:text-slate-950 text-[12px] font-bold uppercase rounded-xl transition-all duration-300 border border-white/10 cursor-pointer text-center"
                                                    >
                                                        {lang === 'EN' ? 'Request via WhatsApp' : 'व्हाट्सएप से अनुरोध करें'}
                                                    </button>
                                                </div>
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
            <section id="notifications" className="py-24 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-white/5 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
                    {/* Left Column - Info & Filters */}
                    <div data-gsap="notif-left" className="lg:col-span-5 space-y-10">
                        <div className="space-y-4">
                            <p className="text-[11px] font-black text-[#6366f1] uppercase tracking-[0.2em]">{lang === "EN" ? "Real-time updates" : "वास्तविक समय अपडेट"}</p>
                            <h2 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
                                {lang === "EN" ? "Live Notice Board" : "लाइव सूचना बोर्ड"}
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </h2>
                            <p className="text-[14px] text-slate-400 font-normal leading-relaxed mt-2 max-w-md">
                                {lang === "EN" 
                                    ? "Official exam circulars, admit card releases, result sheets, and counselling downloads."
                                    : "आधिकारिक परीक्षा अधिसूचनाएं, एडमिट कार्ड, परीक्षा परिणाम व काउंसलिंग की खबरें।"}
                            </p>
                        </div>

                        {/* Search & Filters */}
                        <div className="space-y-6">
                            <div className="relative w-full max-w-md text-left">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={lang === "EN" ? "Search announcements..." : "सूचना खोजें..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/10 pl-11 pr-4 py-3.5 rounded-2xl text-[13px] outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all font-medium text-white placeholder:text-slate-500 shadow-sm"
                                />
                            </div>

                            <div data-gsap="filter-group" className="flex flex-wrap gap-2.5">
                                <button
                                    onClick={() => setFilterCategory("ALL")}
                                    className={`px-5 py-2.5 text-[12px] font-bold rounded-xl border transition-all cursor-pointer ${filterCategory === "ALL"
                                        ? "bg-white text-slate-950 border-white shadow-md shadow-white/10"
                                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300"
                                        }`}
                                >
                                    {lang === "EN" ? "All" : "सभी"} <span className="opacity-60 ml-1">({announcements.length})</span>
                                </button>
                                <button
                                    onClick={() => setFilterCategory("exams")}
                                    className={`px-5 py-2.5 text-[12px] font-bold rounded-xl border transition-all cursor-pointer ${filterCategory === "exams"
                                        ? "bg-white text-slate-950 border-white shadow-md shadow-white/10"
                                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300"
                                        }`}
                                >
                                    {lang === "EN" ? "Exam Circulars" : "परीक्षा विज्ञापन"}
                                </button>
                                <button
                                    onClick={() => setFilterCategory("general")}
                                    className={`px-5 py-2.5 text-[12px] font-bold rounded-xl border transition-all cursor-pointer ${filterCategory === "general"
                                        ? "bg-white text-slate-950 border-white shadow-md shadow-white/10"
                                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-300"
                                        }`}
                                >
                                    {lang === "EN" ? "General Alerts" : "सामान्य खबरें"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Announcements Feed Container */}
                    <div data-gsap="notif-panel" className="lg:col-span-7 bg-[#0a0a0f] border border-white/10 rounded-[32px] p-2 pr-1 min-h-[500px] max-h-[600px] flex flex-col relative text-left shadow-2xl shadow-black/50">
                        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex justify-between items-center shrink-0">
                            <span className="text-[13px] font-black text-white uppercase tracking-wider">{lang === "EN" ? "Recent Circulars" : "हालिया घोषणाएं"}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} /> {lang === "EN" ? "Live Feed" : "लाइव समाचार"}
                            </span>
                        </div>

                        {loading ? (
                            <div className="px-6 py-4">
                                <AnnouncementSkeleton count={3} />
                            </div>
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 flex-1 flex flex-col items-center justify-center">
                                <Bell className="mx-auto text-slate-600 mb-3 opacity-50" size={32} />
                                <p className="text-[14px] font-bold">{lang === "EN" ? "No updates found" : "कोई सूचना नहीं मिली"}</p>
                                <p className="text-[12px] mt-1">{lang === "EN" ? "Try adjusting your filters" : "फ़िल्टर बदल कर प्रयास करें"}</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3 scroll-smooth">
                                {filteredAnnouncements.map((ann, idx) => (
                                    <div key={ann.id || idx} className="flex items-start gap-3.5 group text-left transition-all duration-300 hover:bg-white/[0.03] p-4 rounded-2xl border border-transparent hover:border-white/5 cursor-pointer">
                                        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                            <Bell size={14} className="group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13.5px] font-medium text-slate-200 leading-relaxed font-sans announcement-content break-words whitespace-pre-wrap">
                                                {formatTelegramMessage(ann.content)}
                                            </div>
                                            {ann.links && (
                                                <div className="mt-3">
                                                    <a
                                                        href={ann.links}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/20"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {lang === "EN" ? "View Document" : "दस्तावेज़ देखें"} <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── IMPORTANT RESOURCES ── */}
            <section id="resources" className="border-t border-white/5 py-24 px-6 lg:px-12 text-center relative z-10">
                <div className="max-w-[1240px] mx-auto space-y-12">
                    <div data-gsap="section-heading" className="space-y-3">
                        <p className="text-[11px] font-black text-[#6366f1] uppercase tracking-[0.2em]">{lang === "EN" ? "Portals" : "प्रमुख वेबसाइट्स"}</p>
                        <h2 className="text-3xl font-black text-white font-display tracking-tight">
                            {lang === "EN" ? "Important Government Gateways" : "महत्वपूर्ण सरकारी लिंक्स"}
                        </h2>
                        <p className="text-[13.5px] text-slate-400 max-w-xl mx-auto font-normal">
                            {lang === "EN"
                                ? "Access central and state quota registration desks directly."
                                : "केंद्रीय और राज्य कोटा भर्ती बोर्डों के सीधे प्रवेश द्वार।"}
                        </p>
                    </div>

                    <div data-gsap="resource-grid" className="grid grid-cols-2 md:grid-cols-5 gap-5 max-w-5xl mx-auto text-left">
                        <a
                            href="https://sso.rajasthan.gov.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-gsap="resource-card"
                            className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl hover:border-blue-500/30 hover:scale-[1.02] transition-[transform,border-color,box-shadow] duration-300 will-change-transform flex flex-col justify-between h-[130px] group"
                        >
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono">State Quota</span>
                            <span className="font-bold text-[13.5px] text-white group-hover:text-blue-450">Rajasthan SSO</span>
                            <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a
                            href="https://ssc.gov.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-gsap="resource-card"
                            className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl hover:border-blue-500/30 hover:scale-[1.02] transition-[transform,border-color,box-shadow] duration-300 will-change-transform flex flex-col justify-between h-[130px] group"
                        >
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono">Govt Jobs</span>
                            <span className="font-bold text-[13.5px] text-white group-hover:text-blue-450">SSC Portal</span>
                            <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a
                            href="https://neet.nta.nic.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-gsap="resource-card"
                            className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl hover:border-blue-500/30 hover:scale-[1.02] transition-[transform,border-color,box-shadow] duration-300 will-change-transform flex flex-col justify-between h-[130px] group"
                        >
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono">Medical Exams</span>
                            <span className="font-bold text-[13.5px] text-white group-hover:text-blue-450">NEET UG (NTA)</span>
                            <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a
                            href="https://www.rrcb.gov.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-gsap="resource-card"
                            className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl hover:border-blue-500/30 hover:scale-[1.02] transition-[transform,border-color,box-shadow] duration-300 will-change-transform flex flex-col justify-between h-[130px] group"
                        >
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono">Railways</span>
                            <span className="font-bold text-[13.5px] text-white group-hover:text-blue-450">RRB Recruitment</span>
                            <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>

                        <a
                            href="https://www.ibps.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-gsap="resource-card"
                            className="bg-[#0a0a0f] border border-white/5 p-5 rounded-2xl hover:border-blue-500/30 hover:scale-[1.02] transition-[transform,border-color,box-shadow] duration-300 will-change-transform flex flex-col justify-between h-[130px] group"
                        >
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono">Banking</span>
                            <span className="font-bold text-[13.5px] text-white group-hover:text-blue-450">IBPS Exams</span>
                            <span className="text-[10px] text-slate-500 inline-flex items-center gap-0.5 group-hover:underline">Open Portal <ExternalLink size={10} /></span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── FAQ SECTION ── */}
            <section id="faq" className="py-24 px-6 lg:px-12 max-w-[800px] mx-auto space-y-12 relative z-10">
                <div data-gsap="section-heading" className="text-center space-y-3">
                    <p className="text-[11px] font-black text-[#6366f1] uppercase tracking-[0.2em]">{lang === "EN" ? "Help" : "सहायता"}</p>
                    <h2 className="text-3xl font-black text-white font-display tracking-tight">{lang === "EN" ? "Frequently Asked Questions" : "अक्सर पूछे जाने वाले सवाल"}</h2>
                    <p className="text-[13px] text-slate-400 font-normal">
                        {lang === "EN" 
                            ? "Everything you need to know about notifications locker and filings."
                            : "डिजिटल लॉकर, फॉर्म भरने व नोटिफिकेशन से जुड़े आपके सवालों के जवाब।"}
                    </p>
                </div>

                <div data-gsap="faq-list" className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} data-gsap="faq-item" className="border border-white/5 rounded-2xl bg-[#0a0a0f] overflow-hidden">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                className="w-full p-5 flex items-center justify-between text-left font-bold text-[13px] text-white hover:bg-white/5 bg-transparent border-none cursor-pointer"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${expandedFaq === idx ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence initial={false}>
                                {expandedFaq === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="border-t border-white/5 overflow-hidden"
                                    >
                                        <div className="p-5 text-[12.5px] text-slate-400 font-normal leading-relaxed bg-[#050508]">
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
            <section className="px-6 lg:px-12 pb-24 max-w-[1240px] mx-auto relative z-10">
                <div data-gsap="cta-section" className="bg-[#0a0a0f] border border-white/10 rounded-[32px] text-white p-12 text-center space-y-6 relative overflow-hidden">

                    <h3 className="text-2xl lg:text-3xl font-black font-display tracking-tight">
                        {lang === "EN" ? "Ready to file forms from home?" : "क्या आप घर बैठे फॉर्म भरना चाहते हैं?"}
                    </h3>
                    <p className="text-[13px] text-slate-400 max-w-md mx-auto font-normal leading-relaxed">
                        {lang === "EN"
                            ? "Set up your student profile and link your Telegram account to start receiving alerts instantly."
                            : "अपना स्टूडेंट प्रोफाइल बनाएं और तुरंत परीक्षा अपडेट प्राप्त करने के लिए टेलीग्राम असिस्टेंट से जुड़ें।"}
                    </p>

                    <div className="flex justify-center gap-4">
                        {isLoggedIn ? (
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-7 py-3.5 bg-white text-slate-950 hover:bg-slate-100 text-[13px] font-bold rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer"
                            >
                                {lang === "EN" ? "Access Student Panel" : "विद्यार्थी पैनल खोलें"}
                            </button>
                        ) : (
                            <button
                                onClick={triggerSignIn}
                                className="px-7 py-3.5 bg-white text-slate-950 hover:bg-slate-100 text-[13px] font-bold rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer"
                            >
                                {lang === "EN" ? "Create Free Account" : "निशुल्क अकाउंट बनाएं"}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ── STUNNING PREMIUM FOOTER ── */}
            <footer className="relative bg-[#030305] pt-24 pb-12 overflow-hidden z-10 border-t border-white/5 mt-20">
                
                <div className="max-w-[1240px] mx-auto px-6 lg:px-12 relative z-10">
                    <div data-gsap="footer-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 text-left">
                        
                        {/* Brand Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-1 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                                    <Logo className="w-10 h-10 rounded-lg" />
                                </div>
                                <span className="font-black text-white text-xl tracking-tight font-display leading-tight">Krishna Emitra<br/><span className="text-blue-500 text-[13px] uppercase tracking-wider">Digital Seva</span></span>
                            </div>
                            <p className="text-[13px] leading-relaxed text-slate-400 font-medium pr-8">
                                {lang === "EN"
                                    ? "A secure, prompt, and convenient platform designed to file and track recruitment forms and counselling."
                                    : "सरकारी नौकरी फॉर्म एवं कॉलेज काउंसलिंग आवेदन भरने व लाइव अपडेट पाने का सुरक्षित पोर्टल।"}
                            </p>
                        </div>

                        {/* Location */}
                        <div className="lg:col-span-3 space-y-5">
                            <h4 className="font-black text-white text-[13px] uppercase tracking-[0.15em] opacity-90">{lang === "EN" ? "Our Center" : "हमारा केंद्र"}</h4>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                    <MapPin size={18} className="text-blue-400" />
                                </div>
                                <p className="text-[13px] leading-relaxed text-slate-300 font-bold">
                                    Ward No. 42, New Indra Colony,<br />
                                    Near Janki Tower, Sikar,<br />
                                    <span className="text-slate-500 mt-1 block font-medium">Rajasthan - 332001</span>
                                </p>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="lg:col-span-3 space-y-5">
                            <h4 className="font-black text-white text-[13px] uppercase tracking-[0.15em] opacity-90">{lang === "EN" ? "Operator Contact" : "ऑपरेटर संपर्क"}</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                        <Phone size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{lang === "EN" ? "Direct Line" : "सीधी लाइन"}</p>
                                        <p className="text-[14.5px] font-black text-slate-200 group-hover:text-white transition-colors tracking-wide">+91 8955275304</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                        <Mail size={16} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{lang === "EN" ? "Email Us" : "ईमेल करें"}</p>
                                        <p className="text-[14.5px] font-black text-slate-200 group-hover:text-white transition-colors tracking-wide">vkm5977@gmail.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="lg:col-span-2 space-y-5">
                            <h4 className="font-black text-white text-[13px] uppercase tracking-[0.15em] opacity-90">{lang === "EN" ? "Desks" : "सहायक सेवाएं"}</h4>
                            <div className="space-y-3">
                                <a href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-[13.5px] font-bold text-slate-400 hover:text-cyan-400 transition-colors group">
                                    <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10"><Send size={12} /></span>
                                    Telegram Bot
                                </a>
                                <a href={`https://wa.me/918955275304`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-[13.5px] font-bold text-slate-400 hover:text-[#25D366] transition-colors group">
                                    <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#25D366]/10"><MessageSquare size={12} /></span>
                                    WhatsApp Desk
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[12px] font-medium text-slate-500">
                            © {new Date().getFullYear()} Krishna Emitra Digital Seva. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-[12px] font-bold text-slate-500">
                            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── SERVICE REQUEST MODAL ── */}
            <AnimatePresence>
                {showRequestModal && requestModalSvc && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                            onClick={() => setShowRequestModal(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="relative bg-[#0b0f19]/95 border border-white/15 rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full z-10 text-left text-white backdrop-blur-xl"
                        >
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 bg-transparent border-none cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-blue-450 bg-blue-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-blue-500/20">
                                        {requestModalCatLabel}
                                    </span>
                                    <h3 className="text-xl font-black text-white font-display">
                                        {lang === 'EN' ? 'Confirm Request' : 'अनुरोध की पुष्टि करें'}
                                    </h3>
                                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                                        {lang === 'EN'
                                            ? `You are requesting: "${requestModalSvc.name}". Enter your name and phone number to automatically send this request to our admin desk.`
                                            : `आप "${requestModalSvc.name}" का अनुरोध कर रहे हैं। इस अनुरोध को हमारे एडमिन डेस्क पर भेजने के लिए अपना नाम और फोन नंबर दर्ज करें।`}
                                    </p>
                                </div>

                                <form onSubmit={handleModalSubmit} className="space-y-4">
                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                            {lang === 'EN' ? 'Full Name' : 'पूरा नाम'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder={lang === 'EN' ? 'Enter your name' : 'अपना नाम दर्ज करें'}
                                            className="w-full bg-black/50 border border-white/10 text-[13px] text-white placeholder:text-slate-650 px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                            {lang === 'EN' ? 'Phone Number (WhatsApp)' : 'फ़ोन नंबर (व्हाट्सएप)'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-500 font-bold font-mono">+91</span>
                                            <input
                                                type="tel"
                                                required
                                                pattern="[6-9][0-9]{9}"
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value)}
                                                placeholder={lang === 'EN' ? '10-digit number' : '10-अंकीय नंबर'}
                                                className="w-full bg-black/50 border border-white/10 text-[13px] text-white placeholder:text-slate-650 pl-14 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono font-medium"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingRequest}
                                        className="w-full mt-2 py-3 bg-white hover:bg-slate-100 text-slate-950 text-[13px] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Back to top floating button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer border-none hover:shadow-blue-500/30 active:scale-95 transition-all"
                        title="Back to Top"
                    >
                        <ChevronUp size={20} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}
