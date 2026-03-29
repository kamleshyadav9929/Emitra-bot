import { Routes, Route } from "react-router-dom"
import { Sidebar, BottomNav } from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"

function App() {
  return (
    <div className="flex bg-[#0C0C12] min-h-screen text-slate-200">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 px-5 py-4 border-b border-[#1D1D2D] bg-[#0C0C12] sticky top-0 z-40">
          <div className="w-7 h-7 rounded-md bg-[#6366F1] flex items-center justify-center">
            <span className="text-white text-xs font-bold">⚡</span>
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">E-Mitra Admin</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></div>
            <span className="text-[10px] text-slate-600">Online</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/send"     element={<SendNotification />} />
            <Route path="/students" element={<Students />} />
            <Route path="/logs"     element={<Logs />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
