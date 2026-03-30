import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layers, ArrowRight, Lock, Loader2 } from "lucide-react"
import { loginAdmin } from "../api"

export default function Login() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = await loginAdmin(password)
      if (data.success && data.token) {
        localStorage.setItem("emitra_token", data.token)
        navigate("/")
      } else {
        setError(data.error || "Invalid password")
      }
    } catch (err) {
      setError("Failed to connect to the server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0C0C12] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6366F1] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A855F7] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1a1a2e] rounded-full filter blur-[100px] opacity-20 hidden md:block"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#A855F7] flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 ring-1 ring-white/10">
            <Layers size={28} className="text-white drop-shadow-sm" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            E-Mitra Admin
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-[0.2em]">
            Secure Workspace
          </p>
        </div>

        <div className="bg-[#111119] border border-[#1D1D2D] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366F1]/50 to-transparent opacity-50"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Admin Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-500 group-focus-within:text-[#6366F1] transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the secret key"
                  className="w-full bg-[#0C0C12] border border-[#1D1D2D] rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50 focus:border-[#6366F1]/50 transition-all placeholder:text-slate-700 font-mono tracking-wider"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-white text-slate-900 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              {loading ? (
                <Loader2 size={18} className="animate-spin text-slate-600" />
              ) : (
                <>
                  <span className="text-[13px] uppercase tracking-wider font-bold">Access System</span>
                  <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em] mt-8">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  )
}
