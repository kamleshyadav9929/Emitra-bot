import { Link, useLocation } from "react-router-dom"
import { Home, Send, Users, History, Zap } from "lucide-react"

const navItems = [
  { name: "Dashboard",    path: "/",        icon: Home    },
  { name: "Send",         path: "/send",    icon: Send    },
  { name: "Students",     path: "/students",icon: Users   },
  { name: "Logs",         path: "/logs",    icon: History },
]

/* ── Desktop Sidebar ── */
export function Sidebar() {
  const location = useLocation()
  return (
    <aside className="hidden md:flex w-64 h-screen fixed top-0 left-0 flex-col border-r border-[#1A1A28] bg-[#09090E]">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-[#1A1A28]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF6B35] flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white">E-Mitra</h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[10px] text-slate-600 font-semibold tracking-[0.15em] uppercase px-3 mb-3">Navigation</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20"
                  : "text-slate-500 hover:text-slate-200 hover:bg-[#1A1A28]"
              }`}
            >
              <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="px-4 py-5 border-t border-[#1A1A28]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#0F0F17] border border-[#1A1A28]">
          <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0"></div>
          <span className="text-xs text-slate-400 font-medium">System Online</span>
        </div>
      </div>
    </aside>
  )
}

/* ── Mobile Bottom Nav ── */
export function BottomNav() {
  const location = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090E] border-t border-[#1A1A28]">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? "text-[#FF6B35]" : "text-slate-600 hover:text-slate-400"
              }`}
            >
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-[#FF6B35]" : ""}
              />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-[#FF6B35]" : "text-slate-600"}`}>
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#FF6B35] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default Sidebar
