import { useState } from "react"
import { Search } from "lucide-react"

export default function ServicesTab({
    lang,
    services,
    flatServicesList,
    serviceSearch,
    setServiceSearch,
    handleAutoServiceRequest,
}) {
    const [activeCategory, setActiveCategory] = useState("ALL")

    const categories = ["ALL", ...Object.keys(services)]

    const filteredServices = flatServicesList.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(serviceSearch.toLowerCase())
        const matchCat = activeCategory === "ALL" || s.categoryKey === activeCategory
        return matchSearch && matchCat
    })

    return (
        <div className="animate-fadeIn text-left pb-24 relative z-10">
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="sticky top-0 z-20 bg-[#050508]/80 backdrop-blur-md pb-3 pt-2">
                    <div className="relative w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            value={serviceSearch}
                            onChange={e => setServiceSearch(e.target.value)}
                            placeholder={lang === 'EN' ? 'Search services...' : 'सेवाएं खोजें...'}
                            className="w-full bg-white/5 border border-white/10 text-white text-[13px] md:text-[14px] placeholder:text-slate-500 pl-11 pr-6 py-3 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 shadow-sm font-semibold"
                        />
                    </div>
                </div>

                {/* Horizontal Category Chips */}
                <div className="flex flex-wrap gap-2 pb-2">
                    {categories.map((catKey) => {
                        const label = catKey === "ALL" ? "All Services" : (services[catKey]?.label || catKey)
                        const isActive = activeCategory === catKey
                        return (
                            <button
                                key={catKey}
                                onClick={() => setActiveCategory(catKey)}
                                className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                    isActive 
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
                                        : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>

                {/* Service List */}
                {filteredServices.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        No service records matching selections.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredServices.map((svc, idx) => (
                            <div key={idx} className="bg-zinc-950/50 border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-white/15 hover:shadow-md transition-all duration-300">
                                <div className="flex-1 pr-4">
                                    <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug">{svc.name}</h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{svc.categoryLabel}</span>
                                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">₹{svc.price || '50'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAutoServiceRequest(svc)}
                                    className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all border-none cursor-pointer"
                                >
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
