import { motion } from "motion/react"
import {
    Home,
    CreditCard,
    Zap,
    GraduationCap,
    Car,
    FileSignature,
    FileText,
    Phone,
    MessageCircle,
    MapPin,
    ChevronRight,
    Layers
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

export default function PortalSidebar({ services, activeCategory, onSelect, onWhatsApp, onTrack, config }) {
    return (
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-black/[0.06] bg-white h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
            {/* Brand Mark */}
            <div className="px-4 py-5 border-b border-black/[0.06]">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-black flex items-center justify-center rounded-lg shrink-0">
                        <Layers size={12} className="text-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[11px] font-black tracking-tight uppercase">Krishna E-Mitra</span>
                        <span className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Digital Seva Portal</span>
                    </div>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex flex-col py-3 px-2 gap-0.5 flex-1">
                {/* Home / All */}
                <button
                    onClick={() => onSelect("ALL")}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                        activeCategory === "ALL"
                            ? "bg-black text-white"
                            : "text-black/60 hover:bg-black/[0.04] hover:text-black"
                    }`}
                >
                    <Home size={15} className="shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Home</span>
                    {activeCategory === "ALL" && (
                        <ChevronRight size={12} className="ml-auto opacity-60" />
                    )}
                </button>

                {/* Divider */}
                <div className="h-px bg-black/[0.05] my-2 mx-3" />
                <p className="text-[8px] font-black uppercase tracking-widest text-black/25 px-3 mb-1">Services</p>

                {/* Category buttons */}
                {Object.entries(services).map(([key, cat]) => {
                    const Icon = categoryIcons[key] || categoryIcons.default
                    const isActive = activeCategory === key
                    return (
                        <motion.button
                            key={key}
                            onClick={() => onSelect(key)}
                            whileTap={{ scale: 0.97 }}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                                isActive
                                    ? "bg-black text-white"
                                    : "text-black/60 hover:bg-black/[0.04] hover:text-black"
                            }`}
                        >
                            <Icon size={14} className="shrink-0" />
                            <span className="text-[11px] font-black uppercase tracking-wider leading-tight line-clamp-1">
                                {cat.label}
                            </span>
                            {isActive && <ChevronRight size={11} className="ml-auto opacity-60 shrink-0" />}
                        </motion.button>
                    )
                })}

                {/* Divider */}
                <div className="h-px bg-black/[0.05] my-2 mx-3" />
                <p className="text-[8px] font-black uppercase tracking-widest text-black/25 px-3 mb-1">Support</p>

                {/* Track Status */}
                <button
                    onClick={onTrack}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-black/60 hover:bg-black/[0.04] hover:text-black transition-all duration-200"
                >
                    <MapPin size={14} className="shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Track Status</span>
                </button>

                {/* WhatsApp */}
                <button
                    onClick={onWhatsApp}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-black/60 hover:bg-black/[0.04] hover:text-black transition-all duration-200"
                >
                    <MessageCircle size={14} className="shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp Help</span>
                </button>

                {/* Telegram */}
                <a
                    href={config?.telegram_bot_url || "https://t.me/Kamlesh6377_bot"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-black/60 hover:bg-black/[0.04] hover:text-black transition-all duration-200"
                >
                    <Phone size={14} className="shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Telegram Bot</span>
                </a>
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-black/[0.05] mt-auto">
                <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">© 2025 Krishna E-Mitra</p>
            </div>
        </aside>
    )
}
