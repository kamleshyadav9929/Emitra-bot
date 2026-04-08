import { motion } from "motion/react"
import {
    CreditCard,
    Zap,
    GraduationCap,
    Home,
    Car,
    FileSignature,
    FileText,
    ChevronRight
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

// One icon tile for a single service
function ServiceIconTile({ name, description, price, category, delay, onClick }) {
    const Icon = categoryIcons[category] || categoryIcons.default
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: delay * 0.03 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className="group flex flex-col items-center gap-2.5 p-3 md:p-4 rounded-2xl bg-white border border-black/[0.07] hover:border-black/25 hover:shadow-lg hover:shadow-black/5 transition-all duration-200 cursor-pointer text-center"
        >
            {/* Circle icon */}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/[0.04] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
                <Icon size={18} className="transition-all duration-300" />
            </div>
            {/* Label */}
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-wide leading-tight line-clamp-2 text-black/80 group-hover:text-black">
                {name}
            </p>
            {/* Price badge - only if not free */}
            {price && (
                <span className="text-[8px] font-bold text-black/30 uppercase tracking-wider">
                    ₹{price}
                </span>
            )}
        </motion.button>
    )
}

// Section header for a category
function CategoryHeader({ label, index, id }) {
    return (
        <div id={id} className="flex items-center gap-4 mb-4 scroll-mt-16">
            <span className="text-3xl font-black opacity-[0.06] leading-none tabular-nums">
                {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-black/80">
                {label}
            </h2>
            <div className="h-px flex-1 bg-black/[0.06]" />
        </div>
    )
}

export default function ServiceIconGrid({ services, activeCategory, onServiceClick }) {
    // If a specific category is selected, only show that category
    const filtered = activeCategory === "ALL"
        ? Object.entries(services)
        : Object.entries(services).filter(([key]) => key === activeCategory)

    // Build a flat index for staggered animation delay
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
                            const delay = globalIdx++
                            return (
                                <ServiceIconTile
                                    key={`${key}-${svcIdx}`}
                                    {...svc}
                                    category={key}
                                    delay={delay}
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
