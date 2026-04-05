import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, LogOut, Phone, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import * as api from "../../api"

export default function StudentProfileDrawer({ isOpen, onClose }) {
    const { user, logout } = useAuth()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && user?.phone) {
            setLoading(true)
            api.publicCheckStatus(user.phone)
                .then(data => setHistory(data.history || []))
                .catch(() => setHistory([]))
                .finally(() => setLoading(false))
        }
    }, [isOpen, user])

    const handleLogout = () => {
        logout()
        onClose()
    }

    const statusMeta = (status) => {
        if (status === "completed") return { icon: <CheckCircle size={13} className="text-green-500 shrink-0" />, pill: "bg-green-50 text-green-700" }
        if (status === "pending") return { icon: <Clock size={13} className="text-yellow-500 shrink-0" />, pill: "bg-yellow-50 text-yellow-700" }
        return { icon: <AlertCircle size={13} className="text-ink-3 shrink-0" />, pill: "bg-slate-100 text-ink-3" }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90]"
                    />

                    {/* Slide-up drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 320 }}
                        className="fixed bottom-0 left-0 right-0 z-[91] bg-white rounded-t-[28px] shadow-2xl flex flex-col"
                        style={{ maxHeight: "82vh" }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-2 shrink-0">
                            <div className="w-9 h-1 bg-black/10 rounded-full" />
                        </div>

                        {/* Profile header */}
                        <div className="px-6 pt-2 pb-5 border-b border-black/5 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shrink-0">
                                        <span className="text-white text-2xl font-black leading-none">
                                            {user?.name?.charAt(0)?.toUpperCase() || "?"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-base font-black tracking-tight leading-tight">{user?.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Phone size={10} className="text-ink-3" />
                                            <p className="text-xs font-bold text-ink-3">+91 {user?.phone}</p>
                                        </div>
                                        <span className="mt-1.5 inline-flex items-center px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded-full">
                                            ✓ Verified
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-ink-3 shrink-0"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Service History — scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-ink-3 mb-3">Service History</p>

                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 size={22} className="animate-spin text-ink-3" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <Clock size={18} className="text-ink-3" />
                                    </div>
                                    <p className="text-sm font-bold text-ink-2">No requests yet</p>
                                    <p className="text-xs text-ink-3">Apply for a service to see your history here</p>
                                </div>
                            ) : (
                                history.map((item, idx) => {
                                    const meta = statusMeta(item.status)
                                    return (
                                        <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-black/[0.04]">
                                            <div className="mt-0.5">{meta.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-black truncate">{item.service_name}</p>
                                                <p className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider">{item.category}</p>
                                                {item.updated_at && (
                                                    <p className="text-[10px] text-ink-3 mt-0.5">
                                                        {new Date(item.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${meta.pill}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 pt-3 pb-6 border-t border-black/5 shrink-0" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 border-2 border-black/8 text-xs font-black uppercase tracking-widest rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-ink-2 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={13} /> Log Out
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
