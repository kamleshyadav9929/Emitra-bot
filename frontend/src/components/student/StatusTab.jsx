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
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Track Your Applications</h2>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">Sign in to view your detailed application history, status updates, and download receipts.</p>
                <button onClick={triggerSignIn} className="bg-[#0a4a83] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm">Sign In to Check Status</button>
            </div>
        )
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case "completed":
                return { color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle, label: "Completed" }
            case "processing":
                return { color: "text-blue-600 bg-blue-50 border-blue-100", icon: Clock, label: "Under Process" }
            case "pending":
                return { color: "text-amber-600 bg-amber-50 border-amber-100", icon: AlertCircle, label: "Pending" }
            default:
                return { color: "text-slate-600 bg-slate-50 border-slate-100", icon: Info, label: status }
        }
    }

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* Activity Summary (Moved from Dashboard) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Active</p>
                    <p className="text-2xl font-black text-[#0a4a83]">{statsProgress?.active || 0}</p>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-2xl font-black text-emerald-600">{statsProgress?.completed || 0}</p>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-center col-span-2 md:col-span-1 cursor-pointer hover:border-[#0a4a83]/30 transition-all" onClick={() => setActiveTab("exams")}>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Saved Exams</p>
                    <p className="text-2xl font-black text-indigo-600">{subscribedExams?.length || 0}</p>
                </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-800">Application Status</h3>
                <p className="text-xs text-slate-500">Track your exam forms and service requests</p>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-500 text-sm">No applications found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item, idx) => {
                        const statusInfo = getStatusInfo(item.status)
                        const Icon = statusInfo.icon
                        const isExpanded = expandedItemId === item.id

                        return (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-1">
                                            {item.id} • {item.type === 'service' ? 'Service' : 'Exam Form'}
                                        </span>
                                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.service_name}</h4>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap ${statusInfo.color}`}>
                                        <Icon size={12} />
                                        {statusInfo.label}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        Submitted: {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <button 
                                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                        className="text-[12px] font-bold text-[#0a4a83] hover:underline"
                                    >
                                        {isExpanded ? "Hide Timeline" : "View Timeline"}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                            
                                            <div className="relative flex items-center md:justify-center">
                                                <div className="hidden md:block w-1/2 pr-4 text-right">
                                                    <p className="text-[11px] font-bold text-slate-500">
                                                        {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10 mx-1 shrink-0 flex items-center justify-center">
                                                    <CheckCircle2 size={10} className="text-white" />
                                                </div>
                                                <div className="ml-4 md:ml-0 md:w-1/2 md:pl-4 text-left">
                                                    <p className="text-[12px] font-bold text-slate-800">Request Submitted</p>
                                                    <p className="text-[11px] font-bold text-slate-400 md:hidden mt-0.5">
                                                        {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.status !== "pending" && (
                                                <div className="relative flex items-center md:justify-center">
                                                    <div className="hidden md:block w-1/2 pr-4 text-right">
                                                        <p className="text-[11px] font-bold text-slate-500">
                                                            {new Date(item.updated_at || item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 mx-1 shrink-0 flex items-center justify-center ${
                                                        item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}>
                                                        {item.status === 'completed' ? <CheckCircle2 size={10} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                    </div>
                                                    <div className="ml-4 md:ml-0 md:w-1/2 md:pl-4 text-left">
                                                        <p className="text-[12px] font-bold text-slate-800">{item.status === 'completed' ? 'Processed' : 'Under Process'}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 md:hidden mt-0.5">
                                                            {new Date(item.updated_at || item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {item.remarks && (
                                                <div className="relative flex items-center md:justify-center mt-2">
                                                    <div className="hidden md:block w-1/2 pr-4 text-right">
                                                        <p className="text-[11px] font-bold text-amber-600">Operator Note</p>
                                                    </div>
                                                    <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10 mx-1 shrink-0 flex items-center justify-center">
                                                        <Info size={10} className="text-white" />
                                                    </div>
                                                    <div className="ml-4 md:ml-0 md:w-1/2 md:pl-4 text-left">
                                                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 inline-block">
                                                            <p className="text-[11px] font-bold text-amber-800 leading-snug">{item.remarks}</p>
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
