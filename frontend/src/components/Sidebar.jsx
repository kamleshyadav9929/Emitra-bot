import { Link, useLocation } from "react-router-dom"
import { Home, Send, Users, ClipboardList, Bot, HelpCircle, LogOut, Wrench } from "lucide-react"
import { useEffect, useState } from "react"
import { getServiceRequests } from "../api"

const navItems = [
  { name: "Dashboard",           path: "/admin",            icon: Home },
  { name: "Broadcast",           path: "/admin/send",       icon: Send },
  { name: "Students",            path: "/admin/students",   icon: Users },
  { name: "Requests",            path: "/admin/requests",   icon: ClipboardList },
  { name: "Services",            path: "/admin/services",   icon: Wrench },
  { name: "Bot Settings",        path: "/admin/bot-manager",icon: Bot },
]

function usePendingCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    getServiceRequests("pending")
      .then(d => setCount(d.pending || 0))
      .catch(() => {})
  }, [])
  return count
}

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const pendingCount = usePendingCount()

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0A1A40]/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[280px] bg-[var(--color-surface-base)] border-r border-[var(--color-outline-variant)] z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:flex flex-col`}
      >
        {/* Logo Area */}
        <div className="px-8 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-[var(--color-primary)] font-display">Bureau Panel</h1>
            <p className="text-[11px] font-medium text-gray-500 mt-1">E-Mitra Bot Administration</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors">
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const showBadge = item.path === "/admin/requests" && pendingCount > 0
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onClose() }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-surface-low)] text-[var(--color-primary)] font-semibold shadow-ambient"
                    : "text-[var(--color-on-surface)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-bright)]"
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-[var(--color-primary)]" : "text-gray-400"}
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

        {/* Footer Area */}
        <div className="px-6 py-8 flex flex-col gap-5 border-t border-[var(--color-outline-variant)]">
          <div className="flex flex-col gap-3 px-2">
            <Link to="#" className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-medium">
              <HelpCircle size={18} className="text-gray-400" />
              <span>Help Center</span>
            </Link>
            <Link to="/login" className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-medium">
              <LogOut size={18} className="text-gray-400" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
