import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { TrendingUp, RefreshCw, Megaphone, Users, Send, AlertCircle, BookOpen, ChevronRight } from "lucide-react"
import ExamBadge from "../components/ExamBadge"
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
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] text-[#AEAEAC] font-medium tracking-wide uppercase">Loading</p>
      </div>
    </div>
  )

  const total      = stats?.total_students || 0
  const examCount  = Object.keys(stats?.by_exam || {}).filter(k => k !== "ALL" && k !== "NONE" && stats.by_exam[k] > 0).length
  const examEntries = Object.entries(stats?.by_exam || {}).filter(([k, v]) => k !== "ALL" && k !== "NONE" && v > 0)
  const lastUpdatedStr = lastUpdated
    ? (new Date() - lastUpdated < 10000 ? "Just now" : `Last updated: ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
    : null

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-1">Overview</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Dashboard</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-[#E5E5E3] text-[12px] text-[#3D3D3D] hover:border-black hover:text-black transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {lastUpdatedStr && <span className="text-[10px] text-[#AEAEAC] font-mono">{lastUpdatedStr}</span>}
        </div>
      </div>

      {/* ── Row 1: 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Students */}
        <div
          onClick={() => navigate("/students")}
          className="border border-[#E5E5E3] p-6 bg-white cursor-pointer hover:border-black hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <Users size={16} className="text-[#AEAEAC] group-hover:text-black transition-colors" />
            <ChevronRight size={12} className="text-[#E5E5E3] group-hover:text-black transition-colors" />
          </div>
          <p className="text-4xl font-light text-black tracking-tight">{total}</p>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#AEAEAC] mt-2">Total Students</p>
        </div>

        {/* Messages Sent */}
        <div
          onClick={() => navigate("/logs")}
          className="border border-[#E5E5E3] p-6 bg-white cursor-pointer hover:border-black hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <Send size={16} className="text-[#AEAEAC] group-hover:text-black transition-colors" />
            <ChevronRight size={12} className="text-[#E5E5E3] group-hover:text-black transition-colors" />
          </div>
          <p className="text-4xl font-light text-black tracking-tight">{totalSent}</p>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#AEAEAC] mt-2">Messages Sent</p>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => navigate("/requests")}
          className="border border-[#E5E5E3] p-6 bg-white cursor-pointer hover:border-black hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle size={16} className={pendingCount > 0 ? "text-red-500" : "text-[#AEAEAC]"} />
            <div className="flex items-center gap-1.5">
              {pendingCount > 0 && (
                <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 rounded-full">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
              <ChevronRight size={12} className="text-[#E5E5E3] group-hover:text-black transition-colors" />
            </div>
          </div>
          <p className={`text-4xl font-light tracking-tight ${pendingCount > 0 ? "text-red-600" : "text-black"}`}>
            {pendingCount}
          </p>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#AEAEAC] mt-2">Pending Requests</p>
        </div>

        {/* Exam Categories */}
        <div className="border border-[#E5E5E3] p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <BookOpen size={16} className="text-[#AEAEAC]" />
          </div>
          <p className="text-4xl font-light text-black tracking-tight">{examCount}</p>
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#AEAEAC] mt-2">Exam Categories</p>
        </div>
      </div>

      {/* ── Row 2: Distribution Chart + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Distribution Chart — 3/5 */}
        <div className="border border-[#E5E5E3] p-5 bg-white lg:col-span-3">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#E5E5E3]">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC]">Distribution</p>
            <TrendingUp size={13} className="text-[#AEAEAC]" />
          </div>
          <div className="space-y-4">
            {examEntries.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-[#AEAEAC]">No students yet</p>
              </div>
            ) : (
              examEntries.map(([exam, count]) => {
                const pct   = total === 0 ? 0 : Math.round((count / total) * 100)
                let color = EXAM_COLORS[exam]
                if (!color) {
                  let hash = 0
                  for (let i = 0; i < exam.length; i++) hash = exam.charCodeAt(i) + ((hash << 5) - hash)
                  const h = Math.abs(hash) % 360
                  color = { bar: `hsl(${h}, 70%, 50%)`, text: `hsl(${h}, 80%, 30%)`, bg: `hsl(${h}, 50%, 95%)` }
                }
                return (
                  <div
                    key={exam}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/send?exam=${exam}`)}
                    title={`Click to send to ${exam} students`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-semibold group-hover:underline transition-colors" style={{ color: color.text }}>
                        {exam}
                      </span>
                      <span className="text-[11px] text-[#7A7A78] font-mono">{count} · {pct}%</span>
                    </div>
                    <div className="w-full bg-[#F7F7F5] h-2 overflow-hidden rounded-sm">
                      <div className="h-full transition-all duration-700 rounded-sm" style={{ width: `${pct}%`, backgroundColor: color.bar }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions — 2/5 */}
        <div className="border border-[#E5E5E3] p-5 bg-white lg:col-span-2">
          <div className="mb-5 pb-4 border-b border-[#E5E5E3]">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC]">Quick Actions</p>
          </div>
          <div className="space-y-2">
            {[
              { label: "View All Students",    sub: `${total} registered`,          path: "/students"  },
              { label: "E-Mitra Requests",     sub: pendingCount > 0 ? `${pendingCount} pending` : "No pending", path: "/requests", alert: pendingCount > 0 },
              { label: "Broadcast History",    sub: `${totalSent} messages sent`,    path: "/logs"      },
              { label: "Bot Manager",          sub: "Settings & services",           path: "/bot-manager" },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between px-4 py-3 border border-[#E5E5E3] hover:border-black hover:bg-[#F7F7F5] transition-all text-left group"
              >
                <div>
                  <p className="text-[13px] font-semibold text-black">{item.label}</p>
                  <p className={`text-[11px] mt-0.5 ${item.alert ? "text-red-500" : "text-[#AEAEAC]"}`}>{item.sub}</p>
                </div>
                <ChevronRight size={14} className="text-[#E5E5E3] group-hover:text-black transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Big Send Broadcast Button ── */}
      <button
        onClick={() => navigate("/send")}
        className="w-full flex items-center justify-center gap-3 py-5 bg-black text-white hover:bg-[#1A1A1A] active:scale-[0.99] transition-all"
        style={{ boxShadow: "4px 4px 0px #E5E5E3" }}
      >
        <Megaphone size={20} />
        <span className="text-[16px] font-semibold tracking-wide">📢 Send Broadcast</span>
        <span className="text-[12px] text-white/50 font-mono ml-2">{total} students eligible</span>
      </button>

    </div>
  )
}
