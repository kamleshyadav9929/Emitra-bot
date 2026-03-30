import { useState, useEffect, useCallback } from "react"
import { getServiceRequests, sendReceipt, getStudentDocuments, getDocumentUrl } from "../api"
import { ClipboardList, Clock, CheckCircle, Send, X, Phone, MessageSquare, RefreshCw, Paperclip, FileText, Image as ImageIcon, Download } from "lucide-react"

const STATUS_COLORS = {
  pending:   { bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20"  },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
}

const CATEGORY_EMOJI = {
  documents: "📄",
  utility:   "💡",
  schemes:   "🏛️",
  license:   "🚗",
  land:      "🌾",
}

function ReceiptModal({ req, onClose, onSent }) {
  const [message, setMessage] = useState(
    `✅ Aapki ${req.service_name} seva process ho gayi hai.\n\nKoi sawaal ho to reply karein. 🙏`
  )
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setError("")
    try {
      const res = await sendReceipt(req.telegram_id, message, req.id)
      if (res.success) {
        onSent(req.id)
        onClose()
      } else {
        setError("Message nahi gaya. Dobara try karein.")
      }
    } catch {
      setError("Network error. Check connection.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[#111119] border border-[#1D1D2D] rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1D1D2D]">
          <div>
            <p className="text-xs text-[#818CF8] font-semibold tracking-widest uppercase">Send Receipt</p>
            <h2 className="text-base font-bold text-white mt-0.5">{req.student_name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Student info */}
        <div className="px-6 py-3 bg-[#0C0C12] border-b border-[#1D1D2D] flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ClipboardList size={13} className="text-[#818CF8]" />
            <span>{CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}</span>
          </div>
          {req.student_phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone size={13} className="text-[#22D3EE]" />
              <span>{req.student_phone}</span>
            </div>
          )}
          {req.student_username && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MessageSquare size={13} className="text-slate-600" />
              <span>{req.student_username}</span>
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="px-6 py-5">
          <label className="text-[10px] text-slate-600 font-semibold tracking-widest uppercase block mb-2">
            Receipt Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="w-full bg-[#0C0C12] border border-[#1D1D2D] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-[#6366F1]/40 resize-none transition-colors font-mono"
          />
          <p className="text-[10px] text-slate-700 mt-1 font-mono">
            {message.length} chars
          </p>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1D1D2D] text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#6366F1] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#4F51C9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  Telegram pe Bhejein
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsModal({ telegramId, studentName, onClose }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    getStudentDocuments(telegramId).then(data => {
      setDocs(data.documents || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [telegramId])

  const handleOpenDoc = async (fileId) => {
    setDownloading(fileId)
    try {
      const res = await getDocumentUrl(fileId)
      if (res.url) window.open(res.url, "_blank")
      else alert("Could not fetch file link")
    } catch {
      alert("Network error")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#111119] border border-[#1D1D2D] rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1D1D2D]">
          <div className="flex items-center gap-2">
            <Paperclip size={18} className="text-[#818CF8]" />
            <h2 className="text-base font-bold text-white tracking-tight">Documents</h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="px-6 py-3 bg-[#0C0C12] border-b border-[#1D1D2D]">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Student</p>
          <p className="text-sm font-bold text-white mt-0.5">{studentName}</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
             <div className="flex justify-center py-10">
               <div className="w-5 h-5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
             </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">Is student ne abhi tak koi document nahi bheja hai.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => (
                <div key={doc.id} className="bg-[#0C0C12] border border-[#1D1D2D] rounded-xl p-3 flex items-center justify-between group hover:border-[#2a2a3f] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-[#818CF8]">
                      {doc.file_type === "photo" ? <ImageIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200 truncate max-w-[150px]">{doc.file_name}</p>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenDoc(doc.file_id)}
                    disabled={downloading === doc.file_id}
                    className="w-8 h-8 rounded-lg bg-[#6366F1]/10 text-[#818CF8] flex items-center justify-center hover:bg-[#6366F1]/20 transition-colors disabled:opacity-50"
                  >
                     {downloading === doc.file_id ? (
                        <div className="w-4 h-4 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin" />
                     ) : (
                        <Download size={15} />
                     )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("pending")
  const [selectedReq, setSelectedReq] = useState(null)
  const [selectedDocsReq, setSelectedDocsReq] = useState(null)
  const [stats, setStats] = useState({ total: 0, pending: 0 })

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getServiceRequests(filter)
      setRequests(data.requests || [])
      setStats({ total: data.total || 0, pending: data.pending || 0 })
    } catch {
      setError("Failed to fetch requests. Check connection.")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleSent = (requestId) => {
    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: "completed" } : r)
    )
  }

  const formatTime = (dt) => {
    const d = new Date(dt)
    return d.toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    })
  }

  return (
    <div className="space-y-6">
      {selectedReq && (
        <ReceiptModal
          req={selectedReq}
          onClose={() => setSelectedReq(null)}
          onSent={handleSent}
        />
      )}

      {selectedDocsReq && (
        <DocumentsModal
          telegramId={selectedDocsReq.telegram_id}
          studentName={selectedDocsReq.student_name}
          onClose={() => setSelectedDocsReq(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#818CF8] font-semibold tracking-[0.15em] uppercase mb-1">E-Mitra</p>
          <h1 className="text-2xl font-bold text-white">Service Requests</h1>
          <p className="text-sm text-slate-600 mt-0.5">Users ki pending seva requests dekho aur receipt bhejo.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-3 py-2 bg-[#111119] border border-[#1D1D2D] rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:border-[#2a2a3f] transition-all"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Requests",  value: stats.total,   icon: ClipboardList, color: "#818CF8" },
          { label: "Pending",         value: stats.pending, icon: Clock,          color: "#FBBF24" },
          { label: "Completed",       value: stats.total - stats.pending, icon: CheckCircle, color: "#4ADE80" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111119] border border-[#1D1D2D] rounded-xl px-4 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30` }}>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "pending",   label: "⏳ Pending"   },
          { key: "completed", label: "✅ Completed"  },
          { key: "",          label: "📋 All"        },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
              filter === tab.key
                ? "bg-[#6366F1]/12 text-[#818CF8] border-[#6366F1]/25"
                : "bg-[#111119] text-slate-600 border-[#1D1D2D] hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111119] border border-[#1D1D2D] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 text-center px-10">
            <p className="text-red-400 mb-2 text-sm">{error}</p>
            <button onClick={fetchRequests} className="text-xs text-[#818CF8] underline">
              Try again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-700">
              {filter === "pending" ? "Koi pending request nahi hai. 🎉" : "Koi request nahi mili."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[650px]">
              <thead>
                <tr className="border-b border-[#1D1D2D]">
                  {["Student", "Service", "Status", "Requested At", "Action"].map(h => (
                    <th key={h} className="py-3.5 px-5 text-[10px] font-semibold text-slate-700 tracking-[0.15em] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const s = STATUS_COLORS[req.status] || STATUS_COLORS.pending
                  return (
                    <tr
                      key={req.id}
                      className="border-b border-[#1D1D2D]/60 hover:bg-[#18182A] transition-colors last:border-0"
                    >
                      {/* Student */}
                      <td className="py-4 px-5">
                        <p className="text-sm font-semibold text-slate-200">{req.student_name}</p>
                        {req.student_phone && (
                          <p className="text-[11px] text-[#22D3EE] font-mono">{req.student_phone}</p>
                        )}
                      </td>

                      {/* Service */}
                      <td className="py-4 px-5">
                        <p className="text-sm text-slate-300">
                          {CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                          {req.status === "pending" ? <Clock size={10} /> : <CheckCircle size={10} />}
                          {req.status === "pending" ? "Pending" : "Completed"}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-4 px-5">
                        <span className="text-xs text-slate-600 font-mono">{formatTime(req.requested_at)}</span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <button
                            title="View Documents"
                            onClick={() => setSelectedDocsReq(req)}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex flex-shrink-0 items-center justify-center hover:bg-emerald-500/20 transition-colors"
                          >
                            <Paperclip size={13} />
                          </button>
                          
                          {req.status === "pending" ? (
                            <button
                              onClick={() => setSelectedReq(req)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20 text-xs font-semibold hover:bg-[#6366F1]/20 transition-colors whitespace-nowrap"
                            >
                              <Send size={11} />
                              Receipt
                            </button>
                          ) : (
                            <span className="text-xs text-slate-700 italic px-2">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
