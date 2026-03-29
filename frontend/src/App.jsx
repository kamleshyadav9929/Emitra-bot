import { Routes, Route } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"

function App() {
  return (
    <div className="flex bg-[#0A0A0F] min-h-screen text-slate-200 font-mono">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 ml-64 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<SendNotification />} />
            <Route path="/students" element={<Students />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
