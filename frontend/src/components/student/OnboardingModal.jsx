import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, CheckCircle2, User, Phone, BookOpen, AlertCircle } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import * as api from "../../api"

export default function OnboardingModal({ isOpen, exams }) {
    const { user, login } = useAuth()
    const { lang } = useLanguage()
    
    const defaultName = user?.name && user.name !== "Unknown" ? user.name : ""
    const [name, setName] = useState(defaultName)
    const initialPhone = (user?.phone && !user.phone.startsWith("CLERK_TEMP_") && !user.phone.startsWith("BOT_TEMP_")) ? user.phone : ""
    const [phone, setPhone] = useState(initialPhone)
    const [selectedExams, setSelectedExams] = useState([])
    const [status, setStatus] = useState("idle") // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState("")

    const toggleExam = (examName) => {
        if (selectedExams.includes(examName)) {
            setSelectedExams(selectedExams.filter(e => e !== examName))
        } else {
            setSelectedExams([...selectedExams, examName])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!name.trim()) {
            setErrorMsg(lang === "EN" ? "Name is required." : "नाम आवश्यक है।")
            return
        }

        const cleanPhone = phone.replace(/\D/g, '').slice(-10)
        if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
            setErrorMsg(lang === "EN" ? "Please enter a valid 10-digit Indian phone number." : "कृपया वैध 10-अंकीय भारतीय फोन नंबर दर्ज करें।")
            return
        }

        setStatus("loading")
        setErrorMsg("")
        
        try {
            const res = await api.onboardStudent({
                name: name.trim(),
                phone: cleanPhone,
                exam_preferences: selectedExams
            })

            if (res.success && res.student) {
                // Update local auth context with new data
                login(localStorage.getItem("student_token") || null, res.student)
                setStatus("success")
                // Modal will automatically unmount if AuthContext updates needsOnboarding to false,
                // but we can add a slight delay for the success animation to show.
                setTimeout(() => {
                    // Force close by reloading or letting context naturally hide it.
                    // The parent component should hide it based on needsOnboarding.
                }, 2000)
            } else {
                setStatus("error")
                setErrorMsg(res.error || "Failed to save profile. Please try again.")
            }
        } catch (err) {
            console.error("Onboarding failed", err)
            setStatus("error")
            setErrorMsg("Could not connect to backend server. Please check your internet.")
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Solid Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[var(--color-surface-base)]"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0 text-center">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight font-display">
                            {lang === "EN" ? "Welcome to e-Mitra!" : "ई-मित्र में आपका स्वागत है!"}
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-1">
                            {lang === "EN" ? "Let's personalize your experience." : "आइए आपके अनुभव को अनुकूलित करें।"}
                        </p>
                    </div>

                    {/* Content Scrollable */}
                    <div className="p-6 overflow-y-auto flex-1 scroll-container-smooth">
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
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {errorMsg && (
                                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {errorMsg}
                                    </div>
                                )}

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
                                            <span className="text-slate-400 font-normal">{lang === "EN" ? "(Optional)" : "(वैकल्पिक)"}</span>
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

                                    <div className="space-y-2 pt-2">
                                        <label className="text-[12px] font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                                            <BookOpen size={14} className="text-[var(--color-primary)]" />
                                            {lang === "EN" ? "Which exams are you preparing for?" : "आप किन परीक्षाओं की तैयारी कर रहे हैं?"}
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {exams && exams.length > 0 ? (
                                                exams.map(exam => (
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
                                                            <span className="text-[12.5px] font-bold text-slate-800 leading-tight">
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
                                                <div className="col-span-full text-[12px] text-slate-400 text-center py-4">
                                                    Loading exams...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
                                    >
                                        {lang === "EN" ? "Continue to Dashboard" : "डैशबोर्ड पर जारी रखें"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
