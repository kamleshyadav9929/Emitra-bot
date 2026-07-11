import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
    X, LogOut, Mail, Clock, CheckCircle2, AlertCircle, Loader2, 
    Layers, Award, ClipboardList, CheckCircle, ChevronRight, Phone, ShieldCheck
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import * as api from "../../api"
import { ProfileSkeleton } from "../common/Skeleton"

export default function StudentProfileDrawer({ isOpen, onClose }) {
    const { user, logout } = useAuth()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

    // Handle responsive layouts & animations
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        if (isOpen && (user?.phone || user?.email)) {
            setLoading(true)
            const cleanPhone = user.phone || user.email
            Promise.all([
                api.publicCheckStatus(cleanPhone),
                api.getFormApplicationStatus(cleanPhone).catch(() => ({ applications: [] }))
            ])
                .then(([servicesData, applicationsData]) => {
                    const combined = [
                        ...(servicesData.history || []).map(item => ({ 
                            ...item, 
                            type: "service" 
                        })),
                        ...(applicationsData.applications || []).map(item => ({
                            service_name: item.exam_name,
                            category: "Exam Form Filing",
                            status: item.status,
                            requested_at: item.submitted_at,
                            type: "exam_form"
                        }))
                    ]
                    combined.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
                    setHistory(combined)
                })
                .catch(() => setHistory([]))
                .finally(() => setLoading(false))
        }
    }, [isOpen, user])

    const handleLogout = () => {
        logout()
        onClose()
    }

    // Dynamic stats computation
    const stats = {
        total: history.length,
        active: history.filter(item => ["pending", "processing"].includes(item.status)).length,
        completed: history.filter(item => item.status === "completed").length
    }

    const getStatusStyles = (status) => {
        if (status === "completed") {
            return {
                icon: <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />,
                pill: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                itemBorder: "hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(16,185,129,0.04)]"
            }
        }
        if (status === "pending") {
            return {
                icon: <Clock size={15} className="text-amber-500 shrink-0" />,
                pill: "bg-amber-50 text-amber-700 border border-amber-100",
                itemBorder: "hover:border-amber-200 hover:shadow-[0_8px_20px_rgba(245,158,11,0.04)]"
            }
        }
        if (status === "processing") {
            return {
                icon: <Loader2 size={15} className="text-blue-500 animate-spin shrink-0" />,
                pill: "bg-blue-50 text-blue-700 border border-blue-100",
                itemBorder: "hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(59,130,246,0.04)]"
            }
        }
        return {
            icon: <AlertCircle size={15} className="text-gray-400 shrink-0" />,
            pill: "bg-gray-50 text-gray-700 border border-gray-200",
            itemBorder: "hover:border-gray-300"
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Premium Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[90]"
                    />

                    {/* Responsive Drawer Container */}
                    <motion.div
                        initial={isMobile ? { y: "100%" } : { x: "100%" }}
                        animate={isMobile ? { y: 0 } : { x: 0 }}
                        exit={isMobile ? { y: "100%" } : { x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 260 }}
                        className="fixed bottom-0 left-0 right-0 z-[91] bg-[#f5f5f7] shadow-2xl flex flex-col 
                                   lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-[480px] lg:h-screen lg:rounded-l-3xl lg:rounded-r-none"
                        style={isMobile ? { maxHeight: "88vh" } : undefined}
                    >
                        {/* Drag handle for mobile */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden">
                            <div className="w-10 h-1 bg-black/10 rounded-full" />
                        </div>

                        {/* Top App Bar inside Panel */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[#e5e5e7] bg-white shrink-0">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] block">Student Hub</span>
                                <h2 className="text-[17px] font-bold text-[#1d1d1f] tracking-tight">Your Digital Panel</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] hover:text-[#1d1d1f] transition-all"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Drawer Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            
                            {/* Premium Student Profile Card */}
                            <div className="bg-white rounded-3xl p-5 border border-[#e5e5e7] shadow-sm flex items-center gap-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none" />
                                
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {user?.imageUrl ? (
                                        <img 
                                            src={user.imageUrl} 
                                            alt={user.name} 
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white ring-4 ring-blue-50 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gradient-to-tr from-[#0066cc] to-[#0071e3] rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner">
                                            {user?.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-white items-center justify-center shadow-sm">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    </span>
                                </div>

                                <div className="min-w-0 flex-1 z-10">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight truncate">{user?.name}</h3>
                                        <div className="flex items-center text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider shrink-0">
                                            Verified
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                                        <Mail size={12} className="text-[#86868b] shrink-0" />
                                        <span className="text-[12px] font-medium truncate">{user?.email || user?.phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bento Dashboard Statistics Grid */}
                            <div className="grid grid-cols-3 gap-3.5">
                                <div className="bg-white border border-[#e5e5e7] p-3.5 rounded-2xl shadow-sm text-center">
                                    <div className="w-7 h-7 mx-auto mb-2 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center">
                                        <Layers size={13} />
                                    </div>
                                    <span className="text-[18px] font-extrabold text-[#1d1d1f] block leading-none">{stats.total}</span>
                                    <span className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wide block mt-1.5">All Items</span>
                                </div>
                                <div className="bg-white border border-[#e5e5e7] p-3.5 rounded-2xl shadow-sm text-center">
                                    <div className="w-7 h-7 mx-auto mb-2 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Clock size={13} />
                                    </div>
                                    <span className="text-[18px] font-extrabold text-amber-600 block leading-none">{stats.active}</span>
                                    <span className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wide block mt-1.5">In Progress</span>
                                </div>
                                <div className="bg-white border border-[#e5e5e7] p-3.5 rounded-2xl shadow-sm text-center">
                                    <div className="w-7 h-7 mx-auto mb-2 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle size={13} />
                                    </div>
                                    <span className="text-[18px] font-extrabold text-emerald-600 block leading-none">{stats.completed}</span>
                                    <span className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wide block mt-1.5">Completed</span>
                                </div>
                            </div>

                            {/* History List */}
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Application History</span>
                                    <span className="text-[9px] font-semibold text-[#86868b] bg-white border border-[#e5e5e7] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Live Status
                                    </span>
                                </div>

                                {loading ? (
                                    <ProfileSkeleton />
                                ) : history.length === 0 ? (
                                    <div className="bg-white rounded-3xl border border-[#e5e5e7] p-8 text-center space-y-4 shadow-sm">
                                        <div className="w-12 h-12 bg-[#f5f5f7] border border-[#e5e5e7] rounded-2xl flex items-center justify-center mx-auto text-[#86868b]">
                                            <ClipboardList size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[14px] font-bold text-[#1d1d1f]">No applications tracked</h4>
                                            <p className="text-[11.5px] text-[#86868b] max-w-[240px] mx-auto leading-relaxed">
                                                Apply for government services or register exams to monitor status.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {history.map((item, idx) => {
                                            const styles = getStatusStyles(item.status)
                                            const isExam = item.type === "exam_form"
                                            
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`group bg-white border border-[#e5e5e7] p-4 rounded-2xl flex items-center justify-between 
                                                               transition-all duration-300 shadow-sm cursor-default ${styles.itemBorder}`}
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                                            isExam 
                                                                ? "bg-[#f5f5f7] border-[#e5e5e7] text-[#0071e3] group-hover:bg-[#0071e3]/5"
                                                                : "bg-[#f5f5f7] border-[#e5e5e7] text-indigo-600 group-hover:bg-indigo-50"
                                                        }`}>
                                                            {isExam ? <Award size={18} /> : <ClipboardList size={18} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-[13.5px] font-bold text-[#1d1d1f] tracking-tight truncate leading-tight">
                                                                {item.service_name}
                                                            </h4>
                                                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868b] block mt-0.5">
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-1.5">
                                                        <span className={`text-[8.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${styles.pill}`}>
                                                            {item.status}
                                                        </span>
                                                        {item.requested_at && (
                                                            <span className="text-[9px] font-medium text-[#86868b]">
                                                                {new Date(item.requested_at).toLocaleDateString("en-IN", { 
                                                                    day: "numeric", 
                                                                    month: "short" 
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drawer Bottom Bar / Footer */}
                        <div className="p-6 bg-white border-t border-[#e5e5e7] shrink-0" 
                             style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
                            <button
                                onClick={handleLogout}
                                className="w-full py-3.5 border border-[#e5e5e7] hover:border-red-200 hover:bg-red-50 hover:text-red-600 
                                           bg-[#f5f5f7] text-[#1d1d1f] text-[12px] font-bold uppercase tracking-widest rounded-2xl 
                                           transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <LogOut size={13} /> Log Out Account
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
