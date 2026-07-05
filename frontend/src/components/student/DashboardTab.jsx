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
            {/* Bento Stats Widgets Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Requests */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[var(--color-primary-fixed)] border-none rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-[180px] cursor-pointer hover:shadow-ambient transition-shadow group text-left"
                >
                    <div className="z-10 relative">
                        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-primary)]">TOTAL REQUESTS</p>
                        <p className="text-5xl font-extrabold text-[#0A1A40] mt-3 group-hover:scale-105 transition-transform origin-left">{statsProgress.total}</p>
                    </div>
                    <div className="flex items-center gap-2 z-10 relative mt-auto">
                        <ClipboardList size={16} className="text-[var(--color-primary)]" />
                        <span className="text-[13px] font-medium text-[var(--color-primary)]">Filing Forms Logged</span>
                    </div>
                    <ClipboardList size={140} strokeWidth={1} className="absolute -bottom-6 -right-6 text-white text-opacity-50 rotate-[-5deg] pointer-events-none z-0" />
                </div>

                {/* Under Review */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[var(--color-surface-low)] border-none shadow-sm rounded-xl p-6 flex flex-col justify-between h-[180px] relative overflow-hidden cursor-pointer hover:shadow-ambient transition-shadow text-left"
                >
                    <div className="z-10 relative">
                        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">UNDER REVIEW</p>
                        <p className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">{statsProgress.active}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto z-10 relative">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-[13px] font-medium text-gray-500">Operator Reviewing</span>
                    </div>
                    <Clock size={140} strokeWidth={1} className="absolute -bottom-6 -right-10 text-white/70 rotate-[10deg] pointer-events-none z-0" />
                </div>

                {/* Completed */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[var(--color-surface-lowest)] shadow-ambient border border-[var(--color-outline-variant)] rounded-xl p-6 flex flex-col justify-between h-[180px] cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden text-left"
                >
                    <div className="z-10 relative">
                        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">SUCCESSFULLY FILED</p>
                        <p className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">{statsProgress.completed}</p>
                    </div>
                    <div className="mt-auto flex justify-between items-end z-10 relative">
                        <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Completed Applications</p>
                        </div>
                        <CheckCircle2 size={24} className="text-emerald-250" />
                    </div>
                    <CheckCircle2 size={140} strokeWidth={1} className="absolute -bottom-8 -right-8 text-[#f3faff] rotate-[-15deg] pointer-events-none z-0" />
                </div>

                {/* Action Needed */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-rose-50/70 border border-rose-100/60 rounded-xl p-6 flex flex-col justify-between h-[180px] relative overflow-hidden cursor-pointer hover:shadow-ambient transition-shadow text-left"
                >
                    {statsProgress.actionRequired > 0 && (
                        <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse z-20"></div>
                    )}
                    <div className="z-10 relative">
                        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-rose-600">ACTION REQUIRED</p>
                        <p className="text-4xl font-extrabold text-rose-900 mt-4 tracking-tight">
                            {statsProgress.actionRequired} {statsProgress.actionRequired > 0 && <span className="font-bold text-sm text-red-500 ml-1">Urgent</span>}
                        </p>
                    </div>
                    <p className="text-[13px] font-bold text-rose-600 underline underline-offset-2 hover:text-red-700 transition-colors mt-auto z-10 relative">
                        Fix Rejected Forms
                    </p>
                    <AlertCircle size={140} strokeWidth={1} className="absolute -bottom-6 -right-10 text-rose-200/20 rotate-[10deg] pointer-events-none z-0" />
                </div>
            </div>

            {/* Quick Action Circular Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)]/60 rounded-xl p-6 shadow-sm">
                <button onClick={() => setActiveTab("exams")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:bg-[var(--color-primary-fixed)] transition-all duration-300">
                        <Award size={22} />
                    </div>
                    <span className="text-[12.5px] font-extrabold text-slate-700 group-hover:text-[var(--color-primary)] transition-colors">Select Exams</span>
                </button>

                <button onClick={() => setActiveTab("services")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-300">
                        <ClipboardList size={22} />
                    </div>
                    <span className="text-[12.5px] font-extrabold text-slate-700 group-hover:text-emerald-600 transition-colors">My Services</span>
                </button>

                <button onClick={() => setActiveTab("neet")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:bg-purple-100 transition-all duration-300">
                        <BookOpen size={22} />
                    </div>
                    <span className="text-[12.5px] font-extrabold text-slate-700 group-hover:text-purple-600 transition-colors">NEET Counselling</span>
                </button>

                <button onClick={() => setActiveTab("profile")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:bg-rose-100 transition-all duration-300">
                        <Settings size={22} />
                    </div>
                    <span className="text-[12.5px] font-extrabold text-slate-700 group-hover:text-rose-600 transition-colors">Profile Settings</span>
                </button>
            </div>

            {/* Subscribed Exams list */}
            <div className="space-y-4 text-left">
                <h3 className="text-[14.5px] font-extrabold text-slate-900 font-display">My Subscribed Exams</h3>
                {subscribedExams.length === 0 ? (
                    <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-8 text-center text-slate-450 max-w-md mx-auto space-y-3 shadow-sm hover:shadow-ambient transition-all duration-300 border-solid">
                        <Award size={24} className="mx-auto text-[var(--color-primary)] animate-bounce" />
                        <p className="text-[12.5px] font-bold text-slate-650">Select exams to start receiving updates</p>
                        <button onClick={() => setActiveTab("exams")} className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm border-none cursor-pointer">Choose Exams</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {exams.filter(ex => subscribedExams.includes(ex.name)).map((ex, exIdx) => {
                            const isClosed = ex.end_date ? new Date(ex.end_date) < new Date() : false
                            return (
                                <div key={exIdx} className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 shadow-sm hover:shadow-ambient hover:border-[var(--color-primary)]/30 transition-all duration-300 space-y-4 relative flex flex-col justify-between group border-solid">
                                    <span className="absolute top-4 right-4 text-[8.5px] font-extrabold text-[var(--color-primary)] bg-[var(--color-surface-low)] px-2 py-0.5 rounded border border-[var(--color-outline-variant)]">
                                        {ex.category || "UG"}
                                    </span>
                                    <div className="space-y-2">
                                        <h4 className="text-[13.5px] font-extrabold text-slate-900 pr-12 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{ex.name}</h4>
                                        
                                        <div className="space-y-1">
                                            <span className="text-slate-400 font-extrabold uppercase text-[8.5px] tracking-wider block">Closing Date</span>
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
                                        className="text-[var(--color-primary)] font-semibold text-[13px] hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer transition-colors border-none bg-transparent"
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
                <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-ambient hover:border-[var(--color-primary)]/30 transition-all duration-300 border-solid">
                    <div className="space-y-1">
                        <h4 className="text-[14px] font-extrabold text-slate-900 font-display">Direct Support Line</h4>
                        <p className="text-[12.5px] text-slate-400">Reach operator Kamlesh on WhatsApp instantly.</p>
                    </div>
                    <a 
                        href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%20Krishna%20Emitra!%20I%20have%20a%20support%20request.`}
                        target="_blank" rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer text-center decoration-none"
                    >
                        WhatsApp <MessageSquare size={13} />
                    </a>
                </div>

                <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-ambient hover:border-[var(--color-primary)]/30 transition-all duration-300 border-solid">
                    <div className="space-y-1">
                        <h4 className="text-[14px] font-extrabold text-slate-900 font-display">Digital Seva Center</h4>
                        <p className="text-[12.5px] text-slate-400">Main Market Road, Jodhpur, Rajasthan.</p>
                    </div>
                    <a 
                        href="https://maps.google.com"
                        target="_blank" rel="noreferrer"
                        className="px-4 py-2 bg-[var(--color-surface-low)] hover:bg-slate-100 text-slate-700 border border-[var(--color-outline-variant)] hover:border-slate-350 text-[13px] font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer decoration-none border-solid"
                    >
                        View Map <MapPin size={13} className="text-[var(--color-primary)]" />
                    </a>
                </div>
            </div>
        </div>
    )
}
