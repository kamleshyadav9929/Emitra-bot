import { Link, useLocation } from "react-router-dom"
import { Home, Send, Users, History, Layers, ClipboardList } from "lucide-react"
import { useEffect, useState } from "react"
import { getServiceRequests } from "../api"

const navItems = [
  { name: "Dashboard",        path: "/",         icon: Home          },
  { name: "Send Notification",path: "/send",     icon: Send          },
  { name: "Students",         path: "/students", icon: Users         },
  { name: "Service Requests", path: "/requests", icon: ClipboardList },
  { name: "Logs",             path: "/logs",     icon: History       },
]

function PendingBadge() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    getServiceRequests("pending")
      .then(d => setCount(d.pending || 0))
      .catch(() => {})
  }, [])
  if (!count) return null
  return (
    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center px-1">
      {count > 99 ? "99+" : count}
    </span>
  )
}

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
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-[#6366F1]/12 text-[#818CF8] border border-[#6366F1]/20 shadow-lg shadow-indigo-500/5"
                  : "text-slate-600 hover:text-slate-300 hover:bg-[#18182A] border border-transparent"
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.path === "/requests" && <PendingBadge />}
            </Link>
          )
        })}
      </nav>

      {/* Status & Shortcuts */}
      <div className="px-4 py-5 space-y-3 border-t border-[#1D1D2D]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#111119] border border-[#1D1D2D]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0"></div>
          <span className="text-xs text-slate-500 font-medium">System Online</span>
        </div>
        
        <div className="px-3 py-2 rounded-lg border border-dashed border-[#1D1D2D]">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Shortcuts</p>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1D1D2D] text-[#818CF8] text-[9px] font-mono border border-[#6366F1]/20">^K</kbd>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[1,2,3,4,5].map(n => (
              <div key={n} className="flex flex-col items-center">
                <kbd className="px-1.5 py-0.5 rounded bg-[#1D1D2D] text-[#818CF8] text-[9px] font-mono border border-[#6366F1]/20">{n}</kbd>
              </div>
            ))}
          </div>
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
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] py-1.5 rounded-xl transition-all ${
                isActive ? "text-[#818CF8]" : "text-slate-700 hover:text-slate-400"
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-[#6366F1]/10" : ""}`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-[#818CF8]" : "text-slate-700"}`}>
                {item.name.split(" ")[0]}
              </span>
              {/* Pending dot for mobile */}
              {item.path === "/requests" && <PendingDot />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function PendingDot() {
  const [has, setHas] = useState(false)
  useEffect(() => {
    getServiceRequests("pending")
      .then(d => setHas((d.pending || 0) > 0))
      .catch(() => {})
  }, [])
  if (!has) return null
  return <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
}

export default Sidebar
