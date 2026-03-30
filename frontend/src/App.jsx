import { Routes, Route, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Sidebar, BottomNav } from "./components/Sidebar"
import CommandPalette from "./components/CommandPalette"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"
import ServiceRequests from "./pages/ServiceRequests"

function App() {
  const navigate = useNavigate()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
        return
      }

      if (["INPUT", "TEXTAREA"].includes(event.target.tagName)) return

      if (event.key === "1") navigate("/")
      if (event.key === "2") navigate("/send")
      if (event.key === "3") navigate("/students")
      if (event.key === "4") navigate("/requests")
      if (event.key === "5") navigate("/logs")
    }

    window.addEventListener("keydown", handleKeys)
    return () => window.removeEventListener("keydown", handleKeys)
  }, [navigate])

  return (
    <div className="flex bg-[#0C0C12] min-h-screen text-slate-200">
      <Sidebar />
      <CommandPalette
        key={isCommandPaletteOpen ? "open" : "closed"}
        isOpen={isCommandPaletteOpen}
        setIsOpen={setIsCommandPaletteOpen}
      />
      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="md:hidden flex items-center gap-3 px-5 py-4 border-b border-[#1D1D2D] bg-[#0C0C12] sticky top-0 z-40">
          <div className="w-7 h-7 rounded-md bg-[#6366F1] flex items-center justify-center">
            <span className="text-white text-xs font-bold">E</span>
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">E-Mitra Admin</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></div>
            <span className="text-[10px] text-slate-600">Online</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<SendNotification />} />
            <Route path="/students" element={<Students />} />
            <Route path="/requests" element={<ServiceRequests />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
