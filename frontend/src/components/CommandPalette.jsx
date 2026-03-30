import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X, Home, Send, Users, ClipboardList, History } from "lucide-react"

const commands = [
  { id: "dashboard", label: "Dashboard",        path: "/",         icon: Home          },
  { id: "send",      label: "Send Notification", path: "/send",     icon: Send          },
  { id: "students",  label: "Students",          path: "/students", icon: Users         },
  { id: "requests",  label: "Service Requests",  path: "/requests", icon: ClipboardList },
  { id: "logs",      label: "Logs",              path: "/logs",     icon: History       },
]

export default function CommandPalette({ onClose }) {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const filtered = query.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  const go = (path) => { navigate(path); onClose() }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white border border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center border-b border-[#E5E5E3] px-4 py-3 gap-3">
          <Search size={16} className="text-[#7A7A78] flex-shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 text-sm text-black placeholder:text-[#AEAEAC] bg-transparent outline-none font-medium"
          />
          <button onClick={onClose} className="text-[#AEAEAC] hover:text-black">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="py-1 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#AEAEAC]">No results.</p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => go(cmd.path)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[#3D3D3D] hover:bg-[#F7F7F5] hover:text-black transition-colors font-medium"
              >
                <cmd.icon size={15} strokeWidth={2} className="flex-shrink-0 text-[#7A7A78]" />
                {cmd.label}
                <span className="ml-auto text-[10px] text-[#AEAEAC] font-mono uppercase tracking-wider">Page</span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E5E3] px-4 py-2 flex gap-4 text-[10px] text-[#AEAEAC] font-medium">
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
