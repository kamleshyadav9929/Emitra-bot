import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    CreditCard, Zap, GraduationCap, Shield, Car,
    FileSignature, FileText, CheckCircle2, Clock,
    MessageCircle, ArrowRight, X
} from "lucide-react"
import { useOutsideClick } from "../../hooks/useOutsideClick"

// ── All categories use the Bureau Blue palette only ───────────────────────────
// surface-container-low   = #e6f6ff  (tonal row bg)
// surface-container-lowest= #ffffff  (card bg)
// primary-fixed           = #d7e2ff  (icon bg, badge bg)
// primary                 = #003f87  (icon color, accent)
// primary-container       = #0056b3  (gradient end)
const CATEGORY_META = {
    id:        { icon: CreditCard    },
    bills:     { icon: Zap          },
    forms:     { icon: GraduationCap},
    schemes:   { icon: Shield       },
    land_auto: { icon: Car          },
    cert:      { icon: FileSignature},
    default:   { icon: FileText     },
}

// ── Detail overlay card ───────────────────────────────────────────────────────
function ServiceDetailCard({ svc, catKey, categoryLabel, onClose, onApply }) {
    const ref = useRef(null)
    const Icon = (CATEGORY_META[catKey] || CATEGORY_META.default).icon
    useOutsideClick(ref, onClose)

    useEffect(() => {
        document.body.style.overflow = "hidden"
        const esc = (e) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", esc)
        return () => { document.body.style.overflow = "auto"; window.removeEventListener("keydown", esc) }
    }, [])

    return (
        <div className="fixed inset-0 grid place-items-center z-[100]">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#071E27]/40 backdrop-blur-md"
            />

            {/* Card */}
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative w-full max-w-[460px] mx-4 bg-[var(--color-surface-lowest)] rounded-[24px] overflow-hidden shadow-ambient z-10"
            >
                {/* Blue gradient banner */}
                <div className="h-28 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-between px-7 relative overflow-hidden">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{categoryLabel}</p>
                        <h3 className="text-[19px] font-black text-white leading-tight font-display max-w-[270px]">{svc.name}</h3>
                    </div>
                    <Icon size={72} strokeWidth={1} className="text-white/10 absolute right-4 bottom-2" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={13} className="text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[var(--color-primary-fixed)] text-[var(--color-primary)]">
                            {svc.price ? `₹${svc.price}` : "Free Service"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                            <Clock size={11} /> Priority Processing
                        </span>
                    </div>

                    <div className="bg-[var(--color-surface-low)] rounded-[16px] p-5 space-y-3 shadow-ambient">
                        <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                            {svc.description || "Apply for this government service quickly and easily through e-Mitra. Our team will process your application and keep you updated via WhatsApp & Telegram."}
                        </p>
                        <div className="space-y-2 pt-2">
                            {["100% Digital Processing", "Updates on WhatsApp & Telegram", "Priority processing available"].map((f) => (
                                <div key={f} className="flex items-center gap-2.5">
                                    <CheckCircle2 size={13} className="text-[var(--color-primary)]" />
                                    <p className="text-[12px] font-bold text-gray-600">{f}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => { onApply(svc); onClose() }}
                        className="w-full py-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white font-black text-[13px] uppercase tracking-widest rounded-[14px] flex items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                        <MessageCircle size={15} />
                        Apply via WhatsApp
                    </button>
                    <p className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-widest">
                        WhatsApp pe direct chat shuru hogi
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

// ── Single service row ────────────────────────────────────────────────────────
function ServiceRow({ svc, catKey, categoryLabel, onApply }) {
    const [expanded, setExpanded] = useState(false)
    const Icon = (CATEGORY_META[catKey] || CATEGORY_META.default).icon

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
                whileTap={{ scale: 0.985 }}
                className="flex items-center justify-between gap-4 px-5 py-4 rounded-[14px] cursor-pointer transition-all bg-[var(--color-surface-low)] hover:bg-[var(--color-primary-fixed)] hover:shadow-ambient group"
            >
                {/* Left: icon + text */}
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-[var(--color-primary-fixed)] rounded-[10px] flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                        <Icon size={18} className="text-[var(--color-primary)]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-black text-[#0A1A40] leading-tight font-display truncate">{svc.name}</p>
                        <p className="text-[11px] font-bold text-[var(--color-primary)] mt-0.5">
                            {svc.price ? `₹${svc.price}` : categoryLabel}
                        </p>
                    </div>
                </div>

                {/* Right: apply pill */}
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] text-[11px] font-black rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all"
                >
                    Apply <ArrowRight size={12} />
                </button>
            </motion.div>
        </>
    )
}

// ── Category section header ───────────────────────────────────────────────────
function CategoryHeader({ label, index, id, catKey }) {
    const Icon = (CATEGORY_META[catKey] || CATEGORY_META.default).icon
    return (
        <div id={id} className="mb-4 scroll-mt-20 flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-primary-fixed)] rounded-[10px] flex items-center justify-center shrink-0">
                <Icon size={15} className="text-[var(--color-primary)]" />
            </div>
            <h2 className="text-[15px] font-black text-[#0A1A40] font-display">{label}</h2>
            <span className="text-[9px] font-black text-gray-300 tabular-nums tracking-widest ml-auto">
                {String(index + 1).padStart(2, "0")}
            </span>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ServiceIconGrid({ services, activeCategory, onServiceClick }) {
    const filtered = activeCategory === "ALL"
        ? Object.entries(services)
        : Object.entries(services).filter(([key]) => key === activeCategory)

    return (
        <div className="space-y-10">
            {filtered.map(([key, cat], catIdx) => (
                <div key={key}>
                    <CategoryHeader label={cat.label} index={catIdx} id={`cat-${key}`} catKey={key} />
                    <div className="space-y-2">
                        {(cat.services || []).map(svc => (
                            <ServiceRow
                                key={svc.name}
                                svc={svc}
                                catKey={key}
                                categoryLabel={cat.label}
                                onApply={(s) => onServiceClick({ ...s, category: cat.label, catKey: key })}
                            />
                        ))}
                        {(cat.services || []).length === 0 && (
                            <div className="text-center py-10 bg-[var(--color-surface-low)] rounded-[16px]">
                                <p className="text-[13px] text-gray-400 font-medium">No services in this category yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
