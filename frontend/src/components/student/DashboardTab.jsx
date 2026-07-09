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
                    className="bg-[#e5effa] border border-[#0a4a83]/30 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-[160px] cursor-pointer hover:border-[#0a4a83] transition-all group text-left shadow-sm"
                >
                    <div className="z-10 relative">
                        <p className="text-[10px] font-black tracking-wider uppercase text-[#0a4a83]">TOTAL APPLICATIONS / कुल आवेदन</p>
                        <p className="text-4xl font-extrabold text-[#07355e] mt-3 group-hover:scale-105 transition-transform origin-left">{statsProgress.total}</p>
                    </div>
                    <div className="flex items-center gap-1.5 z-10 relative mt-auto text-[12px] font-bold text-[#0a4a83]">
                        <ClipboardList size={14} />
                        <span>View Status Circulars</span>
                    </div>
                </div>

                {/* Under Review */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[#fff4ee] border border-[#f26522]/30 rounded-xl p-5 flex flex-col justify-between h-[160px] relative overflow-hidden cursor-pointer hover:border-[#f26522] transition-all group text-left shadow-sm"
                >
                    <div className="z-10 relative">
                        <p className="text-[10px] font-black tracking-wider uppercase text-[#f26522]">UNDER REVIEW / लंबित आवेदन</p>
                        <p className="text-4xl font-extrabold text-[#b83b00] mt-3 group-hover:scale-105 transition-transform origin-left">{statsProgress.active}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-auto z-10 relative text-[12px] font-bold text-[#f26522]">
                        <Clock size={14} className="animate-pulse" />
                        <span>Operator Reviewing</span>
                    </div>
                </div>

                {/* Completed */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-[#e7f6e7] border border-[#138808]/30 rounded-xl p-5 flex flex-col justify-between h-[160px] cursor-pointer hover:border-[#138808] transition-all group relative overflow-hidden text-left shadow-sm"
                >
                    <div className="z-10 relative">
                        <p className="text-[10px] font-black tracking-wider uppercase text-[#138808]">SUCCESSFULLY FILED / पूर्ण आवेदन</p>
                        <p className="text-4xl font-extrabold text-[#0d5f05] mt-3 group-hover:scale-105 transition-transform origin-left">{statsProgress.completed}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between z-10 relative text-[12px] font-bold text-[#138808]">
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Receipts Issued</span>
                    </div>
                </div>

                {/* Action Needed */}
                <div 
                    onClick={() => setActiveTab("services")}
                    className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col justify-between h-[160px] relative overflow-hidden cursor-pointer hover:border-red-500 transition-all group text-left shadow-sm"
                >
                    {statsProgress.actionRequired > 0 && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-red-650 rounded-full animate-ping z-20"></div>
                    )}
                    <div className="z-10 relative">
                        <p className="text-[10px] font-black tracking-wider uppercase text-red-655">ACTION REQUIRED / त्रुटि सुधार</p>
                        <p className="text-4xl font-extrabold text-red-900 mt-3 group-hover:scale-105 transition-transform origin-left">
                            {statsProgress.actionRequired}
                        </p>
                    </div>
                    <span className="text-[11.5px] font-black text-red-655 uppercase tracking-wide underline underline-offset-2 hover:text-red-700 transition-colors mt-auto z-10 relative block">
                        Fix Rejected Forms
                    </span>
                </div>
            </div>

            {/* Quick Action Desk */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[#f8fafc] border border-slate-200 rounded-xl p-5 shadow-inner">
                <button onClick={() => setActiveTab("exams")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-[#0a4a83] flex items-center justify-center shadow-sm group-hover:border-[#0a4a83] group-hover:bg-[#e5effa] transition-all duration-200">
                        <Award size={18} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 group-hover:text-[#0a4a83] transition-colors">Select Exams / परीक्षा चयन</span>
                </button>

                <button onClick={() => setActiveTab("services")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-sm group-hover:border-emerald-600 group-hover:bg-emerald-50 transition-all duration-200">
                        <ClipboardList size={18} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">My Services / मेरी सेवाएं</span>
                </button>

                <button onClick={() => setActiveTab("neet")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-purple-600 flex items-center justify-center shadow-sm group-hover:border-purple-600 group-hover:bg-purple-50 transition-all duration-200">
                        <BookOpen size={18} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 group-hover:text-purple-600 transition-colors">NEET Desk / नीट हेल्प</span>
                </button>

                <button onClick={() => setActiveTab("profile")} className="flex flex-col items-center gap-2 group cursor-pointer border-none bg-transparent">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-[#f26522] flex items-center justify-center shadow-sm group-hover:border-[#f26522] group-hover:bg-[#fff4ee] transition-all duration-200">
                        <Settings size={18} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 group-hover:text-[#f26522] transition-colors">SSO Profile / प्रोफ़ाइल</span>
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
