import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    CreditCard, Zap, GraduationCap, Home, Car,
    FileSignature, FileText, X, MessageCircle,
    CheckCircle2, Clock, ArrowUpRight
} from "lucide-react"
import { useOutsideClick } from "../../hooks/useOutsideClick"

const CATEGORY_ICONS = {
    id: CreditCard,
    bills: Zap,
    forms: GraduationCap,
    schemes: Home,
    land_auto: Car,
    cert: FileSignature,
    default: FileText
}

// ── Close icon (animated) ─────────────────────────────────────────────────────
function CloseIcon() {
    return (
        <motion.svg
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90, transition: { duration: 0.1 } }}
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
        </motion.svg>
    )
}

// ── Expandable service list for one category ──────────────────────────────────
function ExpandableServiceList({ catKey, services, onApply }) {
    const [active, setActive] = useState(null)
    const ref = useRef(null)
    const id = useId()
    const Icon = CATEGORY_ICONS[catKey] || CATEGORY_ICONS.default

    useOutsideClick(ref, () => setActive(null))

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") setActive(null) }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    useEffect(() => {
        document.body.style.overflow = active ? "hidden" : "auto"
        return () => { document.body.style.overflow = "auto" }
    }, [active])

    return (
        <>
            {/* ── BACKDROP ── */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80]"
                    />
                )}
            </AnimatePresence>

            {/* ── EXPANDED CARD OVERLAY ── */}
            <AnimatePresence>
                {active && (
                    <div className="fixed inset-0 grid place-items-center z-[90] px-4">
                        {/* Mobile close button */}
                        <motion.button
                            key={`close-btn-${active.name}-${id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.05 } }}
                            className="absolute top-4 right-4 lg:hidden w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg z-[91]"
                            onClick={() => setActive(null)}
                        >
                            <CloseIcon />
                        </motion.button>

                        <motion.div
                            layoutId={`svc-card-${active.name}-${id}`}
                            ref={ref}
                            className="w-full max-w-[480px] bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/20"
                        >
                            {/* Card top bar */}
                            <div className="px-6 pt-6 pb-5 border-b border-black/[0.06]">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        {/* Animated icon */}
                                        <motion.div
                                            layoutId={`svc-icon-${active.name}-${id}`}
                                            className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shrink-0"
                                        >
                                            <Icon size={24} className="text-white" strokeWidth={1.7} />
                                        </motion.div>

                                        <div className="min-w-0">
                                            <motion.h2
                                                layoutId={`svc-title-${active.name}-${id}`}
                                                className="font-black text-black text-lg leading-tight"
                                            >
                                                {active.name}
                                            </motion.h2>
                                            {active.price && (
                                                <motion.p
                                                    layoutId={`svc-price-${active.name}-${id}`}
                                                    className="text-[11px] text-black/40 font-bold mt-0.5"
                                                >
                                                    ₹{active.price}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop close */}
                                    <button
                                        onClick={() => setActive(null)}
                                        className="hidden lg:flex w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/10 items-center justify-center transition-colors shrink-0"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Card body */}
                            <div className="px-6 py-5">
                                <motion.div
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-36 overflow-auto [mask:linear-gradient(to_bottom,white_70%,transparent)] [scrollbar-width:none] [-ms-overflow-style:none]"
                                >
                                    <p className="text-[13px] text-black/55 leading-relaxed">
                                        {active.description || "Apply for this government service quickly and easily through Krishna E-Mitra. Our team will process your application and keep you updated via WhatsApp."}
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center gap-2.5">
                                            <CheckCircle2 size={14} className="text-black/40 shrink-0" />
                                            <p className="text-[11px] font-semibold text-black/50">100% Digital Processing</p>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <CheckCircle2 size={14} className="text-black/40 shrink-0" />
                                            <p className="text-[11px] font-semibold text-black/50">Updates on WhatsApp & Telegram</p>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Clock size={14} className="text-black/40 shrink-0" />
                                            <p className="text-[11px] font-semibold text-black/50">Priority processing available</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* CTA */}
                                <button
                                    onClick={() => { onApply(active); setActive(null) }}
                                    className="mt-5 w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2.5 hover:bg-black/85 active:scale-[0.98] transition-all shadow-lg shadow-black/10"
                                >
                                    <MessageCircle size={14} />
                                    Apply via WhatsApp
                                </button>
                                <p className="text-[9px] text-center font-bold text-black/25 uppercase tracking-widest mt-2.5">
                                    WhatsApp pe direct chat shuru hogi
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── COMPACT LIST ── */}
            <ul className="w-full space-y-2">
                {services.map((svc, idx) => (
                    <motion.li
                        layoutId={`svc-card-${svc.name}-${id}`}
                        key={`${catKey}-${idx}`}
                        onClick={() => setActive(svc)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.025, ease: "easeOut" }}
                        className="group relative flex items-center gap-3 px-4 py-3.5 bg-white border border-black/[0.07] hover:border-black/20 hover:bg-neutral-50 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
                    >
                        {/* Left accent stripe */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black scale-y-0 group-hover:scale-y-100 transition-transform duration-250 origin-bottom rounded-l-2xl" />

                        {/* Index number */}
                        <span className="text-[11px] font-black text-black/20 tabular-nums w-6 shrink-0 group-hover:text-black/40 transition-colors select-none">
                            {String(idx + 1).padStart(2, "0")}
                        </span>

                        {/* Icon */}
                        <motion.div
                            layoutId={`svc-icon-${svc.name}-${id}`}
                            className="w-9 h-9 rounded-xl bg-black/[0.04] group-hover:bg-black flex items-center justify-center shrink-0 transition-all duration-250"
                        >
                            <Icon
                                size={15}
                                className="text-black/40 group-hover:text-white transition-colors duration-250"
                                strokeWidth={1.8}
                            />
                        </motion.div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <motion.p
                                layoutId={`svc-title-${svc.name}-${id}`}
                                className="text-[13px] font-bold text-black/80 leading-tight line-clamp-1 group-hover:text-black transition-colors"
                            >
                                {svc.name}
                            </motion.p>
                            {svc.description && (
                                <p className="text-[10px] text-black/30 mt-0.5 line-clamp-1">{svc.description}</p>
                            )}
                        </div>

                        {/* Price */}
                        {svc.price && (
                            <motion.span
                                layoutId={`svc-price-${svc.name}-${id}`}
                                className="hidden sm:block text-[9px] font-black px-2.5 py-1 rounded-full border border-black/[0.08] text-black/30 shrink-0 group-hover:border-black/20 group-hover:text-black/50 transition-all"
                            >
                                ₹{svc.price}
                            </motion.span>
                        )}

                        {/* Expand hint */}
                        <div className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity duration-200">
                            <ArrowUpRight size={14} className="text-black" />
                        </div>
                    </motion.li>
                ))}
            </ul>
        </>
    )
}

// ── Category section header ───────────────────────────────────────────────────
function CategoryHeader({ label, index, id }) {
    return (
        <div id={id} className="mb-4 scroll-mt-16">
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-black/20 tabular-nums tracking-widest">
                    {String(index + 1).padStart(2, "0")}
                </span>
                <div className="h-px flex-1 bg-black/[0.07]" />
            </div>
            <h2 className="mt-2 text-sm font-black uppercase tracking-widest text-black/75">
                {label}
            </h2>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ServiceIconGrid({ services, activeCategory, onServiceClick }) {
    const filtered = activeCategory === "ALL"
        ? Object.entries(services)
        : Object.entries(services).filter(([key]) => key === activeCategory)

    // onApply: wrap onServiceClick so it fires the WhatsApp flow
    const handleApply = (svc) => onServiceClick(svc)

    return (
        <div className="space-y-10 md:space-y-14">
            {filtered.map(([key, cat], catIdx) => (
                <div key={key}>
                    <CategoryHeader
                        label={cat.label}
                        index={catIdx}
                        id={`cat-${key}`}
                    />
                    <ExpandableServiceList
                        catKey={key}
                        services={cat.services || []}
                        onApply={(svc) => handleApply({ ...svc, category: cat.label, catKey: key })}
                    />
                </div>
            ))}
        </div>
    )
}
