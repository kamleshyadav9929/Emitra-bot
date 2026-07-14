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
        { id: "services", icon: ClipboardList, label: lang === 'EN' ? "Apply for Service" : "सेवा के लिए आवेदन", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        { id: "exams", icon: Award, label: lang === 'EN' ? "Fill Exam Form" : "परीक्षा फॉर्म भरें", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
        { id: "status", icon: CheckCircle2Icon, label: lang === 'EN' ? "Check Status" : "आवेदन स्थिति देखें", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        { id: "about", icon: MessageSquare, label: lang === 'EN' ? "Contact Help" : "सहायता डेस्क", color: "bg-orange-500/10 text-orange-450 border-orange-500/20" },
    ]

    function CheckCircle2Icon(props) {
        return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case "completed":
                return { 
                    color: "text-emerald-450 bg-emerald-500/10 border-emerald-500/20", 
                    icon: CheckCircle, 
                    label: lang === 'EN' ? "Completed" : "पूर्ण हुआ",
                    progressWidth: "w-full",
                    progressBarColor: "bg-emerald-500"
                }
            case "processing":
                return { 
                    color: "text-blue-450 bg-blue-500/10 border-blue-500/20", 
                    icon: Clock, 
                    label: lang === 'EN' ? "Under Process" : "प्रक्रिया में",
                    progressWidth: "w-2/3",
                    progressBarColor: "bg-blue-500 animate-pulse"
                }
            case "pending":
                return { 
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/20", 
                    icon: AlertCircle, 
                    label: lang === 'EN' ? "Pending" : "लंबित",
                    progressWidth: "w-1/3",
                    progressBarColor: "bg-amber-500"
                }
            default:
                return { 
                    color: "text-slate-400 bg-white/5 border-white/10", 
                    icon: Info, 
                    label: status,
                    progressWidth: "w-1/4",
                    progressBarColor: "bg-slate-550"
                }
        }
    }

    return (
        <div className="space-y-6 md:space-y-8 text-left animate-fadeIn pb-20">
            {/* Header: Service Counter Feel */}
            <div className="pt-2">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight font-display">
                    {lang === 'EN' ? 'Namaste' : 'नमस्ते'}, {user ? user.name.split(' ')[0] : (lang === 'EN' ? 'Student' : 'विद्यार्थी')}
                </h2>
                <p className="text-[13.5px] text-slate-400 font-semibold mt-1">
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
                            className="bg-zinc-900/70 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col items-center justify-center gap-3.5 hover:border-white/20 hover:bg-zinc-800/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group active:scale-97"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${nav.color} border transition-all duration-300 group-hover:scale-105`}>
                                <Icon size={20} />
                            </div>
                            <span className="text-xs md:text-[13px] font-bold text-slate-300 group-hover:text-white text-center transition-colors">{nav.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Upcoming Deadlines (Compact) */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        {lang === 'EN' ? 'Upcoming Deadlines' : 'आगामी समय सीमा'}
                    </h3>
                    <button onClick={() => setActiveTab("exams")} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer">
                        {lang === 'EN' ? 'View All' : 'सभी देखें'}
                    </button>
                </div>
                {exams && exams.filter(ex => ex.end_date && new Date(ex.end_date) >= new Date()).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exams.filter(ex => ex.end_date && new Date(ex.end_date) >= new Date()).slice(0, 2).map((ex, idx) => (
                            <div key={idx} className="bg-zinc-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-white/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-350">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[13px] font-bold text-white line-clamp-1 pr-2">{ex.name}</h4>
                                        <p className="text-[10.5px] text-red-400 font-bold mt-0.5 flex items-center gap-1">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
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
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-sm text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:opacity-95 transition-all active:scale-95 border-none cursor-pointer"
                                >
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-zinc-900/40 backdrop-blur-sm border border-white/15 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
                        <p className="text-slate-500 text-xs font-semibold">
                            {lang === 'EN' ? 'No upcoming exam deadlines' : 'कोई आगामी परीक्षा समय सीमा नहीं है'}
                        </p>
                        <button 
                            onClick={() => setActiveTab("exams")}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:opacity-95 cursor-pointer border-none"
                        >
                            {lang === 'EN' ? 'View Exam Catalog' : 'परीक्षा सूची देखें'}
                        </button>
                    </div>
                )}
            </div>

            {/* Recent Applications */}
            <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        {lang === 'EN' ? 'Recent Applications' : 'हाल के आवेदन'}
                    </h3>
                    {history && history.length > 0 && (
                        <button 
                            onClick={() => setActiveTab("status")} 
                            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                        >
                            {lang === 'EN' ? 'Track All' : 'सभी ट्रैक करें'}
                        </button>
                    )}
                </div>
                {history && history.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {history.slice(0, 2).map((item, idx) => {
                            const statusInfo = getStatusInfo(item.status)
                            const StatusIcon = statusInfo.icon
                            
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => setActiveTab("status")}
                                    className="bg-zinc-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-4.5 flex flex-col justify-between shadow-sm hover:border-white/20 hover:shadow-md transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <h4 className="text-[13px] font-bold text-white line-clamp-1 pr-1">{item.service_name}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                    {item.id} • {item.type === 'service' ? (lang === 'EN' ? 'Service' : 'सेवा') : (lang === 'EN' ? 'Exam Form' : 'परीक्षा फॉर्म')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Stepper / Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                                            <span>Progress Timeline</span>
                                            <span className="font-extrabold">{statusInfo.label}</span>
                                        </div>
                                        <div className="w-full bg-white/5 border border-white/5 h-2 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${statusInfo.progressWidth} ${statusInfo.progressBarColor}`} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5 w-full text-[10.5px]">
                                        <span className="text-slate-450 font-medium">
                                            {lang === 'EN' ? 'Submitted' : 'जमा किया'}: {new Date(item.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full border text-[9.5px] font-extrabold flex items-center gap-1 ${statusInfo.color}`}>
                                            <StatusIcon size={10} />
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-zinc-900/40 backdrop-blur-sm border border-white/15 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3">
                        <p className="text-slate-500 text-xs font-semibold">
                            {lang === 'EN' ? 'No recent applications found' : 'कोई हालिया आवेदन नहीं मिला'}
                        </p>
                        <div className="flex gap-2.5">
                            <button 
                                onClick={() => setActiveTab("services")}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-[10.5px] font-bold hover:opacity-95 cursor-pointer border-none"
                            >
                                {lang === 'EN' ? 'Apply for Service' : 'सेवा के लिए आवेदन करें'}
                            </button>
                            <button 
                                onClick={() => setActiveTab("exams")}
                                className="border border-white/10 bg-white/5 text-slate-350 px-4 py-2 rounded-xl text-[10.5px] font-bold hover:bg-white/10 backdrop-blur-sm cursor-pointer"
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

