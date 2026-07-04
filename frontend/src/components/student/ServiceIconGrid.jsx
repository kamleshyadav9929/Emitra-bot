import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    CreditCard, Zap, GraduationCap, Shield, Car,
    FileSignature, FileText, CheckCircle2, Clock,
    MessageCircle, ArrowRight, X
} from "lucide-react"
import { useOutsideClick } from "../../hooks/useOutsideClick"

const CATEGORY_META = {
    id:        { icon: CreditCard,    bg: "bg-[#e1f5fe]", text: "text-[#0288d1]" },
    bills:     { icon: Zap,           bg: "bg-[#fff3e0]", text: "text-[#f57c00]" },
    forms:     { icon: GraduationCap, bg: "bg-[#e8f5e9]", text: "text-[#388e3c]" },
    schemes:   { icon: Shield,        bg: "bg-[#ffebee]", text: "text-[#d32f2f]" },
    land_auto: { icon: Car,           bg: "bg-[#e0f2f1]", text: "text-[#00796b]" },
    cert:      { icon: FileSignature, bg: "bg-[#eef2ff]", text: "text-[#4f46e5]" },
    default:   { icon: FileText,      bg: "bg-[#f5f5f7]", text: "text-[#86868b]" },
}

// ── Detail overlay card (Premium iOS Modal Sheet) ───────────────────────────────
function ServiceDetailCard({ svc, catKey, categoryLabel, onClose, onApply }) {
    const ref = useRef(null)
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const Icon = meta.icon
    useOutsideClick(ref, onClose)

    useEffect(() => {
        document.body.style.overflow = "hidden"
        const esc = (e) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", esc)
        return () => { document.body.style.overflow = "auto"; window.removeEventListener("keydown", esc) }
    }, [])

    return (
        <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#1d1d1f]/40 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal Sheet */}
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
                className="relative w-full max-w-[460px] bg-white rounded-[32px] overflow-hidden border border-[#e5e5e7] shadow-[0_24px_60px_rgba(0,0,0,0.12)] z-10"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full flex items-center justify-center transition-colors z-20"
                >
                    <X size={15} className="text-[#1d1d1f]" />
                </button>

                {/* Content Body */}
                <div className="p-6 md:p-8 space-y-6">
                    {/* Header Row */}
                    <div className="flex gap-4 items-start pt-3">
                        <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0 border border-gray-100`}>
                            <Icon size={26} className={meta.text} strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 pr-8">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-1">{categoryLabel}</p>
                            <h3 className="text-xl font-bold text-[#1d1d1f] leading-snug tracking-tight font-sans break-words">{svc.name}</h3>
                        </div>
                    </div>

                    {/* Metadata pill row */}
                    <div className="flex items-center gap-3">
                        <span className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#f5f5f7] text-[#0071e3] border border-[#e5e5e7]">
                            {svc.price ? `₹${svc.price}` : "Free Service"}
                        </span>
                        <span className="text-[11px] font-medium text-[#86868b] flex items-center gap-1.5">
                            <Clock size={12} /> Instant Digital Delivery
                        </span>
                    </div>

                    {/* Service description section */}
                    <div className="bg-[#f5f5f7] rounded-2xl p-5 space-y-4 border border-[#e5e5e7]/60">
                        <p className="text-[13px] text-[#1d1d1f] leading-relaxed font-normal">
                            {svc.description || "Apply for this government service quickly and easily through Krishna Emitra. Our team will process your application and keep you updated via WhatsApp & Telegram."}
                        </p>
                        
                        <div className="h-[1px] bg-[#e5e5e7]" />

                        <div className="space-y-2.5">
                            {["100% Secure & Digital Processing", "Real-Time Updates via WhatsApp", "Officially Verified Certificate"].map((f) => (
                                <div key={f} className="flex items-center gap-2.5">
                                    <CheckCircle2 size={13} className="text-[#0071e3]" />
                                    <p className="text-[12px] font-medium text-[#1d1d1f]">{f}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Large Apply Button */}
                    <div className="space-y-3">
                        <button
                            onClick={() => { onApply(svc); onClose() }}
                            className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-[14px] rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
                        >
                            <MessageCircle size={15} />
                            Apply via WhatsApp
                        </button>
                        <p className="text-[10px] text-center font-medium text-[#86868b] tracking-wide">
                            A direct WhatsApp chat will be initiated with our support desk.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// ── Service Card (App Store Card Aesthetic) ──────────────────────────────────
function ServiceCard({ svc, catKey, categoryLabel, onApply }) {
    const [expanded, setExpanded] = useState(false)
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const Icon = meta.icon

    return (
        <>
            <AnimatePresence>
                {expanded && (
                    <ServiceDetailCard
                        svc={svc}
                        catKey={catKey}
                        categoryLabel={categoryLabel}
                        onClose={() => setExpanded(false)}
                        onApply={onApply}
                    />
                )}
            </AnimatePresence>

            <motion.div
                onClick={() => setExpanded(true)}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="flex flex-col justify-between p-6 rounded-[24px] cursor-pointer transition-all bg-white border border-[#e5e5e7] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] group relative overflow-hidden"
            >
                {/* Header info */}
                <div className="flex gap-4 items-start min-w-0 mb-5">
                    <div className={`w-11 h-11 ${meta.bg} rounded-xl flex items-center justify-center shrink-0 border border-gray-50`}>
                        <Icon size={20} className={meta.text} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-0.5">{categoryLabel}</p>
                        <h4 className="text-[14.5px] font-semibold text-[#1d1d1f] leading-snug tracking-tight font-sans group-hover:text-[#0071e3] transition-colors break-words pr-4">{svc.name}</h4>
                        <p className="text-[12.5px] text-[#86868b] line-clamp-2 mt-1.5 font-normal leading-normal">{svc.description || "Apply online with direct assistance."}</p>
                    </div>
                </div>

                {/* Footer action block */}
                <div className="flex items-center justify-between border-t border-[#f5f5f7] pt-4 mt-auto">
                    <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                        {svc.price ? `₹${svc.price}` : "Free"}
                    </span>

                    {/* App Store "GET" Button Capsule */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
                        className="shrink-0 px-5 py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] group-hover:bg-[#0071e3] text-[#0071e3] group-hover:text-white text-[12px] font-bold rounded-full transition-all tracking-wider uppercase active:scale-95"
                    >
                        Apply
                    </button>
                </div>
            </motion.div>
        </>
    )
}

// ── Category Section Title ────────────────────────────────────────────────────
function CategoryHeader({ label, index, id, catKey }) {
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const Icon = meta.icon
    return (
        <div id={id} className="mb-5 scroll-mt-20 flex items-center gap-3">
            <div className={`w-7 h-7 ${meta.bg} rounded-lg flex items-center justify-center shrink-0 border border-gray-50`}>
                <Icon size={13} className={meta.text} />
            </div>
            <h2 className="text-[14.5px] font-bold text-[#1d1d1f] tracking-tight">{label}</h2>
            <span className="text-[10px] font-bold text-[#d2d2d7] tabular-nums tracking-widest ml-auto">
                {String(index + 1).padStart(2, "0")}
            </span>
        </div>
    )
}

// ── Main Grid Container ────────────────────────────────────────────────────────
export default function ServiceIconGrid({ services, activeCategory, onServiceClick }) {
    const filtered = activeCategory === "ALL"
        ? Object.entries(services)
        : Object.entries(services).filter(([key]) => key === activeCategory)

    return (
        <div className="space-y-12">
            {filtered.map(([key, cat], catIdx) => (
                <div key={key}>
                    <CategoryHeader label={cat.label} index={catIdx} id={`cat-${key}`} catKey={key} />
                    
                    {/* Bento Grid structure for Apple Look */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(cat.services || []).map(svc => (
                            <ServiceCard
                                key={svc.name}
                                svc={svc}
                                catKey={key}
                                categoryLabel={cat.label}
                                onApply={(s) => onServiceClick({ ...s, category: cat.label, catKey: key })}
                            />
                        ))}
                    </div>

                    {(cat.services || []).length === 0 && (
                        <div className="text-center py-12 bg-white border border-[#e5e5e7] rounded-3xl">
                            <p className="text-[13px] text-[#86868b] font-medium">No services found in this category.</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
