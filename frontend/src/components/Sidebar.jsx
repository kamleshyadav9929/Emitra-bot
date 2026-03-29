import { Link, useLocation } from "react-router-dom"
import { Home, Send, Users, History, Layers } from "lucide-react"

const navItems = [
  { name: "Dashboard",        path: "/",         icon: Home    },
  { name: "Send Notification",path: "/send",     icon: Send    },
  { name: "Students",         path: "/students", icon: Users   },
  { name: "Logs",             path: "/logs",     icon: History },
]

export function Sidebar() {
  const location = useLocation()
  return (
    <aside className="hidden md:flex w-64 h-screen fixed top-0 left-0 flex-col border-r border-[#1D1D2D] bg-[#0C0C12]">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-[#1D1D2D]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white">E-Mitra</h1>
            <p className="text-[10px] text-[#6366F1]/70 font-semibold tracking-[0.15em] uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] text-slate-700 font-semibold tracking-[0.15em] uppercase px-3 mb-3">Navigation</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#6366F1]/12 text-[#818CF8] border border-[#6366F1]/20"
                  : "text-slate-600 hover:text-slate-300 hover:bg-[#18182A] border border-transparent"
              }`}
            >
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="px-4 py-5 border-t border-[#1D1D2D]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#111119] border border-[#1D1D2D]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0"></div>
          <span className="text-xs text-slate-500 font-medium">System Online</span>
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0C12] border-t border-[#1D1D2D]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? "text-[#818CF8]" : "text-slate-700 hover:text-slate-400"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#818CF8]" : "text-slate-700"}`}>
                {item.name.split(" ")[0]}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default Sidebar
