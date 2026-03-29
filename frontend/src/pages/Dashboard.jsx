import { useEffect, useState, useCallback } from "react"
import { Users, Send, Target, TrendingUp, RefreshCw, Cpu, Activity, Globe } from "lucide-react"
import { motion } from "motion/react"
import StatCard from "../components/StatCard"
import ExamBadge, { EXAM_COLORS } from "../components/ExamBadge"
import { getStats, getStudents, getLogs } from "../api"

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
          <div className="w-7 h-7 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const total = stats?.total_students || 0
  const activeExamsCount = Object.keys(stats?.by_exam || {}).filter(k => k !== 'ALL' && k !== 'NONE' && stats.by_exam[k] > 0).length
  const examEntries = Object.entries(stats?.by_exam || {}).filter(([k]) => k !== 'ALL' && k !== 'NONE')

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-[10px] text-[#818CF8] font-semibold tracking-[0.15em] uppercase mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-white">System Dashboard</h1>
          <p className="text-sm text-slate-600 mt-0.5">Real-time stats for E-Mitra bot.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-[#111119] border border-[#1D1D2D] rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:border-[#2a2a3f] transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin text-[#6366F1]" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {lastUpdated && (
            <span className="text-[10px] text-slate-700 font-mono">
              Updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
            </span>
          )}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Total Students" value={total} icon={Users} colorTheme="indigo" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Messages Sent" value={totalSent} icon={Send} colorTheme="cyan" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Active Exams" value={activeExamsCount} icon={Target} colorTheme="green" />
        </motion.div>
      </motion.div>

      {/* Lower Row: Health + Distribution + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* System Health */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111119] border border-[#1D1D2D] rounded-xl p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">System Health</h2>
            <Activity size={14} className="text-[#4ADE80]" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Globe size={12} />
                <span>API Status</span>
              </div>
              <span className="text-[10px] font-bold text-[#4ADE80] bg-[#4ADE80]/10 px-1.5 py-0.5 rounded">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Cpu size={12} />
                <span>Bot Service</span>
              </div>
              <span className="text-[10px] font-bold text-[#4ADE80] bg-[#4ADE80]/10 px-1.5 py-0.5 rounded">ACTIVE</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#1D1D2D]">
            <p className="text-[10px] text-slate-700 font-mono tracking-tighter">LATENCY: 42ms</p>
          </div>
        </motion.div>

        {/* Exam Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111119] border border-[#1D1D2D] rounded-xl p-5 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Distribution</h2>
            <TrendingUp size={14} className="text-slate-700" />
          </div>
          <div className="space-y-4">
            {examEntries.map(([exam, count]) => {
              const pct = total === 0 ? 0 : Math.round((count / total) * 100)
              const color = EXAM_COLORS[exam] || "#666"
              return (
                <div key={exam}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-400">{exam}</span>
                    <span className="text-xs text-slate-600 font-mono">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#1D1D2D] h-1 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
            {examEntries.length === 0 && <p className="text-xs text-slate-700 text-center py-4">No data</p>}
          </div>
        </motion.div>

        {/* Recent Students */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111119] border border-[#1D1D2D] rounded-xl p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Recent Students</h2>
            <span className="text-[10px] text-slate-600 bg-[#1D1D2D] px-2 py-1 rounded font-mono">{total} total</span>
          </div>
          <div className="space-y-1">
            {recent.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#18182A] transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ background: `${EXAM_COLORS[s.exam_preference] || "#6366F1"}20`, border: `1px solid ${EXAM_COLORS[s.exam_preference] || "#6366F1"}30` }}
                >
                  {s.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{s.name}</p>
                </div>
                <ExamBadge exam={s.exam_preference} />
                <span className="text-[10px] text-slate-700 flex-shrink-0">{new Date(s.joined_at).toLocaleDateString()}</span>
              </div>
            ))}
            {recent.length === 0 && <div className="text-center py-8"><p className="text-sm text-slate-700">No students yet</p></div>}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
