import { ClipboardList, Clock, CheckCircle2, AlertCircle, Award, BookOpen, Settings, MessageSquare, MapPin, ChevronRight } from "lucide-react"

export default function DashboardTab({
    user,
    statsProgress,
    setActiveTab,
    subscribedExams,
    exams,
    config,
    setActiveExamForTimeline
}) {
    return (
        <div className="space-y-8 text-left animate-fadeIn">
            {/* Welcome Header */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-container)] to-[var(--color-primary)] text-white rounded-2xl p-6 md:p-8 shadow-ambient border-none overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_40%)]" />
                <div className="space-y-1.5 relative z-10">
                    <span className="px-2.5 py-0.8 bg-white/20 border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider rounded-md inline-block">
                        Online Dashboard
                    </span>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1 font-display">
                        Namaste, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-[12.5px] text-slate-200 leading-normal font-normal">Welcome back! Manage your exam notifications and filing submissions securely.</p>
                </div>

                <div className="flex gap-3 relative z-10 w-full md:w-auto">
                    <button onClick={() => setActiveTab("exams")} className="flex-1 md:flex-initial px-5 py-2.5 bg-white hover:bg-slate-50 text-[var(--color-primary)] text-[12.5px] font-bold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-center border-none">
                        Select Exams
                    </button>
                    <button onClick={() => setActiveTab("services")} className="flex-1 md:flex-initial px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-[12.5px] font-bold rounded-xl transition-all cursor-pointer border-none">
                        Request Services
                    </button>
                </div>
            </div>

            {/* Bento Stats Widgets Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 group space-y-3.5 text-left">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Requests</span>
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center group-hover:scale-105 transition-transform"><ClipboardList size={16} /></div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{statsProgress.total}</p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Filing Forms Logged</p>
                    </div>
                </div>
                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 group space-y-3.5 text-left">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Under Review</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-605 flex items-center justify-center group-hover:scale-105 transition-transform"><Clock size={16} /></div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{statsProgress.active}</p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Operator Reviewing</p>
                    </div>
                </div>
                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 group space-y-3.5 text-left">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Completed</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform"><CheckCircle2 size={16} /></div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{statsProgress.completed}</p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Successfully Filed</p>
                    </div>
                </div>
                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 group space-y-3.5 text-left">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Action Needed</span>
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform"><AlertCircle size={16} /></div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{statsProgress.actionRequired}</p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Needs Attention</p>
                    </div>
                </div>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setActiveTab("exams")} className="bg-apple-canvas border border-apple-hairline hover:border-apple-ink/30 p-5 rounded-[18px] text-left shadow-sm hover:shadow-md transition-all duration-300 space-y-3 cursor-pointer group apple-active-scale border-solid">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center group-hover:scale-110 transition-transform"><Award size={18} /></div>
                    <div>
                        <p className="text-[13px] font-extrabold text-slate-900">Select Exams</p>
                        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Choose Alerts</p>
                    </div>
                </button>
                <button onClick={() => setActiveTab("services")} className="bg-apple-canvas border border-apple-hairline hover:border-apple-ink/30 p-5 rounded-[18px] text-left shadow-sm hover:shadow-md transition-all duration-300 space-y-3 cursor-pointer group apple-active-scale border-solid">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardList size={18} /></div>
                    <div>
                        <p className="text-[13px] font-extrabold text-slate-900">My Services</p>
                        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Filing Catalog</p>
                    </div>
                </button>
                <button onClick={() => setActiveTab("neet")} className="bg-apple-canvas border border-apple-hairline hover:border-apple-ink/30 p-5 rounded-[18px] text-left shadow-sm hover:shadow-md transition-all duration-300 space-y-3 cursor-pointer group apple-active-scale border-solid">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={18} /></div>
                    <div>
                        <p className="text-[13px] font-extrabold text-slate-900">NEET Counselling</p>
                        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Choice Guide</p>
                    </div>
                </button>
                <button onClick={() => setActiveTab("profile")} className="bg-apple-canvas border border-apple-hairline hover:border-apple-ink/30 p-5 rounded-[18px] text-left shadow-sm hover:shadow-md transition-all duration-300 space-y-3 cursor-pointer group apple-active-scale border-solid">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Settings size={18} /></div>
                    <div>
                        <p className="text-[13px] font-extrabold text-slate-900">Profile Settings</p>
                        <p className="text-[9.5px] text-slate-400 font-extrabold uppercase mt-0.5">Edit Account</p>
                    </div>
                </button>
            </div>

            {/* Subscribed Exams list */}
            <div className="space-y-4 text-left">
                <h3 className="text-[14.5px] font-extrabold text-slate-900 font-display">My Subscribed Exams</h3>
                {subscribedExams.length === 0 ? (
                    <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-8 text-center text-slate-400 max-w-md mx-auto space-y-3 shadow-sm hover:shadow-md transition-all duration-300 border-solid">
                        <Award size={24} className="mx-auto text-[var(--color-primary)] animate-bounce" />
                        <p className="text-[12.5px] font-bold text-slate-650">Select exams to start receiving updates</p>
                        <button onClick={() => setActiveTab("exams")} className="px-5 py-2.5 bg-apple-primary hover:bg-apple-primary-focus text-white text-[13px] font-semibold rounded-full transition-all apple-active-scale shadow-sm border-none cursor-pointer">Choose Exams</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {exams.filter(ex => subscribedExams.includes(ex.name)).map((ex, exIdx) => {
                            const isClosed = ex.end_date ? new Date(ex.end_date) < new Date() : false
                            return (
                                <div key={exIdx} className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 space-y-4 relative flex flex-col justify-between group border-solid">
                                    <span className="absolute top-4 right-4 text-[8.5px] font-extrabold text-[var(--color-primary)] bg-[var(--color-surface-low)] px-2 py-0.5 rounded border border-[var(--color-outline-variant)]">
                                        {ex.category || "UG"}
                                    </span>
                                    <div className="space-y-2">
                                        <h4 className="text-[13.5px] font-extrabold text-slate-900 pr-12 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{ex.name}</h4>
                                        
                                        <div className="space-y-1">
                                            <span className="text-slate-455 font-extrabold uppercase text-[8.5px] tracking-wider block">Closing Date</span>
                                            <span className={`text-[12.5px] font-extrabold ${isClosed ? "text-red-500" : "text-slate-900"}`}>
                                                {ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-IN") : "TBD"}
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            setActiveExamForTimeline(ex)
                                            setActiveTab("exams")
                                        }} 
                                        className="text-apple-primary font-semibold text-[13px] hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer transition-colors border-none bg-transparent"
                                    >
                                        View Timeline <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Support and Location Summary Dashboard Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 border-solid">
                    <div className="space-y-1">
                        <h4 className="text-[14px] font-extrabold text-slate-900 font-display">Direct Support Line</h4>
                        <p className="text-[12.5px] text-slate-400">Reach operator Kamlesh on WhatsApp instantly.</p>
                    </div>
                    <a 
                        href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%20Krishna%20Emitra!%20I%20have%20a%20support%20request.`}
                        target="_blank" rel="noreferrer"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-full shadow-sm flex items-center gap-1.5 transition-all apple-active-scale cursor-pointer text-center decoration-none"
                    >
                        WhatsApp <MessageSquare size={13} />
                    </a>
                </div>

                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 border-solid">
                    <div className="space-y-1">
                        <h4 className="text-[14px] font-extrabold text-slate-900 font-display">Digital Seva Center</h4>
                        <p className="text-[12.5px] text-slate-400">Main Market Road, Jodhpur, Rajasthan.</p>
                    </div>
                    <a 
                        href="https://maps.google.com"
                        target="_blank" rel="noreferrer"
                        className="px-5 py-2.5 bg-apple-canvas hover:bg-apple-canvas-parchment text-apple-ink/75 border border-apple-hairline hover:border-apple-ink/30 text-[13px] font-semibold rounded-full shadow-sm flex items-center gap-1.5 transition-all apple-active-scale cursor-pointer decoration-none border-solid"
                    >
                        View Map <MapPin size={13} className="text-apple-primary" />
                    </a>
                </div>
            </div>
        </div>
    )
}
