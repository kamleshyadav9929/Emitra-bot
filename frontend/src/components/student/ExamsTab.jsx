import { useState } from "react"
import { Search, CheckCircle2 } from "lucide-react"

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
    
    // Derived categories from the filtered list (could be static too)
    const filterChips = ["ALL", "UG", "GOVT JOB", "MEDICAL", "ENGINEERING"]

    const displayedExams = filteredExamsList.filter(ex => {
        const cat = (ex.category || "UG").toUpperCase()
        if (activeFilter === "ALL") return true
        if (activeFilter === "GOVT JOB" && cat.includes("GOVT")) return true
        return cat === activeFilter
    })

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

                {/* Horizontal Filter Chips */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {filterChips.map(chip => (
                        <button
                            key={chip}
                            onClick={() => setActiveFilter(chip)}
                            className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
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
                {displayedExams.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        No exams found for this category.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {displayedExams.map((ex, idx) => {
                            const isSubscribed = subscribedExams.includes(ex.name)
                            return (
                                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="pr-4">
                                            <h4 className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-1">{ex.name}</h4>
                                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{ex.category || "UG"}</span>
                                        </div>
                                        {isSubscribed && (
                                            <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Subscribed
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Exam Date</p>
                                            <p className="text-xs font-bold text-slate-800">{ex.exam_date ? new Date(ex.exam_date).toLocaleDateString("en-IN") : "TBD"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-0.5">Last Date</p>
                                            <p className="text-xs font-bold text-red-600">{ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-IN") : "TBD"}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-auto">
                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) triggerSignIn()
                                                else handleToggleExamSubscription(ex.name)
                                            }}
                                            className={`flex-1 py-2 rounded-lg text-[11px] font-bold text-center transition-colors ${
                                                isSubscribed 
                                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                                    : "bg-[#e5effa] text-[#0a4a83] hover:bg-blue-100"
                                            }`}
                                        >
                                            {isSubscribed ? "Unsubscribe" : "Subscribe"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) triggerSignIn()
                                                else {
                                                    setWizardExamName(ex.name)
                                                    setIsWizardOpen(true)
                                                }
                                            }}
                                            className="flex-1 bg-[#0a4a83] hover:bg-[#164FA8] text-white py-2 rounded-lg text-[11px] font-bold text-center shadow-sm transition-colors"
                                        >
                                            Fill Form
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
