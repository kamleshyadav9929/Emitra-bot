import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageSquare, Loader2, CheckCircle2, AlertCircle, X, ExternalLink } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLanguage } from "../../context/LanguageContext"
import { useClerk } from "@clerk/react"
import * as api from "../../api"

export default function LoginModal({ isOpen, onClose }) {
    const { login } = useAuth()
    const { lang } = useLanguage()
    const { openSignIn } = useClerk()
    const [token, setToken] = useState(null)
    const [botUrl, setBotUrl] = useState("")
    const [status, setStatus] = useState("idle") // idle, loading, pending, awaiting_onboarding, success, expired, error
    const [errorMsg, setErrorMsg] = useState("")
    const pollIntervalRef = useRef(null)

    const startLoginSession = async () => {
        setStatus("loading")
        setErrorMsg("")
        try {
            const res = await api.createLoginToken()
            if (res.success && res.token) {
                setToken(res.token)
                setBotUrl(res.bot_url)
                setStatus("pending")
            } else {
                setStatus("error")
                setErrorMsg("Failed to start login session. Please try again.")
            }
        } catch (err) {
            console.error("Login token generation failed", err)
            setStatus("error")
            setErrorMsg("Could not connect to backend server. Please check your internet.")
        }
    }

    // Effect to start/stop session
    useEffect(() => {
        if (isOpen) {
            startLoginSession()
        } else {
            // Clean up when closed
            setToken(null)
            setBotUrl("")
            setStatus("idle")
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
            }
        }
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
            }
        }
    }, [isOpen])

    // Effect to handle polling
    useEffect(() => {
        if (token && (status === "pending" || status === "awaiting_onboarding")) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

            pollIntervalRef.current = setInterval(async () => {
                try {
                    const res = await api.checkLoginStatus(token)
                    if (res.success) {
                        if (res.status === "success" && res.token && res.user) {
                            clearInterval(pollIntervalRef.current)
                            pollIntervalRef.current = null
                            setStatus("success")
                            // Short delay for success animation
                            setTimeout(() => {
                                login(res.token, res.user)
                                onClose()
                            }, 1500)
                        } else if (res.status === "awaiting_onboarding") {
                            setStatus("awaiting_onboarding")
                        } else if (res.status === "expired") {
                            clearInterval(pollIntervalRef.current)
                            pollIntervalRef.current = null
                            setStatus("expired")
                        } else if (res.status === "pending") {
                            // keep pending
                        }
                    }
                } catch (err) {
                    console.error("Polling login status failed", err)
                }
            }, 2000)
        }

        return () => {
            if (pollIntervalRef.current && status !== "pending" && status !== "awaiting_onboarding") {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
            }
        }
    }, [token, status])

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                {/* Backdrop Click Close */}
                <div className="absolute inset-0" onClick={onClose} />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden z-10 text-center"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all border-none bg-transparent cursor-pointer"
                    >
                        <X size={18} />
                    </button>

                    {/* Content states */}
                    <div className="space-y-6 py-4">
                        {status === "loading" && (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
                                <p className="text-[13px] font-semibold text-slate-500">
                                    {lang === "EN" ? "Generating secure login session..." : "सुरक्षित लॉगिन सत्र जनरेट हो रहा है..."}
                                </p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800">Connection Error</h3>
                                <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    {errorMsg}
                                </p>
                                <button
                                    onClick={startLoginSession}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[12px] rounded-xl transition-all border-none cursor-pointer"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {status === "expired" && (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800">Session Expired</h3>
                                <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    {lang === "EN" ? "The login link has expired. Please generate a new link to sign in." : "लॉगिन लिंक समाप्त हो गया है। कृपया साइन इन करने के लिए एक नया लिंक जनरेट करें।"}
                                </p>
                                <button
                                    onClick={startLoginSession}
                                    className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold text-[12px] rounded-xl transition-all border-none cursor-pointer"
                                >
                                    {lang === "EN" ? "Generate New Link" : "नया लिंक बनाएं"}
                                </button>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500"
                                >
                                    <CheckCircle2 size={32} />
                                </motion.div>
                                <h3 className="text-lg font-black text-slate-800">
                                    {lang === "EN" ? "Authentication Successful" : "सत्यापन सफल रहा"}
                                </h3>
                                <p className="text-[12.5px] text-slate-500">
                                    {lang === "EN" ? "Logging you into your dashboard..." : "आपको डैशबोर्ड में लॉग इन किया जा रहा है..."}
                                </p>
                            </div>
                        )}

                        {(status === "pending" || status === "awaiting_onboarding") && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="space-y-2">
                                    <div className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-500 mx-auto">
                                        <MessageSquare size={22} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">
                                        {lang === "EN" ? "Login with Telegram" : "टेलीग्राम से लॉग इन करें"}
                                    </h3>
                                    <p className="text-[12px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                                        {lang === "EN" 
                                            ? "We link securely with Telegram. No password, email, or OTP required." 
                                            : "हम टेलीग्राम से सुरक्षित लिंक करते हैं। पासवर्ड, ईमेल या ओटीपी की आवश्यकता नहीं है।"}
                                    </p>
                                </div>

                                {/* Telegram Bot Deep Link Button */}
                                <div className="pt-2">
                                    <a
                                        href={botUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#229ED9] hover:bg-[#1c8ec4] text-white text-[13px] font-bold rounded-2xl transition-all shadow-md hover:-translate-y-0.5 active:scale-[0.98] border-none"
                                    >
                                        <span>{lang === "EN" ? "Open Telegram Bot" : "टेलीग्राम बॉट खोलें"}</span>
                                        <ExternalLink size={14} />
                                    </a>
                                </div>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                        {lang === "EN" ? "Or" : "या"}
                                    </span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>

                                <div>
                                    <button
                                        onClick={() => {
                                            onClose()
                                            openSignIn({
                                                afterSignInUrl: window.location.origin + "/dashboard",
                                                afterSignUpUrl: window.location.origin + "/dashboard",
                                            })
                                        }}
                                        className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-bold rounded-2xl transition-all shadow-sm cursor-pointer bg-white"
                                    >
                                        {lang === "EN" ? "Sign in with Google / Email" : "गूगल / ईमेल से साइन इन करें"}
                                    </button>
                                </div>

                                {/* Polling State Message */}
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-3">
                                    <Loader2 className="w-4 h-4 text-sky-500 animate-spin flex-shrink-0" />
                                    <p className="text-[11.5px] font-semibold text-slate-500 text-left leading-normal">
                                        {status === "pending" ? (
                                            lang === "EN" 
                                                ? "Awaiting your click on 'Start' in the bot..." 
                                                : "बॉट में 'Start' दबाने का इंतज़ार कर रहे हैं..."
                                        ) : (
                                            lang === "EN"
                                                ? "Almost done! Click 'Share Contact' in the Telegram bot..."
                                                : "बस होने ही वाला है! टेलीग्राम बॉट में 'Share Contact' पर क्लिक करें..."
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
