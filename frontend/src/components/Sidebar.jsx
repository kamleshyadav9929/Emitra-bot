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
    <span className="ml-auto min-w-[18px] h-[18px] rounded-sm bg-black text-[10px] font-bold text-white flex items-center justify-center px-1">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function Sidebar() {
  const location = useLocation()
  return (
    <aside className="hidden md:flex w-[220px] h-screen fixed top-0 left-0 flex-col border-r border-[#E5E5E3] bg-white">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#E5E5E3]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black flex items-center justify-center">
            <Layers size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold tracking-tight text-black leading-none">E-Mitra</h1>
            <p className="text-[10px] text-[#7A7A78] font-medium tracking-[0.12em] uppercase mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-px overflow-y-auto">
        <p className="text-[9px] text-[#AEAEAC] font-semibold tracking-[0.18em] uppercase px-3 mb-2">Navigate</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all group ${
                isActive
                  ? "bg-black text-white"
                  : "text-[#3D3D3D] hover:text-black hover:bg-[#F2F2F0]"
              }`}
            >
              <item.icon size={15} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.path === "/requests" && <PendingBadge />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#E5E5E3]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F7F5] border border-[#E5E5E3]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></div>
          <span className="text-[11px] text-[#3D3D3D] font-medium">System Online</span>
        </div>
        <div className="mt-2 px-3 flex items-center justify-between">
          <p className="text-[9px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase">Command</p>
          <kbd className="px-1.5 py-0.5 bg-[#F7F7F5] border border-[#E5E5E3] text-[9px] font-mono text-[#3D3D3D]">⌘K</kbd>
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5E3] safe-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 transition-all ${
                isActive ? "text-black" : "text-[#AEAEAC]"
              }`}
            >
              <div className={`p-1.5 transition-colors ${isActive ? "bg-black" : ""}`}>
                <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : ""} />
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${isActive ? "text-black" : "text-[#AEAEAC]"}`}>
                {item.name.split(" ")[0]}
              </span>
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
  return <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-black" />
}

export default Sidebar
