import { useState, useEffect, useMemo, useRef, Fragment } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate, useParams } from "react-router-dom"
import {
    User, Mail, Phone, Clock, CheckCircle2, AlertCircle, Loader2,
    Layers, Award, ClipboardList, CheckCircle, ChevronRight, ShieldCheck,
    Globe, Bell, LogOut, X, Search, Menu, Send, MessageSquare,
    Calendar, ChevronDown, Download, ExternalLink, FileText, LayoutDashboard,
    FileCheck, Info, RefreshCw, ChevronUp, FileBadge, Sparkles,
    Settings, Check, MapPin, Eye, BookOpen
} from "lucide-react"

import "../../portal.css"
import { useLanguage } from "../../context/LanguageContext"
import { useAuth } from "../../context/AuthContext"
import * as api from "../../api"
import ExamFormWizard from "../../components/student/ExamFormWizard"

export default function StudentPanel() {
    const navigate = useNavigate()
    const { category: catParam } = useParams()
    const { lang, toggleLanguage, t } = useLanguage()
    const { user, isLoggedIn, logout } = useAuth()

    // Navigation and tab states
    const [activeTab, setActiveTab] = useState("overview")
    const [activeExamForTimeline, setActiveExamForTimeline] = useState(null)
    const [activeServiceForForm, setActiveServiceForForm] = useState(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Data lists from DB
    const [services, setServices] = useState({})
    const [exams, setExams] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [history, setHistory] = useState([])
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // UI state filters
    const [appSearch, setAppSearch] = useState("")
    const [appFilter, setAppFilter] = useState("ALL")
    const [serviceSearch, setServiceSearch] = useState("")
    const [serviceCatFilter, setServiceCatFilter] = useState("ALL")
    const [examSearch, setExamSearch] = useState("")
    const [examCategoryFilter, setExamCategoryFilter] = useState("ALL")
    const [servicesSubTab, setServicesSubTab] = useState("catalog")
    const [notificationsSubTab, setNotificationsSubTab] = useState("all")
    const [expandedAppId, setExpandedAppId] = useState(null)

    // LocalStorage-backed states linked to student
    const storagePrefix = user?.phone || user?.email || "anonymous"
    const [subscribedExams, setSubscribedExams] = useState([])
    const [readNotifications, setReadNotifications] = useState([])
    const [notificationPrefs, setNotificationPrefs] = useState({ whatsapp: true, telegram: true })
    const [editableProfile, setEditableProfile] = useState({ name: "", phone: "", email: "" })
    const [profileSavedMessage, setProfileSavedMessage] = useState("")

    // NEET & Query submission states
    const [neetRank, setNeetRank] = useState("")
    const [neetCategory, setNeetCategory] = useState("GEN")
    const [neetPhone, setNeetPhone] = useState("")
    const [neetFormSubmitted, setNeetFormSubmitted] = useState(false)
    
    // Service form modal states
    const [formDataDesc, setFormDataDesc] = useState("")
    const [formFile, setFormFile] = useState(null)
    const [formFileName, setFormFileName] = useState("")
    const [formSubmitting, setFormSubmitting] = useState(false)
    const [formSuccessId, setFormSuccessId] = useState("")

    // Helpdesk Support States
    const [cbName, setCbName] = useState("")
    const [cbPhone, setCbPhone] = useState("")
    const [cbQuery, setCbQuery] = useState("")
    const [cbSubmitted, setCbSubmitted] = useState(false)

    // Exam Wizard States
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [wizardExamName, setWizardExamName] = useState("")

    // Public Slider Carousel State
    const [carouselIndex, setCarouselIndex] = useState(0)

    // Fetch dashboard resources
    const fetchAllData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

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

            const identifier = user?.phone || user?.email
            if (isLoggedIn && identifier) {
                const [statusRes, applicationsRes] = await Promise.all([
                    api.publicCheckStatus(identifier).catch(() => ({ history: [] })),
                    api.getFormApplicationStatus(identifier).catch(() => ({ applications: [] }))
                ])

                const combined = [
                    ...(statusRes.history || []).map(item => ({
                        ...item,
                        type: "service",
                        id: `SR-${item.id}`
                    })),
                    ...(applicationsRes.applications || []).map(item => ({
                        ...item,
                        id: `EX-${item.id}`,
                        rawId: item.id,
                        service_name: item.exam_name,
                        category: "Exam Form Filing",
                        status: item.status,
                        remarks: item.remarks,
                        requested_at: item.submitted_at,
                        type: "exam_form",
                        documents: item.documents || []
                    }))
                ]
                combined.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
                setHistory(combined)
            }
        } catch (err) {
            console.error("Failed to load portal data", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // React to category URL slug
    useEffect(() => {
        if (catParam) {
            setActiveTab("services")
            setServicesSubTab("catalog")
            setServiceCatFilter(catParam)
        }
    }, [catParam])

    // Fetch on mount
    const userIdentifier = user?.email || user?.phone
    useEffect(() => {
        fetchAllData()
    }, [isLoggedIn, userIdentifier])

    const handleLogout = () => {
        logout()
        navigate("/")
    }

    // Load local storage states when user becomes available
    useEffect(() => {
        if (user) {
            const subs = localStorage.getItem(`${storagePrefix}_subscribedExams`)
            const reads = localStorage.getItem(`${storagePrefix}_readNotifications`)
            const prefs = localStorage.getItem(`${storagePrefix}_notificationPrefs`)
            
            if (subs) setSubscribedExams(JSON.parse(subs))
            else setSubscribedExams([])

            if (reads) setReadNotifications(JSON.parse(reads))
            else setReadNotifications([])

            if (prefs) setNotificationPrefs(JSON.parse(prefs))

            setEditableProfile({
                name: user.name || "",
                phone: user.phone || "",
                email: user.email || ""
            })
        }
    }, [user, storagePrefix])

    // Automatic Announcement Carousel rotation (every 4s)
    useEffect(() => {
        if (announcements.length > 0 && activeTab === "overview" && !isLoggedIn) {
            const timer = setInterval(() => {
                setCarouselIndex(prev => (prev + 1) % Math.min(announcements.length, 4))
            }, 4000)
            return () => clearInterval(timer)
        }
    }, [announcements, activeTab, isLoggedIn])

    // Save exam preferences
    const handleSaveExamSubscriptions = (updatedList) => {
        setSubscribedExams(updatedList)
        localStorage.setItem(`${storagePrefix}_subscribedExams`, JSON.stringify(updatedList))
    }

    // Toggle single subscription
    const handleToggleExamSubscription = (examName) => {
        const list = subscribedExams.includes(examName)
            ? subscribedExams.filter(n => n !== examName)
            : [...subscribedExams, examName]
        handleSaveExamSubscriptions(list)
    }

    // Mark single notification read
    const handleMarkNotificationRead = (id) => {
        if (!readNotifications.includes(id)) {
            const list = [...readNotifications, id]
            setReadNotifications(list)
            localStorage.setItem(`${storagePrefix}_readNotifications`, JSON.stringify(list))
        }
    }

    // Mark all notifications read
    const handleMarkAllNotificationsRead = () => {
        const allIds = announcements.map(ann => ann.id)
        setReadNotifications(allIds)
        localStorage.setItem(`${storagePrefix}_readNotifications`, JSON.stringify(allIds))
    }

    // Render notifications panel for 3-column split layout
    const renderNotificationsPanel = (isSticky = true) => {
        const subNotifications = announcements.filter(ann => {
            if (subscribedExams.length === 0) return false;
            return subscribedExams.some(exam => {
                const titleMatch = ann.title?.toLowerCase().includes(exam.toLowerCase());
                const contentMatch = ann.content?.toLowerCase().includes(exam.toLowerCase());
                return titleMatch || contentMatch;
            });
        });

        return (
            <div className={`flex flex-col space-y-5 h-full ${isSticky ? "" : "bg-white border border-[var(--color-outline-variant)] rounded-3xl p-6 shadow-ambient"}`}>
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-[14.5px] font-extrabold text-slate-900 font-display flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                            {lang === 'EN' ? 'Alert Inbox' : 'अलर्ट इनबॉक्स'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wide">
                            {lang === 'EN' ? 'Subscribed Alerts' : 'सदस्यता प्राप्त अलर्ट'}
                        </p>
                    </div>
                    {subNotifications.length > 0 && (
                        <span className="px-2 py-0.5 bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] text-[var(--color-primary)] text-[9.5px] font-extrabold rounded-md">
                            {subNotifications.length} Active
                        </span>
                    )}
                </div>

                {subNotifications.length === 0 ? (
                    <div className="py-8 px-4 text-center space-y-6 flex flex-col items-center justify-center my-auto">
                        <div className="w-14 h-14 bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center rounded-2xl border border-[var(--color-outline-variant)] shadow-sm animate-pulse">
                            <Bell size={24} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">
                                {lang === 'EN' ? 'No Subscribed Updates' : 'कोई सदस्यता अलर्ट नहीं'}
                            </h4>
                            <p className="text-[11.5px] text-slate-450 leading-relaxed font-semibold">
                                {lang === 'EN' 
                                    ? 'Select your target exams to receive verified portal updates, or join our community networks.' 
                                    : 'सत्यापित पोर्टल अपडेट प्राप्त करने के लिए अपनी लक्षित परीक्षाओं का चयन करें, या हमारे समुदाय में शामिल हों।'}
                            </p>
                        </div>
                        
                        <div className="space-y-2.5 w-full">
                            <button 
                                onClick={() => setActiveTab("exams")} 
                                className="w-full px-4.5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white rounded-xl text-[11px] font-extrabold transition-all shadow-ambient flex items-center justify-center gap-1.5 cursor-pointer border-none"
                            >
                                <Award size={13} /> {lang === 'EN' ? 'Select Exams' : 'परीक्षाएं चुनें'}
                            </button>
                            
                            <a 
                                href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent("Hello! I want to join the WhatsApp alerts group.")}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-full px-4.5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-[var(--color-outline-variant)] rounded-xl text-[11px] font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <MessageSquare size={13} className="text-emerald-500" /> {lang === 'EN' ? 'Join WhatsApp Alerts' : 'व्हाट्सएप से जुड़ें'}
                            </a>
                            
                            <a 
                                href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"}
                                target="_blank" rel="noopener noreferrer"
                                className="w-full px-4.5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-[var(--color-outline-variant)] rounded-xl text-[11px] font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Send size={13} className="text-sky-500" /> {lang === 'EN' ? 'Join Telegram Bot' : 'टेलीग्राम से जुड़ें'}
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3.5 overflow-y-auto pr-1 scrollbar-thin">
                        {subNotifications.map((ann, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3.5 hover:bg-[var(--color-surface-bright)] rounded-2xl transition-all border border-transparent hover:border-[var(--color-outline-variant)] group bg-white border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <Bell size={13} />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-[12.5px] font-extrabold text-slate-900 truncate group-hover:text-[var(--color-primary)] transition-colors">{ann.title}</h4>
                                        <span className="text-[9.5px] text-slate-400 shrink-0 font-semibold">{new Date(ann.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
                                    </div>
                                    <p className="text-[11.5px] text-slate-550 font-normal leading-relaxed">{ann.content}</p>
                                    {ann.links && (
                                        <a 
                                            href={ann.links} target="_blank" rel="noopener noreferrer"
                                            className="text-[var(--color-primary)] text-[10px] font-extrabold hover:text-[var(--color-primary-container)] inline-flex items-center gap-0.5 mt-1"
                                        >
                                            Download Document <ExternalLink size={9} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Save profile configurations
    const handleSaveProfile = (e) => {
        e.preventDefault()
        localStorage.setItem(`${storagePrefix}_notificationPrefs`, JSON.stringify(notificationPrefs))
        setProfileSavedMessage("Preferences and Profile settings updated successfully!")
        setTimeout(() => setProfileSavedMessage(""), 3000)
    }

    // Submit custom service request (Page 8)
    const handleServiceFormSubmit = async (e) => {
        e.preventDefault()
        if (!activeServiceForForm) return

        setFormSubmitting(true)
        try {
            const submissionNotes = `Requested: ${activeServiceForForm.name}. Details: ${formDataDesc}`
            await api.publicLogIntent(
                submissionNotes,
                activeServiceForForm.categoryLabel || "Service Request",
                user?.phone || "WEB_ANONYMOUS"
            )
            // Generate mock request ID for confirmation
            const reqId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`
            setFormSuccessId(reqId)
            fetchAllData(true)
        } catch (err) {
            alert("Error logging filing request: " + err.message)
        } finally {
            setFormSubmitting(false)
        }
    }

    // NEET Counselling Request Submit
    const handleNeetCounsellingSubmit = async (e) => {
        e.preventDefault()
        if (!neetRank.trim()) return alert("Please enter your NEET rank")
        if (!neetPhone.trim() || !/^[6-9]\d{9}$/.test(neetPhone)) return alert("Please enter a valid 10-digit number")

        setNeetFormSubmitted(true)
        try {
            await api.publicLogIntent(
                `NEET Choice-Filling Counselling (Rank: ${neetRank}, Cat: ${neetCategory})`,
                "Counselling Hub",
                neetPhone
            )
            setTimeout(() => {
                const textMsg = `Hello! I requested Rajasthan NEET choice filling guidance. Details:\nRank: ${neetRank}\nCategory: ${neetCategory}`
                window.open(`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(textMsg)}`, "_blank")
            }, 1000)
            fetchAllData(true)
        } catch {}
    }

    // Callback Request Submit
    const handleCallbackQuerySubmit = async (e) => {
        e.preventDefault()
        if (!cbName.trim() || !cbPhone.trim() || !cbQuery.trim()) return alert("Please fill all callback fields")

        setCbSubmitted(true)
        try {
            await api.publicLogIntent(
                `Callback support request: ${cbQuery} (Client: ${cbName})`,
                "Support Desk",
                cbPhone
            )
            fetchAllData(true)
        } catch {}
    }

    const triggerSignIn = () => {
        if (window.Clerk) {
            window.Clerk.openSignIn({
                afterSignInUrl: window.location.href,
                afterSignUpUrl: window.location.href,
            })
        }
    }

    // computed stats and list filters
    const statsProgress = useMemo(() => {
        const total = history.length
        const active = history.filter(item => ["pending", "processing"].includes(item.status)).length
        const completed = history.filter(item => item.status === "completed").length
        const actionRequired = history.filter(item => item.remarks && item.status !== "completed").length
        return { total, active, completed, actionRequired }
    }, [history])

    const filteredApplications = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = item.service_name.toLowerCase().includes(appSearch.toLowerCase()) || 
                                 item.id.toLowerCase().includes(appSearch.toLowerCase())
            if (appFilter === "ALL") return matchesSearch
            if (appFilter === "action") return matchesSearch && item.remarks && item.status !== "completed"
            return matchesSearch && item.status === appFilter
        })
    }, [history, appSearch, appFilter])

    const filteredExamsList = useMemo(() => {
        return exams.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(examSearch.toLowerCase())
            if (examCategoryFilter === "ALL") return matchesSearch
            return matchesSearch && (ex.category || "UG").toUpperCase() === examCategoryFilter.toUpperCase()
        })
    }, [exams, examSearch, examCategoryFilter])

    // Flat list of services catalog
    const flatServicesList = useMemo(() => {
        const list = []
        Object.entries(services).forEach(([catKey, cat]) => {
            cat.services?.forEach(s => {
                if (serviceCatFilter === "ALL" || catKey === serviceCatFilter) {
                    list.push({ ...s, categoryKey: catKey, categoryLabel: cat.label })
                }
            })
        })
        return list.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    }, [services, serviceCatFilter, serviceSearch])

    // Get closest upcoming deadline dates for exams ticker
    const upcomingDeadlines = useMemo(() => {
        return exams
            .filter(ex => ex.end_date && new Date(ex.end_date) >= new Date())
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 5)
    }, [exams])

    const getStatusDetails = (status, hasRemarks) => {
        if (status === "completed") {
            return {
                label: "Completed",
                labelHi: "पूर्ण",
                colorClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
                badgeClass: "bg-emerald-500",
                stepIndex: 3
            }
        }
        if (status === "processing") {
            return {
                label: "Processing",
                labelHi: "प्रक्रिया में",
                colorClass: "bg-blue-50 text-blue-700 border-blue-100",
                badgeClass: "bg-blue-500 animate-pulse",
                stepIndex: 2
            }
        }
        if (status === "pending") {
            if (hasRemarks) {
                return {
                    label: "Action Required",
                    labelHi: "कार्रवाई आवश्यक",
                    colorClass: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
                    badgeClass: "bg-amber-500",
                    stepIndex: 1
                }
            }
            return {
                label: "Under Review",
                labelHi: "समीक्षा के तहत",
                colorClass: "bg-orange-50 text-orange-700 border-orange-100",
                badgeClass: "bg-orange-500",
                stepIndex: 1
            }
        }
        return {
            label: "Rejected",
            labelHi: "अस्वीकृत",
            colorClass: "bg-red-50 text-red-700 border-red-100",
            badgeClass: "bg-red-500",
            stepIndex: 1
        }
    }

    const navigationItems = [
        { id: "overview", label: "Dashboard", labelHi: "डैशबोर्ड", icon: LayoutDashboard },
        { id: "services", label: "Browse Services", labelHi: "सरकारी सेवाएँ", icon: ClipboardList },
        { id: "exams", label: "Exam Alerts", labelHi: "परीक्षा अलर्ट", icon: Award },
        { id: "neet", label: "NEET Counselling", labelHi: "नीट काउंसलिंग", icon: BookOpen },
        { id: "profile", label: "Profile Settings", labelHi: "प्रोफ़ाइल", icon: Settings },
        { id: "help", label: "Help Desk", labelHi: "सहायता डेस्क", icon: Info },
        { id: "about", label: "About Us", labelHi: "हमारे बारे में", icon: ShieldCheck }
    ]

    return (
        <div className="min-h-screen flex text-slate-800 font-sans antialiased relative bg-[var(--color-surface-base)] w-full">
            
            {/* ── DESKTOP SIDEBAR ── */}
            <aside className="w-[280px] bg-[var(--color-surface-base)] border-r border-[var(--color-outline-variant)] hidden lg:flex flex-col sticky top-0 h-screen shrink-0 z-20">
                <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--color-outline-variant)]">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-container)] text-white flex items-center justify-center font-bold text-[18px] shadow-md shadow-[var(--color-primary)]/30">
                            e
                        </div>
                        <div className="leading-tight">
                            <span className="text-[var(--color-primary)] font-extrabold text-[15px] tracking-tight block font-display">Krishna Emitra</span>
                            <span className="text-[9.5px] text-gray-500 font-extrabold tracking-widest uppercase block mt-0.5">Student Panel</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        // Do not show notifications or profile tabs if user is logged out
                        if (!isLoggedIn && ["profile"].includes(item.id)) return null;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id)
                                    setActiveExamForTimeline(null)
                                }}
                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer group ${
                                    isActive
                                        ? "bg-[var(--color-surface-low)] text-[var(--color-primary)] font-semibold shadow-ambient"
                                        : "text-[var(--color-on-surface)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-bright)]"
                                }`}
                            >
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2.0} className={`${isActive ? "text-[var(--color-primary)]" : "text-gray-400 group-hover:text-[var(--color-primary)] transition-colors"}`} />
                                <span className="flex-1 text-left">
                                    {lang === "EN" ? item.label : item.labelHi}
                                </span>
                                {!isActive && (
                                    <ChevronRight size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Desktop Account block */}
                <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-base)]">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm">
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-[var(--color-primary)]/10" />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-container)] text-white flex items-center justify-center font-bold text-[14px] rounded-xl shadow-md">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[12.5px] font-bold text-gray-900 truncate leading-tight">{user?.name}</p>
                                <p className="text-[9.5px] font-semibold text-gray-400 truncate mt-1">Student Account</p>
                            </div>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg cursor-pointer" title="Log Out">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={triggerSignIn}
                            className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/10 cursor-pointer hover:-translate-y-0.5 duration-200"
                        >
                            <User size={14} /> Sign In Portal
                        </button>
                    )}
                </div>
            </aside>

            {/* ── MAIN PORTAL CANVAS ── */}
            <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
                
                {/* ── TOP NAV HEADER ── */}
                <header className="h-20 bg-[var(--color-surface-base)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)] flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-505 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                            <Menu size={20} />
                        </button>
                        <div className="hidden lg:flex items-center gap-2">
                            <h2 className="text-[16px] font-extrabold text-slate-900 tracking-tight font-display">
                                {lang === "EN" ? navigationItems.find(i => i.id === activeTab)?.label : navigationItems.find(i => i.id === activeTab)?.labelHi}
                            </h2>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                        </div>
                        <div className="lg:hidden flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-container)] text-white flex items-center justify-center font-bold text-[14px] shadow-md shadow-[var(--color-primary)]/20">e</div>
                            <span className="text-slate-900 font-extrabold text-[14.5px] tracking-tight">Krishna Emitra</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isLoggedIn && (
                            <button 
                                onClick={() => setActiveTab("overview")} 
                                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all relative cursor-pointer"
                                title="Inbox Notifications"
                            >
                                <Bell size={16} />
                                {announcements.length - readNotifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
                                        {announcements.length - readNotifications.length}
                                    </span>
                                )}
                            </button>
                        )}

                        <button onClick={() => fetchAllData(true)} disabled={refreshing} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
                            <RefreshCw size={15} className={refreshing ? "animate-spin text-[var(--color-primary)]" : ""} />
                        </button>

                        <button onClick={toggleLanguage} className="text-slate-700 hover:text-slate-900 transition-all text-[11px] font-bold flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3.5 py-1.8 rounded-xl border border-slate-200/80 shadow-sm cursor-pointer">
                            <Globe size={13} className="text-slate-400" /> {lang === 'EN' ? 'हिन्दी' : 'English'}
                        </button>
                    </div>
                </header>

                {/* ── MOBILE MENU DRAWER ── */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="fixed inset-0 bg-[#0A1A40]/40 backdrop-blur-sm z-50 lg:hidden"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                                className="fixed top-0 bottom-0 left-0 w-[280px] bg-[var(--color-surface-base)] text-[var(--color-on-surface)] z-50 lg:hidden flex flex-col p-5 shadow-2xl border-r border-[var(--color-outline-variant)]"
                            >
                                <div className="flex items-center justify-between pb-5 border-b border-[var(--color-outline-variant)] mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-container)] text-white flex items-center justify-center font-bold text-[14px]">e</div>
                                        <span className="font-extrabold text-[15px] text-[var(--color-primary)] font-display">Krishna Emitra</span>
                                    </div>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-[var(--color-surface-bright)] rounded-lg text-slate-400 hover:text-[var(--color-primary)] cursor-pointer transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                <nav className="flex-1 space-y-1.5">
                                    {navigationItems.map(item => {
                                        const Icon = item.icon
                                        const isActive = activeTab === item.id
                                        if (!isLoggedIn && ["profile"].includes(item.id)) return null;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTab(item.id)
                                                    setActiveExamForTimeline(null)
                                                    setIsMobileMenuOpen(false)
                                                }}
                                                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold cursor-pointer ${
                                                    isActive ? "bg-[var(--color-surface-low)] text-[var(--color-primary)] shadow-ambient font-bold" : "text-[var(--color-on-surface)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-bright)]"
                                                }`}
                                            >
                                                <Icon size={16} />
                                                <span>{lang === "EN" ? item.label : item.labelHi}</span>
                                            </button>
                                        )
                                    })}
                                </nav>

                                <div className="border-t border-[var(--color-outline-variant)] pt-4">
                                    {isLoggedIn ? (
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 hover:bg-red-50 text-red-500 text-[12.5px] font-bold uppercase rounded-xl transition-all cursor-pointer"
                                        >
                                            <LogOut size={14} /> Log Out
                                        </button>
                                    ) : (
                                        <button onClick={triggerSignIn} className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-bold uppercase rounded-xl cursor-pointer">
                                            Sign In
                                        </button>
                                    )}
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <div className="flex flex-1 w-full overflow-hidden items-start">
                    {/* ── CENTER WORKSPACE ── */}
                    <div className="flex-1 min-w-0 h-[calc(100vh-80px)] overflow-y-auto flex flex-col justify-between">
                        {/* ── CANVAS MAIN CONTENT ── */}
                        <main className="max-w-[1140px] w-full mx-auto px-6 md:px-10 py-8 flex-1">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                            <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
                            <span className="text-[12px] text-slate-400 font-bold tracking-widest uppercase">Initializing Portal</span>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fadeIn">
                            
                            {/* ── SECTION 1: PUBLIC LANDING OR DASHBOARD (Tab 1 Overview) ── */}
                            {activeTab === "overview" && (
                                <div className="space-y-8 animate-fadeIn animate-slideUp">
                                    
                                    {/* IF LOGGED OUT: PUBLIC LANDING PAGE */}
                                    {!isLoggedIn ? (
                                        <div className="space-y-8">
                                            {/* Rotating Hero Carousel */}
                                            {announcements.length > 0 && (
                                                <div className="relative h-72 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-2xl overflow-hidden shadow-ambient border-none flex items-center p-8 md:p-14">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)]" />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent z-10" />
                                                    <div className="relative z-20 space-y-4 max-w-xl text-left">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/30">
                                                            <Sparkles size={11} className="animate-pulse" /> Latest Notification
                                                        </span>
                                                        <h2 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight line-clamp-2 bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200 font-display">
                                                            {announcements[carouselIndex]?.title}
                                                        </h2>
                                                        <p className="text-[12.5px] text-white/90 line-clamp-3 leading-relaxed font-normal">
                                                            {announcements[carouselIndex]?.content}
                                                        </p>
                                                        {announcements[carouselIndex]?.links && (
                                                            <a 
                                                                href={announcements[carouselIndex].links} target="_blank" rel="noopener noreferrer"
                                                                className="text-white hover:text-slate-200 text-[12px] font-bold inline-flex items-center gap-1.5 underline transition-colors group"
                                                            >
                                                                Read Official PDF Document <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Dots pagination indicator */}
                                                    <div className="absolute bottom-6 right-8 z-20 flex gap-2">
                                                        {announcements.slice(0, 4).map((_, dotIdx) => (
                                                            <button 
                                                                key={dotIdx} 
                                                                onClick={() => setCarouselIndex(dotIdx)} 
                                                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${carouselIndex === dotIdx ? "bg-white w-6" : "bg-white/30 hover:bg-white/55"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Upcoming Deadlines Horizontal Ticker */}
                                            {upcomingDeadlines.length > 0 && (
                                                <div className="bg-white border border-[var(--color-outline-variant)] shadow-ambient rounded-2xl p-4 flex items-center overflow-hidden">
                                                    <div className="flex items-center gap-2 shrink-0 border-r border-[var(--color-outline-variant)] pr-4 mr-4 text-[var(--color-primary)] text-[11px] font-extrabold uppercase tracking-wider">
                                                        <Clock size={14} className="animate-pulse" /> Deadlines Ticker
                                                    </div>
                                                    <div className="flex items-center gap-10 whitespace-nowrap animate-marquee">
                                                        {upcomingDeadlines.map((ex, exIdx) => (
                                                            <span key={exIdx} className="text-[12.5px] font-semibold text-slate-700">
                                                                🔥 <span className="font-extrabold text-slate-900">{ex.name}</span> closes on <span className="text-[var(--color-primary)] font-bold">{new Date(ex.end_date).toLocaleDateString("en-IN")}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Public Notifications list & Why Krishna Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                                                {/* Latest Announcements */}
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-ambient lg:col-span-2 space-y-4">
                                                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-[15px] font-extrabold text-slate-900 font-display">Public Notification Board</h3>
                                                            <p className="text-[11.5px] text-slate-400 mt-0.5">Scrollable lists of recent exam circulars.</p>
                                                        </div>
                                                        <span className="text-[10px] font-extrabold text-[var(--color-primary)] uppercase bg-[var(--color-surface-low)] px-2.5 py-1 rounded-lg border border-[var(--color-outline-variant)]">Public Reads</span>
                                                    </div>

                                                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                                                        {announcements.slice(0, 6).map((ann, idx) => (
                                                            <div key={idx} className="border border-slate-100 hover:border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all text-left">
                                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold mb-1">
                                                                    <span className="text-[var(--color-primary)] uppercase tracking-wider">Government Alert</span>
                                                                    <span>{new Date(ann.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
                                                                </div>
                                                                <h4 className="text-[13.5px] font-extrabold text-slate-900 leading-snug">{ann.title}</h4>
                                                                <p className="text-[12px] text-slate-500 font-normal leading-relaxed mt-1.5">{ann.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Why Krishna Emitra trust section */}
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-ambient space-y-4 text-left">
                                                    <h3 className="text-[15px] font-extrabold text-slate-900 border-b border-slate-100 pb-3 font-display">Why Krishna Emitra?</h3>
                                                    <div className="space-y-5 text-[12px] leading-relaxed text-slate-500 font-normal">
                                                        <div className="flex gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</div>
                                                            <p><span className="font-extrabold text-slate-800 block">100% Secure Uploads:</span> All marksheets and passport documents are stored locally in the locker.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</div>
                                                            <p><span className="font-extrabold text-slate-800 block">Automatic Status Alerts:</span> Get real-time updates via Telegram broadcast or SMS.</p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">✓</div>
                                                            <p><span className="font-extrabold text-slate-800 block">WhatsApp File Intake:</span> Submit correction documents with one click.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CTA Block */}
                                            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-2xl p-8 md:p-12 text-center space-y-5 shadow-ambient border-none relative overflow-hidden">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_35%)]" />
                                                <h3 className="text-lg md:text-2xl font-extrabold tracking-tight relative z-10 font-display">Select your exams and never miss a deadline!</h3>
                                                <p className="text-[13px] text-slate-200 max-w-lg mx-auto font-normal leading-relaxed relative z-10">
                                                    Subscribe to SSC, Railways, State PCS, or NEET counselling updates to receive personalized inboxes and countdown alerts.
                                                </p>
                                                <div className="pt-2 relative z-10">
                                                    <button 
                                                        onClick={triggerSignIn}
                                                        className="px-6 py-3 bg-white hover:bg-slate-100 text-[var(--color-primary)] text-[12.5px] font-bold uppercase rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                                    >
                                                        Sign In &amp; Get Started
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // IF LOGGED IN: STUDENT DASHBOARD WORKSPACE
                                        <div className="space-y-8 text-left">
                                            {/* Welcome Header */}
                                            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-container)] to-[var(--color-primary)] text-white rounded-2xl p-6 md:p-8 shadow-ambient border-none overflow-hidden">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_40%)]" />
                                                <div className="space-y-1.5 relative z-10">
                                                    <span className="px-2.5 py-0.8 bg-white/20 border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider rounded-md inline-block">
                                                        Online Dashboard
                                                    </span>
                                                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1 font-display">
                                                        Namaste, {user?.name?.split(" ")[0]} 👋
                                                    </h1>
                                                    <p className="text-[12.5px] text-slate-200 leading-normal font-normal">Welcome back! Manage your exam notifications and filing submissions securely.</p>
                                                </div>

                                                <div className="flex gap-3 relative z-10 w-full md:w-auto">
                                                    <button onClick={() => setActiveTab("exams")} className="flex-1 md:flex-initial px-5 py-2.8 bg-white hover:bg-slate-50 text-[var(--color-primary)] text-[12.5px] font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-center">
                                                        Select Exams
                                                    </button>
                                                    <button onClick={() => setActiveTab("services")} className="flex-1 md:flex-initial px-5 py-2.8 bg-white/20 hover:bg-white/30 text-white text-[12.5px] font-bold rounded-xl transition-all cursor-pointer">
                                                        Request Services
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Bento Stats Widgets Grid */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3.5 text-left hover:border-[var(--color-primary)] hover:shadow-ambient transition-all duration-300 group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Requests</span>
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center group-hover:scale-105 transition-transform"><ClipboardList size={16} /></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-slate-900">{statsProgress.total}</p>
                                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Filing Forms Logged</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3.5 text-left hover:border-amber-400 hover:shadow-ambient transition-all duration-300 group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Under Review</span>
                                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-605 flex items-center justify-center group-hover:scale-105 transition-transform"><Clock size={16} /></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-slate-900">{statsProgress.active}</p>
                                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Operator Reviewing</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3.5 text-left hover:border-emerald-400 hover:shadow-ambient transition-all duration-300 group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Completed</span>
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform"><CheckCircle2 size={16} /></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-slate-900">{statsProgress.completed}</p>
                                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Successfully Filed</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 shadow-sm space-y-3.5 text-left hover:border-rose-450 hover:shadow-ambient transition-all duration-300 group">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Action Needed</span>
                                                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform"><AlertCircle size={16} /></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-black text-slate-900">{statsProgress.actionRequired}</p>
                                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Needs Attention</p>
                                                    </div>
                                                </div>
                                            </div>

                                                                                         {/* Quick Action Tiles */}
                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                 <button onClick={() => setActiveTab("exams")} className="bg-white border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] p-5 rounded-2xl text-left shadow-sm hover:shadow-ambient transition-all duration-300 space-y-3 cursor-pointer group hover:-translate-y-1">
                                                     <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition-transform"><Award size={18} /></div>
                                                     <div>
                                                         <p className="text-[13px] font-extrabold text-slate-900">Select Exams</p>
                                                         <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Choose Alerts</p>
                                                     </div>
                                                 </button>
                                                 <button onClick={() => setActiveTab("services")} className="bg-white border border-[var(--color-outline-variant)] hover:border-emerald-500 p-5 rounded-2xl text-left shadow-sm hover:shadow-ambient transition-all duration-300 space-y-3 cursor-pointer group hover:-translate-y-1">
                                                     <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardList size={18} /></div>
                                                     <div>
                                                         <p className="text-[13px] font-extrabold text-slate-900">My Services</p>
                                                         <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Filing Catalog</p>
                                                     </div>
                                                 </button>
                                                 <button onClick={() => setActiveTab("neet")} className="bg-white border border-[var(--color-outline-variant)] hover:border-purple-500 p-5 rounded-2xl text-left shadow-sm hover:shadow-ambient transition-all duration-300 space-y-3 cursor-pointer group hover:-translate-y-1">
                                                     <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={18} /></div>
                                                     <div>
                                                         <p className="text-[13px] font-extrabold text-slate-900">NEET Counselling</p>
                                                         <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Choice Guide</p>
                                                     </div>
                                                 </button>
                                                 <button onClick={() => setActiveTab("profile")} className="bg-white border border-[var(--color-outline-variant)] hover:border-rose-500 p-5 rounded-2xl text-left shadow-sm hover:shadow-ambient transition-all duration-300 space-y-3 cursor-pointer group hover:-translate-y-1">
                                                     <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Settings size={18} /></div>
                                                     <div>
                                                         <p className="text-[13px] font-extrabold text-slate-900">Profile Settings</p>
                                                         <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Edit Account</p>
                                                     </div>
                                                 </button>
                                             </div>

                                             {/* Subscribed Exams list */}
                                             <div className="space-y-4 text-left">
                                                 <h3 className="text-[14.5px] font-extrabold text-slate-900 font-display">My Subscribed Exams</h3>
                                                 {subscribedExams.length === 0 ? (
                                                     <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-8 text-center text-slate-400 max-w-md mx-auto space-y-3 shadow-ambient">
                                                         <Award size={24} className="mx-auto text-[var(--color-primary)] animate-bounce" />
                                                         <p className="text-[12.5px] font-bold text-slate-650">Select exams to start receiving updates</p>
                                                         <button onClick={() => setActiveTab("exams")} className="px-4.5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-[var(--color-primary)]/10 cursor-pointer">Choose Exams</button>
                                                     </div>
                                                 ) : (
                                                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                                         {exams.filter(ex => subscribedExams.includes(ex.name)).map((ex, exIdx) => {
                                                             const isClosed = ex.end_date ? new Date(ex.end_date) < new Date() : false
                                                             return (
                                                                 <div key={exIdx} className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 shadow-sm hover:shadow-ambient hover:border-[var(--color-primary)] transition-all space-y-4 relative flex flex-col justify-between group">
                                                                     <span className="absolute top-4 right-4 text-[8.5px] font-extrabold text-[var(--color-primary)] bg-[var(--color-surface-low)] px-2 py-0.5 rounded border border-[var(--color-outline-variant)]">
                                                                         {ex.category || "UG"}
                                                                     </span>
                                                                     <div className="space-y-2">
                                                                         <h4 className="text-[13.5px] font-extrabold text-slate-900 pr-12 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{ex.name}</h4>
                                                                         
                                                                         <div className="space-y-1">
                                                                             <span className="text-slate-450 font-extrabold uppercase text-[8.5px] tracking-wider block">Closing Date</span>
                                                                             <span className={`text-[12.5px] font-extrabold ${isClosed ? "text-red-500" : "text-slate-900"}`}>
                                                                                 {ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-IN") : "TBD"}
                                                                             </span>
                                                                         </div>
                                                                     </div>

                                                                     <button 
                                                                         onClick={() => {
                                                                             setActiveExamForTimeline(ex)
                                                                             setActiveTab("exams")
                                                                         }} 
                                                                         className="text-[var(--color-primary)] font-bold text-[11.5px] hover:text-[var(--color-primary-container)] inline-flex items-center gap-1 mt-1 cursor-pointer transition-colors"
                                                                     >
                                                                         View Timeline <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                                     </button>
                                                                 </div>
                                                             )
                                                         })}
                                                     </div>
                                                 )}
                                             </div>

                                             {/* Support and Location Summary Dashboard Footer */}
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                                 <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-[var(--color-primary)] transition-colors">
                                                     <div className="space-y-1">
                                                         <h4 className="text-[14px] font-extrabold text-slate-900 font-display">Direct Support Line</h4>
                                                         <p className="text-[12.5px] text-slate-400">Reach operator Kamlesh on WhatsApp instantly.</p>
                                                     </div>
                                                     <a 
                                                         href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%20Krishna%20Emitra!%20I%20have%20a%20support%20request.`}
                                                         target="_blank" rel="noreferrer"
                                                         className="px-5 py-2.8 bg-emerald-605 hover:bg-emerald-700 text-white text-[11.5px] font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                                                     >
                                                         WhatsApp <MessageSquare size={13} />
                                                     </a>
                                                 </div>

                                                 <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-[var(--color-primary)] transition-colors">
                                                     <div className="space-y-1">
                                                         <h4 className="text-[14px] font-extrabold text-slate-900 font-display">Digital Seva Center</h4>
                                                         <p className="text-[12.5px] text-slate-400">Main Market Road, Jodhpur, Rajasthan.</p>
                                                     </div>
                                                     <a 
                                                         href="https://maps.google.com"
                                                         target="_blank" rel="noreferrer"
                                                         className="px-5 py-2.8 bg-white hover:bg-[var(--color-surface-bright)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] text-[11.5px] font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                                                     >
                                                         View Map <MapPin size={13} className="text-[var(--color-primary)]" />
                                                     </a>
                                                 </div>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )}

                            {/* ── TAB 2: SERVICES SELECTION & CATALOG ── */}
                            {activeTab === "services" && (
                                <div className="space-y-8 animate-fadeIn text-left">
                                    <div className="border-b border-[var(--color-outline-variant)] pb-4">
                                        <h2 className="text-xl font-black text-slate-900 font-display">
                                            {lang === 'EN' ? 'Official e-Mitra Filing Services' : 'आधिकारिक ई-मित्र सेवाएँ'}
                                        </h2>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {lang === 'EN' ? 'Browse official government documents and request quick filing desk help.' : 'आधिकारिक सरकारी दस्तावेजों को ब्राउज़ करें और त्वरित सहायता के लिए अनुरोध दर्ज करें।'}
                                        </p>
                                    </div>

                                    {isLoggedIn && (
                                        <div className="flex gap-2 bg-[var(--color-surface-low)]/50 p-1 rounded-xl w-fit mb-6 border border-[var(--color-outline-variant)]">
                                            <button
                                                onClick={() => setServicesSubTab("catalog")}
                                                className={`py-2 px-5 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                                                    servicesSubTab === "catalog"
                                                        ? "bg-white text-[var(--color-primary)] font-bold shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                {lang === 'EN' ? 'Services Catalog' : 'सेवाएं सूची'}
                                            </button>
                                            <button
                                                onClick={() => setServicesSubTab("requests")}
                                                className={`py-2 px-5 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                                                    servicesSubTab === "requests"
                                                        ? "bg-white text-[var(--color-primary)] font-bold shadow-sm"
                                                        : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                {lang === 'EN' ? 'My Filings' : 'मेरे आवेदन'}
                                            </button>
                                        </div>
                                    )}

                                    {(!isLoggedIn || servicesSubTab === "catalog") ? (
                                        <div className="space-y-6">
                                            {/* Catalog Filters */}
                                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                                <div className="relative w-full sm:w-72">
                                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        value={serviceSearch}
                                                        onChange={e => setServiceSearch(e.target.value)}
                                                        placeholder={lang === 'EN' ? 'Search services...' : 'सेवाएं खोजें...'}
                                                        className="w-full pl-10 pr-4 py-2.8 bg-white border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] rounded-xl text-[12px] outline-none shadow-sm transition-all font-semibold text-slate-800"
                                                    />
                                                </div>

                                                <select
                                                    value={serviceCatFilter}
                                                    onChange={e => setServiceCatFilter(e.target.value)}
                                                    className="px-4 py-2.8 bg-white border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] rounded-xl text-[12px] outline-none font-bold text-slate-650 shadow-sm cursor-pointer"
                                                >
                                                    <option value="ALL">{lang === 'EN' ? 'All Categories' : 'सभी श्रेणियां'}</option>
                                                    {Object.entries(services).map(([k, cat]) => (
                                                        <option key={k} value={k}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Grid */}
                                            {flatServicesList.length === 0 ? (
                                                <div className="bg-white/70 border border-[var(--color-outline-variant)] rounded-2xl p-16 text-center text-slate-400">
                                                    No service records matching selections.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {flatServicesList.map((svc, idx) => (
                                                        <div key={idx} className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-sm hover:shadow-ambient hover:border-[var(--color-primary)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 group">
                                                            <div className="space-y-3 text-left">
                                                                <div className="flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                                                                    <span>{svc.categoryLabel}</span>
                                                                    <span className="text-[var(--color-primary)] bg-[var(--color-surface-low)] px-2.5 py-0.8 rounded-lg border border-[var(--color-outline-variant)] font-extrabold">Fee: {svc.price || "₹50"}</span>
                                                                </div>
                                                                <h4 className="text-[14.5px] font-extrabold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors leading-snug">{svc.name}</h4>
                                                                <p className="text-[12px] text-slate-500 font-normal leading-relaxed">{svc.description || "Secure filing registration services with error validation."}</p>
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    if (!isLoggedIn) triggerSignIn()
                                                                    else {
                                                                        setActiveServiceForForm(svc)
                                                                        setFormSuccessId("")
                                                                        setFormDataDesc("")
                                                                    }
                                                                }}
                                                                className="mt-6 w-full py-2.8 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12px] font-bold rounded-xl transition-all text-center cursor-pointer shadow-ambient hover:shadow-lg"
                                                            >
                                                                {lang === 'EN' ? 'Request This Service' : 'इस सेवा का अनुरोध करें'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* History table */
                                        <div className="space-y-6">
                                            {history.length === 0 ? (
                                                <div className="bg-white/70 border border-[var(--color-outline-variant)] rounded-2xl p-16 text-center text-slate-400 font-medium">
                                                    No submitted requests found.
                                                </div>
                                            ) : (
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl overflow-hidden shadow-ambient">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-[12.5px] border-collapse text-left">
                                                            <thead>
                                                                <tr className="bg-[var(--color-surface-low)]/40 border-b border-[var(--color-outline-variant)] text-slate-500 font-extrabold tracking-wider text-[9.5px] uppercase">
                                                                    <th className="py-4 px-5">ID</th>
                                                                    <th className="py-4 px-4">Service Details</th>
                                                                    <th className="py-4 px-4">Filing Date</th>
                                                                    <th className="py-4 px-4">Status</th>
                                                                    <th className="py-4 px-4 text-right pr-6">Remarks / Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {history.map((app) => {
                                                                    const isExpanded = expandedAppId === app.id
                                                                    const statDetails = getStatusDetails(app.status, !!app.remarks)
                                                                    return (
                                                                        <Fragment key={app.id}>
                                                                            <tr 
                                                                                onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                                                                                className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer ${isExpanded ? "bg-slate-50/30" : ""}`}
                                                                            >
                                                                                <td className="py-5 px-5 font-bold text-slate-805 font-mono text-[12px]">{app.id}</td>
                                                                                <td className="py-5 px-4 text-left">
                                                                                    <span className="font-extrabold text-slate-900 block text-[13.5px]">{app.service_name}</span>
                                                                                    <span className="inline-block text-[8px] font-extrabold text-[var(--color-primary)] bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] px-2 py-0.5 rounded uppercase mt-1 tracking-wider">{app.category}</span>
                                                                                </td>
                                                                                <td className="py-5 px-4 font-semibold text-slate-400">{new Date(app.requested_at).toLocaleDateString("en-IN")}</td>
                                                                                <td className="py-5 px-4">
                                                                                    <span className={`text-[8.5px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${statDetails.colorClass}`}>
                                                                                        {lang === 'EN' ? statDetails.label : statDetails.labelHi}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-5 px-4 text-right text-slate-500 font-semibold truncate max-w-xs pr-6">
                                                                                    {app.remarks ? (
                                                                                        <span className="inline-flex items-center gap-1 text-amber-600 text-[11px] font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                                                                                            <AlertCircle size={12} className="animate-pulse" /> Action Required
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-slate-400 text-[11px] font-semibold">{lang === 'EN' ? 'Click to expand' : 'विस्तार करें'}</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>

                                                                            {isExpanded && (
                                                                                <tr className="bg-slate-50/50">
                                                                                    <td colSpan={5} className="p-6 space-y-4">
                                                                                        <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 shadow-sm max-w-xl text-left">
                                                                                            <p className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Filing Process Timeline</p>
                                                                                            <div className="relative flex justify-between items-center w-full py-1 px-4">
                                                                                                <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2 z-0" />
                                                                                                <div className="absolute left-0 h-0.5 bg-[var(--color-primary)] top-1/2 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(statDetails.stepIndex / 3) * 100}%` }} />
                                                                                                {["Submitted", "Review", "Processing", "Done"].map((step, sIdx) => {
                                                                                                    const isActive = statDetails.stepIndex >= sIdx
                                                                                                    return (
                                                                                                        <div key={sIdx} className="relative z-10 flex flex-col items-center">
                                                                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${isActive ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "bg-white border-slate-200 text-slate-300"}`}>
                                                                                                                {isActive && <Check size={8} strokeWidth={3} />}
                                                                                                            </div>
                                                                                                            <span className={`text-[9.5px] font-bold mt-1.5 ${isActive ? "text-[var(--color-primary)] font-extrabold" : "text-slate-400"}`}>{step}</span>
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        </div>

                                                                                        {app.remarks && (
                                                                                            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-250 flex items-start gap-2.5 max-w-xl shadow-sm text-left">
                                                                                                <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                                                                                <div className="space-y-1.5">
                                                                                                    <p className="text-[9.5px] font-extrabold text-amber-805 uppercase tracking-widest">Operator Action Remark</p>
                                                                                                    <p className="text-[12.5px] text-amber-900 leading-normal font-semibold mt-0.5">{app.remarks}</p>
                                                                                                    <div className="pt-2">
                                                                                                        <a 
                                                                                                            href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%2C%20regarding%20my%20request%20${app.id}%20which%2520requires%20attention.`} 
                                                                                                            target="_blank" rel="noopener noreferrer"
                                                                                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                                                                                        >
                                                                                                            Chat Support on WhatsApp <MessageSquare size={12} />
                                                                                                        </a>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </Fragment>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 3: EXAMS SELECTION & DETAILS ── */}
                            {activeTab === "exams" && (
                                <div className="space-y-8 animate-fadeIn text-left">
                                    
                                    {/* IF ACTIVE TIMELINE SELECTION LOADED */}
                                    {activeExamForTimeline ? (
                                        <div className="space-y-8">
                                            {/* Details Header */}
                                            <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-ambient flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => setActiveExamForTimeline(null)} 
                                                            className="text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-bright)] px-3 py-1 rounded-lg text-[12px] font-bold cursor-pointer transition-colors"
                                                        >
                                                            ← Go Back
                                                        </button>
                                                        <span className="text-[9.5px] font-extrabold text-[var(--color-primary)] bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] px-2 py-0.5 rounded tracking-wide uppercase">
                                                            {activeExamForTimeline.category || "UG"}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-lg font-extrabold text-slate-900 pr-12 line-clamp-1">{activeExamForTimeline.name}</h2>
                                                    <p className="text-[12.5px] text-slate-500 font-normal leading-relaxed">{activeExamForTimeline.description || "Official government recruitment listing."}</p>
                                                </div>

                                                <button
                                                    onClick={() => handleToggleExamSubscription(activeExamForTimeline.name)}
                                                    className={`px-5 py-2.8 text-[12px] font-bold rounded-xl transition-all border cursor-pointer ${
                                                        subscribedExams.includes(activeExamForTimeline.name)
                                                            ? "bg-[var(--color-surface-low)] hover:bg-[var(--color-surface-bright)] text-[var(--color-primary)] border-[var(--color-outline-variant)]"
                                                            : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white shadow-ambient border-none"
                                                    }`}
                                                >
                                                    {subscribedExams.includes(activeExamForTimeline.name) ? "Unsubscribe Alerts" : "Subscribe Alerts"}
                                                </button>
                                            </div>

                                            {/* Visual Timeline */}
                                            <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-8 shadow-ambient space-y-6">
                                                <h3 className="text-[14px] font-extrabold text-slate-900 border-b border-slate-100 pb-3 font-display">Visual Examination Timeline</h3>
                                                
                                                <div className="relative flex justify-between items-center max-w-3xl mx-auto py-6 px-4">
                                                    <div className="absolute left-0 right-0 h-0.5 bg-slate-105 top-1/2 -translate-y-1/2 z-0" />
                                                    
                                                    {[
                                                        { label: "Registration Start", date: activeExamForTimeline.start_date },
                                                        { label: "Registration Deadline", date: activeExamForTimeline.end_date },
                                                        { label: "Exam Date", date: activeExamForTimeline.exam_date }
                                                    ].map((item, idx) => {
                                                        const isUpcoming = item.date ? new Date(item.date) >= new Date() : true
                                                        return (
                                                            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 font-bold text-[11px] transition-colors ${
                                                                    isUpcoming 
                                                                        ? "bg-white border-slate-200 text-slate-400" 
                                                                        : "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-ambient"
                                                                }`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <span className={`text-[10px] font-extrabold ${isUpcoming ? "text-slate-400" : "text-slate-800"}`}>{item.label}</span>
                                                                <span className="text-[11px] font-bold text-slate-505 bg-[var(--color-surface-low)]/50 border border-[var(--color-outline-variant)] px-2 py-0.5 rounded">{item.date ? new Date(item.date).toLocaleDateString("en-IN") : "TBD"}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Action Blocks */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-[var(--color-primary)] transition-all">
                                                    <div className="space-y-1 text-left">
                                                        <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">Official Website</h4>
                                                        <p className="text-[11.5px] text-slate-400">View official board notice.</p>
                                                    </div>
                                                    <a 
                                                        href={activeExamForTimeline.official_url} target="_blank" rel="noopener noreferrer"
                                                        className="px-4 py-2.2 bg-white hover:bg-slate-50 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] text-[11px] font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                                                    >
                                                        Official Link <ExternalLink size={12} />
                                                    </a>
                                                </div>

                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-[var(--color-primary)] transition-all">
                                                    <div className="space-y-1 text-left">
                                                        <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">Filing Assistant</h4>
                                                        <p className="text-[11.5px] text-slate-400">Apply form via bureau desk.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (!isLoggedIn) triggerSignIn()
                                                            else {
                                                                setWizardExamName(activeExamForTimeline.name)
                                                                setIsWizardOpen(true)
                                                            }
                                                        }}
                                                        className="px-4 py-2.2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[11px] font-bold rounded-xl shadow-ambient transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                                                    >
                                                        Apply Now <Sparkles size={12} className="text-white animate-pulse" />
                                                    </button>
                                                </div>

                                                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-[var(--color-primary)] transition-all">
                                                    <div className="space-y-1 text-left">
                                                        <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">Ask Operator</h4>
                                                        <p className="text-[11.5px] text-slate-400">Ask support on WhatsApp.</p>
                                                    </div>
                                                    <a 
                                                        href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(`Hi Support! I have a question regarding the ${activeExamForTimeline.name} exam.`)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="px-4 py-2.2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                                                    >
                                                        WhatsApp <MessageSquare size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // EXAMS SELECTION LIST
                                        <div className="space-y-6">
                                            {/* List Header */}
                                            <div className="border-b border-[var(--color-outline-variant)] pb-4 space-y-3">
                                                <div>
                                                    <h2 className="text-lg font-extrabold text-slate-900 font-display">Select Exam Circular Preferences</h2>
                                                    <p className="text-[11.5px] text-slate-400 mt-0.5">Subscribe to target notifications and countdown trackers.</p>
                                                </div>

                                                {/* Search & Category Filter chips */}
                                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-2">
                                                    {/* Search bar */}
                                                    <div className="relative w-full sm:w-72">
                                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input 
                                                            type="text"
                                                            value={examSearch}
                                                            onChange={e => setExamSearch(e.target.value)}
                                                            placeholder="Search exam name..."
                                                            className="w-full pl-8 pr-4 py-2.8 bg-white border border-[var(--color-outline-variant)] focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] rounded-xl text-[12px] outline-none shadow-sm transition-all font-semibold"
                                                        />
                                                    </div>

                                                    {/* Filter Chips */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {["ALL", "SSC", "Railway", "Banking", "State PCS", "Defence", "Others"].map((chip) => (
                                                            <button
                                                                key={chip}
                                                                onClick={() => setExamCategoryFilter(chip)}
                                                                className={`px-4 py-2 rounded-xl text-[11.5px] font-bold border transition-all cursor-pointer ${
                                                                    examCategoryFilter === chip 
                                                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-ambient" 
                                                                        : "bg-white text-[var(--color-on-surface)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-low)]"
                                                                }`}
                                                            >
                                                                {chip}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Exams Grid */}
                                            {filteredExamsList.length === 0 ? (
                                                <div className="bg-white/70 border border-[var(--color-outline-variant)] rounded-2xl p-16 text-center text-slate-450">
                                                    No exams found matching preferences.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                                    {filteredExamsList.map((ex) => {
                                                        const isSubbed = subscribedExams.includes(ex.name)
                                                        return (
                                                            <div key={ex.id} className="bg-white border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] rounded-2xl p-5.5 shadow-sm hover:shadow-ambient transition-all duration-300 relative flex flex-col justify-between group hover:-translate-y-0.5">
                                                                <div className="space-y-3.5 text-left">
                                                                  <div className="flex items-center justify-between">
                                                                    <span className="text-[8.5px] font-extrabold text-[var(--color-primary)] bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] px-2 py-0.8 rounded uppercase tracking-wider">
                                                                        {ex.category || "UG"}
                                                                    </span>
                                                                    
                                                                    <label className="flex items-center gap-1.5 cursor-pointer" title={isSubbed ? "Subscribed Alert" : "Click to subscribe alert"}>
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isSubbed}
                                                                            onChange={() => handleToggleExamSubscription(ex.name)}
                                                                            className="rounded-lg border-slate-350 text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4.5 h-4.5 cursor-pointer"
                                                                        />
                                                                    </label>
                                                                  </div>
                                                                  <h3 
                                                                      onClick={() => setActiveExamForTimeline(ex)}
                                                                      className="text-[14px] font-extrabold text-slate-900 group-hover:text-[var(--color-primary)] cursor-pointer line-clamp-1 transition-colors"
                                                                  >
                                                                      {ex.name}
                                                                  </h3>
                                                                  <p className="text-[12px] text-slate-500 font-normal line-clamp-2 leading-relaxed">
                                                                      {ex.description || "Apply for recruitment programs with verified credentials."}
                                                                  </p>
                                                                </div>

                                                                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                                                                    <div>
                                                                        <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">End Date</span>
                                                                        <span className="text-[11.5px] font-extrabold text-slate-700">{ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-IN") : "TBD"}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setActiveExamForTimeline(ex)}
                                                                        className="text-[var(--color-primary)] text-[11.5px] font-bold hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
                                                                    >
                                                                        Details &amp; Timeline →
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                            {/* Sticky saveSelections bottom banner */}
                                            {isLoggedIn && (
                                                <div className="sticky bottom-6 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-2xl p-5 flex items-center justify-between shadow-ambient border-none z-20 animate-slideUp">
                                                    <span className="text-[12.5px] font-bold text-white">
                                                        💼 <span className="text-white font-extrabold">{subscribedExams.length}</span> Exam Preferences Active
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            handleSaveExamSubscriptions(subscribedExams)
                                                            alert("Subscriptions updated successfully!")
                                                        }}
                                                        className="px-5 py-2.8 bg-white hover:bg-slate-50 text-[var(--color-primary)] text-[12px] font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-black/10"
                                                    >
                                                        Save Selections
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 4: NEET CHOICE-FILLING COUNSELLING ── */}
                            {activeTab === "neet" && (
                                <div className="space-y-8 animate-fadeIn text-left">
                                    <div className="border-b border-[var(--color-outline-variant)] pb-4">
                                        <h2 className="text-xl font-black text-slate-900">
                                            {lang === 'EN' ? 'NEET UG Counselling Assistance' : 'नीट यूजी काउंसलिंग सहायता'}
                                        </h2>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {lang === 'EN' ? 'Enter your details to request custom choice-filling templates and professional guidance.' : 'कस्टम चॉइस-फिलिंग टेम्पलेट और पेशेवर मार्गदर्शन के लिए अपने विवरण दर्ज करें।'}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[var(--color-outline-variant)] rounded-3xl shadow-ambient p-6 md:p-8 max-w-xl mx-auto space-y-6">
                                        {neetFormSubmitted ? (
                                            <div className="text-center py-6 space-y-5">
                                                <div className="w-16 h-16 bg-emerald-50 text-emerald-505 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/5">
                                                    <CheckCircle2 size={36} />
                                                </div>
                                                <h3 className="text-lg font-extrabold text-slate-900">Counselling Request Submitted!</h3>
                                                <p className="text-[13px] text-slate-505 leading-relaxed font-normal">
                                                    Your NEET Counselling guidance request has been registered. You are being redirected to chat with Krishna Emitra on WhatsApp to receive choice templates.
                                                </p>
                                                <button
                                                    onClick={() => setNeetFormSubmitted(false)}
                                                    className="px-5 py-2.8 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12px] font-bold rounded-xl transition-all cursor-pointer shadow-ambient hover:shadow-lg border-none"
                                                >
                                                    Submit Another Response
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleNeetCounsellingSubmit} className="space-y-5">
                                                <div>
                                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">NEET All India Rank (AIR) *</label>
                                                    <input 
                                                        type="number"
                                                        value={neetRank}
                                                        onChange={e => setNeetRank(e.target.value)}
                                                        placeholder="e.g. 15430"
                                                        className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm placeholder:text-slate-350"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Counselling Category *</label>
                                                        <select
                                                            value={neetCategory}
                                                            onChange={e => setNeetCategory(e.target.value)}
                                                            className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <option value="GEN">General (UR)</option>
                                                            <option value="OBC">OBC-NCL</option>
                                                            <option value="EWS">EWS</option>
                                                            <option value="SC">SC</option>
                                                            <option value="ST">ST</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">WhatsApp Phone Number *</label>
                                                        <input 
                                                            type="tel"
                                                            value={neetPhone}
                                                            onChange={e => setNeetPhone(e.target.value)}
                                                            placeholder="10-digit number"
                                                            className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm placeholder:text-slate-350"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-ambient hover:shadow-lg cursor-pointer active:scale-98 hover:-translate-y-0.5 duration-200 border-none"
                                                >
                                                    Get Counselling Guidance
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 5: PROFILE & NOTIFICATIONS SETTINGS ── */}
                            {activeTab === "profile" && isLoggedIn && (
                                <div className="space-y-8 animate-fadeIn text-left">
                                    <div className="border-b border-[var(--color-outline-variant)] pb-4">
                                        <h2 className="text-xl font-black text-slate-900">
                                            {lang === 'EN' ? 'Profile & Subscription Settings' : 'प्रोफ़ाइल एवं सदस्यता सेटिंग्स'}
                                        </h2>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {lang === 'EN' ? 'Configure messaging channels and maintain contact parameters.' : 'संदेश भेजने वाले चैनलों को कॉन्फ़िगर करें और संपर्क मापदंडों को बनाए रखें।'}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[var(--color-outline-variant)] rounded-3xl shadow-ambient p-6 md:p-8 max-w-xl mx-auto space-y-6">
                                        {profileSavedMessage && (
                                            <div className="p-3.5 bg-emerald-50 text-emerald-755 border border-emerald-100 rounded-xl text-[12px] font-semibold">
                                                {profileSavedMessage}
                                            </div>
                                        )}

                                        <form onSubmit={handleSaveProfile} className="space-y-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Display Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={editableProfile.name}
                                                        onChange={e => setEditableProfile({...editableProfile, name: e.target.value})}
                                                        className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Phone Number</label>
                                                        <input 
                                                            type="text" 
                                                            value={editableProfile.phone}
                                                            disabled
                                                            className="w-full p-3.5 bg-slate-105 border border-[var(--color-outline-variant)] text-slate-400 rounded-xl text-[13px] font-semibold cursor-not-allowed outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Email (Optional)</label>
                                                        <input 
                                                            type="email" 
                                                            value={editableProfile.email}
                                                            onChange={e => setEditableProfile({...editableProfile, email: e.target.value})}
                                                            className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100 pt-5 space-y-4">
                                                <h3 className="text-[11.5px] font-extrabold text-slate-900 uppercase tracking-wider">Alert Notifications Configuration</h3>
                                                <div className="space-y-4">
                                                    <label className="flex items-center justify-between cursor-pointer group">
                                                        <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receive alerts via WhatsApp</span>
                                                        <input 
                                                            type="checkbox"
                                                            checked={notificationPrefs.whatsapp}
                                                            onChange={e => setNotificationPrefs({...notificationPrefs, whatsapp: e.target.checked})}
                                                            className="rounded-lg text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-5.5 h-5.5 cursor-pointer border-slate-300"
                                                        />
                                                    </label>
                                                    <label className="flex items-center justify-between cursor-pointer group">
                                                        <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receive alerts via Telegram Bot</span>
                                                        <input 
                                                            type="checkbox"
                                                            checked={notificationPrefs.telegram}
                                                            onChange={e => setNotificationPrefs({...notificationPrefs, telegram: e.target.checked})}
                                                            className="rounded-lg text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-5.5 h-5.5 cursor-pointer border-slate-300"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <button 
                                                type="submit"
                                                className="px-5 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-bold uppercase rounded-xl w-full transition-all hover:shadow-lg cursor-pointer hover:-translate-y-0.5 duration-200 active:scale-98 border-none"
                                            >
                                                Save Settings
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 6: HELP DESK / SUPPORT CALLS ── */}
                            {activeTab === "help" && (
                                <div className="space-y-8 animate-fadeIn text-left">
                                    <div className="border-b border-[var(--color-outline-variant)] pb-4">
                                        <h2 className="text-xl font-black text-slate-900">
                                            {lang === 'EN' ? 'Support Desk & Callback Support' : 'सहायता डेस्क और कॉलबैक सहायता'}
                                        </h2>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {lang === 'EN' ? 'Submit your support query or direct request for verification.' : 'सत्यापन के लिए अपना समर्थन प्रश्न या सीधा अनुरोध सबमिट करें।'}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[var(--color-outline-variant)] rounded-3xl shadow-ambient p-6 md:p-8 max-w-xl mx-auto space-y-6">
                                        {cbSubmitted ? (
                                            <div className="text-center py-6 space-y-5">
                                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/5">
                                                    <CheckCircle2 size={36} />
                                                </div>
                                                <h3 className="text-lg font-extrabold text-slate-900">Support Query Received!</h3>
                                                <p className="text-[13px] text-slate-500 leading-relaxed font-normal">
                                                    Your callback request has been logged successfully. Our operator will call you back shortly.
                                                </p>
                                                <button
                                                    onClick={() => setCbSubmitted(false)}
                                                    className="px-5 py-2.8 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12px] font-bold rounded-xl transition-all cursor-pointer shadow-ambient border-none"
                                                >
                                                    Submit Another Query
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleCallbackQuerySubmit} className="space-y-5">
                                                <div>
                                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Your Full Name *</label>
                                                    <input 
                                                        type="text"
                                                        value={cbName}
                                                        onChange={e => setCbName(e.target.value)}
                                                        placeholder="e.g. Rahul Sharma"
                                                        className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm placeholder:text-slate-355"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Mobile Phone Number *</label>
                                                    <input 
                                                        type="tel"
                                                        value={cbPhone}
                                                        onChange={e => setCbPhone(e.target.value)}
                                                        placeholder="10-digit number"
                                                        className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm placeholder:text-slate-355"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">What can we help you with? *</label>
                                                    <textarea 
                                                        rows={4}
                                                        value={cbQuery}
                                                        onChange={e => setCbQuery(e.target.value)}
                                                        placeholder="Ask about marksheet uploads, fee payments, document correction, etc."
                                                        className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none resize-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm placeholder:text-slate-355"
                                                        required
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-ambient cursor-pointer border-none hover:shadow-lg hover:-translate-y-0.5 duration-200 active:scale-98"
                                                >
                                                    Submit Callback Request
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 7: ABOUT US ── */}
                            {activeTab === "about" && (
                                <div className="space-y-8 animate-fadeIn text-left">
                                    <div className="border-b border-[var(--color-outline-variant)] pb-4">
                                        <h2 className="text-xl font-black text-slate-900">
                                            {lang === 'EN' ? 'About Krishna Emitra Digital Seva' : 'कृष्णा ई-मित्र डिजिटल सेवा के बारे में'}
                                        </h2>
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            {lang === 'EN' ? 'Rajasthan students unified desk support.' : 'राजस्थान के छात्रों के लिए एकीकृत डिजिटल सहायता डेस्क।'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-sm hover:border-[var(--color-primary)] hover:shadow-ambient transition-all duration-300 space-y-4 text-left">
                                            <h4 className="text-[13.5px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider font-display">Center Location</h4>
                                            <p className="text-[12.5px] text-slate-655 font-semibold leading-relaxed">
                                                Shop No. 12, Main Market Road,<br />Jodhpur, Rajasthan - 342001
                                            </p>
                                            <div className="pt-2">
                                                <a 
                                                    href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                                                    className="px-4 py-2.2 bg-white hover:bg-slate-50 text-[var(--color-on-surface)] text-[11px] font-bold rounded-xl border border-[var(--color-outline-variant)] shadow-sm inline-flex items-center gap-1.5 transition-colors"
                                                >
                                                    Get Directions <MapPin size={12} className="text-[var(--color-primary)]" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-sm hover:border-[var(--color-primary)] hover:shadow-ambient transition-all duration-300 space-y-4 text-left">
                                            <h4 className="text-[13.5px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider font-display">Working Hours</h4>
                                            <p className="text-[12.5px] text-slate-655 font-semibold leading-relaxed">
                                                Monday to Saturday: 9:00 AM - 8:00 PM<br />
                                                Sunday: Closed for system maintenance
                                            </p>
                                            <span className="text-[9.5px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase font-extrabold inline-block">Open Now</span>
                                        </div>

                                        <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-sm hover:border-[var(--color-primary)] hover:shadow-ambient transition-all duration-300 space-y-4 text-left">
                                            <h4 className="text-[13.5px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider font-display">Direct WhatsApp Desk</h4>
                                            <p className="text-[12.5px] text-slate-655 font-semibold leading-relaxed">
                                                Need quick manual support? Directly message our desk to verify fees or document uploads.
                                            </p>
                                            <div className="pt-2">
                                                <a 
                                                    href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%20Krishna%20Emitra!%20I%20need%20assistance.`} 
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-colors"
                                                >
                                                    Chat on WhatsApp <MessageSquare size={13} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </main>

                        {/* Mobile / Tablet Notifications (only visible below xl) */}
                        {!loading && (
                            <div className="xl:hidden mt-4 px-6 md:px-10 pb-8">
                                {renderNotificationsPanel(false)}
                            </div>
                        )}

                        {/* Footer */}
                        <footer className="border-t border-[var(--color-outline-variant)] py-8 bg-white/50 backdrop-blur-sm mt-auto">
                            <div className="max-w-[1140px] w-full mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-slate-400 font-bold tracking-tight">
                                <p>© {new Date().getFullYear()} Krishna Emitra Digital Seva. All rights reserved.</p>
                                <div className="flex gap-4">
                                    <span>support@krishnaemitra.com</span>
                                    <span>•</span>
                                    <span>Jodhpur, Rajasthan</span>
                                </div>
                            </div>
                        </footer>
                    </div>

                    {/* ── RIGHT PREMIUM NOTIFICATION PANEL ── */}
                    {!loading && (
                        <aside className="hidden xl:flex w-[340px] border-l border-[var(--color-outline-variant)] h-[calc(100vh-80px)] shrink-0 p-6 flex-col overflow-y-auto bg-[var(--color-surface-base)] relative">
                            {renderNotificationsPanel(true)}
                        </aside>
                    )}
                </div>
            </div>

            {/* ── EXAM WIZARD MODAL ── */}
            <ExamFormWizard 
                isOpen={isWizardOpen} 
                onClose={() => {
                    setIsWizardOpen(false)
                    fetchAllData(true)
                }} 
                examName={wizardExamName} 
                config={config} 
            />

            {/* ── SERVICE REQUEST SUBMISSION MODAL ── */}
            {activeServiceForForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-[var(--color-outline-variant)] max-w-md w-full shadow-ambient p-6 space-y-5"
                    >
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-[14.5px] font-extrabold text-slate-900 text-left font-display">Filing Request: {activeServiceForForm.name}</h3>
                                <p className="text-[10px] text-[var(--color-primary)] font-extrabold bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] px-2 py-0.5 rounded inline-block mt-1 tracking-wider text-left">{activeServiceForForm.categoryLabel}</p>
                            </div>
                            <button onClick={() => setActiveServiceForForm(null)} className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] rounded-lg cursor-pointer transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {formSuccessId ? (
                            <div className="p-6 text-center space-y-5">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-505 flex items-center justify-center rounded-full mx-auto border border-emerald-150 shadow-sm shadow-emerald-500/5">
                                    <CheckCircle2 size={30} />
                                </div>
                                <h4 className="text-[15px] font-extrabold text-emerald-955">Request Submitted Successfully</h4>
                                <p className="text-[12.5px] text-emerald-805 leading-relaxed font-semibold">
                                    Your request has been logged with ID <span className="font-bold font-mono text-emerald-955 bg-white px-2 py-0.5 rounded border border-emerald-150 shadow-sm">{formSuccessId}</span>. Track it inside the **Filing History** section.
                                </p>
                                <button 
                                    onClick={() => setActiveServiceForForm(null)}
                                    className="px-5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-extrabold rounded-xl w-full cursor-pointer transition-colors shadow-ambient border-none"
                                >
                                    Close Window
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleServiceFormSubmit} className="space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block mb-1">Name</label>
                                        <input type="text" value={user?.name} disabled className="w-full p-2.8 bg-slate-100 border border-[var(--color-outline-variant)] text-slate-400 rounded-lg text-[12px] font-semibold cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block mb-1">Mobile</label>
                                        <input type="text" value={user?.phone} disabled className="w-full p-2.8 bg-slate-100 border border-[var(--color-outline-variant)] text-slate-400 rounded-lg text-[12px] font-semibold cursor-not-allowed" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block mb-1">Additional details (Marks, Category, etc.)</label>
                                    <textarea 
                                        rows={3}
                                        value={formDataDesc}
                                        onChange={e => setFormDataDesc(e.target.value)}
                                        placeholder="Add roll numbers, target dates, or category specifics..."
                                        className="w-full p-3.5 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[12px] font-semibold outline-none resize-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9.5px] font-extrabold uppercase text-slate-400 block">Supporting Document Upload</label>
                                    <div className="border border-dashed border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] rounded-xl p-4 text-center cursor-pointer transition-all relative group bg-slate-50 hover:bg-white">
                                        <input 
                                            type="file" 
                                            onChange={e => {
                                                if (e.target.files?.[0]) {
                                                    setFormFile(e.target.files[0])
                                                    setFormFileName(e.target.files[0].name)
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <FileText size={20} className="mx-auto text-[var(--color-primary)] mb-1.5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[11px] text-slate-400 font-bold block">
                                            {formFileName ? `Selected: ${formFileName}` : "Click to select Aadhaar, photo or marksheet PDF"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="submit"
                                        disabled={formSubmitting}
                                        className="px-5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-extrabold rounded-xl w-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-ambient hover:shadow-lg border-none active:scale-98"
                                    >
                                        {formSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                                        Submit Filing Request
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}

        </div>
    )
}
