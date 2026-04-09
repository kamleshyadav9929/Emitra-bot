import { motion, AnimatePresence } from "motion/react"
import {
    Home, CreditCard, Zap, GraduationCap, Car, FileSignature,
    FileText, MessageCircle, Phone, MapPin, ChevronRight,
    Layers, Shield, HelpCircle, Grid3X3, User
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const CATEGORY_ICONS = {
    id: CreditCard,
    bills: Zap,
    forms: GraduationCap,
    schemes: Shield,
    land_auto: Car,
    cert: FileSignature,
    default: FileText
}

export default function PortalSidebar({ services, activeCategory, onWhatsApp, onTrack, config, isLoggedIn, user, onLoginClick }) {
    const navigate = useNavigate()

    const navItems = [
        { key: "ALL", label: "Home", icon: Home, action: () => navigate("/") },
        { key: "divider1" },
    ]

    return (
        <aside style={{ width: "var(--sidebar-w)" }} className="hidden lg:flex flex-col shrink-0 bg-[var(--navy)] text-white h-[calc(100vh-var(--header-h))] sticky top-[var(--header-h)] overflow-y-auto">

            {/* User info strip */}
            <div className="px-4 py-4 border-b border-white/10">
                {isLoggedIn && user ? (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-[var(--amber)] ring-offset-1 ring-offset-[var(--navy)]">
                            <span className="text-sm font-black text-[var(--amber)]">{user?.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-white truncate">{user?.name}</p>
                            <p className="text-[9px] text-white/40 font-medium">Registered User</p>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition-all duration-200"
                    >
                        <User size={14} className="text-[var(--amber)]" />
                        <div className="text-left">
                            <p className="text-[10px] font-black text-white">Login / Register</p>
                            <p className="text-[9px] text-white/40">Access your account</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">

                {/* Home */}
                <SidebarButton
                    icon={Home}
                    label="Home"
                    active={activeCategory === "ALL"}
                    onClick={() => navigate("/")}
                />

                {/* Divider */}
                <SectionLabel label="Services" />

                {/* Service Categories */}
                {Object.entries(services).map(([key, cat]) => {
                    const Icon = CATEGORY_ICONS[key] || CATEGORY_ICONS.default
                    return (
                        <SidebarButton
                            key={key}
                            icon={Icon}
                            label={cat.label}
                            active={activeCategory === key}
                            onClick={() => navigate(`/services/${key}`)}
                            count={cat.services?.length}
                        />
                    )
                })}

                {/* Divider */}
                <SectionLabel label="Support" />

                <SidebarButton icon={MapPin} label="Track Status" onClick={onTrack} />
                <SidebarButton icon={MessageCircle} label="WhatsApp Help" onClick={onWhatsApp} />
                <SidebarButton
                    icon={Phone}
                    label="Telegram Bot"
                    onClick={() => window.open(config?.telegram_bot_url || "https://t.me/Kamlesh6377_bot", "_blank")}
                />
                <SidebarButton icon={HelpCircle} label="Help & FAQ" onClick={() => {}} />
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 shrink-0">
                <p className="text-[8px] font-bold text-white/25 uppercase tracking-widest">© 2025 Krishna E-Mitra</p>
                <p className="text-[8px] text-white/20 mt-0.5">Powered by Kamlesh Services</p>
            </div>
        </aside>
    )
}

function SidebarButton({ icon: Icon, label, active, onClick, count }) {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                active
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
        >
            <Icon size={14} className="shrink-0" />
            <span className="text-[11px] font-bold leading-tight line-clamp-1 flex-1">{label}</span>
            {count && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                    active ? "bg-black/10 text-black" : "bg-white/10 text-white/50"
                }`}>
                    {count}
                </span>
            )}
            {active && <ChevronRight size={11} className="shrink-0 opacity-60" />}
        </motion.button>
    )
}

function SectionLabel({ label }) {
    return (
        <div className="px-3 pt-4 pb-1.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</p>
        </div>
    )
}
