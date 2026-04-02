import { useEffect, useState } from "react"
import { CheckCircle2, Send, Clock, MessageSquare, ClipboardList, AlertTriangle, Filter } from "lucide-react"
import { getLogs } from "../api"
import ExamBadge from "../components/ExamBadge"

const LOG_FILTERS = ["All", "Messages", "Requests", "Errors"]

const FILTER_ICON = {
  All:      <Filter size={12} />,
  Messages: <MessageSquare size={12} />,
  Requests: <ClipboardList size={12} />,
  Errors:   <AlertTriangle size={12} />,
}

const formatRelativeTime = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const formatTimestamp = (date) => {
  const d = new Date(date)
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("All")

  useEffect(() => {
    getLogs()
      .then(res => { setLogs(res.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalDelivered = logs.reduce((acc, l) => acc + (l.total_recipients || 0), 0)

  // For now, all API logs are "Messages" type. Errors/Requests are placeholders for extensibility.
  const filteredLogs = activeFilter === "All" || activeFilter === "Messages" ? logs : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">History</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Activity Logs</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Audit log of all dispatched broadcasts and system events.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-light text-black">{totalDelivered}</p>
          <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.15em] uppercase">Total Delivered</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {LOG_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border transition-colors ${
              activeFilter === f
                ? "bg-black text-white border-black"
                : "bg-white text-[#7A7A78] border-[#E5E5E3] hover:border-black hover:text-black"
            }`}
          >
            {FILTER_ICON[f]}
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border border-[#E5E5E3] py-20 text-center">
          <Send size={24} className="mx-auto text-[#AEAEAC] mb-3" />
          <p className="text-[13px] text-[#AEAEAC]">
            {activeFilter === "All" ? "No activity yet." : `No ${activeFilter.toLowerCase()} logged.`}
          </p>
        </div>
      ) : (
        <div className="border border-[#E5E5E3]">
          {filteredLogs.map((log, i) => (
            <div
              key={log.id}
              className={`flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5 hover:bg-[#F7F7F5] transition-colors ${
                i < filteredLogs.length - 1 ? "border-b border-[#E5E5E3]" : ""
              }`}
            >
              {/* Type icon column */}
              <div className="flex-shrink-0 w-8 h-8 bg-[#F7F7F5] border border-[#E5E5E3] flex items-center justify-center">
                <MessageSquare size={14} className="text-[#7A7A78]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ExamBadge exam={log.target_exam} />
                  <div className="flex items-center gap-1.5 text-[11px] text-[#AEAEAC] font-mono">
                    <Clock size={11} />
                    <span title={formatTimestamp(log.sent_at)}>{formatRelativeTime(log.sent_at)}</span>
                    <span className="text-[#E5E5E3] mx-1">·</span>
                    <span>{formatTimestamp(log.sent_at)}</span>
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
