import { Home, LayoutGrid, MapPin, LogIn, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export default function LandingBottomNav({ onLoginClick, onProfileClick }) {
    const { user, isLoggedIn } = useAuth()

    const tabs = [
        {
            id: "home",
            icon: Home,
            label: "Home",
            action: () => window.scrollTo({ top: 0, behavior: "smooth" })
        },
        {
            id: "services",
            icon: LayoutGrid,
            label: "Services",
            action: () => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })
        },
        {
            id: "status",
            icon: MapPin,
            label: "Track",
            action: () => document.getElementById("status")?.scrollIntoView({ behavior: "smooth" })
        },
        {
            id: "profile",
            icon: isLoggedIn ? User : LogIn,
            label: isLoggedIn ? (user?.name?.split(" ")[0] || "Profile") : "Log In",
            action: isLoggedIn ? onProfileClick : onLoginClick,
            isUser: isLoggedIn
        },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/96 backdrop-blur-md border-t border-black/[0.06] shadow-[0_-4px_32px_rgba(0,0,0,0.07)]">
            <div className="flex items-stretch justify-around px-1 pt-2 pb-safe" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={tab.action}
                            className="flex flex-col items-center gap-1 flex-1 py-1 px-2 rounded-2xl hover:bg-black/[0.04] active:scale-95 transition-all"
                        >
                            {tab.isUser ? (
                                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-white text-[10px] font-black leading-none">
                                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                </div>
                            ) : (
                                <Icon size={19} className="text-ink-2 shrink-0" strokeWidth={1.8} />
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-wider leading-none truncate max-w-full ${
                                tab.isUser ? "text-black" : "text-ink-3"
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
