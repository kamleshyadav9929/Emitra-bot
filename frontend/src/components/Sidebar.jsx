import { Link, useLocation } from "react-router-dom"
import { Home, Send, Users, Layers, ClipboardList, Bot } from "lucide-react"
import { useEffect, useState } from "react"
import { getServiceRequests } from "../api"

const navItems = [
  { name: "Dashboard", path: "/",            icon: Home          },
  { name: "Send",      path: "/send",        icon: Send          },
  { name: "Students",  path: "/students",    icon: Users         },
  { name: "E-Mitra",  path: "/requests",    icon: ClipboardList },
  { name: "Bot Manager", path: "/bot-manager", icon: Bot         },
]

// Accent colors per route for the active left-border
const ROUTE_ACCENT = {
  "/":             "#0A0A0A",
  "/send":         "#3B82F6",
  "/students":     "#22C55E",
  "/requests":     "#EF4444",
  "/bot-manager":  "#F97316",
}

function usePendingCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    getServiceRequests("pending")
      .then(d => setCount(d.pending || 0))
      .catch(() => {})
  }, [])
  return count
}

export function Sidebar() {
  const location = useLocation()
  const pendingCount = usePendingCount()

  return (
    <aside className="hidden md:flex w-[220px] h-screen fixed top-0 left-0 flex-col border-r border-[#E5E5E3] bg-white z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#E5E5E3]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black flex items-center justify-center flex-shrink-0">
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
          const showBadge = item.path === "/requests" && pendingCount > 0
          const accent = ROUTE_ACCENT[item.path] || "#0A0A0A"
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-[#F7F7F5] text-black"
                  : "text-[#3D3D3D] hover:text-black hover:bg-[#F2F2F0]"
              }`}
            >
              {/* Colored left-border accent when active */}
              {isActive && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm"
                  style={{ backgroundColor: accent }}
                />
              )}
              <item.icon
                size={15}
                strokeWidth={isActive ? 2.5 : 2}
                className="flex-shrink-0"
                style={isActive ? { color: accent } : {}}
              />
              <span className="flex-1">{item.name}</span>
              {showBadge && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 rounded-full">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
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
      </div>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()
  const pendingCount = usePendingCount()

  return (
    <nav
      className="md:hidden sticky bottom-0 mt-auto w-full z-50 bg-white border-t border-[#E5E5E3]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const showBadge = item.path === "/requests" && pendingCount > 0
          const accent = ROUTE_ACCENT[item.path] || "#0A0A0A"
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-all ${
                isActive ? "text-black" : "text-[#AEAEAC]"
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5"
                  style={{ backgroundColor: accent }}
                />
              )}
              <item.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                style={isActive ? { color: accent } : {}}
              />
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider ${isActive ? "text-black" : "text-[#AEAEAC]"}`}
              >
                {item.name}
              </span>
              {showBadge && (
                <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default Sidebar
