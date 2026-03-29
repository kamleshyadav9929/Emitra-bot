import { Routes, Route } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import SendNotification from "./pages/SendNotification"
import Students from "./pages/Students"
import Logs from "./pages/Logs"

function App() {
  return (
    <div className="flex bg-[#09090E] min-h-screen text-slate-200">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-8">
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
