import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Radio, ChevronDown, ChevronUp, Clock,
    MessageCircle, Phone, MapPin, UserPlus,
    Users, FileText, TrendingUp, Star,
    ExternalLink, Megaphone
} from "lucide-react"
import * as api from "../../api"

// Relative time
function timeAgo(dateStr) {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

// Exam label chip
function ExamChip({ exam }) {
    const colors = {
        ALL: "bg-blue-100 text-blue-800",
        JEE: "bg-purple-100 text-purple-800",
        NEET: "bg-green-100 text-green-800",
        SSC: "bg-orange-100 text-orange-800",
        UPSC: "bg-red-100 text-red-800",
        default: "bg-slate-100 text-slate-700",
    }
    const cls = colors[exam] || colors.default
    return (
        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
            {!exam || exam === "ALL" ? "All Students" : exam}
        </span>
    )
}

// Single news card
function NewsCard({ item, index }) {
    const [expanded, setExpanded] = useState(false)
    const isLong = (item.message?.length || 0) > 100

    return (
        <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
            className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 hover:shadow-sm transition-all"
        >
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <ExamChip exam={item.exam} />
                    <span className="text-[8px] text-slate-400 flex items-center gap-0.5 shrink-0 font-medium">
                        <Clock size={7} />
                        {timeAgo(item.sent_at)}
                    </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                    {expanded ? item.message : item.preview}
                </p>
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-[var(--navy)] hover:underline"
                    >
                        {expanded ? <><ChevronUp size={9} />Less</> : <><ChevronDown size={9} />More</>}
                    </button>
                )}
            </div>
        </motion.div>
    )
}

// Animated stat counter
function StatRow({ value, label, icon: Icon, suffix = "" }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--navy)]/5 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-[var(--navy)]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800">{value}{suffix}</p>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            </div>
        </div>
    )
}

export default function PortalRightPanel({ stats, config, onRegister, onTrack }) {
    const [news, setNews] = useState([])
    const [newsLoading, setNewsLoading] = useState(true)

    useEffect(() => {
        api.getPublicNews()
            .then(d => setNews(d.news || []))
            .catch(() => setNews([]))
            .finally(() => setNewsLoading(false))
    }, [])

    const quickLinks = [
        { label: "WhatsApp Help", icon: MessageCircle, desc: "Chat instantly", action: () => window.open(`https://wa.me/${config?.whatsapp_number || "916377964293"}`, "_blank"), color: "text-green-600" },
        { label: "Telegram Bot", icon: Phone, desc: "Auto-apply bot", action: () => window.open(config?.telegram_bot_url || "https://t.me/Kamlesh6377_bot", "_blank"), color: "text-blue-600" },
        { label: "Track Status", icon: MapPin, desc: "Check progress", action: onTrack, color: "text-amber-600" },
        { label: "Register Free", icon: UserPlus, desc: "Join E-Mitra", action: onRegister, color: "text-[var(--navy)]" },
    ]

    return (
        <aside
            style={{ width: "var(--right-w)" }}
            className="hidden xl:flex flex-col shrink-0 border-l border-[var(--border)] bg-white h-[calc(100vh-var(--header-h))] sticky top-[var(--header-h)] overflow-y-auto"
        >
            <div className="p-4 space-y-5">

                {/* ── LATEST NEWS ── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <Megaphone size={12} className="text-[var(--navy)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Latest Updates</span>
                        </div>
                        {/* Live indicator */}
                        <span className="flex items-center gap-1 text-[8px] font-bold text-green-600">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                            </span>
                            LIVE
                        </span>
                    </div>

                    {newsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton h-16" />
                            ))}
                        </div>
                    ) : news.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
                            <Radio size={20} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-300">No updates yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {news.map((item, i) => <NewsCard key={item.id} item={item} index={i} />)}
                        </div>
                    )}
                </div>

                {/* ── DIVIDER ── */}
                <div className="h-px bg-slate-100" />

                {/* ── QUICK LINKS ── */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Links</p>
                    <div className="space-y-1">
                        {quickLinks.map((link, i) => (
                            <motion.button
                                key={i}
                                whileTap={{ scale: 0.98 }}
                                onClick={link.action}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 group transition-colors"
                            >
                                <div className={`w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center shrink-0 transition-colors ${link.color}`}>
                                    <link.icon size={13} />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 leading-none">{link.label}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">{link.desc}</p>
                                </div>
                                <ExternalLink size={10} className="text-slate-300 ml-auto shrink-0 group-hover:text-slate-400" />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* ── DIVIDER ── */}
                <div className="h-px bg-slate-100" />

                {/* ── STATS ── */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Platform Stats</p>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <StatRow value={stats?.total_students?.toLocaleString() || "4,000"} suffix="+" label="Students Registered" icon={Users} />
                        <StatRow value="50" suffix="+" label="Sarkari Services" icon={FileText} />
                        <StatRow value="100" suffix="%" label="Digital Process" icon={TrendingUp} />
                    </div>
                </div>

                {/* ── DIVIDER ── */}
                <div className="h-px bg-slate-100" />

                {/* ── TESTIMONIAL ── */}
                <div className="bg-[var(--navy)] rounded-2xl p-4 space-y-3">
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={11} className="text-[var(--amber)] fill-[var(--amber)]" />
                        ))}
                    </div>
                    <p className="text-[11px] text-white/80 leading-snug italic">
                        "Mool Niwas certificate 24 ghante mein mil gaya. Bahut acha service!"
                    </p>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">— Ramesh Kumar, Bikaner</p>
                </div>

                {/* Contact */}
                <div className="pb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Contact Us</p>
                    <a href="tel:+916377964293" className="flex items-center gap-2 text-[11px] font-bold text-[var(--navy)] hover:underline">
                        <span>+91 63779 64293</span>
                    </a>
                    <p className="text-[9px] text-slate-400 mt-0.5">Mon–Sat 9am–6pm</p>
                </div>
            </div>
        </aside>
    )
}
