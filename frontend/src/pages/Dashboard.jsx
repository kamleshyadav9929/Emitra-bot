import { useEffect, useState } from "react"
import { Users, Send, Target } from "lucide-react"
import StatCard from "../components/StatCard"
import ExamBadge, { EXAM_COLORS } from "../components/ExamBadge"
import { getStats, getStudents, getLogs } from "../api"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [totalSent, setTotalSent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getStats().catch(e => ({ total_students: 0, by_exam: {} })),
      getStudents().catch(e => ({ students: [] })),
      getLogs().catch(e => ({ logs: [] }))
    ]).then(([st, stList, logData]) => {
      setStats(st)
      const sorted = (stList.students || []).sort((a,b) => new Date(b.joined_at) - new Date(a.joined_at))
      setRecent(sorted.slice(0, 5))
      
      const logs = logData.logs || []
      const sent = logs.reduce((acc, log) => acc + (log.total_recipients || 0), 0)
      setTotalSent(sent)
      
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    )
  }

  const total = stats?.total_students || 0
  const activeExamsCount = Object.keys(stats?.by_exam || {}).filter(k => k !== 'ALL' && k !== 'NONE' && stats.by_exam[k] > 0).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-wide">System Overview</h1>
        <p className="text-slate-400 mt-2">Welcome back, Admin. Here are your latest stats.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={total} icon={Users} colorTheme="teal" />
        <StatCard title="Messages Sent" value={totalSent} icon={Send} colorTheme="orange" />
        <StatCard title="Active Exams" value={activeExamsCount} icon={Target} colorTheme="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="bg-[#0D0D14] p-6 rounded-lg border border-[#1E1E2E] lg:col-span-1 shadow-xl">
          <h2 className="text-lg font-bold mb-6 tracking-widest uppercase border-b border-[#1E1E2E] pb-4">Exam Distribution</h2>
          <div className="space-y-6">
            {Object.entries(stats?.by_exam || {}).filter(([k]) => k !== 'ALL' && k !== 'NONE').map(([exam, count]) => {
              const pct = total === 0 ? 0 : Math.round((count / total) * 100)
              const color = EXAM_COLORS[exam] || "#666"
              return (
                <div key={exam} className="space-y-2 group">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{exam}</span>
                    <span className="text-slate-500">{count} students ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#1E1E2E] h-1.5 rounded-full overflow-hidden">
                    <div 
                         className="h-1.5 rounded-full transition-all duration-1000 ease-out" 
                         style={{ 
                            width: `${pct}%`, 
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}80`
                         }}>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#0D0D14] p-6 rounded-lg border border-[#1E1E2E] lg:col-span-2 shadow-xl">
          <h2 className="text-lg font-bold mb-6 tracking-widest uppercase border-b border-[#1E1E2E] pb-4">Recent Students</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E1E2E] text-slate-500 text-xs tracking-[0.2em] uppercase">
                  <th className="pb-4 px-4 font-normal">Name</th>
                  <th className="pb-4 px-4 font-normal">Exam</th>
                  <th className="pb-4 px-4 font-normal">Contact</th>
                  <th className="pb-4 px-4 font-normal text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]/50">
                {recent.map((s, i) => (
                  <tr key={i} className="hover:bg-[#1E1E2E]/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-200">{s.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <ExamBadge exam={s.exam_preference} />
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-sm">
                      {s.username || s.telegram_id}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-500 text-sm">
                      {new Date(s.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
