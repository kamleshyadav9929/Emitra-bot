import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardList, TrendingUp, Megaphone, ArrowRight, ExternalLink, Activity, FileText, CheckCircle, Users, Send } from "lucide-react"
import { getStats, getStudents, getLogs, getServiceRequests } from "../api"

const EXAM_COLORS = {
  JEE:  { bar: "#3B82F6", text: "#1D4ED8", bg: "#EFF6FF" },
  NEET: { bar: "#22C55E", text: "#15803D", bg: "#F0FDF4" },
  SSC:  { bar: "#F97316", text: "#C2410C", bg: "#FFF7ED" },
  UPSC: { bar: "#EF4444", text: "#B91C1C", bg: "#FEF2F2" },
  CUET: { bar: "#A855F7", text: "#7E22CE", bg: "#FAF5FF" },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats]           = useState(null)
  const [totalSent, setTotalSent]   = useState(0)
  const [pendingCount, setPending]  = useState(0)
  const [recentStudents, setRecent] = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [st, stList, logData, reqData] = await Promise.all([
        getStats().catch(() => ({ total_students: 0, by_exam: {} })),
        getStudents().catch(() => ({ students: [] })),
        getLogs().catch(() => ({ logs: [] })),
        getServiceRequests("pending").catch(() => ({ pending: 0 })),
      ])
      setStats(st)
      const sorted = (stList.students || []).sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
      setRecent(sorted.slice(0, 5))
      setTotalSent((logData.logs || []).reduce((acc, l) => acc + (l.total_recipients || 0), 0))
      setPending(reqData.pending || 0)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#164FA8] border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] text-[#164FA8] font-bold tracking-wide uppercase">Loading Panel Data</p>
      </div>
    </div>
  )

  const total = stats?.total_students || 0
  const examEntries = Object.entries(stats?.by_exam || {}).filter(([k, v]) => k !== "ALL" && k !== "NONE" && v > 0)
  
  const lastUpdatedStr = lastUpdated
    ? (new Date() - lastUpdated < 10000 ? "Just now" : `Last check: ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
    : null

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#164FA8] mb-2">INSTITUTIONAL DASHBOARD</p>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">Bot Overview</h1>
           <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed">
             Monitor student onboarding metrics, broadcast volumes, and integration requests from a unified digital panel.
           </p>
        </div>
        <button 
           onClick={() => fetchAll(true)}
           disabled={refreshing}
           className="px-4 py-2 bg-white border border-gray-200 text-[#164FA8] font-medium text-[13px] rounded-lg shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
        >
           {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* ── Top Metrics Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Total Students */}
        <div 
          onClick={() => navigate("/admin/students")}
          className="bg-[var(--color-primary-fixed)] border-none rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-[180px] cursor-pointer hover:shadow-ambient transition-shadow group"
        >
          <div className="z-10 relative">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-primary)]">TOTAL STUDENTS</p>
            <p className="text-5xl font-extrabold text-[#0A1A40] mt-3 group-hover:scale-105 transition-transform origin-left">{total}</p>
          </div>
          <div className="flex items-center gap-2 z-10 relative">
            <TrendingUp size={16} className="text-[var(--color-primary)]" />
            <span className="text-[13px] font-medium text-[var(--color-primary)]">Active Registrations</span>
          </div>
          <Users size={140} strokeWidth={1} className="absolute -bottom-6 -right-6 text-white text-opacity-50 rotate-[-5deg] pointer-events-none z-0" />
        </div>

        {/* Messages Sent */}
        <div 
          onClick={() => navigate("/admin/logs")}
          className="bg-[var(--color-surface-lowest)] shadow-ambient border-none rounded-xl p-6 flex flex-col justify-between h-[180px] cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden"
        >
          <div className="z-10 relative">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-400">MESSAGES SENT</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">{totalSent}</p>
          </div>
          <div className="mt-auto flex justify-between items-end z-10 relative">
            <div>
               <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total Delivered Broadcasts</p>
            </div>
            <Send size={24} className="text-gray-200" />
          </div>
          <Send size={140} strokeWidth={1} className="absolute -bottom-8 -right-8 text-[#f3faff] rotate-[-15deg] pointer-events-none z-0" />
        </div>

        {/* Pending Requests */}
        <div 
          onClick={() => navigate("/admin/requests")}
          className="bg-[var(--color-surface-low)] border-none shadow-sm rounded-xl p-6 flex flex-col justify-between h-[180px] relative overflow-hidden cursor-pointer hover:shadow-ambient transition-shadow"
        >
          {pendingCount > 0 && (
             <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse z-20"></div>
          )}
          <div className="z-10 relative">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">PENDING REQUESTS</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">
               {pendingCount} {pendingCount > 0 && <span className="font-semibold text-2xl text-red-500 ml-1">New</span>}
            </p>
          </div>
          <p className="text-[13px] font-bold text-[var(--color-primary)] underline underline-offset-2 hover:text-black transition-colors mt-auto z-10 relative">
            View All e-Mitra Requests
          </p>
          <FileText size={140} strokeWidth={1} className="absolute -bottom-6 -right-10 text-white/70 rotate-[10deg] pointer-events-none z-0" />
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Exam Distribution & Recent Students */}
        <div className="bg-[var(--color-surface-lowest)] border-none rounded-xl p-7 shadow-ambient lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[17px] font-bold text-gray-900">Recent Student Registrations</h2>
            <button 
              onClick={() => navigate("/admin/students")}
              className="text-[13px] font-semibold text-[#164FA8] hover:text-[#0B3A82] transition-colors"
            >
              View Full Student Database
            </button>
          </div>

          {recentStudents.length === 0 ? (
             <div className="text-center py-8 text-sm text-gray-500">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-[10px] font-bold tracking-wider text-gray-400 uppercase pb-4">Name</th>
                    <th className="text-[10px] font-bold tracking-wider text-gray-400 uppercase pb-4">Phone Number</th>
                    <th className="text-[10px] font-bold tracking-wider text-gray-400 uppercase pb-4">Exam Prep</th>
                    <th className="text-[10px] font-bold tracking-wider text-gray-400 uppercase pb-4">Status</th>
                    <th className="text-[10px] font-bold tracking-wider text-gray-400 uppercase pb-4 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-medium border-t-0">
                  {recentStudents.map((s, idx) => {
                    const dateObj = new Date(s.joined_at)
                    const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'Unknown'
                    return (
                      <tr key={s.phone_number || idx} className="odd:bg-[var(--color-surface-low)]">
                        <td className="py-4 px-2 font-bold text-[var(--color-on-surface)] border-none">{s.name || "Unknown"}</td>
                        <td className="py-4 px-2 border-none text-gray-600">{s.phone_number || "Not Shared"}</td>
                        <td className="py-4 text-gray-600 px-2 border-none">{s.exam_preference || "NONE"}</td>
                        <td className="py-4 px-2 border-none">
                          <span className="bg-[#E1F7E8] text-[#1E8A44] px-3 py-1 rounded-md text-[10px] font-bold">Active</span>
                        </td>
                        <td className="py-4 px-2 text-gray-400 text-right border-none">{dateStr}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Exam Distribution Inject */}
          <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-[13px] font-bold text-gray-800 mb-4 uppercase tracking-wider">Exam Distribution</h3>
              <div className="space-y-4">
                  {examEntries.length === 0 ? (
                      <p className="text-[12px] text-gray-400">No data available.</p>
                  ) : (
                      examEntries.map(([exam, count]) => {
                          const pct = total === 0 ? 0 : Math.round((count / total) * 100)
                          let color = EXAM_COLORS[exam] || { bar: "#164FA8", text: "#0B3A82", bg: "#F0F4FA" }
                          return (
                              <div key={exam}>
                                  <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-[12px] font-bold" style={{ color: color.text }}>{exam}</span>
                                      <span className="text-[11px] text-gray-500 font-medium">{count} Students · {pct}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 h-[6px] overflow-hidden rounded-full">
                                      <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${pct}%`, backgroundColor: color.bar }} />
                                  </div>
                              </div>
                          )
                      })
                  )}
              </div>
          </div>

        </div>

        {/* Right Column - Action Cards */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          


          {/* Update Form List -> Service Requests */}
          <div 
            onClick={() => navigate("/admin/requests")}
            className="bg-[var(--color-surface-low)] border-none rounded-xl p-7 flex flex-col justify-between cursor-pointer hover:shadow-ambient transition-all flex-shrink-0"
          >
            <div>
              <FileText size={22} className="text-[#164FA8] mb-4" />
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Service Requests</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed mb-6 pr-4">
                Process integration requests for e-Mitra digital services and track statuses.
              </p>
            </div>
            <button className="flex items-center gap-2 text-[11px] font-bold text-[#164FA8] uppercase tracking-wide group-hover:underline underline-offset-2">
              MANAGE REQUESTS <ExternalLink size={14} />
            </button>
          </div>

          {/* Systems Operational */}
          <div className="bg-[#E8F8F5] rounded-[16px] px-5 py-4 flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 bg-[#BCF0DA] rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-[#10B981] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900">Systems Operational</p>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5">{lastUpdatedStr || "Last check: unknown"}</p>
            </div>
          </div>

        </div>
      </div>
      
      <div className="mt-12 w-full flex justify-between items-start text-[10px] text-gray-400 border-t border-gray-100 pt-6">
        <div className="flex flex-col md:flex-row gap-10 md:gap-20">
          <div>
            <h4 className="font-bold text-gray-800 text-[12px] tracking-wide mb-2">E-Mitra Bot Panel</h4>
            <p className="max-w-xs leading-relaxed">Providing high-end digital infrastructure for administrative efficiency and student convenience.</p>
          </div>
          <div className="flex gap-16">
              <div>
                <h4 className="font-bold tracking-wider uppercase mb-2 text-[#164FA8]">Platform</h4>
                <p className="mb-2 cursor-pointer hover:text-gray-800">Privacy Policy</p>
                <p className="cursor-pointer hover:text-gray-800">Terms of Service</p>
              </div>
              <div>
                <h4 className="font-bold tracking-wider uppercase mb-2 text-[#164FA8]">System Support</h4>
                <p className="mb-2 cursor-pointer hover:text-gray-800">Bot Commands</p>
                <p className="cursor-pointer hover:text-gray-800">Contact Support</p>
              </div>
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-400 mt-10 pb-8">
        © 2024 E-Mitra Bot Administration. All rights reserved.
      </p>

    </div>
  )
}
