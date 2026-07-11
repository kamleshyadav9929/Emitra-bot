import { useState } from "react"
import { Search, ExternalLink, Calendar, Building, ChevronRight, Award } from "lucide-react"

export default function OngoingRecruitmentsTab({ exams, setWizardExamName, setIsWizardOpen, isLoggedIn, triggerSignIn }) {
    const [searchQuery, setSearchQuery] = useState("")

    const ongoingExams = exams.filter(ex => !ex.end_date || new Date(ex.end_date) >= new Date())
    const filteredExams = ongoingExams.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || (ex.category && ex.category.toLowerCase().includes(searchQuery.toLowerCase())))

    const getLogoUrl = (url, fallback) => {
        if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallback || "EX")}&background=random&color=fff&size=128&bold=true`;
        try {
            let domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallback || "EX")}&background=random&color=fff&size=128&bold=true`;
        }
    }

    return (
        <div className="space-y-6 text-left animate-fadeIn">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[16px] p-4 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div>
                    <h2 className="text-[18px] md:text-[22px] font-bold text-slate-900 tracking-tight">Ongoing Recruitments</h2>
                    <p className="text-[12px] md:text-[14px] text-slate-500 mt-1">Browse and apply for the latest government jobs and examinations.</p>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search recruitments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-[280px] pl-10 pr-4 py-2 md:py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-[10px] text-[13px] md:text-[14px] focus:outline-none focus:border-[#4162EE] focus:ring-1 focus:ring-[#4162EE] transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredExams.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-slate-200 rounded-[16px]">
                        <Award size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-[15px] font-medium text-slate-600">No ongoing recruitments found.</p>
                    </div>
                ) : (
                    filteredExams.map((ex, idx) => (
                        <div key={idx} className="bg-white border border-[#4162EE]/20 hover:border-[#4162EE] rounded-[16px] p-4 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-5 group">
                            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                                <div className="w-[48px] md:w-[64px] h-[48px] md:h-[64px] shrink-0 rounded-full border border-slate-200 p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={getLogoUrl(ex.official_url, ex.category || ex.name)} 
                                        alt={ex.name}
                                        className="w-full h-full object-contain rounded-full"
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ex.category || ex.name)}&background=random&color=fff&size=128&bold=true`;
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[14px] sm:text-[18px] font-bold text-slate-800 uppercase tracking-tight leading-tight group-hover:text-[#4162EE] transition-colors">
                                        {ex.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[12px] md:text-[13px] text-slate-500 font-medium">
                                        {ex.category && (
                                            <span className="flex items-center gap-1">
                                                <Building size={14} /> {ex.category}
                                            </span>
                                        )}
                                        {ex.official_url && (
                                            <a href={ex.official_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#4162EE] hover:underline">
                                                <ExternalLink size={13} /> Official Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                                <button
                                    onClick={() => {
                                        if (!isLoggedIn) triggerSignIn()
                                        else {
                                            setWizardExamName(ex.name)
                                            setIsWizardOpen(true)
                                        }
                                    }}
                                    className="w-full sm:w-auto px-4 md:px-8 py-2 md:py-2.5 bg-[#4162EE] hover:bg-[#3451D4] text-white text-[13px] md:text-[15px] font-semibold rounded-[8px] transition-colors border-none shadow-sm cursor-pointer text-center"
                                >
                                    Apply Now
                                </button>
                                <span className="text-[12px] md:text-[13px] font-semibold text-slate-600 flex items-center gap-1.5 justify-center sm:justify-end">
                                    <Calendar size={14} className="text-slate-400" />
                                    {ex.end_date ? new Date(ex.end_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "TBD"}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
