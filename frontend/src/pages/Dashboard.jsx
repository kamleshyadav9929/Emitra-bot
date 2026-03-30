import { useEffect, useState, useCallback } from "react"
import { Users, Send, Target, TrendingUp, RefreshCw, Cpu, Activity, Globe } from "lucide-react"
import ExamBadge from "../components/ExamBadge"
import { EXAM_COLORS } from "../constants/examColors"
import { getStats, getStudents, getLogs } from "../api"

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-[#E5E5E3] p-6 bg-white hover:border-[#0A0A0A] transition-colors">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-3">{label}</p>
      <p className="text-4xl font-light text-black tracking-tight">{value ?? "—"}</p>
      {sub && <p className="text-[11px] text-[#7A7A78] mt-2">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [totalSent, setTotalSent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [st, stList, logData] = await Promise.all([
        getStats().catch(() => ({ total_students: 0, by_exam: {} })),
        getStudents().catch(() => ({ students: [] })),
        getLogs().catch(() => ({ logs: [] }))
      ])
      setStats(st)
      const sorted = (stList.students || []).sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
      setRecent(sorted.slice(0, 5))
      const sent = (logData.logs || []).reduce((acc, log) => acc + (log.total_recipients || 0), 0)
      setTotalSent(sent)
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
  const examEntries = Object.entries(stats?.by_exam || {}).filter(([k]) => k !== 'ALL' && k !== 'NONE')

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">Overview</p>
          <h1 className="text-3xl font-light text-black tracking-tight">System Dashboard</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Real-time stats for E-Mitra bot.</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-[#E5E5E3] text-[12px] text-[#3D3D3D] hover:border-black hover:text-black transition-colors disabled:opacity-40 font-medium"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {lastUpdated && (
            <span className="text-[10px] text-[#AEAEAC] font-mono">
              {Math.round((Date.now() - lastUpdated) / 1000)}s ago
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Students" value={total} sub="Registered in system" />
        <StatCard label="Messages Sent" value={totalSent} sub="Total recipients" />
        <StatCard label="Active Exams" value={activeExamsCount} sub="Categories" />
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
            {examEntries.map(([exam, count]) => {
              const pct = total === 0 ? 0 : Math.round((count / total) * 100)
              return (
                <div key={exam}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-semibold text-[#3D3D3D]">{exam}</span>
                    <span className="text-[11px] text-[#7A7A78] font-mono">{count} · {pct}%</span>
                  </div>
                  <div className="w-full bg-[#F7F7F5] h-1.5 overflow-hidden">
                    <div className="h-full bg-black transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {examEntries.length === 0 && <p className="text-[12px] text-[#AEAEAC] text-center py-4">No data</p>}
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
              <span className="text-[10px] text-[#AEAEAC] font-mono flex-shrink-0">{new Date(s.joined_at).toLocaleDateString()}</span>
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
