import { useState } from "react"
import { Search, CheckCircle2, Calendar, FileText, Bell } from "lucide-react"

export default function ExamsTab({
    subscribedExams,
    handleToggleExamSubscription,
    examSearch,
    setExamSearch,
    filteredExamsList,
    triggerSignIn,
    setWizardExamName,
    setIsWizardOpen,
    isLoggedIn
}) {
    const [activeFilter, setActiveFilter] = useState("ALL")
    const [tabMode, setTabMode] = useState("upcoming") // 'upcoming' | 'all'
    const [toast, setToast] = useState(null)
    
    // Derived categories from the filtered list (could be static too)
    const filterChips = ["ALL", "UG", "GOVT JOB", "MEDICAL", "ENGINEERING"]

    const displayedExams = filteredExamsList.filter(ex => {
        const cat = (ex.category || "UG").toUpperCase()
        if (activeFilter === "ALL") return true
        if (activeFilter === "GOVT JOB" && cat.includes("GOVT")) return true
        return cat === activeFilter
    })

    const upcomingExams = displayedExams.filter(ex => ex.end_date && new Date(ex.end_date) >= new Date(new Date().setHours(0,0,0,0)))

    const examsToRender = tabMode === "upcoming" ? upcomingExams : displayedExams

    return (
        <div className="animate-fadeIn text-left pb-24">
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="sticky top-0 z-20 bg-[var(--color-surface-base)] pb-3 pt-2">
                    <div className="relative w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            value={examSearch}
                            onChange={e => setExamSearch(e.target.value)}
                            placeholder="Search exams..."
                            className="w-full bg-white border border-slate-200 text-[13px] md:text-[14px] placeholder:text-slate-400 pl-11 pr-6 py-3 rounded-xl focus:outline-none focus:border-[#0a4a83] shadow-sm font-semibold"
                        />
                    </div>
                </div>

                {/* Internal Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                    <button
                        onClick={() => setTabMode("upcoming")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                            tabMode === "upcoming" ? "bg-white text-[#0a4a83] shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <Calendar size={16} /> Upcoming Exams
                    </button>
                    <button
                        onClick={() => setTabMode("all")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                            tabMode === "all" ? "bg-white text-[#0a4a83] shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <Bell size={16} /> Exam Alerts
                    </button>
                </div>

                {/* Horizontal Filter Chips */}
                <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                    {filterChips.map(chip => (
                        <button
                            key={chip}
                            onClick={() => setActiveFilter(chip)}
                            className={`px-4 py-1.5 rounded-full text-[12px] font-bold shrink-0 whitespace-nowrap transition-colors ${
                                activeFilter === chip 
                                    ? "bg-[#0a4a83] text-white" 
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Exam List */}
                {examsToRender.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                        {tabMode === "upcoming" ? "No upcoming exams found in this category." : "No exams found for this category."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {examsToRender.map((ex, idx) => {
                            const isSubscribed = subscribedExams.includes(ex.name)
                            return (
                                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="pr-4">
                                            <h4 className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-2">{ex.name}</h4>
                                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1 inline-block">{ex.category || "UG"}</span>
                                        </div>
                                        {tabMode === "all" && isSubscribed && (
                                            <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                                <CheckCircle2 size={10} /> Subscribed
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        {ex.exam_date && (
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Exam Date</p>
                                                <p className="text-xs font-bold text-slate-800">{new Date(ex.exam_date).toLocaleDateString("en-IN")}</p>
                                            </div>
                                        )}
                                        {ex.end_date && (
                                            <div>
                                                <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-0.5">Last Date</p>
                                                <p className="text-xs font-bold text-red-600">{new Date(ex.end_date).toLocaleDateString("en-IN")}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-auto">
                                        {tabMode === "all" ? (
                                            <button
                                                onClick={() => {
                                                    if (!isLoggedIn) triggerSignIn()
                                                    else {
                                                        handleToggleExamSubscription(ex.name)
                                                        setToast(isSubscribed ? `Unsubscribed from ${ex.name}` : `Subscribed to ${ex.name} alerts!`)
                                                        setTimeout(() => setToast(null), 3000)
                                                    }
                                                }}
                                                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold text-center transition-colors flex items-center justify-center gap-2 ${
                                                    isSubscribed 
                                                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                                        : "bg-[#e5effa] text-[#0a4a83] hover:bg-blue-100"
                                                }`}
                                            >
                                                <Bell size={14} /> {isSubscribed ? "Unsubscribe from Alerts" : "Subscribe to Alerts"}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        alert("Details will be available soon!")
                                                    }}
                                                    className="flex-1 py-2.5 rounded-lg text-[12px] font-bold text-center transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-2"
                                                >
                                                    <FileText size={14} /> View Details
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (!isLoggedIn) triggerSignIn()
                                                        else {
                                                            setWizardExamName(ex.name)
                                                            setIsWizardOpen(true)
                                                        }
                                                    }}
                                                    className="flex-1 bg-[#0a4a83] hover:bg-[#164FA8] text-white py-2.5 rounded-lg text-[12px] font-bold text-center shadow-sm transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} /> Fill Form
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-full text-[12px] font-bold shadow-lg z-[100] animate-fadeIn whitespace-nowrap flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    {toast}
                </div>
            )}
        </div>
    )
}
