import { Link, useLocation } from "react-router-dom"
import { Home, Send, Users, History, Terminal } from "lucide-react"

export default function Sidebar() {
  const location = useLocation()
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Send Notification", path: "/send", icon: Send },
    { name: "Students", path: "/students", icon: Users },
    { name: "Logs", path: "/logs", icon: History },
  ]

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-[#0D0D14] border-r border-[#1E1E2E] flex flex-col items-center py-8">
      
      <div className="w-full px-6 flex items-center gap-3 mb-10 text-orange-500">
        <Terminal size={32} />
        <div>
          <h1 className="text-xl font-bold tracking-wider uppercase">E-Mitra</h1>
          <p className="text-xs text-orange-500/60 uppercase tracking-widest">SysAdmin</p>
        </div>
      </div>

      <nav className="flex-1 w-full px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 border border-transparent ${
                isActive 
                  ? "bg-[#1E1E2E] text-white border-[#333344] shadow-[0_0_15px_rgba(255,107,53,0.1)]" 
                  : "text-slate-400 hover:text-white hover:bg-[#1E1E2E]/50"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-[#FF6B35]" : ""} />
              <span className="font-medium text-sm tracking-wide">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="w-full px-8 pb-4">
        <div className="px-4 py-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-md flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_10px_#4ADE80] animate-pulse"></div>
          <span className="text-xs text-slate-400">System Online</span>
        </div>
      </div>
      
    </aside>
  )
}
