import { ClipboardList, Award, BookOpen, Settings, MessageSquare, MapPin, ChevronRight, Bell, Calendar, User, FileText, CheckCircle, Clock, AlertCircle, Info } from "lucide-react"

export default function DashboardTab({
    user,
    statsProgress,
    setActiveTab,
    subscribedExams,
    exams,
    config,
    setActiveExamForTimeline,
    setWizardExamName,
    setIsWizardOpen,
    triggerSignIn,
    lang,
    subNotifications,
    history = []
}) {
    const latestNotification = subNotifications && subNotifications.length > 0 ? subNotifications[0] : null;

    // Fast Nav Items
    const fastNav = [
        { id: "services", icon: ClipboardList, label: "Apply for Service", color: "bg-blue-50 text-blue-600" },
        { id: "exams", icon: Award, label: "Fill Exam Form", color: "bg-indigo-50 text-indigo-600" },
        { id: "status", icon: CheckCircle2Icon, label: "Check Status", color: "bg-emerald-50 text-emerald-600" },
        { id: "about", icon: MessageSquare, label: "Contact Help", color: "bg-orange-50 text-orange-600" },
    ]

    function CheckCircle2Icon(props) {
        return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case "completed":
                return { color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle, label: lang === 'EN' ? "Completed" : "पूरा हुआ" }
            case "processing":
                return { color: "text-blue-600 bg-blue-50 border-blue-100", icon: Clock, label: lang === 'EN' ? "Under Process" : "प्रक्रिया में" }
            case "pending":
                return { color: "text-amber-600 bg-amber-50 border-amber-100", icon: AlertCircle, label: lang === 'EN' ? "Pending" : "लंबित" }
            default:
                return { color: "text-slate-600 bg-slate-50 border-slate-100", icon: Info, label: status }
        }
    }

    return (
        <div className="space-y-6 md:space-y-8 text-left animate-fadeIn pb-20">
            {/* Header: Service Counter Feel */}
            <div className="pt-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {lang === 'EN' ? 'Namaste' : 'नमस्ते'}, {user ? user.name.split(' ')[0] : (lang === 'EN' ? 'Student' : 'विद्यार्थी')}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                    {lang === 'EN' ? 'What do you want to do today?' : 'आज आप क्या करना चाहते हैं?'}
                </p>
            </div>

            {/* Fast Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {fastNav.map((nav) => {
                    const Icon = nav.icon;
                    return (
                        <button 
                            key={nav.id}
                            onClick={() => setActiveTab(nav.id)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 hover:border-[#0a4a83]/30 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${nav.color} group-hover:scale-110 transition-transform`}>
                                <Icon size={22} />
                            </div>
                            <span className="text-xs md:text-sm font-bold text-slate-700 text-center">{nav.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Upcoming Deadlines (Compact) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Upcoming Deadlines</h3>
                    <button onClick={() => setActiveTab("exams")} className="text-[11px] font-bold text-[#0a4a83] hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exams.filter(ex => ex.end_date && new Date(ex.end_date) >= new Date()).slice(0, 2).map((ex, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1 pr-2">{ex.name}</h4>
                                    <p className="text-[11px] text-red-500 font-bold mt-0.5">
                                        Closes: {new Date(ex.end_date).toLocaleDateString("en-IN", {day:'numeric', month:'short'})}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (!user) triggerSignIn()
                                    else {
                                        setWizardExamName(ex.name)
                                        setIsWizardOpen(true)
                                    }
                                }}
                                className="bg-[#4162EE] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#3451D4]"
                            >
                                Apply
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Applications */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                        {lang === 'EN' ? 'Recent Applications' : 'हाल के आवेदन'}
                    </h3>
                    {history && history.length > 0 && (
                        <button 
                            onClick={() => setActiveTab("status")} 
                            className="text-[11px] font-bold text-[#0a4a83] hover:underline"
                        >
                            {lang === 'EN' ? 'Track All' : 'सभी ट्रैक करें'}
                        </button>
                    )}
                </div>
                {history && history.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {history.slice(0, 2).map((item, idx) => {
                            const statusInfo = getStatusInfo(item.status)
                            const StatusIcon = statusInfo.icon
                            
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => setActiveTab("status")}
                                    className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-[#0a4a83]/30 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1 pr-1">{item.service_name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 text-left">
                                                    {item.id} • {item.type === 'service' ? (lang === 'EN' ? 'Service' : 'सेवा') : (lang === 'EN' ? 'Exam Form' : 'परीक्षा फॉर्म')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 w-full">
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {lang === 'EN' ? 'Submitted' : 'जमा किया'}: {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold flex items-center gap-1 ${statusInfo.color}`}>
                                            <StatusIcon size={10} />
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center gap-2.5">
                        <p className="text-slate-500 text-xs font-semibold">
                            {lang === 'EN' ? 'No recent applications found' : 'कोई हालिया आवेदन नहीं मिला'}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setActiveTab("services")}
                                className="bg-[#4162EE] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#3451D4] cursor-pointer"
                            >
                                {lang === 'EN' ? 'Apply for Service' : 'सेवा के लिए आवेदन करें'}
                            </button>
                            <button 
                                onClick={() => setActiveTab("exams")}
                                className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-50 cursor-pointer"
                            >
                                {lang === 'EN' ? 'Fill Exam Form' : 'परीक्षा फॉर्म भरें'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

