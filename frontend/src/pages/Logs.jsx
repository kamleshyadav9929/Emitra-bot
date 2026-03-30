import { useEffect, useState } from "react"
import { CheckCircle2, Send, Clock } from "lucide-react"
import { getLogs } from "../api"
import ExamBadge from "../components/ExamBadge"

const formatRelativeTime = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLogs()
      .then(res => { setLogs(res.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalDelivered = logs.reduce((acc, l) => acc + (l.total_recipients || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">History</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Message Logs</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Audit log of all dispatched broadcasts.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-light text-black">{totalDelivered}</p>
          <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase">Total Delivered</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-[#E5E5E3] py-20 text-center">
          <Send size={24} className="mx-auto text-[#AEAEAC] mb-3" />
          <p className="text-[13px] text-[#AEAEAC]">No broadcasts yet.</p>
        </div>
      ) : (
        <div className="border border-[#E5E5E3]">
          {logs.map((log, i) => (
            <div
              key={log.id}
              className={`flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5 hover:bg-[#F7F7F5] transition-colors ${
                i < logs.length - 1 ? "border-b border-[#E5E5E3]" : ""
              }`}
            >
              {/* Left accent line */}
              <div className="hidden sm:block w-px self-stretch bg-[#E5E5E3] flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ExamBadge exam={log.target_exam} />
                  <div className="flex items-center gap-1.5 text-[11px] text-[#AEAEAC] font-mono">
                    <Clock size={11} />
                    <span>{formatRelativeTime(log.sent_at)}</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#3D3D3D] whitespace-pre-wrap leading-relaxed bg-[#F7F7F5] border border-[#E5E5E3] px-4 py-3">
                  {log.message_text}
                </p>
              </div>

              {/* Delivered badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2E7D32]/20 bg-[#2E7D32]/5 text-[#2E7D32] text-[11px] font-semibold flex-shrink-0 self-start">
                <CheckCircle2 size={12} />
                {log.total_recipients} delivered
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
