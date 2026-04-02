import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Send, Target, TrendingUp, RefreshCw, Cpu, Activity, Globe, Megaphone, ClipboardList } from "lucide-react"
import ExamBadge from "../components/ExamBadge"
import { getStats, getStudents, getLogs, getServiceRequests } from "../api"

// Per-exam brand colors for the distribution bars
const EXAM_BAR_COLORS = {
  JEE:  { bar: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8" },
  NEET: { bar: "#22C55E", bg: "#F0FDF4", text: "#15803D" },
  SSC:  { bar: "#F97316", bg: "#FFF7ED", text: "#C2410C" },
  UPSC: { bar: "#EF4444", bg: "#FEF2F2", text: "#B91C1C" },
  CUET: { bar: "#A855F7", bg: "#FAF5FF", text: "#7E22CE" },
}

function StatCard({ label, value, sub, onClick, badge }) {
  return (
    <div
      className={`border border-[#E5E5E3] p-6 bg-white transition-all duration-200 ${onClick ? "cursor-pointer hover:border-black hover:shadow-md" : ""}`}
      onClick={onClick}
      style={{ userSelect: "none" }}
    >
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-3">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-4xl font-light text-black tracking-tight">{value ?? "—"}</p>
        {badge != null && badge > 0 && (
          <span className="mb-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 rounded-full">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] text-[#7A7A78] mt-2">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [totalSent, setTotalSent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

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
      const sent = (logData.logs || []).reduce((acc, log) => acc + (log.total_recipients || 0), 0)
      setTotalSent(sent)
      setPendingCount(reqData.pending || 0)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[11px] text-[#AEAEAC] font-medium tracking-wide uppercase">Loading</p>
        </div>
      </div>
    )
  }

  const total = stats?.total_students || 0
  const activeExamsCount = Object.keys(stats?.by_exam || {}).filter(k => k !== 'ALL' && k !== 'NONE' && stats.by_exam[k] > 0).length
  const examEntries = Object.entries(stats?.by_exam || {}).filter(([k, v]) => k !== 'ALL' && k !== 'NONE' && v > 0)

  const formatLastUpdated = (date) => {
    if (!date) return null
    const now = new Date()
    const diff = Math.round((now - date) / 1000)
    if (diff < 10) return "Just now"
    return `Last updated: ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">Overview</p>
          <h1 className="text-3xl font-light text-black tracking-tight">System Dashboard</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Real-time stats for E-Mitra bot.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {/* Broadcast Button */}
            <button
              onClick={() => navigate("/send")}
              className="flex items-center gap-2 px-3 py-2 bg-black text-white text-[12px] font-semibold hover:bg-[#3D3D3D] transition-colors"
            >
              <Megaphone size={12} />
              Send Broadcast
            </button>
            {/* Refresh Button */}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 border border-[#E5E5E3] text-[12px] text-[#3D3D3D] hover:border-black hover:text-black transition-colors disabled:opacity-40 font-medium"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-[#AEAEAC] font-mono">
              {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards — 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={total}
          sub="Registered in system"
          onClick={() => navigate("/students")}
        />
        <StatCard
          label="Messages Sent"
          value={totalSent}
          sub="Total recipients"
          onClick={() => navigate("/logs")}
        />
        <StatCard
          label="Active Exams"
          value={activeExamsCount}
          sub="Categories"
        />
        <StatCard
          label="Pending Requests"
          value={pendingCount}
          sub="E-Mitra services"
          badge={pendingCount}
          onClick={() => navigate("/requests")}
        />
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* System Health */}
        <div className="border border-[#E5E5E3] p-5 bg-white lg:col-span-2">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#E5E5E3]">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC]">System Health</p>
            <Activity size={13} className="text-[#2E7D32]" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-[#7A7A78]">
                <Globe size={12} />
                <span>API Status</span>
              </div>
              <span className="text-[10px] font-semibold text-[#2E7D32] border border-[#2E7D32]/20 bg-[#2E7D32]/5 px-1.5 py-0.5">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-[#7A7A78]">
                <Cpu size={12} />
                <span>Bot Service</span>
              </div>
              <span className="text-[10px] font-semibold text-[#2E7D32] border border-[#2E7D32]/20 bg-[#2E7D32]/5 px-1.5 py-0.5">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-[#7A7A78]">
                <ClipboardList size={12} />
                <span>Pending Requests</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 border cursor-pointer transition-colors ${
                  pendingCount > 0
                    ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                    : "text-[#AEAEAC] border-[#E5E5E3] bg-[#F7F7F5]"
                }`}
                onClick={() => navigate("/requests")}
              >
                {pendingCount > 0 ? `${pendingCount} PENDING` : "CLEAR"}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E5E5E3]">
            <p className="text-[10px] text-[#AEAEAC] font-mono">LATENCY: 42ms</p>
          </div>
        </div>

        {/* Exam Distribution */}
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
                const pct = total === 0 ? 0 : Math.round((count / total) * 100)
                const color = EXAM_BAR_COLORS[exam] || { bar: "#0A0A0A", bg: "#F7F7F5", text: "#0A0A0A" }
                return (
                  <div
                    key={exam}
                    className="cursor-pointer group"
                    onClick={() => navigate(`/send?exam=${exam}`)}
                    title={`Click to send to ${exam} students`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span
                        className="text-[12px] font-semibold transition-colors group-hover:underline"
                        style={{ color: color.text }}
                      >
                        {exam}
                      </span>
                      <span className="text-[11px] text-[#7A7A78] font-mono">{count} · {pct}%</span>
                    </div>
                    <div className="w-full bg-[#F7F7F5] h-2 overflow-hidden rounded-sm">
                      <div
                        className="h-full transition-all duration-700 rounded-sm"
                        style={{ width: `${pct}%`, backgroundColor: color.bar }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="border border-[#E5E5E3] bg-white">
        <div className="px-5 py-4 border-b border-[#E5E5E3] flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC]">Recent Students</p>
          <span className="text-[10px] text-[#AEAEAC] font-mono">{total} total</span>
        </div>
        <div>
          {recent.map((s, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#E5E5E3] last:border-0 hover:bg-[#F7F7F5] transition-colors">
              <div className="w-8 h-8 bg-[#F7F7F5] border border-[#E5E5E3] flex items-center justify-center text-black font-semibold text-[12px] flex-shrink-0">
                {s.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-black truncate">{s.name}</p>
              </div>
              <ExamBadge exam={s.exam_preference} />
              <span className="text-[10px] text-[#AEAEAC] font-mono flex-shrink-0">{new Date(s.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[13px] text-[#AEAEAC]">No students yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
