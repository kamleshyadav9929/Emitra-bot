import { Search, Info, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function StatusTab({ history, isLoggedIn, triggerSignIn, lang }) {
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
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-1">
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

                        return (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
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
                                    <button className="text-[12px] font-bold text-[#0a4a83] hover:underline">
                                        View Timeline
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
