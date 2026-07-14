import { useState, useMemo, useEffect, useRef } from "react"
import { Search, CheckCircle2, Calendar, FileText, Bell } from "lucide-react"
import Fuse from "fuse.js"

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
    const inputRef = useRef(null)
    
    // Derived categories from the filtered list (could be static too)
    const filterChips = ["ALL", "UG", "GOVT JOB", "MEDICAL", "ENGINEERING"]

    // Keyboard shortcut / listener to focus search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "/" && document.activeElement !== inputRef.current) {
                const activeTag = document.activeElement?.tagName
                if (!["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) {
                    e.preventDefault()
                    inputRef.current?.focus()
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Memoized Fuse instance
    const fuse = useMemo(() => {
        return new Fuse(filteredExamsList, {
            keys: ["name", "category"],
            threshold: 0.35,
        })
    }, [filteredExamsList])

    // Memoized displayed exams
    const displayedExams = useMemo(() => {
        let list = filteredExamsList

        if (examSearch.trim()) {
            list = fuse.search(examSearch).map(res => res.item)
        }

        return list.filter(ex => {
            const cat = (ex.category || "UG").toUpperCase()
            if (activeFilter === "ALL") return true
            if (activeFilter === "GOVT JOB" && cat.includes("GOVT")) return true
            return cat === activeFilter
        })
    }, [filteredExamsList, examSearch, activeFilter, fuse])

    const upcomingExams = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0)
        return displayedExams.filter(ex => ex.end_date && new Date(ex.end_date) >= new Date(today))
    }, [displayedExams])

    const examsToRender = tabMode === "upcoming" ? upcomingExams : displayedExams

    return (
        <div className="animate-fadeIn text-left pb-24 relative z-10">
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="sticky top-0 z-20 bg-[#050508]/80 backdrop-blur-md pb-3 pt-2">
                    <div className="relative w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            ref={inputRef}
                            type="text"
                            value={examSearch}
                            onChange={e => setExamSearch(e.target.value)}
                            placeholder="Search exams..."
                            className="w-full bg-white/5 border border-white/10 text-white text-[13px] md:text-[14px] placeholder:text-slate-500 pl-11 pr-16 py-3 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 shadow-sm font-semibold"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none select-none">
                            <kbd className="bg-white/5 text-slate-500 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">[ / ]</kbd>
                        </div>
                    </div>
                </div>

                {/* Internal Tabs */}
                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-2">
                    <button
                        onClick={() => setTabMode("upcoming")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                            tabMode === "upcoming" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Calendar size={16} /> Upcoming Exams
                    </button>
                    <button
                        onClick={() => setTabMode("all")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                            tabMode === "all" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
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
                            className={`px-4 py-1.5 rounded-full text-[12px] font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
                                activeFilter === chip 
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
                                    : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
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
                                <div key={idx} className="bg-zinc-950/50 border border-white/5 p-4 rounded-xl shadow-sm relative flex flex-col justify-between hover:border-white/15 hover:shadow-md transition-all duration-300">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="pr-4">
                                            <h4 className="text-[14px] font-bold text-slate-200 leading-snug line-clamp-2">{ex.name}</h4>
                                            <span className="text-[10px] font-black tracking-widest text-slate-450 uppercase mt-1 inline-block">{ex.category || "UG"}</span>
                                        </div>
                                        {tabMode === "all" && isSubscribed && (
                                            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                                <CheckCircle2 size={10} /> Subscribed
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        {ex.exam_date && (
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Exam Date</p>
                                                <p className="text-xs font-bold text-slate-350">{new Date(ex.exam_date).toLocaleDateString("en-IN")}</p>
                                            </div>
                                        )}
                                        {ex.end_date && (
                                            <div>
                                                <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-0.5">Last Date</p>
                                                <p className="text-xs font-bold text-red-400">{new Date(ex.end_date).toLocaleDateString("en-IN")}</p>
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
                                                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 border-none ${
                                                    isSubscribed 
                                                        ? "bg-white/5 text-slate-400 hover:bg-white/10" 
                                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                                                }`}
                                            >
                                                <Bell size={14} /> {isSubscribed ? "Unsubscribe" : "Subscribe to Alerts"}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        alert("Details will be available soon!")
                                                    }}
                                                    className="flex-1 py-2.5 rounded-lg text-[12px] font-bold text-center transition-colors bg-white/5 text-slate-300 hover:bg-white/10 border-none cursor-pointer flex items-center justify-center gap-2"
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
                                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2.5 rounded-lg text-[12px] font-bold text-center shadow-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2"
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
                <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 text-white px-5 py-2.5 rounded-full text-[12px] font-bold shadow-lg z-[100] animate-fadeIn whitespace-nowrap flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    {toast}
                </div>
            )}
        </div>
    )
}
