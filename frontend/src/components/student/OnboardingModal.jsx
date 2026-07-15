import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, CheckCircle2, User, Phone, BookOpen, AlertCircle, Search, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import * as api from "../../api"

export default function OnboardingModal({ isOpen, exams }) {
    const { user, login } = useAuth()
    const { lang } = useLanguage()
    
    // Step state: 1 (Basic Info), 2 (Exams), 3 (Telegram Connect)
    const [step, setStep] = useState(1)
    const [status, setStatus] = useState("idle") // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState("")

    // Step 1 state
    const defaultName = user?.name && user.name !== "Unknown" ? user.name : ""
    const [name, setName] = useState(defaultName)
    const initialPhone = (user?.phone && !user.phone.startsWith("CLERK_TEMP_") && !user.phone.startsWith("BOT_TEMP_")) ? user.phone : ""
    const [phone, setPhone] = useState(initialPhone)
    const [gender, setGender] = useState("")

    // Step 2 state
    const [selectedExams, setSelectedExams] = useState([])
    const [examSearch, setExamSearch] = useState("")

    // Step 3 Telegram linking state
    const [telegramStatus, setTelegramStatus] = useState("idle") // idle, generating, waiting, connected
    const [botUrl, setBotUrl] = useState("")
    const [linkToken, setLinkToken] = useState(null)
    const pollRef = useRef(null)

    const toggleExam = (examName) => {
        if (selectedExams.includes(examName)) {
            setSelectedExams(selectedExams.filter(e => e !== examName))
        } else {
            setSelectedExams([...selectedExams, examName])
        }
    }

    const filteredExams = useMemo(() => {
        if (!exams) return []
        return exams.filter(ex => ex.name.toLowerCase().includes(examSearch.toLowerCase()))
    }, [exams, examSearch])

    const handleNextStep1 = () => {
        if (!name.trim()) {
            setErrorMsg(lang === "EN" ? "Name is required." : "नाम आवश्यक है।")
            return
        }
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        if (phone && (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone))) {
            setErrorMsg(lang === "EN" ? "Please enter a valid 10-digit Indian phone number." : "कृपया वैध 10-अंकीय भारतीय फोन नंबर दर्ज करें।")
            return
        }
        if (!gender) {
            setErrorMsg(lang === "EN" ? "Please select your gender." : "कृपया अपना लिंग चुनें।")
            return
        }
        setErrorMsg("")
        setStep(2)
    }

    const handleNextStep2 = () => {
        setErrorMsg("")
        // Automatically skip Step 3 if already connected to telegram
        if (user?.is_telegram_linked) {
            submitOnboarding()
        } else {
            setStep(3)
        }
    }

    // Generate deep-link login token when Step 3 is entered
    useEffect(() => {
        if (step !== 3 || telegramStatus !== "idle") return
        let cancelled = false

        const generateToken = async () => {
            setTelegramStatus("generating")
            try {
                const res = await api.createLoginToken()
                if (!cancelled && res.success && res.token) {
                    setLinkToken(res.token)
                    setBotUrl(res.bot_url)
                    setTelegramStatus("waiting")
                } else if (!cancelled) {
                    // Fallback to static link if token generation fails
                    setBotUrl("https://t.me/Kamlesh6377_bot")
                    setTelegramStatus("waiting")
                }
            } catch (err) {
                console.error("Failed to generate telegram link token", err)
                if (!cancelled) {
                    setBotUrl("https://t.me/Kamlesh6377_bot")
                    setTelegramStatus("waiting")
                }
            }
        }
        generateToken()

        return () => { cancelled = true }
    }, [step, telegramStatus])

    // Poll login status to detect telegram connection
    useEffect(() => {
        if (step !== 3 || !linkToken || telegramStatus !== "waiting") return

        let failedAttempts = 0
        if (pollRef.current) clearInterval(pollRef.current)

        pollRef.current = setInterval(async () => {
            try {
                const res = await api.checkLoginStatus(linkToken)
                failedAttempts = 0
                if (res.success) {
                    if (res.status === "success" || res.status === "awaiting_onboarding") {
                        // Telegram is now linked!
                        clearInterval(pollRef.current)
                        pollRef.current = null
                        setTelegramStatus("connected")

                        // Auto-submit onboarding after showing success briefly
                        setTimeout(() => {
                            submitOnboarding()
                        }, 1800)
                    }
                    // "pending" means still waiting — keep polling
                }
            } catch (err) {
                failedAttempts++
                if (failedAttempts >= 8) {
                    clearInterval(pollRef.current)
                    pollRef.current = null
                    // Don't block the user — they can still finish manually
                }
            }
        }, 2000)

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current)
                pollRef.current = null
            }
        }
    }, [step, linkToken, telegramStatus])

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current)
                pollRef.current = null
            }
        }
    }, [])

    const submitOnboarding = async () => {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        
        setStatus("loading")
        setErrorMsg("")
        
        try {
            const res = await api.onboardStudent({
                name: name.trim(),
                phone: cleanPhone,
                gender: gender,
                exam_preferences: selectedExams
            })

            if (res.success && res.student) {
                login(localStorage.getItem("student_token") || null, res.student)
                setStatus("success")
            } else {
                setStatus("error")
                setErrorMsg(res.error || "Failed to save profile. Please try again.")
                setStep(1) // go back to fix
            }
        } catch (err) {
            console.error("Onboarding failed", err)
            setStatus("error")
            setErrorMsg("Could not connect to backend server. Please check your internet.")
        }
    }

    const handleFinish = (e) => {
        e?.preventDefault()
        submitOnboarding()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[var(--color-surface-base)]"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                >
                    <div className="px-3 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 bg-slate-50 shrink-0 text-center relative">
                        {step > 1 && status === "idle" && (
                            <button onClick={() => setStep(step - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-xl font-black text-slate-800 tracking-tight font-display">
                            {lang === "EN" ? "Welcome to e-Mitra!" : "ई-मित्र में आपका स्वागत है!"}
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-1">
                            {lang === "EN" 
                                ? (step === 1 ? "Step 1: Basic Information" : step === 2 ? "Step 2: Select Exams" : "Step 3: Stay Updated")
                                : (step === 1 ? "चरण 1: बुनियादी जानकारी" : step === 2 ? "चरण 2: परीक्षा चुनें" : "चरण 3: अपडेट रहें")}
                        </p>
                        
                        {/* Progress Bar */}
                        {status === "idle" && (
                            <div className="w-full bg-slate-200 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[var(--color-primary)] transition-all duration-300"
                                    style={{ width: `${(step / (user?.is_telegram_linked ? 2 : 3)) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                        {status === "loading" || status === "success" ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-5">
                                {status === "loading" ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
                                        <div className="text-center space-y-1">
                                            <h3 className="text-lg font-bold text-slate-800">
                                                {lang === "EN" ? "Just a moment..." : "बस एक पल..."}
                                            </h3>
                                            <p className="text-[13px] font-medium text-slate-500">
                                                {lang === "EN" ? "We are customizing your dashboard" : "हम आपका डैशबोर्ड अनुकूलित कर रहे हैं"}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
                                        >
                                            <CheckCircle2 size={32} />
                                        </motion.div>
                                        <div className="text-center space-y-1">
                                            <h3 className="text-lg font-bold text-emerald-600">
                                                {lang === "EN" ? "All Set!" : "सब तैयार है!"}
                                            </h3>
                                            <p className="text-[13px] font-medium text-slate-500">
                                                {lang === "EN" ? "Enjoy your personalized dashboard." : "अपने व्यक्तिगत डैशबोर्ड का आनंद लें।"}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {errorMsg && (
                                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {errorMsg}
                                    </div>
                                )}

                                {/* STEP 1 */}
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700 ml-1">
                                                {lang === "EN" ? "Your Name" : "आपका नाम"} <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[13.5px] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
                                                    placeholder={lang === "EN" ? "Enter your full name" : "अपना पूरा नाम दर्ज करें"}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700 ml-1 flex justify-between">
                                                <span>{lang === "EN" ? "Phone Number" : "फ़ोन नंबर"}</span>
                                                <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[13.5px] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
                                                    placeholder={lang === "EN" ? "10-digit mobile number" : "10 अंकों का मोबाइल नंबर"}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700 ml-1">
                                                {lang === "EN" ? "Gender" : "लिंग"} <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Male", "Female", "Other"].map(g => (
                                                    <div 
                                                        key={g} 
                                                        onClick={() => setGender(g)}
                                                        className={`text-center py-2.5 rounded-xl cursor-pointer text-[13px] font-bold transition-all border ${
                                                            gender === g ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {lang === "EN" ? g : (g === "Male" ? "पुरुष" : g === "Female" ? "महिला" : "अन्य")}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleNextStep1}
                                                className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
                                            >
                                                {lang === "EN" ? "Next Step" : "अगला चरण"} <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 */}
                                {step === 2 && (
                                    <div>
                                        {/* Search - pinned at top */}
                                        <div className="relative" style={{ marginBottom: '12px' }}>
                                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={examSearch}
                                                onChange={(e) => setExamSearch(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[13.5px] rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
                                                placeholder={lang === "EN" ? "Search exams..." : "परीक्षाएं खोजें..."}
                                            />
                                        </div>

                                        {/* Scrollable exam list - inline styles guarantee this works */}
                                        <div 
                                            style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }}
                                            className="custom-scrollbar"
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {filteredExams.length > 0 ? (
                                                    filteredExams.map(exam => (
                                                        <div 
                                                            key={exam.id}
                                                            onClick={() => toggleExam(exam.name)}
                                                            className={`border rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all ${
                                                                selectedExams.includes(exam.name) 
                                                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" 
                                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12.5px] font-bold text-slate-800 leading-tight pr-4">
                                                                    {exam.name}
                                                                </span>
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                                    selectedExams.includes(exam.name)
                                                                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                                                        : "border-slate-300"
                                                                }`}>
                                                                    {selectedExams.includes(exam.name) && <CheckCircle2 size={10} />}
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-semibold">{exam.category}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-[12px] text-slate-400 text-center py-4">
                                                        {lang === "EN" ? "No exams found." : "कोई परीक्षा नहीं मिली।"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Continue button - pinned at bottom */}
                                        <div style={{ marginTop: '12px' }}>
                                            <button
                                                onClick={handleNextStep2}
                                                className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
                                            >
                                                {lang === "EN" ? "Continue" : "जारी रखें"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 */}
                                {step === 3 && (
                                    <div className="space-y-5 text-center">
                                        {/* Connected State */}
                                        {telegramStatus === "connected" ? (
                                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                                                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
                                                >
                                                    <CheckCircle2 size={32} />
                                                </motion.div>
                                                <div className="text-center space-y-1">
                                                    <h3 className="text-lg font-bold text-emerald-600">
                                                        {lang === "EN" ? "Telegram Connected!" : "टेलीग्राम जुड़ गया!"}
                                                    </h3>
                                                    <p className="text-[13px] font-medium text-slate-500">
                                                        {lang === "EN"
                                                            ? "You'll now receive instant notifications on Telegram."
                                                            : "अब आपको टेलीग्राम पर त्वरित सूचनाएं प्राप्त होंगी।"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 pt-1">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    {lang === "EN" ? "Setting up your dashboard..." : "आपका डैशबोर्ड सेट हो रहा है..."}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Icon */}
                                                <div className="bg-[#E3F2FD] w-16 h-16 rounded-full flex items-center justify-center mx-auto text-[#2AABEE]">
                                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.98 1.25-5.59 3.69-.53.35-1.01.52-1.44.51-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.41-1.43-.87.03-.24.37-.49 1.02-.75 4-1.74 6.67-2.89 8.01-3.45 3.82-1.6 4.61-1.87 5.12-1.88.11 0 .36.03.49.14.11.09.14.22.15.34.02.1-.01.27-.02.32z"/>
                                                    </svg>
                                                </div>

                                                {/* Title & Description */}
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">
                                                        {lang === "EN" ? "Connect Telegram Bot" : "टेलीग्राम बॉट से जुड़ें"}
                                                    </h3>
                                                    <p className="text-[13px] text-slate-500 mt-1 px-4 leading-relaxed">
                                                        {lang === "EN" 
                                                            ? "To receive instant notifications and download admit cards directly on your phone, connect with our official Telegram bot."
                                                            : "त्वरित सूचनाएं प्राप्त करने और सीधे अपने फोन पर एडमिट कार्ड डाउनलोड करने के लिए हमारे टेलीग्राम बॉट से जुड़ें।"}
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-3 pt-2">
                                                    {/* Dynamic deep-link button */}
                                                    {telegramStatus === "generating" ? (
                                                        <div className="w-full py-3 bg-[#2AABEE]/70 text-white font-bold text-[13.5px] rounded-xl flex items-center justify-center gap-2">
                                                            <Loader2 size={16} className="animate-spin" />
                                                            {lang === "EN" ? "Preparing secure link..." : "सुरक्षित लिंक तैयार हो रहा है..."}
                                                        </div>
                                                    ) : (
                                                        <a 
                                                            href={botUrl || "https://t.me/Kamlesh6377_bot"}
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="w-full py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-[13.5px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                                        >
                                                            {lang === "EN" ? "Open Telegram Bot" : "टेलीग्राम बॉट खोलें"}
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}

                                                    {/* Polling indicator — show when we have a token and are waiting */}
                                                    {telegramStatus === "waiting" && linkToken && (
                                                        <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center gap-2.5">
                                                            <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin flex-shrink-0" />
                                                            <p className="text-[11.5px] font-semibold text-slate-500 leading-normal">
                                                                {lang === "EN"
                                                                    ? "Waiting for you to press 'Start' in the bot..."
                                                                    : "बॉट में 'Start' दबाने का इंतज़ार कर रहे हैं..."}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        onClick={handleFinish}
                                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[13px] rounded-xl transition-all border-none cursor-pointer"
                                                    >
                                                        {lang === "EN" ? "Skip for now" : "अभी छोड़ें"}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    )
}
