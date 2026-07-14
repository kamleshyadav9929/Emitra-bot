import { useState } from "react"
import { Search, Info, CheckCircle, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

export default function StatusTab({ 
    history, 
    isLoggedIn, 
    triggerSignIn, 
    lang, 
    statsProgress, 
    subscribedExams,
    setActiveTab
}) {
    const [expandedItemId, setExpandedItemId] = useState(null)

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 relative z-10 animate-fadeIn">
                <div className="w-16 h-16 bg-white/5 text-blue-400 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Search size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Track Your Applications</h2>
                <p className="text-sm text-slate-400 mb-6 max-w-sm">Sign in to view your detailed application history, status updates, and download receipts.</p>
                <button onClick={triggerSignIn} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm border-none cursor-pointer">Sign In to Check Status</button>
            </div>
        )
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case "completed":
                return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, label: "Completed" }
            case "processing":
                return { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Clock, label: "Under Process" }
            case "pending":
                return { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: AlertCircle, label: "Pending" }
            default:
                return { color: "text-slate-400 bg-white/5 border-white/10", icon: Info, label: status }
        }
    }

    return (
        <div className="space-y-6 pb-20 animate-fadeIn relative z-10">
            {/* Activity Summary (Moved from Dashboard) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-zinc-950/50 p-4 border border-white/5 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active</p>
                    <p className="text-2xl font-black text-blue-400">{statsProgress?.active || 0}</p>
                </div>
                <div className="bg-zinc-950/50 p-4 border border-white/5 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-2xl font-black text-emerald-400">{statsProgress?.completed || 0}</p>
                </div>
                <div className="bg-zinc-950/50 p-4 border border-white/5 rounded-xl shadow-sm text-center col-span-2 md:col-span-1 cursor-pointer hover:border-white/15 hover:bg-zinc-900/50 transition-all" onClick={() => setActiveTab("exams")}>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saved Exams</p>
                    <p className="text-2xl font-black text-indigo-400">{subscribedExams?.length || 0}</p>
                </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-white/5 pt-6 text-left">
                <h3 className="text-lg font-bold text-white">Application Status</h3>
                <p className="text-xs text-slate-400">Track your exam forms and service requests</p>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/30">
                    <p className="text-slate-500 text-sm">No applications found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item, idx) => {
                        const statusInfo = getStatusInfo(item.status)
                        const Icon = statusInfo.icon
                        const isExpanded = expandedItemId === item.id

                        return (
                            <div key={idx} className="bg-zinc-950/50 border border-white/5 rounded-[24px] p-4 shadow-sm hover:border-white/15 transition-all duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-left">
                                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 block mb-1">
                                            {item.id} • {item.type === 'service' ? 'Service' : 'Exam Form'}
                                        </span>
                                        <h4 className="text-sm font-bold text-white leading-tight">{item.service_name}</h4>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap ${statusInfo.color}`}>
                                        <Icon size={12} />
                                        {statusInfo.label}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                    <div className="text-[11px] text-slate-450 font-medium">
                                        Submitted: {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <button 
                                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                        className="text-[12px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer bg-transparent border-none"
                                    >
                                        {isExpanded ? "Hide Timeline" : "View Timeline"}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-white/5 animate-fadeIn">
                                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                            
                                            <div className="relative flex items-center md:justify-center">
                                                <div className="hidden md:block w-1/2 pr-4 text-right">
                                                    <p className="text-[11px] font-bold text-slate-400">
                                                        {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#050508] shadow-sm z-10 mx-1 shrink-0 flex items-center justify-center">
                                                    <CheckCircle2 size={10} className="text-white" />
                                                </div>
                                                <div className="ml-4 md:ml-0 md:w-1/2 md:pl-4 text-left">
                                                    <p className="text-[12px] font-bold text-slate-200">Request Submitted</p>
                                                    <p className="text-[11px] font-bold text-slate-400 md:hidden mt-0.5">
                                                        {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.status !== "pending" && (
                                                <div className="relative flex items-center md:justify-center">
                                                    <div className="hidden md:block w-1/2 pr-4 text-right">
                                                        <p className="text-[11px] font-bold text-slate-400">
                                                            {new Date(item.updated_at || item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border-2 border-[#050508] shadow-sm z-10 mx-1 shrink-0 flex items-center justify-center ${
                                                        item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}>
                                                        {item.status === 'completed' ? <CheckCircle2 size={10} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                    </div>
                                                    <div className="ml-4 md:ml-0 md:w-1/2 md:pl-4 text-left">
                                                        <p className="text-[12px] font-bold text-slate-200">{item.status === 'completed' ? 'Processed' : 'Under Process'}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 md:hidden mt-0.5">
                                                            {new Date(item.updated_at || item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {item.remarks && (
                                                <div className="relative flex items-center md:justify-center mt-2">
                                                    <div className="hidden md:block w-1/2 pr-4 text-right">
                                                        <p className="text-[11px] font-bold text-amber-400">Operator Note</p>
                                                    </div>
                                                    <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-[#050508] shadow-sm z-10 mx-1 shrink-0 flex items-center justify-center">
                                                        <Info size={10} className="text-white" />
                                                    </div>
                                                    <div className="ml-4 md:ml-0 md:w-1/2 md:pl-4 text-left">
                                                        <div className="bg-amber-500/10 border border-amber-550/20 rounded-lg p-2.5 inline-block">
                                                            <p className="text-[11px] font-bold text-amber-300 leading-snug">{item.remarks}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
