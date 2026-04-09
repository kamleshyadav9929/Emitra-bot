import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
    CreditCard, Zap, GraduationCap, Home, Car,
    FileSignature, FileText, CheckCircle2, Clock,
    MessageCircle
} from "lucide-react"
import { useOutsideClick } from "../../hooks/useOutsideClick"

// ── Per-category icon + banner style ─────────────────────────────────────────
const CATEGORY_META = {
    id:        { icon: CreditCard,    bg: "bg-neutral-900",     pattern: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)" },
    bills:     { icon: Zap,           bg: "bg-neutral-800",     pattern: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.07) 0%, transparent 60%)" },
    forms:     { icon: GraduationCap, bg: "bg-neutral-900",     pattern: "radial-gradient(circle at 50% 70%, rgba(255,255,255,0.06) 0%, transparent 60%)" },
    schemes:   { icon: Home,          bg: "bg-neutral-800",     pattern: "radial-gradient(circle at 20% 60%, rgba(255,255,255,0.07) 0%, transparent 60%)" },
    land_auto: { icon: Car,           bg: "bg-neutral-900",     pattern: "radial-gradient(circle at 80% 40%, rgba(255,255,255,0.07) 0%, transparent 60%)" },
    cert:      { icon: FileSignature, bg: "bg-neutral-800",     pattern: "radial-gradient(circle at 40% 20%, rgba(255,255,255,0.06) 0%, transparent 60%)" },
    default:   { icon: FileText,      bg: "bg-neutral-900",     pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)" },
}

// ── Animated close icon ───────────────────────────────────────────────────────
function CloseIcon() {
    return (
        <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24"
            viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="h-4 w-4 text-black"
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
        </motion.svg>
    )
}

// ── Icon Banner — used as the "image" in both compact + expanded ──────────────
function IconBanner({ svc, catKey, compact = false }) {
    const meta = CATEGORY_META[catKey] || CATEGORY_META.default
    const Icon = meta.icon
    return (
        <div
            className={`${meta.bg} flex items-center justify-center relative overflow-hidden ${
                compact
                    ? "h-14 w-14 md:h-14 md:w-14 rounded-lg shrink-0"
                    : "w-full h-72 sm:rounded-tr-xl sm:rounded-tl-xl"
            }`}
            style={{ backgroundImage: meta.pattern }}
        >
            {/* Subtle grid lines */}
            <div className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize: compact ? "8px 8px" : "24px 24px"
                }}
            />
            <Icon
                size={compact ? 22 : 56}
                className="text-white relative z-10"
                strokeWidth={1.4}
            />
            {!compact && (
                <p className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    {svc.category || "Government Service"}
                </p>
            )}
        </div>
    )
}

// ── Main expandable list ──────────────────────────────────────────────────────
function ExpandableServiceList({ catKey, categoryLabel, services, onApply }) {
    const [active, setActive] = useState(null)
    const ref = useRef(null)
    const id = useId()

    useOutsideClick(ref, () => setActive(null))

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") setActive(false) }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [active])

    useEffect(() => {
        document.body.style.overflow = active && typeof active === "object" ? "hidden" : "auto"
        return () => { document.body.style.overflow = "auto" }
    }, [active])

    return (
        <>
            {/* ── BACKDROP ── */}
            <AnimatePresence>
                {active && typeof active === "object" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 h-full w-full z-10"
                    />
                )}
            </AnimatePresence>

            {/* ── EXPANDED CARD ── */}
            <AnimatePresence>
                {active && typeof active === "object" ? (
                    <div className="fixed inset-0 grid place-items-center z-[100]">

                        {/* Mobile close */}
                        <motion.button
                            key={`close-${active.name}-${id}`}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.05 } }}
                            className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6 shadow-md z-[101]"
                            onClick={() => setActive(null)}
                        >
                            <CloseIcon />
                        </motion.button>

                        <motion.div
                            layoutId={`card-${active.name}-${id}`}
                            ref={ref}
                            className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white sm:rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Banner image (shared layoutId) */}
                            <motion.div layoutId={`image-${active.name}-${id}`}>
                                <IconBanner svc={{ ...active, category: categoryLabel }} catKey={catKey} compact={false} />
                            </motion.div>

                            <div>
                                {/* Header row */}
                                <div className="flex justify-between items-start p-4">
                                    <div>
                                        <motion.h3
                                            layoutId={`title-${active.name}-${id}`}
                                            className="font-bold text-neutral-700"
                                        >
                                            {active.name}
                                        </motion.h3>
                                        <motion.p
                                            layoutId={`description-${active.name}-${id}`}
                                            className="text-neutral-600 text-sm"
                                        >
                                            {active.price ? `₹${active.price}` : "Free Service"}
                                        </motion.p>
                                    </div>

                                    <motion.button
                                        layoutId={`button-${active.name}-${id}`}
                                        onClick={() => { onApply(active); setActive(null) }}
                                        className="px-4 py-3 text-sm rounded-full font-bold bg-black text-white flex items-center gap-1.5 shrink-0 hover:bg-neutral-800 active:scale-95 transition-all"
                                    >
                                        <MessageCircle size={13} />
                                        Apply
                                    </motion.button>
                                </div>

                                {/* Content */}
                                <div className="pt-2 relative px-4">
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-neutral-600 text-xs md:text-sm h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none]"
                                    >
                                        <p>
                                            {active.description || "Apply for this government service quickly and easily through Krishna E-Mitra. Our team will process your application and keep you updated."}
                                        </p>
                                        <div className="space-y-2 w-full">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-neutral-400 shrink-0" />
                                                <p className="text-xs font-semibold text-neutral-500">100% Digital Processing</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-neutral-400 shrink-0" />
                                                <p className="text-xs font-semibold text-neutral-500">Updates on WhatsApp & Telegram</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-neutral-400 shrink-0" />
                                                <p className="text-xs font-semibold text-neutral-500">Priority processing available</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : null}
            </AnimatePresence>

            {/* ── COMPACT LIST (exact Aceternity structure) ── */}
            <ul className="w-full gap-4">
                {services.map((svc) => (
                    <motion.div
                        layoutId={`card-${svc.name}-${id}`}
                        key={`card-${svc.name}-${id}`}
                        onClick={() => setActive(svc)}
                        className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 rounded-xl cursor-pointer"
                    >
                        {/* Left: icon banner + text */}
                        <div className="flex gap-4 flex-col md:flex-row items-center md:items-center">
                            <motion.div layoutId={`image-${svc.name}-${id}`}>
                                <IconBanner svc={svc} catKey={catKey} compact={true} />
                            </motion.div>

                            <div>
                                <motion.h3
                                    layoutId={`title-${svc.name}-${id}`}
                                    className="font-medium text-neutral-800 text-center md:text-left"
                                >
                                    {svc.name}
                                </motion.h3>
                                <motion.p
                                    layoutId={`description-${svc.name}-${id}`}
                                    className="text-neutral-600 text-sm text-center md:text-left"
                                >
                                    {svc.price ? `₹${svc.price}` : categoryLabel}
                                </motion.p>
                            </div>
                        </div>

                        {/* Right: CTA button */}
                        <motion.button
                            layoutId={`button-${svc.name}-${id}`}
                            className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-black hover:text-white text-black mt-4 md:mt-0 transition-colors"
                        >
                            Apply
                        </motion.button>
                    </motion.div>
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
                        categoryLabel={cat.label}
                        services={cat.services || []}
                        onApply={(svc) => onServiceClick({ ...svc, category: cat.label, catKey: key })}
                    />
                </div>
            ))}
        </div>
    )
}
