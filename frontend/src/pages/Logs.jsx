import { useEffect, useState } from "react"
import { CheckCircle2, Send } from "lucide-react"
import { getLogs } from "../api"
import ExamBadge from "../components/ExamBadge"

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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#FF6B35] font-semibold tracking-widest uppercase mb-1">History</p>
          <h1 className="text-2xl font-bold text-white">Message Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Audit log of all dispatched broadcasts.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{totalDelivered}</p>
          <p className="text-xs text-slate-500">Total Delivered</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#0F0F17] border border-[#1A1A28] rounded-xl p-16 text-center">
          <Send size={32} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-600">No broadcasts yet. Send your first notification!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div
              key={log.id}
              className="bg-[#0F0F17] border border-[#1A1A28] rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start hover:border-[#2a2a3a] transition-colors group"
            >
              {/* Left accent */}
              <div className="hidden sm:block w-0.5 self-stretch bg-[#1A1A28] group-hover:bg-[#4ECDC4] rounded-full transition-colors flex-shrink-0" />

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ExamBadge exam={log.target_exam} />
                  <span className="text-xs text-slate-600 font-mono">
                    {new Date(log.sent_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-[#09090E] border border-[#1A1A28] rounded-lg px-4 py-3">
                  {log.message_text}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4ADE80]/8 text-[#4ADE80] rounded-lg border border-[#4ADE80]/20 text-xs font-semibold flex-shrink-0">
                <CheckCircle2 size={13} />
                {log.total_recipients} delivered
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
