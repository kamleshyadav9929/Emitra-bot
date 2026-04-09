import { motion } from "motion/react"
import {
    CreditCard,
    Zap,
    GraduationCap,
    Home,
    Car,
    FileSignature,
    FileText,
    ArrowUpRight
} from "lucide-react"

const categoryIcons = {
    id: CreditCard,
    bills: Zap,
    forms: GraduationCap,
    schemes: Home,
    land_auto: Car,
    cert: FileSignature,
    default: FileText
}

// ── Individual Service Icon Tile ──────────────────────────────────────────────
function ServiceIconTile({ name, description, price, category, delay, index = 0, onClick }) {
    const Icon = categoryIcons[category] || categoryIcons.default

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, delay: delay * 0.025, ease: "easeOut" }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="group relative flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-white border border-black/[0.07] hover:border-black/25 hover:shadow-lg hover:shadow-black/[0.07] transition-all duration-200 cursor-pointer text-center overflow-hidden"
        >
            {/* Subtle index watermark */}
            <span className="absolute top-1 right-2 text-[22px] font-black text-black/[0.04] leading-none select-none tabular-nums">
                {String(index + 1).padStart(2, "0")}
            </span>

            {/* Left accent line appears on hover */}
            <div className="absolute left-0 top-2 bottom-2 w-[2.5px] bg-black rounded-full scale-y-0 group-hover:scale-y-100 transition-transform duration-250 origin-bottom" />

            {/* Icon */}
            <div className="relative w-12 h-12 md:w-13 md:h-13 rounded-2xl bg-black/[0.04] group-hover:bg-black flex items-center justify-center transition-all duration-250 shrink-0">
                <Icon size={17} className="text-black/50 group-hover:text-white transition-colors duration-250" strokeWidth={1.7} />
            </div>

            {/* Name */}
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-wide leading-tight line-clamp-2 text-black/70 group-hover:text-black transition-colors">
                {name}
            </p>

            {/* Price */}
            {price && (
                <span className="text-[8px] font-bold text-black/30 border border-black/[0.08] rounded-full px-2 py-0.5 group-hover:border-black/20 transition-colors">
                    ₹{price}
                </span>
            )}

            {/* Arrow — appears on hover */}
            <ArrowUpRight
                size={10}
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity duration-200"
            />
        </motion.button>
    )
}

// ── Category Section Header ───────────────────────────────────────────────────
function CategoryHeader({ label, index, id }) {
    return (
        <div id={id} className="mb-5 scroll-mt-16">
            <div className="flex items-center gap-4">
                {/* Big bold number */}
                <span className="text-[11px] font-black text-black/20 tabular-nums tracking-widest">
                    {String(index + 1).padStart(2, "0")}
                </span>
                {/* Full-width rule */}
                <div className="h-px flex-1 bg-black/[0.08]" />
            </div>
            <h2 className="mt-2 text-sm md:text-base font-black uppercase tracking-widest text-black/80">
                {label}
            </h2>
        </div>
    )
}

// ── Main Grid Export ──────────────────────────────────────────────────────────
export default function ServiceIconGrid({ services, activeCategory, onServiceClick }) {
    const filtered = activeCategory === "ALL"
        ? Object.entries(services)
        : Object.entries(services).filter(([key]) => key === activeCategory)

    let globalIdx = 0

    return (
        <div className="space-y-10 md:space-y-14">
            {filtered.map(([key, cat], catIdx) => (
                <div key={key}>
                    <CategoryHeader
                        label={cat.label}
                        index={catIdx}
                        id={`cat-${key}`}
                    />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                        {cat.services?.map((svc, svcIdx) => {
                            const delay = globalIdx
                            const tileIndex = globalIdx
                            globalIdx++
                            return (
                                <ServiceIconTile
                                    key={`${key}-${svcIdx}`}
                                    {...svc}
                                    category={key}
                                    delay={delay}
                                    index={tileIndex}
                                    onClick={() => onServiceClick({ ...svc, category: cat.label, catKey: key })}
                                />
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
