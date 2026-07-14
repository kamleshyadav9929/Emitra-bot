import { useState, useMemo, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import Fuse from "fuse.js"

export default function ServicesTab({
    lang,
    services,
    flatServicesList,
    serviceSearch,
    setServiceSearch,
    handleAutoServiceRequest,
}) {
    const [activeCategory, setActiveCategory] = useState("ALL")
    const [priceFilter, setPriceFilter] = useState("ALL")
    const inputRef = useRef(null)

    const categories = ["ALL", ...Object.keys(services)]

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
        return new Fuse(flatServicesList, {
            keys: ["name", "categoryLabel"],
            threshold: 0.35,
        })
    }, [flatServicesList])

    // Memoized filtered services catalog combining fuzzy search, category matching, and price filtering
    const filteredServices = useMemo(() => {
        let list = flatServicesList

        if (serviceSearch.trim()) {
            list = fuse.search(serviceSearch).map(res => res.item)
        }

        return list.filter(s => {
            const matchCat = activeCategory === "ALL" || s.categoryKey === activeCategory
            
            const price = parseFloat(s.price || 50)
            let matchPrice = true
            if (priceFilter === "UNDER_100") {
                matchPrice = price < 100
            } else if (priceFilter === "100_500") {
                matchPrice = price >= 100 && price <= 500
            } else if (priceFilter === "OVER_500") {
                matchPrice = price > 505
            }

            return matchCat && matchPrice
        })
    }, [flatServicesList, serviceSearch, activeCategory, priceFilter, fuse])

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
                            value={serviceSearch}
                            onChange={e => setServiceSearch(e.target.value)}
                            placeholder={lang === 'EN' ? 'Search services...' : 'सेवाएं खोजें...'}
                            className="w-full bg-white/5 border border-white/10 text-white text-[13px] md:text-[14px] placeholder:text-slate-500 pl-11 pr-16 py-3 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 shadow-sm font-semibold"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none select-none">
                            <kbd className="bg-white/5 text-slate-500 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">[ / ]</kbd>
                        </div>
                    </div>
                </div>

                {/* Horizontal Category Chips */}
                <div className="flex flex-wrap gap-2 pb-1">
                    {categories.map((catKey) => {
                        const label = catKey === "ALL" ? "All Services" : (services[catKey]?.label || catKey)
                        const isActive = activeCategory === catKey
                        return (
                            <button
                                key={catKey}
                                onClick={() => setActiveCategory(catKey)}
                                className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                    isActive 
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/10" 
                                        : "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>

                {/* Horizontal Price Filters */}
                <div className="flex flex-wrap gap-2 items-center pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-1.5 select-none">Price Range:</span>
                    {[
                        { id: "ALL", label: lang === 'EN' ? "All Prices" : "सभी दरें" },
                        { id: "UNDER_100", label: "Under ₹100" },
                        { id: "100_500", label: "₹100 - ₹500" },
                        { id: "OVER_500", label: "₹500+" }
                    ].map(p => {
                        const isActive = priceFilter === p.id
                        return (
                            <button
                                key={p.id}
                                onClick={() => setPriceFilter(p.id)}
                                className={`px-3 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
                                    isActive
                                        ? "bg-blue-500/15 text-blue-450 border-blue-500/25"
                                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {p.label}
                            </button>
                        )
                    })}
                </div>

                {/* Service List */}
                {filteredServices.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold bg-zinc-900/40 border border-white/15 border-dashed rounded-2xl">
                        No service records matching selections.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredServices.map((svc, idx) => (
                            <div key={idx} className="bg-zinc-900/70 border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-white/20 hover:shadow-md transition-all duration-300">
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
