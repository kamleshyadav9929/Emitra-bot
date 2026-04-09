import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Home, CreditCard, Zap, GraduationCap, Car, FileSignature,
    FileText, MessageCircle, Phone, MapPin, Shield, HelpCircle,
    Layers, User, LogIn, ChevronRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const CATEGORY_ICONS = {
    id:        CreditCard,
    bills:     Zap,
    forms:     GraduationCap,
    schemes:   Shield,
    land_auto: Car,
    cert:      FileSignature,
    default:   FileText
}

// ── Collapsed width / Expanded width ─────────────────────────────────────────
const W_CLOSED = 60   // px  — icon only
const W_OPEN   = 240  // px  — icon + label

// ── Section divider label ─────────────────────────────────────────────────────
function SectionLabel({ label, open }) {
    return (
        <div className="px-3 pt-4 pb-1 overflow-hidden">
            <motion.p
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-[8px] font-black uppercase tracking-widest text-white/25 whitespace-nowrap"
            >
                {label}
            </motion.p>
        </div>
    )
}

// ── Individual sidebar link/button ────────────────────────────────────────────
function SidebarButton({ icon: Icon, label, active, onClick, count, open }) {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            title={!open ? label : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 group overflow-hidden ${
                active
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
        >
            {/* Icon — always visible */}
            <Icon
                size={18}
                className={`shrink-0 transition-colors ${active ? "text-black" : "text-white/70 group-hover:text-white"}`}
                strokeWidth={active ? 2.2 : 1.7}
            />

            {/* Label — fades in when open */}
            <motion.span
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.15, delay: open ? 0.05 : 0 }}
                className="text-[11px] font-bold whitespace-pre flex-1 leading-tight"
            >
                {label}
            </motion.span>

            {/* Count badge */}
            {count && open && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                        active ? "bg-black/10 text-black" : "bg-white/10 text-white/50"
                    }`}
                >
                    {count}
                </motion.span>
            )}
        </motion.button>
    )
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function SidebarLogo({ open }) {
    return (
        <div className="flex items-center gap-2.5 px-3 py-2 overflow-hidden">
            {/* Always-visible icon block */}
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
                <Layers size={14} className="text-black" />
            </div>

            {/* Text fades in */}
            <motion.div
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.15, delay: open ? 0.06 : 0 }}
                className="leading-none whitespace-nowrap overflow-hidden"
            >
                <p className="text-[11px] font-black uppercase tracking-tight text-white">Krishna E-Mitra</p>
                <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Digital Seva Portal</p>
            </motion.div>
        </div>
    )
}

// ── User strip (bottom) ───────────────────────────────────────────────────────
function UserStrip({ isLoggedIn, user, onLoginClick, open }) {
    if (isLoggedIn && user) {
        return (
            <div className="flex items-center gap-2.5 px-3 py-2.5 overflow-hidden">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 ring-1 ring-white/20">
                    <span className="text-xs font-black text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
                </div>

                <motion.div
                    animate={{ opacity: open ? 1 : 0 }}
                    transition={{ duration: 0.15, delay: open ? 0.06 : 0 }}
                    className="min-w-0 whitespace-nowrap overflow-hidden"
                >
                    <p className="text-[11px] font-black text-white leading-tight">{user?.name}</p>
                    <p className="text-[9px] text-white/35 font-medium">Registered User</p>
                </motion.div>
            </div>
        )
    }
    return (
        <button
            onClick={onLoginClick}
            title={!open ? "Login / Register" : undefined}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 rounded-xl transition-colors overflow-hidden"
        >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <LogIn size={14} className="text-white/60" />
            </div>
            <motion.div
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.15, delay: open ? 0.06 : 0 }}
                className="text-left whitespace-nowrap overflow-hidden"
            >
                <p className="text-[10px] font-black text-white">Login / Register</p>
                <p className="text-[9px] text-white/35">Access your account</p>
            </motion.div>
        </button>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PortalSidebar({
    services, activeCategory, onWhatsApp, onTrack,
    config, isLoggedIn, user, onLoginClick
}) {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    return (
        <motion.aside
            animate={{ width: open ? W_OPEN : W_CLOSED }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="hidden lg:flex flex-col shrink-0 bg-black text-white h-[calc(100vh-var(--header-h))] sticky top-[var(--header-h)] overflow-hidden z-30"
        >
            {/* ── Logo ── */}
            <div className="py-4 border-b border-white/[0.07] shrink-0">
                <SidebarLogo open={open} />
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">

                <SidebarButton
                    icon={Home}
                    label="Home"
                    active={activeCategory === "ALL"}
                    onClick={() => navigate("/")}
                    open={open}
                />

                <SectionLabel label="Services" open={open} />

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
                            open={open}
                        />
                    )
                })}

                <SectionLabel label="Support" open={open} />

                <SidebarButton icon={MapPin}       label="Track Status"  onClick={onTrack}     open={open} />
                <SidebarButton icon={MessageCircle} label="WhatsApp Help" onClick={onWhatsApp}  open={open} />
                <SidebarButton
                    icon={Phone}
                    label="Telegram Bot"
                    onClick={() => window.open(config?.telegram_bot_url || "https://t.me/Kamlesh6377_bot", "_blank")}
                    open={open}
                />
                <SidebarButton icon={HelpCircle} label="Help & FAQ" onClick={() => {}} open={open} />
            </nav>

            {/* ── User strip ── */}
            <div className="border-t border-white/[0.07] py-2 px-2 shrink-0">
                <UserStrip
                    isLoggedIn={isLoggedIn}
                    user={user}
                    onLoginClick={onLoginClick}
                    open={open}
                />
            </div>
        </motion.aside>
    )
}
