import { useState } from "react"
import { login } from "../api"
import { useNavigate } from "react-router-dom"
import { Layers, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function Login() {
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError("")
    try {
      const data = await login(password)
      if (data.token) {
        localStorage.setItem("admin_token", data.token)
        navigate("/")
      } else {
        setError(data.error || "Invalid password.")
      }
    } catch {
      setError("Could not reach server. Check connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — editorial masthead */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 bg-[#0A0A0A] text-white">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-white flex items-center justify-center">
            <Layers size={14} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold tracking-wide">E-Mitra</span>
        </div>

        <div>
          <p className="text-[10px] text-white/40 font-semibold tracking-[0.2em] uppercase mb-6">Admin System</p>
          <h1 className="text-5xl font-light leading-[1.1] tracking-tight">
            Manage.<br />Send.<br />Monitor.
          </h1>
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-[13px] text-white/40 leading-relaxed">
              Secure administrative workspace for the E-Mitra student notification platform.
            </p>
          </div>
        </div>

        <div className="text-[10px] text-white/20 font-mono">
          © {new Date().getFullYear()} E-Mitra Admin
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-10">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <Layers size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-semibold text-black">E-Mitra Admin</span>
          </div>

          <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.2em] uppercase mb-3">Sign In</p>
          <h2 className="text-2xl font-semibold text-black leading-tight mb-8">Access your workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#3D3D3D] tracking-wide uppercase mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter secret key"
                  className={`w-full border px-4 py-3 text-[14px] text-black placeholder:text-[#AEAEAC] bg-white outline-none focus:border-black transition-colors pr-10 ${
                    error ? "border-[#C62828]" : "border-[#E5E5E3]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEAC] hover:text-black"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-[12px] text-[#C62828] font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-colors ${
                loading || !password.trim()
                  ? "bg-[#F7F7F5] text-[#AEAEAC] cursor-not-allowed"
                  : "bg-black text-white hover:bg-[#3D3D3D]"
              }`}
            >
              {loading ? (
                <span className="text-[13px]">Verifying...</span>
              ) : (
                <>
                  Access System
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-[11px] text-[#AEAEAC] text-center">
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  )
}
