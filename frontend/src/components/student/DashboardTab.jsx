import { ClipboardList, Award, BookOpen, Settings, MessageSquare, MapPin, ChevronRight, Bell, Calendar, User } from "lucide-react"

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
    subNotifications
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

            {/* Activity Summary (Compact) */}
            {user && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-center cursor-pointer" onClick={() => setActiveTab("status")}>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Active</p>
                        <p className="text-2xl font-black text-[#0a4a83]">{statsProgress.active || 0}</p>
                    </div>
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-center cursor-pointer" onClick={() => setActiveTab("status")}>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Completed</p>
                        <p className="text-2xl font-black text-emerald-600">{statsProgress.completed || 0}</p>
                    </div>
                    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm text-center cursor-pointer col-span-2 md:col-span-1" onClick={() => setActiveTab("exams")}>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Saved Exams</p>
                        <p className="text-2xl font-black text-indigo-600">{subscribedExams.length}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
