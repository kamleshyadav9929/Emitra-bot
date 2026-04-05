import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { auth } from "../../firebase"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { useAuth } from "../../context/AuthContext"
import { X, Phone, Shield, User, ArrowLeft, Loader2 } from "lucide-react"

export default function LoginModal({ isOpen, onClose }) {
    const { login } = useAuth()
    const [step, setStep] = useState(1) // 1: phone, 2: otp, 3: name
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const confirmationRef = useRef(null)
    const recaptchaRef = useRef(null)

    // Reset state and clean up reCAPTCHA when modal closes/opens
    useEffect(() => {
        if (isOpen) {
            setStep(1); setPhone(""); setOtp(""); setName(""); setError("")
        } else {
            clearVerifier()
        }
    }, [isOpen])

    const clearVerifier = () => {
        if (recaptchaRef.current) {
            try { recaptchaRef.current.clear() } catch (e) {}
            recaptchaRef.current = null
        }
        // Also clear any leftover reCAPTCHA iframes from the DOM
        const el = document.getElementById("recaptcha-container")
        if (el) el.innerHTML = ""
    }

    const getVerifier = () => {
        // Always create a fresh verifier to avoid stale token issues
        clearVerifier()
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => { clearVerifier() }
        })
        return recaptchaRef.current
    }

    const handleSendOtp = async () => {
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError("Enter a valid 10-digit Indian mobile number")
            return
        }
        setLoading(true); setError("")
        try {
            const verifier = getVerifier()
            const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier)
            confirmationRef.current = result
            setStep(2)
        } catch (err) {
            setError(err.message?.includes("too-many-requests")
                ? "Too many attempts. Please wait a few minutes and try again."
                : "Failed to send OTP. Please try again.")
            try { recaptchaRef.current?.clear() } catch (e) {}
            recaptchaRef.current = null
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (otp.length < 6) { setError("Enter the 6-digit OTP"); return }
        setLoading(true); setError("")
        try {
            await confirmationRef.current.confirm(otp)
            // Returning user? Auto-login with stored name
            const stored = JSON.parse(localStorage.getItem("emitra_student") || "null")
            if (stored?.phone === phone && stored?.name) {
                login(phone, stored.name)
                onClose()
            } else {
                setStep(3) // New user — collect name
            }
        } catch (err) {
            setError("Invalid OTP. Please check and try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveName = () => {
        if (!name.trim()) { setError("Please enter your name"); return }
        login(phone, name.trim())
        onClose()
    }

    const steps = [
        { icon: Phone, label: "Enter Mobile Number" },
        { icon: Shield, label: "Verify OTP" },
        { icon: User, label: "Your Name" },
    ]
    const StepIcon = steps[step - 1].icon

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-7 pt-7 pb-5 border-b border-black/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2.5">
                                    {/* Step dots */}
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3].map(s => (
                                            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
                                                s === step ? "w-6 bg-black" : s < step ? "w-4 bg-black/25" : "w-4 bg-black/8"
                                            }`} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                                            <StepIcon size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-ink-3">Step {step} of 3</p>
                                            <p className="text-[15px] font-black tracking-tight leading-tight">{steps[step - 1].label}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-ink-3 hover:text-black mt-0.5">
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="px-7 py-6">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                                        <p className="text-xs text-ink-2 leading-relaxed">
                                            We'll send a one-time password to your mobile to verify your identity.
                                        </p>
                                        <div className="flex items-center border-2 border-black/10 focus-within:border-black rounded-xl overflow-hidden transition-colors">
                                            <span className="px-3.5 py-3 text-sm font-black text-ink-3 border-r border-black/10 bg-slate-50 select-none">+91</span>
                                            <input
                                                type="tel" inputMode="numeric"
                                                value={phone}
                                                onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError("") }}
                                                placeholder="9876543210"
                                                className="flex-1 px-3.5 py-3 text-sm font-bold outline-none bg-transparent"
                                                maxLength={10}
                                                onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                                                autoFocus
                                            />
                                        </div>
                                        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={loading || phone.length !== 10}
                                            className="w-full py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black/85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 size={14} className="animate-spin" /> : "Send OTP →"}
                                        </button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                                        <p className="text-xs text-ink-2 leading-relaxed">
                                            OTP sent to <span className="font-black text-black">+91 {phone}</span>. Valid for 10 minutes.
                                        </p>
                                        <input
                                            type="text" inputMode="numeric"
                                            value={otp}
                                            onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError("") }}
                                            placeholder="— — — — — —"
                                            className="w-full px-4 py-3.5 text-2xl font-black text-center border-2 border-black/10 focus:border-black rounded-xl outline-none transition-colors tracking-[0.6em]"
                                            maxLength={6}
                                            onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                                            autoFocus
                                        />
                                        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
                                        <button
                                            onClick={handleVerifyOtp}
                                            disabled={loading || otp.length !== 6}
                                            className="w-full py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black/85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 size={14} className="animate-spin" /> : "Verify & Log In →"}
                                        </button>
                                        <button
                                            onClick={() => { setStep(1); setOtp(""); setError("") }}
                                            className="w-full py-2 text-xs font-bold text-ink-3 hover:text-black transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowLeft size={12} /> Change Number
                                        </button>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-4">
                                        <p className="text-xs text-ink-2 leading-relaxed">
                                            🎉 Phone verified! What should we call you?
                                        </p>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => { setName(e.target.value); setError("") }}
                                            placeholder="Your full name"
                                            className="w-full px-4 py-3 text-sm font-bold border-2 border-black/10 focus:border-black rounded-xl outline-none transition-colors"
                                            onKeyDown={e => e.key === "Enter" && handleSaveName()}
                                            autoFocus
                                        />
                                        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
                                        <button
                                            onClick={handleSaveName}
                                            disabled={!name.trim()}
                                            className="w-full py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black/85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            Complete Setup →
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
        {/* reCAPTCHA container MUST be outside AnimatePresence — always in DOM */}
        <div id="recaptcha-container" style={{ position: "fixed", bottom: 0, zIndex: 9999 }} />
        </>
    )
}
