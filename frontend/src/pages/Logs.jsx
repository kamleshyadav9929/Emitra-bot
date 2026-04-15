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

  const filteredLogs = activeFilter === "All" || activeFilter === "Messages" ? logs : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">History</p>
          <h1 className="text-3xl font-black text-[#0A1A40] tracking-tight leading-tight font-display">Activity Logs</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed font-medium">Audit log of all dispatched broadcasts and system events.</p>
        </div>
        <div className="bg-[var(--color-surface-low)] py-4 px-7 rounded-[20px] text-center shadow-ambient">
          <p className="text-4xl font-black text-[#0A1A40]">{totalDelivered}</p>
          <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase mt-1">Total Delivered</p>
        </div>
      </div>

      {/* Filter Tabs — tonal pill style, no borders */}
      <div className="flex gap-2 flex-wrap">
        {LOG_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold transition-all rounded-[14px] ${
              activeFilter === f
                ? "bg-[var(--color-primary)] text-white shadow-ambient"
                : "bg-[var(--color-surface-lowest)] text-gray-500 hover:bg-[var(--color-surface-low)] hover:text-gray-900 shadow-ambient"
            }`}
          >
            {FILTER_ICON[f]}
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-[var(--color-surface-lowest)] py-20 text-center rounded-[20px] shadow-ambient">
          <Send size={24} className="mx-auto text-gray-300 mb-4" />
          <p className="text-[13px] text-gray-500 font-medium">
            {activeFilter === "All" ? "No activity yet." : `No ${activeFilter.toLowerCase()} logged.`}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-lowest)] rounded-[20px] overflow-hidden shadow-ambient">
          {filteredLogs.map((log, i) => (
            <div
              key={log.id}
              className={`group flex flex-col sm:flex-row sm:items-start gap-4 px-6 py-6 hover:bg-[var(--color-surface-bright)] transition-colors ${
                i % 2 === 0 ? "bg-[var(--color-surface-lowest)]" : "bg-[var(--color-surface-low)]"
              }`}
            >
              {/* Type icon column */}
              <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] flex items-center justify-center rounded-[12px]">
                <MessageSquare size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ExamBadge exam={log.target_exam} />
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
                    <Clock size={12} />
                    <span title={formatTimestamp(log.sent_at)}>{formatRelativeTime(log.sent_at)}</span>
                    <span className="text-gray-300 mx-1">·</span>
                    <span>{formatTimestamp(log.sent_at)}</span>
                  </div>
                </div>
                <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed bg-[var(--color-surface-base)] px-5 py-4 rounded-[14px] max-w-4xl shadow-ambient">
                  {log.message_text}
                </p>
              </div>

              {/* Delivered badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold flex-shrink-0 self-start rounded-full">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {log.total_recipients} delivered
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
