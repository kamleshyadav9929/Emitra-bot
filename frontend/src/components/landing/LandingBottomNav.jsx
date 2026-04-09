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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F7F4]/95 backdrop-blur-md border-t border-[#E8E6E1] shadow-[0_-4px_24px_rgba(13,27,42,0.08)]">
            <div className="flex items-stretch justify-around px-1 pt-2 pb-safe" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={tab.action}
                            className="flex flex-col items-center gap-1 flex-1 py-1 px-2 rounded-2xl hover:bg-[#0D1B2A]/[0.04] active:scale-95 transition-all"
                        >
                            {tab.isUser ? (
                                <div className="w-6 h-6 bg-[#0D1B2A] rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-[#00C896] text-[10px] font-black leading-none">
                                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                </div>
                            ) : (
                                <Icon size={19} className="text-[#3D5166] shrink-0" strokeWidth={1.8} />
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-wider leading-none truncate max-w-full ${
                                tab.isUser ? "text-[#0D1B2A]" : "text-[#6B7685]"
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
