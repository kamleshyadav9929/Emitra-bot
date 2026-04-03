import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Sidebar, BottomNav } from "./components/Sidebar"
import CommandPalette from "./components/CommandPalette"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"
import ServiceRequests from "./pages/ServiceRequests"
import BotManager from "./pages/BotManager"
import Login from "./pages/Login"
import { Layers } from "lucide-react"

function PrivateRoute({ children }) {
  const token = localStorage.getItem("admin_token")
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
        return
      }
      if (event.key === "Escape") { setIsCommandPaletteOpen(false); return }
      if (["INPUT", "TEXTAREA"].includes(event.target.tagName)) return
      if (event.key === "1") navigate("/")
      if (event.key === "2") navigate("/send")
      if (event.key === "3") navigate("/students")
      if (event.key === "4") navigate("/requests")
      if (event.key === "5") navigate("/bot-manager")
    }
    window.addEventListener("keydown", handleKeys)
    return () => window.removeEventListener("keydown", handleKeys)
  }, [navigate])

  const isLoginPage = location.pathname === "/login"

  return (
    <div className="flex flex-col md:flex-row bg-white text-black" style={{ minHeight: '100dvh' }}>
      {!isLoginPage && <Sidebar />}
      {!isLoginPage && isCommandPaletteOpen && (
        <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
      )}

      <main className={`flex-1 min-w-0 flex flex-col ${!isLoginPage ? "md:ml-[220px]" : ""}`}>
        {/* Mobile top bar */}
        {!isLoginPage && (
          <div className="md:hidden flex items-center gap-3 px-5 py-4 border-b border-[#E5E5E3] bg-white sticky top-0 z-40">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <Layers size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-semibold text-black">E-Mitra Admin</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></div>
              <span className="text-[10px] text-[#7A7A78] font-medium">Online</span>
            </div>
          </div>
        )}

        <div className={`max-w-5xl mx-auto w-full ${!isLoginPage ? "px-4 sm:px-5 md:px-8 py-6 md:py-8" : "flex-1 flex flex-col"}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/send" element={<PrivateRoute><SendNotification /></PrivateRoute>} />
            <Route path="/students" element={<PrivateRoute><Students /></PrivateRoute>} />
            <Route path="/requests" element={<PrivateRoute><ServiceRequests /></PrivateRoute>} />
            <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
            <Route path="/bot-manager" element={<PrivateRoute><BotManager /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
      {!isLoginPage && <BottomNav />}
    </div>
  )
}

export default App
