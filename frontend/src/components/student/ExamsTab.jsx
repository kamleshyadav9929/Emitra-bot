import { Search, ExternalLink, Sparkles, MessageSquare, ChevronRight } from "lucide-react"

export default function ExamsTab({
    activeExamForTimeline,
    setActiveExamForTimeline,
    subscribedExams,
    handleToggleExamSubscription,
    examSearch,
    setExamSearch,
    examCategoryFilter,
    setExamCategoryFilter,
    filteredExamsList,
    isLoggedIn,
    triggerSignIn,
    setWizardExamName,
    setIsWizardOpen,
    config,
    handleSaveExamSubscriptions
}) {
    return (
        <div className="space-y-8 animate-fadeIn text-left">
            {/* IF ACTIVE TIMELINE SELECTION LOADED */}
            {activeExamForTimeline ? (
                <div className="space-y-8">
                    {/* Details Header */}
                    <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-solid">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setActiveExamForTimeline(null)} 
                                    className="text-slate-400 hover:text-apple-primary hover:bg-apple-canvas-parchment px-3 py-1 rounded-lg text-[12px] font-bold cursor-pointer transition-colors border-none bg-transparent"
                                >
                                    ← Go Back
                                </button>
                                <span className="text-[9.5px] font-extrabold text-apple-primary bg-apple-surface-pearl border border-apple-divider-soft px-2 py-0.5 rounded tracking-wide uppercase">
                                    {activeExamForTimeline.category || "UG"}
                                </span>
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900 pr-12 line-clamp-1">{activeExamForTimeline.name}</h2>
                            <p className="text-[12.5px] text-slate-500 font-normal leading-relaxed">{activeExamForTimeline.description || "Official government recruitment listing."}</p>
                        </div>

                        <button
                            onClick={() => handleToggleExamSubscription(activeExamForTimeline.name)}
                            className={`px-5 py-2.5 text-[13px] font-semibold rounded-full transition-all apple-active-scale cursor-pointer border-solid ${
                                subscribedExams.includes(activeExamForTimeline.name)
                                    ? "bg-apple-canvas-parchment hover:bg-apple-hairline text-apple-ink/75 border border-apple-hairline"
                                    : "bg-apple-primary hover:bg-apple-primary-focus text-white shadow-sm border-none"
                            }`}
                        >
                            {subscribedExams.includes(activeExamForTimeline.name) ? "Unsubscribe Alerts" : "Subscribe Alerts"}
                        </button>
                    </div>

                    {/* Visual Timeline */}
                    <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-8 shadow-sm space-y-6 border-solid">
                        <h3 className="text-[14px] font-extrabold text-slate-900 border-b border-apple-divider-soft pb-3 font-display">Visual Examination Timeline</h3>
                        
                        <div className="relative flex justify-between items-center max-w-3xl mx-auto py-6 px-4">
                            <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2 z-0" />
                            
                            {[
                                { label: "Registration Start", date: activeExamForTimeline.start_date },
                                { label: "Registration Deadline", date: activeExamForTimeline.end_date },
                                { label: "Exam Date", date: activeExamForTimeline.exam_date }
                            ].map((item, idx) => {
                                const isUpcoming = item.date ? new Date(item.date) >= new Date() : true
                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 font-bold text-[11px] transition-colors ${
                                            isUpcoming 
                                                ? "bg-white border-slate-200 text-slate-400" 
                                                : "bg-apple-primary border-apple-primary text-white shadow-sm"
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`text-[10px] font-extrabold ${isUpcoming ? "text-slate-400" : "text-slate-800"}`}>{item.label}</span>
                                        <span className="text-[11px] font-bold text-slate-500 bg-apple-surface-pearl border border-apple-divider-soft px-2 py-0.5 rounded">{item.date ? new Date(item.date).toLocaleDateString("en-IN") : "TBD"}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Action Blocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 flex items-center justify-between shadow-sm hover:border-apple-ink/30 transition-all border-solid">
                            <div className="space-y-1 text-left">
                                <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">Official Website</h4>
                                <p className="text-[11.5px] text-slate-400">View official board notice.</p>
                            </div>
                            <a 
                                href={activeExamForTimeline.official_url} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 bg-apple-canvas hover:bg-apple-canvas-parchment text-apple-ink/75 border border-apple-hairline hover:border-apple-ink/30 text-[11px] font-semibold rounded-full shadow-sm transition-all apple-active-scale flex items-center gap-1.5 border-solid cursor-pointer decoration-none"
                            >
                                Official Link <ExternalLink size={12} />
                            </a>
                        </div>

                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 flex items-center justify-between shadow-sm hover:border-apple-ink/30 transition-all border-solid">
                            <div className="space-y-1 text-left">
                                <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">Filing Assistant</h4>
                                <p className="text-[11.5px] text-slate-400">Apply form via bureau desk.</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (!isLoggedIn) triggerSignIn()
                                    else {
                                        setWizardExamName(activeExamForTimeline.name)
                                        setIsWizardOpen(true)
                                    }
                                }}
                                className="px-4 py-2 bg-apple-primary hover:bg-apple-primary-focus text-white text-[11px] font-semibold rounded-full shadow-sm transition-all apple-active-scale flex items-center gap-1.5 cursor-pointer border-none"
                            >
                                Apply Now <Sparkles size={12} className="text-white animate-pulse" />
                            </button>
                        </div>

                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5 flex items-center justify-between shadow-sm hover:border-apple-ink/30 transition-all border-solid">
                            <div className="space-y-1 text-left">
                                <h4 className="text-[13.5px] font-extrabold text-slate-900 font-display">Ask Operator</h4>
                                <p className="text-[11.5px] text-slate-400">Ask support on WhatsApp.</p>
                            </div>
                            <a 
                                href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=${encodeURIComponent(`Hi Support! I have a question regarding the ${activeExamForTimeline.name} exam.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-full shadow-sm transition-all apple-active-scale flex items-center gap-1.5 border-solid cursor-pointer decoration-none text-center"
                            >
                                WhatsApp <MessageSquare size={12} />
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                // EXAMS SELECTION LIST
                <div className="space-y-6">
                    {/* List Header */}
                    <div className="border-b border-apple-divider-soft pb-4 space-y-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 font-display">Select Exam Circular Preferences</h2>
                            <p className="text-[11.5px] text-slate-400 mt-0.5">Subscribe to target notifications and countdown trackers.</p>
                        </div>

                        {/* Search & Category Filter chips */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-2">
                            {/* Search bar */}
                            <div className="relative w-full sm:w-72">
                                <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-apple-ink/40" />
                                <input 
                                    type="text"
                                    value={examSearch}
                                    onChange={e => setExamSearch(e.target.value)}
                                    placeholder="Search exam name..."
                                    className="w-full bg-apple-canvas border border-apple-hairline text-[14px] text-apple-ink placeholder:text-apple-ink/40 pl-11 pr-8 py-2.5 rounded-full focus:outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm font-semibold"
                                />
                            </div>

                            {/* Filter Chips */}
                            <div className="flex flex-wrap gap-2 items-center">
                                {["ALL", "SSC", "Railway", "Banking", "State PCS", "Defence", "Others"].map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => setExamCategoryFilter(chip)}
                                        className={`px-4 py-1.5 text-[13px] font-medium rounded-full border transition-all apple-active-scale cursor-pointer ${
                                            examCategoryFilter === chip 
                                                ? "bg-apple-canvas border-apple-primary-focus border-2 ring-1 ring-apple-primary-focus/20 text-apple-ink font-semibold" 
                                                : "bg-apple-canvas border-apple-hairline text-apple-ink/75 hover:border-apple-ink/40"
                                        }`}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Exams Grid */}
                    {filteredExamsList.length === 0 ? (
                        <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-16 text-center text-slate-450 border-solid">
                            No exams found matching preferences.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {filteredExamsList.map((ex) => {
                                const isSubbed = subscribedExams.includes(ex.name)
                                return (
                                    <div key={ex.id} className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-5.5 shadow-sm hover:shadow-md hover:border-apple-ink/30 transition-all duration-300 relative flex flex-col justify-between group border-solid">
                                        <div className="space-y-3.5 text-left">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8.5px] font-extrabold text-apple-primary bg-apple-surface-pearl border border-apple-divider-soft px-2 py-0.8 rounded uppercase tracking-wider">
                                                {ex.category || "UG"}
                                            </span>
                                            
                                            <label className="flex items-center gap-1.5 cursor-pointer" title={isSubbed ? "Subscribed Alert" : "Click to subscribe alert"}>
                                                <input 
                                                    type="checkbox"
                                                    checked={isSubbed}
                                                    onChange={() => handleToggleExamSubscription(ex.name)}
                                                    className="rounded-lg border-slate-350 text-apple-primary focus:ring-apple-primary w-4.5 h-4.5 cursor-pointer"
                                                />
                                            </label>
                                          </div>
                                          <h3 
                                              onClick={() => setActiveExamForTimeline(ex)}
                                              className="text-[14px] font-extrabold text-slate-900 group-hover:text-apple-primary cursor-pointer line-clamp-1 transition-colors"
                                          >
                                              {ex.name}
                                          </h3>
                                          <p className="text-[12px] text-slate-500 font-normal line-clamp-2 leading-relaxed">
                                              {ex.description || "Apply for recruitment programs with verified credentials."}
                                          </p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                                            <div>
                                                <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">End Date</span>
                                                <span className="text-[11.5px] font-extrabold text-slate-700">{ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-IN") : "TBD"}</span>
                                            </div>
                                            <button 
                                                onClick={() => setActiveExamForTimeline(ex)}
                                                className="text-apple-primary text-[11.5px] font-semibold hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform border-none bg-transparent"
                                            >
                                                Details &amp; Timeline →
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {/* Sticky saveSelections bottom banner */}
                    {isLoggedIn && (
                        <div className="sticky bottom-6 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-2xl p-5 flex items-center justify-between shadow-ambient border-none z-20 animate-slideUp">
                            <span className="text-[12.5px] font-bold text-white">
                                💼 <span className="text-white font-extrabold">{subscribedExams.length}</span> Exam Preferences Active
                            </span>
                            <button
                                onClick={() => {
                                    handleSaveExamSubscriptions(subscribedExams)
                                    alert("Subscriptions updated successfully!")
                                }}
                                className="px-5 py-2.5 bg-apple-canvas hover:bg-apple-canvas-parchment text-apple-primary text-[13px] font-semibold rounded-full transition-all apple-active-scale cursor-pointer border-none shadow-sm"
                            >
                                Save Selections
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
