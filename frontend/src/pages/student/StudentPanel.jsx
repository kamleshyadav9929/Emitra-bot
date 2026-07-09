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
import DashboardTab from "../../components/student/DashboardTab"
import ServicesTab from "../../components/student/ServicesTab"
import ExamsTab from "../../components/student/ExamsTab"
import NeetCounsellingTab from "../../components/student/NeetCounsellingTab"
import ProfileTab from "../../components/student/ProfileTab"
import HelpDeskTab from "../../components/student/HelpDeskTab"
import AboutUsTab from "../../components/student/AboutUsTab"
import PublicOverview from "../../components/student/PublicOverview"
import Logo from "../../components/common/Logo"

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
    const [broadcasts, setBroadcasts] = useState([])
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
    const [customPhone, setCustomPhone] = useState("")

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
            const [servicesRes, examsRes, announcementsRes, configRes, newsRes] = await Promise.all([
                api.getPublicServices().catch(() => ({ services: {} })),
                api.getPublicExams().catch(() => ({ exams: [] })),
                api.getPublicAnnouncements().catch(() => ({ announcements: [] })),
                api.getPublicConfig().catch(() => ({})),
                api.getPublicNews().catch(() => ({ news: [] }))
            ])

            setServices(servicesRes.services || {})
            setExams(examsRes.exams || [])
            setAnnouncements(announcementsRes.announcements || [])
            setConfig(configRes || {})
            setBroadcasts(newsRes.news || [])

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
            setServiceCatFilter(catParam.toUpperCase())
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

    // Compute filtered subscribed notifications from both general announcements and news broadcasts
    const subNotifications = useMemo(() => {
        const combined = [
            ...announcements.map(ann => ({
                ...ann,
                type: "announcement"
            })),
            ...broadcasts.map(b => ({
                id: `BC-${b.id}`,
                title: `Official Update: ${b.exam}`,
                content: b.message,
                created_at: b.sent_at,
                links: null,
                exam: b.exam,
                type: "broadcast"
            }))
        ]

        if (subscribedExams.length === 0) return []

        return combined.filter(ann => {
            if (ann.type === "broadcast") {
                return ann.exam === "ALL" || subscribedExams.some(e => e.toLowerCase() === ann.exam.toLowerCase())
            } else {
                return subscribedExams.some(exam => {
                    const titleMatch = ann.title?.toLowerCase().includes(exam.toLowerCase())
                    const contentMatch = ann.content?.toLowerCase().includes(exam.toLowerCase())
                    return titleMatch || contentMatch
                })
            }
        }).sort((a, b) => new Date(b.created_at || b.sent_at) - new Date(a.created_at || a.sent_at))
    }, [announcements, broadcasts, subscribedExams])

    const unreadCount = useMemo(() => {
        return subNotifications.filter(n => !readNotifications.includes(n.id)).length
    }, [subNotifications, readNotifications])

    // Mark all notifications read
    const handleMarkAllNotificationsRead = () => {
        const allIds = subNotifications.map(ann => ann.id)
        setReadNotifications(allIds)
        localStorage.setItem(`${storagePrefix}_readNotifications`, JSON.stringify(allIds))
    }

    // Render notifications panel for 3-column split layout
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

    const renderNotificationsPanel = (isSticky = true) => {
        // Group notifications by date
        const grouped = [];
        const groups = {};
        
        subNotifications.forEach(ann => {
            const dateObj = new Date(ann.created_at || ann.sent_at || Date.now());
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let dateStr = "";
            if (dateObj.toDateString() === today.toDateString()) {
                dateStr = lang === 'EN' ? 'Today' : 'आज';
            } else if (dateObj.toDateString() === yesterday.toDateString()) {
                dateStr = lang === 'EN' ? 'Yesterday' : 'कल';
            } else {
                dateStr = dateObj.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
            }
            
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(ann);
        });

        return (
            <div className={`flex flex-col space-y-4 h-full ${isSticky ? "" : "bg-white border border-[var(--color-outline-variant)] rounded-3xl p-6 shadow-ambient"}`}>
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
                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin p-3 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex flex-col space-y-4">
                        {Object.entries(groups).map(([dateStr, items]) => (
                            <div key={dateStr} className="space-y-4 flex flex-col">
                                {/* Centered Date Label */}
                                <div className="flex justify-center my-1.5">
                                    <span className="bg-slate-200/80 text-slate-600 text-[9.5px] font-extrabold px-3 py-0.5 rounded-full tracking-wide shadow-sm uppercase">
                                        {dateStr}
                                    </span>
                                </div>
                                
                                {/* Messages */}
                                {items.map((ann, idx) => {
                                    const isRead = readNotifications.includes(ann.id);
                                    const formattedTime = new Date(ann.created_at || ann.sent_at || Date.now()).toLocaleTimeString("en-IN", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true
                                    });

                                    return (
                                        <div 
                                            key={ann.id || idx} 
                                            onClick={() => handleMarkNotificationRead(ann.id)}
                                            className={`relative w-full rounded-2xl p-4 shadow-sm transition-all border border-solid group text-left cursor-pointer flex flex-col ${
                                                isRead
                                                    ? "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:shadow-md"
                                                    : "bg-[#e3f2fd] border-blue-200 text-slate-900 hover:border-blue-300 hover:shadow-md ring-1 ring-blue-100/50"
                                            }`}
                                        >
                                            {/* Message title */}
                                            {ann.title && (
                                                <h4 className="text-[13px] font-bold text-slate-900 leading-snug mb-2 font-display">
                                                    {ann.title}
                                                </h4>
                                            )}

                                            {/* Message body */}
                                            <div className="text-[12px] text-slate-650 font-normal leading-relaxed whitespace-pre-wrap break-words font-sans">
                                                {formatTelegramMessage(ann.content)}
                                            </div>

                                            {/* Document download link */}
                                            {ann.links && (
                                                <div className="pt-2">
                                                    <a 
                                                        href={ann.links} target="_blank" rel="noopener noreferrer"
                                                        className="text-[var(--color-primary)] text-[10px] font-bold hover:text-[var(--color-primary-container)] inline-flex items-center gap-1 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Download Attachment <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            )}

                                            {/* Message Footer Row with Category and Time */}
                                            <div className="flex justify-between items-center mt-3.5 pt-2.5 border-t border-slate-100/80">
                                                <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                    isRead 
                                                        ? "bg-slate-100 text-slate-500" 
                                                        : "bg-blue-100 text-blue-700"
                                                }`}>
                                                    {ann.category || "General Update"}
                                                </span>

                                                <div className="flex items-center gap-1.5 select-none">
                                                    <span className="text-[8.5px] text-slate-400 font-bold uppercase">
                                                        {formattedTime}
                                                    </span>
                                                    {isRead ? (
                                                        <span className="text-blue-500 flex items-center" title="Read">
                                                            <Check size={11} strokeWidth={3} />
                                                        </span>
                                                    ) : (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Unread" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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

    // Log service request intent and auto-redirect to WhatsApp
    const handleAutoServiceRequest = (svc) => {
        setActiveServiceForForm(svc)
        setFormSuccessId("")
        setFormSubmitting(false)
        setCustomPhone(user?.phone || "")
    }

    const submitServiceRequestWithPhone = async (phoneVal) => {
        setFormSubmitting(true)
        try {
            let finalPhone = phoneVal.trim()
            if (!finalPhone) {
                finalPhone = "WEB_ANONYMOUS"
            }

            await api.publicLogIntent(
                activeServiceForForm.name,
                activeServiceForForm.categoryLabel || "Service Request",
                finalPhone
            )

            const reqId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`
            setFormSuccessId(reqId)

            // Prefilled WhatsApp message
            const textMsg = `Hello Krishna Emitra! I have requested the service: *${activeServiceForForm.name}* (Category: *${activeServiceForForm.categoryLabel || "Service Request"}*) via the web portal. Prefilled Contact: ${finalPhone !== "WEB_ANONYMOUS" ? finalPhone : "Not Provided"}.`
            const waUrl = `https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(textMsg)}`

            setTimeout(() => {
                window.open(waUrl, "_blank")
            }, 1500)

            fetchAllData(true)
        } catch (err) {
            alert("Error logging filing request: " + err.message)
            setActiveServiceForForm(null)
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
            <aside className="w-[280px] bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen shrink-0 z-20">
                {/* Tricolor Saffron/Green Top Line */}
                <div className="h-1 bg-gradient-to-r from-[#f26522] via-white to-[#138808]" />

                {/* SSO / e-Mitra Kiosk Header */}
                <div className="h-16 flex items-center px-5 border-b border-slate-200 bg-[#f8fafc]">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
                        <div className="w-8 h-8 rounded-lg bg-[#0a4a83] text-white flex items-center justify-center font-bold text-sm shadow-md">
                            SSO
                        </div>
                        <div className="leading-tight">
                            <span className="text-slate-800 font-extrabold text-[13.5px] tracking-tight block">Citizen SSO Portal</span>
                            <span className="text-[9px] text-[#f26522] font-black tracking-widest uppercase block">कृष्णा ई-मित्र</span>
                        </div>
                    </div>
                </div>

                {/* REDESIGNED CITIZEN SSOID CARD */}
                {isLoggedIn && (
                    <div className="px-4 py-4 border-b border-slate-100 bg-[#f8fafc]/50">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 bg-[#138808] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl">
                                Verified
                            </div>
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-[#0a4a83]/20 bg-slate-50 flex items-center justify-center text-[#0a4a83] text-base font-black shadow-inner overflow-hidden">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <h4 className="text-[12.5px] font-bold text-slate-800 tracking-tight leading-tight mb-0.5">{user?.name}</h4>
                            <p className="text-[9.5px] font-mono text-slate-400 select-all">
                                SSOID: <span className="font-extrabold text-[#0a4a83]">RAJ_{String(user?.phone || user?.telegram_id || 'CITIZEN').slice(-8).toUpperCase()}</span>
                            </p>
                            <div className="mt-2.5 py-1 bg-[#e7f6e7] border border-[rgba(19,136,8,0.15)] text-[#138808] text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1">
                                <ShieldCheck size={11} /> verified citizen
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
                    {navigationItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        // Do not show profile tab if user is logged out
                        if (!isLoggedIn && ["profile"].includes(item.id)) return null;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id)
                                    setActiveExamForTimeline(null)
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all duration-155 cursor-pointer group ${
                                    isActive
                                        ? "bg-[#e5effa] text-[#0a4a83] font-bold"
                                        : "text-slate-655 hover:text-[#0a4a83] hover:bg-slate-50"
                                }`}
                            >
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 2.0} className={`${isActive ? "text-[#0a4a83]" : "text-slate-400 group-hover:text-[#0a4a83] transition-colors"}`} />
                                <span className="flex-1 text-left">
                                    {lang === "EN" ? item.label : item.labelHi}
                                </span>
                                {!isActive && (
                                    <ChevronRight size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Desktop Account block at bottom */}
                <div className="p-4 border-t border-slate-100 bg-[#f8fafc]">
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-red-200 hover:bg-red-50 text-red-655 hover:text-red-700 text-[11px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                        >
                            <LogOut size={13} /> Close SSO Session
                        </button>
                    ) : (
                        <button
                            onClick={triggerSignIn}
                            className="w-full py-2.5 bg-[#0a4a83] hover:bg-[#07355e] text-white text-[11.5px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#0a4a83]/10 cursor-pointer hover:-translate-y-0.5 duration-200"
                        >
                            <User size={13} /> SSO Portal Login
                        </button>
                    )}
                </div>
            </aside>

            {/* ── MAIN PORTAL CANVAS ── */}
            <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
                
                {/* ── DOUBLE-DECKER GOVT HEADER ── */}
                <div className="flex flex-col sticky top-0 z-30 shrink-0 shadow-sm">
                    {/* Top Deck: Gov Info & Support Banner */}
                    <div className="h-10 bg-[#072146] text-white flex items-center justify-between px-6 md:px-10 text-[11px] font-medium border-b border-[#0f3460]">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px]">🏛️</span>
                            <span className="tracking-wide text-white/90">
                                {lang === "EN" ? "Government of Rajasthan" : "राजस्थान सरकार"}
                            </span>
                            <span className="text-slate-500 font-bold">|</span>
                            <span className="text-slate-300">
                                {lang === "EN" ? "Single Sign-On (SSO)" : "सिंगल साइन-ऑन पोर्टल"}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-white/80">
                            <span className="hidden sm:inline">📞 Helpline: <span className="font-bold text-amber-400">1800-180-6127</span></span>
                            {isLoggedIn && (
                                <span className="text-slate-400 hidden md:inline">
                                    IP: <span className="font-mono">10.140.23.{String(user?.telegram_id || '99').slice(-2)}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottom Deck: Primary Header */}
                    <header className="h-16 bg-white flex items-center justify-between px-6 md:px-10 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                                <Menu size={20} />
                            </button>
                            <div className="hidden lg:flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#0a4a83] text-white flex items-center justify-center font-bold text-sm">
                                    SSO
                                </div>
                                <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">
                                    {lang === "EN" ? "Citizen Dashboard" : "नागरिक डैशबोर्ड"}
                                </h2>
                                <span className="text-slate-350 font-normal">/</span>
                                <span className="text-[13px] text-[#0a4a83] font-semibold">
                                    {lang === "EN" ? navigationItems.find(i => i.id === activeTab)?.label : navigationItems.find(i => i.id === activeTab)?.labelHi}
                                </span>
                            </div>
                            <div className="lg:hidden flex items-center gap-2">
                                <Logo className="w-8 h-8 rounded-lg" />
                                <span className="text-slate-800 font-extrabold text-[14px]">e-Mitra Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isLoggedIn && (
                                <button 
                                    onClick={() => setActiveTab("overview")} 
                                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-455 hover:text-slate-700 transition-all relative cursor-pointer"
                                    title="Inbox Notifications"
                                >
                                    <Bell size={16} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button onClick={() => fetchAllData(true)} disabled={refreshing} className="p-2 rounded-xl hover:bg-slate-100 text-slate-455 hover:text-slate-700 transition-all cursor-pointer">
                                <RefreshCw size={15} className={refreshing ? "animate-spin text-[#0a4a83]" : ""} />
                            </button>

                            <button onClick={toggleLanguage} className="text-slate-700 hover:text-slate-900 transition-all text-[11px] font-bold flex items-center gap-1.5 bg-white hover:bg-slate-50 px-3.5 py-1.8 rounded-xl border border-slate-200 shadow-sm cursor-pointer">
                                <Globe size={13} className="text-slate-400" /> {lang === 'EN' ? 'हिन्दी' : 'English'}
                            </button>
                        </div>
                    </header>

                    {/* Saffron and Green Tricolor border bottom */}
                    <div className="sso-tricolor-line" />
                </div>

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
                                        <Logo className="w-8 h-8 rounded-lg" />
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
                    <div className="flex-1 min-w-0 h-[calc(100vh-108px)] overflow-y-auto scroll-container-smooth flex flex-col justify-between">
                        {/* Official Bulletin Notice Ticker */}
                        {upcomingDeadlines.length > 0 && (
                            <div className="bg-[#fff4ee] text-slate-700 text-[11px] font-semibold py-2 px-6 overflow-hidden flex items-center border-b border-orange-100 shadow-inner relative shrink-0">
                                <div className="flex items-center gap-1.5 shrink-0 bg-[#fff4ee] z-10 pr-4 mr-4 text-[#f26522] font-black uppercase tracking-wider relative">
                                    <Clock size={12} className="animate-pulse" /> 
                                    {lang === "EN" ? "URGENT NOTICES" : "आवश्यक सूचना"}
                                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-black/5 pointer-events-none translate-x-full" />
                                </div>
                                <div className="flex items-center gap-12 whitespace-nowrap marquee-track">
                                    {upcomingDeadlines.map((ex, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 text-[11.5px]">
                                            📢 <span className="font-extrabold text-slate-800">{ex.name}</span>: {lang === "EN" ? "Submission closes on" : "आवेदन की अंतिम तिथि"} <span className="text-[#f26522] font-bold">{new Date(ex.end_date).toLocaleDateString("en-IN")}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* ── CANVAS MAIN CONTENT ── */}
                        <main className="max-w-[1140px] w-full mx-auto px-6 md:px-10 py-8 flex-1">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                            <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
                            <span className="text-[12px] text-slate-400 font-bold tracking-widest uppercase">Initializing Portal</span>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fadeIn">
                            
                            {/* ── Tab 1: Overview ── */}
                            {activeTab === "overview" && (
                                !isLoggedIn ? (
                                    <PublicOverview 
                                        announcements={announcements}
                                        carouselIndex={carouselIndex}
                                        setCarouselIndex={setCarouselIndex}
                                        upcomingDeadlines={upcomingDeadlines}
                                        triggerSignIn={triggerSignIn}
                                    />
                                ) : (
                                    <DashboardTab 
                                        user={user}
                                        statsProgress={statsProgress}
                                        setActiveTab={setActiveTab}
                                        subscribedExams={subscribedExams}
                                        exams={exams}
                                        config={config}
                                        setActiveExamForTimeline={setActiveExamForTimeline}
                                    />
                                )
                            )}

                            {/* ── Tab 2: Services ── */}
                            {activeTab === "services" && (
                                <ServicesTab 
                                    lang={lang}
                                    isLoggedIn={isLoggedIn}
                                    services={services}
                                    flatServicesList={flatServicesList}
                                    serviceSearch={serviceSearch}
                                    setServiceSearch={setServiceSearch}
                                    serviceCatFilter={serviceCatFilter}
                                    setServiceCatFilter={setServiceCatFilter}
                                    servicesSubTab={servicesSubTab}
                                    setServicesSubTab={setServicesSubTab}
                                    history={history}
                                    expandedAppId={expandedAppId}
                                    setExpandedAppId={setExpandedAppId}
                                    triggerSignIn={triggerSignIn}
                                    handleAutoServiceRequest={handleAutoServiceRequest}
                                    config={config}
                                />
                            )}

                            {/* ── Tab 3: Exams ── */}
                            {activeTab === "exams" && (
                                <ExamsTab 
                                    activeExamForTimeline={activeExamForTimeline}
                                    setActiveExamForTimeline={setActiveExamForTimeline}
                                    subscribedExams={subscribedExams}
                                    handleToggleExamSubscription={handleToggleExamSubscription}
                                    examSearch={examSearch}
                                    setExamSearch={setExamSearch}
                                    examCategoryFilter={examCategoryFilter}
                                    setExamCategoryFilter={setExamCategoryFilter}
                                    filteredExamsList={filteredExamsList}
                                    isLoggedIn={isLoggedIn}
                                    triggerSignIn={triggerSignIn}
                                    setWizardExamName={setWizardExamName}
                                    setIsWizardOpen={setIsWizardOpen}
                                    config={config}
                                    handleSaveExamSubscriptions={handleSaveExamSubscriptions}
                                    exams={exams}
                                />
                            )}

                            {/* ── Tab 4: NEET Counselling ── */}
                            {activeTab === "neet" && (
                                <NeetCounsellingTab 
                                    lang={lang}
                                    neetFormSubmitted={neetFormSubmitted}
                                    setNeetFormSubmitted={setNeetFormSubmitted}
                                    neetRank={neetRank}
                                    setNeetRank={setNeetRank}
                                    neetCategory={neetCategory}
                                    setNeetCategory={setNeetCategory}
                                    neetPhone={neetPhone}
                                    setNeetPhone={setNeetPhone}
                                    handleNeetCounsellingSubmit={handleNeetCounsellingSubmit}
                                />
                            )}

                            {/* ── Tab 5: Profile ── */}
                            {activeTab === "profile" && isLoggedIn && (
                                <ProfileTab 
                                    lang={lang}
                                    profileSavedMessage={profileSavedMessage}
                                    editableProfile={editableProfile}
                                    setEditableProfile={setEditableProfile}
                                    notificationPrefs={notificationPrefs}
                                    setNotificationPrefs={setNotificationPrefs}
                                    handleSaveProfile={handleSaveProfile}
                                />
                            )}

                            {/* ── Tab 6: Help Desk ── */}
                            {activeTab === "help" && (
                                <HelpDeskTab 
                                    lang={lang}
                                    cbSubmitted={cbSubmitted}
                                    setCbSubmitted={setCbSubmitted}
                                    cbName={cbName}
                                    setCbName={setCbName}
                                    cbPhone={cbPhone}
                                    setCbPhone={setCbPhone}
                                    cbQuery={cbQuery}
                                    setCbQuery={setCbQuery}
                                    handleCallbackQuerySubmit={handleCallbackQuerySubmit}
                                />
                            )}

                            {/* ── Tab 7: About Us ── */}
                            {activeTab === "about" && (
                                <AboutUsTab 
                                    lang={lang}
                                    config={config}
                                />
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
                        <aside className="hidden xl:flex w-[340px] border-l border-slate-200 h-[calc(100vh-108px)] shrink-0 p-6 flex-col overflow-y-auto scroll-container-smooth bg-slate-50 relative">
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
                                <h3 className="text-[14.5px] font-extrabold text-slate-900 text-left font-display">Filing Request Registered</h3>
                                <p className="text-[10px] text-[var(--color-primary)] font-extrabold bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] px-2 py-0.5 rounded inline-block mt-1 tracking-wider text-left">{activeServiceForForm.categoryLabel}</p>
                            </div>
                            <button onClick={() => setActiveServiceForForm(null)} className="p-1.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-low)] rounded-lg cursor-pointer transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {formSubmitting ? (
                            <div className="p-6 text-center space-y-3">
                                <Loader2 size={30} className="mx-auto text-[var(--color-primary)] animate-spin" />
                                <h4 className="text-[14px] font-extrabold text-slate-800">Logging Your Request...</h4>
                            </div>
                        ) : formSuccessId ? (
                            <div className="p-4 text-center space-y-5">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/5">
                                    <CheckCircle2 size={30} />
                                </div>
                                <h4 className="text-[15px] font-extrabold text-emerald-600">Request Logged Successfully!</h4>
                                <p className="text-[12.5px] text-slate-500 leading-relaxed font-semibold">
                                    Your request for <span className="font-extrabold text-slate-900">{activeServiceForForm.name}</span> has been logged. We are redirecting you to WhatsApp to complete your filing.
                                </p>
                                
                                <div className="space-y-2">
                                    <a 
                                        href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(`Hello Krishna Emitra! I have requested the service: *${activeServiceForForm.name}* (Category: *${activeServiceForForm.categoryLabel || "Service Request"}*) via the web portal. Prefilled Contact: ${customPhone.trim() || "Not Provided"}.`)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold rounded-xl w-full cursor-pointer transition-colors shadow-sm border-none flex items-center justify-center gap-2 decoration-none font-sans"
                                    >
                                        <MessageSquare size={16} /> Open WhatsApp Chat
                                    </a>
                                    <button 
                                        onClick={() => setActiveServiceForForm(null)}
                                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded-xl w-full cursor-pointer transition-all border-none"
                                    >
                                        Close Window
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* PHONE COLLECTION STEP */
                            <div className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold uppercase text-slate-450 block tracking-wider">Contact Number (Optional)</label>
                                    <p className="text-[11.5px] text-slate-500 leading-normal font-semibold">Provide your mobile number if you want the operator to contact you directly regarding this service request.</p>
                                </div>

                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={customPhone} 
                                        onChange={e => setCustomPhone(e.target.value)}
                                        placeholder="Enter mobile number (optional)" 
                                        className="w-full p-3 bg-slate-50 border border-[var(--color-outline-variant)] rounded-xl text-[12.5px] font-semibold outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    />
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button 
                                        onClick={() => submitServiceRequestWithPhone(customPhone)}
                                        className="px-5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-[12.5px] font-extrabold rounded-xl flex-1 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-ambient border-none"
                                    >
                                        Proceed to WhatsApp
                                    </button>
                                    <button 
                                        onClick={() => setActiveServiceForForm(null)}
                                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 text-[12px] font-bold rounded-xl cursor-pointer transition-all border-none"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

        </div>
    )
}
