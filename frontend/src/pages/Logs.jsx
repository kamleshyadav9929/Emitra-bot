import { useEffect, useState } from "react"
import { CheckCircle2, Send, Clock } from "lucide-react"
import { motion } from "motion/react"
import { getLogs } from "../api"
import ExamBadge from "../components/ExamBadge"

const formatRelativeTime = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString()
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLogs().then(res => {
      setLogs(res.logs || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const totalDelivered = logs.reduce((acc, l) => acc + (l.total_recipients || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#818CF8] font-semibold tracking-[0.15em] uppercase mb-1">History</p>
          <h1 className="text-2xl font-bold text-white">Message Logs</h1>
          <p className="text-sm text-slate-600 mt-0.5">Audit log of all dispatched broadcasts.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{totalDelivered}</p>
          <p className="text-xs text-slate-600">Total Delivered</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#111119] border border-[#1D1D2D] rounded-xl p-16 text-center">
          <Send size={28} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-700">No broadcasts yet.</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="space-y-3"
        >
          {logs.map(log => (
            <motion.div
              key={log.id}
              variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
              className="bg-[#111119] border border-[#1D1D2D] rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start hover:border-[#2a2a3f] transition-colors group"
            >
              <div className="hidden sm:block w-0.5 self-stretch bg-[#1D1D2D] group-hover:bg-[#6366F1] rounded-full transition-colors flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ExamBadge exam={log.target_exam} />
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <Clock size={12} />
                    <span>{formatRelativeTime(log.sent_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-[#0C0C12] border border-[#1D1D2D] rounded-lg px-4 py-3">
                  {log.message_text}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4ADE80]/8 text-[#4ADE80] rounded-lg border border-[#4ADE80]/20 text-xs font-semibold flex-shrink-0">
                <CheckCircle2 size={13} />
                {log.total_recipients} delivered
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
