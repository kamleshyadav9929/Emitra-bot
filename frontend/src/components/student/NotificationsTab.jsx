import { useState } from "react"
import { Bell, CheckCircle2 } from "lucide-react"

export default function NotificationsTab({ notifications, formatMessage, onMarkRead, readIds, onMarkAllRead, lang }) {
    const [filter, setFilter] = useState("all")

    const filtered = notifications.filter(n => {
        if (filter === "all") return true
        if (filter === "exams") return n.type === "broadcast" || n.title?.toLowerCase().includes("exam")
        if (filter === "services") return n.type === "announcement" && !n.title?.toLowerCase().includes("exam")
        return true
    })

    return (
        <div className="space-y-4 pb-20 relative z-10 text-left">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold text-white">Notifications</h3>
                    <p className="text-xs text-slate-400">Updates and alerts</p>
                </div>
                <button 
                    onClick={onMarkAllRead}
                    className="text-xs font-bold text-blue-400 hover:text-blue-350 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                    <CheckCircle2 size={14} /> Mark all read
                </button>
            </div>

            <div className="flex flex-wrap gap-2 pb-2">
                {["all", "exams", "services"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                            filter === f 
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
                                : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={20} className="text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-sm">No notifications found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(ann => {
                        const isRead = readIds.includes(ann.id)
                        return (
                            <div 
                                key={ann.id}
                                onClick={() => onMarkRead(ann.id)}
                                className={`rounded-xl p-4 shadow-sm border cursor-pointer transition-all duration-300 ${
                                    isRead 
                                        ? 'bg-zinc-900/40 border-white/10 opacity-70 hover:opacity-90 hover:border-white/15' 
                                        : 'bg-zinc-900/80 border-[#4162EE]/50 hover:border-[#4162EE]/70 shadow-md shadow-[#4162EE]/5'
                                }`}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-0.5 relative shrink-0">
                                        <Bell size={16} className={isRead ? "text-slate-500" : "text-blue-400"} />
                                        {!isRead && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-zinc-900"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] text-slate-200 leading-relaxed announcement-content text-left">
                                            {formatMessage(ann.content)}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-550 font-bold uppercase">
                                                {new Date(ann.created_at || ann.sent_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                                            </span>
                                            {ann.links && (
                                                <a 
                                                    href={ann.links} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline"
                                                >
                                                    View Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
