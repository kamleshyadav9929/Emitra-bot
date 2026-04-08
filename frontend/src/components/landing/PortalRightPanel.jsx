import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    MessageCircle,
    Phone,
    MapPin,
    UserPlus,
    Users,
    FileText,
    TrendingUp,
    Star,
    Radio,
    ChevronDown,
    ChevronUp,
    Clock
} from "lucide-react"
import useCountUp from "../../hooks/useCountUp"
import * as api from "../../api"

function MiniStat({ value, suffix, label, Icon, delay }) {
    const { count, ref } = useCountUp(value)
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-3 group"
        >
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
                <Icon size={14} />
            </div>
            <div>
                <div className="text-base font-black leading-none">{count}{suffix}</div>
                <div className="text-[9px] font-bold text-black/35 uppercase tracking-widest mt-0.5">{label}</div>
            </div>
        </motion.div>
    )
}

// News item — collapsible
function NewsItem({ item, index }) {
    const [expanded, setExpanded] = useState(false)

    const timeAgo = (dateStr) => {
        if (!dateStr) return ""
        const d = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now - d) / 1000)
        if (diff < 60) return "Just now"
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const examBadge = (exam) => {
        if (!exam || exam === "ALL") return "All Students"
        return exam
    }

    const isLong = item.message?.length > 120

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="border border-black/[0.07] rounded-xl overflow-hidden bg-black/[0.02] hover:bg-black/[0.04] transition-all"
        >
            <div className="p-3">
                {/* Top: exam badge + time */}
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-black text-white rounded-full">
                        {examBadge(item.exam)}
                    </span>
                    <span className="text-[8px] font-bold text-black/30 flex items-center gap-1">
                        <Clock size={8} />
                        {timeAgo(item.sent_at)}
                    </span>
                </div>

                {/* Message preview */}
                <p className="text-[11px] text-black/70 leading-relaxed font-medium">
                    {expanded ? item.message : item.preview}
                </p>

                {/* Expand/collapse if long */}
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-1.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                    >
                        {expanded ? (
                            <><ChevronUp size={9} /> Show less</>
                        ) : (
                            <><ChevronDown size={9} /> Read more</>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    )
}

export default function PortalRightPanel({ stats, config, onRegister, onTrack }) {
    const [news, setNews] = useState([])
    const [newsLoading, setNewsLoading] = useState(true)

    useEffect(() => {
        api.getPublicNews()
            .then(data => setNews(data.news || []))
            .catch(() => setNews([]))
            .finally(() => setNewsLoading(false))
    }, [])

    const quickLinks = [
        {
            label: "WhatsApp Help",
            icon: MessageCircle,
            action: () => window.open(`https://wa.me/${config?.whatsapp_number || "916377964293"}`, "_blank"),
            desc: "Chat with us"
        },
        {
            label: "Telegram Bot",
            icon: Phone,
            action: () => window.open(config?.telegram_bot_url || "https://t.me/Kamlesh6377_bot", "_blank"),
            desc: "Auto apply"
        },
        {
            label: "Track Status",
            icon: MapPin,
            action: onTrack,
            desc: "Check progress"
        },
        {
            label: "Register Now",
            icon: UserPlus,
            action: onRegister,
            desc: "Join for free"
        },
    ]

    return (
        <aside className="hidden xl:flex flex-col w-64 shrink-0 border-l border-black/[0.06] bg-white h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
            <div className="p-4 space-y-5">

                {/* ── LATEST NEWS ──────────────────────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                            <Radio size={11} className="text-black/60" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Latest News</p>
                        </div>
                        {/* Live dot */}
                        <span className="flex h-1.5 w-1.5 ml-auto">
                            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-black opacity-40"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-black opacity-60"></span>
                        </span>
                    </div>

                    {newsLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-black/[0.04] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-black/10 rounded-xl">
                            <Radio size={18} className="text-black/15 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-black/25">No broadcasts yet</p>
                            <p className="text-[9px] text-black/20 mt-0.5">Admin messages will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <AnimatePresence>
                                {news.map((item, i) => (
                                    <NewsItem key={item.id} item={item} index={i} />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <div className="h-px bg-black/[0.05]" />

                {/* ── QUICK LINKS ───────────────────────────────────────── */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/25 mb-3">Quick Links</p>
                    <div className="space-y-1">
                        {quickLinks.map((link, i) => {
                            const Icon = link.icon
                            return (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + i * 0.05 }}
                                    onClick={link.action}
                                    className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-black/[0.04] transition-all duration-200"
                                >
                                    <Icon size={13} className="text-black/40 group-hover:text-black transition-colors shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-black/70 group-hover:text-black transition-colors leading-none">
                                            {link.label}
                                        </p>
                                        <p className="text-[8px] font-medium text-black/30 mt-0.5">{link.desc}</p>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                </div>

                <div className="h-px bg-black/[0.05]" />

                {/* ── STATS ─────────────────────────────────────────────── */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/25 mb-3">Platform Stats</p>
                    <div className="space-y-3">
                        <MiniStat value={stats?.total_students || 0} suffix="+" label="Students Registered" Icon={Users} delay={0.1} />
                        <div className="h-px bg-black/[0.05]" />
                        <MiniStat value={50} suffix="+" label="Sarkari Services" Icon={FileText} delay={0.15} />
                        <div className="h-px bg-black/[0.05]" />
                        <MiniStat value={100} suffix="%" label="Digital Process" Icon={TrendingUp} delay={0.2} />
                    </div>
                </div>

                <div className="h-px bg-black/[0.05]" />

                {/* ── TESTIMONIAL ───────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 bg-black rounded-2xl space-y-2 text-white"
                >
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={9} className="text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <p className="text-[10px] font-semibold leading-snug opacity-90">
                        "Kal apply kiya aaj certificate aa gaya!"
                    </p>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-wider">
                        — Krishna E-Mitra User
                    </p>
                </motion.div>

                {/* Contact */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/25 mb-2">Contact</p>
                    <a href="tel:916377964293" className="text-[10px] font-bold text-black/50 hover:text-black transition-colors block">
                        +91 63779 64293
                    </a>
                </div>
            </div>
        </aside>
    )
}
