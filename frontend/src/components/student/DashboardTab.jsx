import { ClipboardList, Clock, CheckCircle2, AlertCircle, Award, BookOpen, Settings, MessageSquare, MapPin, ChevronRight } from "lucide-react"

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
    triggerSignIn
}) {
    return (
        <div className="space-y-8 text-left animate-fadeIn">
            {/* Bento Stats Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Total Requests */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[var(--color-primary-fixed)] border border-[var(--color-primary)]/10 shadow-sm rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-[180px] cursor-pointer hover:shadow-ambient transition-shadow group"
                >
                    <div className="z-10 relative">
                        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-primary)]">TOTAL APPLICATIONS / कुल आवेदन</p>
                        <p className="text-5xl font-extrabold text-[#0A1A40] mt-3 group-hover:scale-105 transition-transform origin-left">{statsProgress.total}</p>
                    </div>
                    <div className="flex items-center gap-2 z-10 relative">
                        <ClipboardList size={16} className="text-[var(--color-primary)]" />
                        <span className="text-[13px] font-medium text-[var(--color-primary)]">View Status Circulars</span>
                    </div>
                    <ClipboardList size={140} strokeWidth={1} className="absolute -bottom-6 -right-6 text-white text-opacity-50 rotate-[-5deg] pointer-events-none z-0" />
                </div>

                {/* Completed */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] shadow-sm rounded-xl p-6 flex flex-col justify-between h-[180px] cursor-pointer hover:shadow-ambient transition-shadow relative overflow-hidden"
                >
                    <div className="z-10 relative">
                        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-400">SUCCESSFULLY FILED / पूर्ण आवेदन</p>
                        <p className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">{statsProgress.completed}</p>
                    </div>
                    <div className="mt-auto flex justify-between items-end z-10 relative">
                        <div>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Receipts Issued</p>
                        </div>
                        <CheckCircle2 size={24} className="text-gray-200" />
                    </div>
                    <CheckCircle2 size={140} strokeWidth={1} className="absolute -bottom-8 -right-8 text-[#f3faff] rotate-[-15deg] pointer-events-none z-0" />
                </div>
            </div>

            {/* Ongoing Recruitments */}
            <div className="bg-white border border-slate-200 rounded-[16px] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                    <h3 className="text-[18px] font-semibold text-slate-900 tracking-tight">Ongoing Recruitments</h3>
                    <button onClick={() => setActiveTab("recruitments")} className="text-[13px] font-medium text-[#4162EE] hover:underline bg-transparent border-none cursor-pointer">
                        View All
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {exams.filter(ex => !ex.end_date || new Date(ex.end_date) >= new Date()).slice(0, 3).map((ex, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[12px] border border-[#4162EE] bg-white transition-shadow hover:shadow-md">
                            <div className="flex items-center gap-5">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ex.category || ex.name)}&background=random&color=fff&size=64&bold=true`} 
                                    alt={ex.category}
                                    className="w-[60px] h-[60px] rounded-full object-cover shadow-sm border border-slate-200"
                                />
                                <div className="space-y-1">
                                    <h4 className="text-[15px] font-semibold text-slate-800 uppercase tracking-tight line-clamp-2 pr-4">{ex.name}</h4>
                                    <p className="text-[14px] text-slate-500 uppercase">({ex.category || "GOVT"})</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        if (!user) triggerSignIn()
                                        else {
                                            setWizardExamName(ex.name)
                                            setIsWizardOpen(true)
                                        }
                                    }}
                                    className="px-8 py-2.5 bg-[#4162EE] hover:bg-[#3451D4] text-white text-[15px] font-medium rounded-[8px] transition-colors border-none shadow-sm cursor-pointer w-full sm:w-auto text-center"
                                >
                                    Apply Now
                                </button>
                                <span className="text-[13px] text-slate-600 font-medium">
                                    {ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "TBD"}
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {exams.filter(ex => !ex.end_date || new Date(ex.end_date) >= new Date()).length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-[14px]">
                            No ongoing recruitments at the moment.
                        </div>
                    )}
                </div>
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
