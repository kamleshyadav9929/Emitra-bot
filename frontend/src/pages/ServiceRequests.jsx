import { useState, useEffect, useCallback } from "react"
import { getServiceRequests, sendReceipt, getStudentDocuments, getDocumentUrl } from "../api"
import { ClipboardList, Clock, CheckCircle, Send, X, Phone, MessageSquare, RefreshCw, Paperclip, FileText, Image as ImageIcon, Download } from "lucide-react"

const CATEGORY_EMOJI = {
  documents: "📄", utility: "💡", schemes: "🏛️", license: "🚗", land: "🌾",
}

// ── Receipt Modal ───────────────────────────────────────────────────────────────
function ReceiptModal({ req, onClose, onSent }) {
  const [message, setMessage] = useState(
    `✅ Aapki ${req.service_name} seva process ho gayi hai.\n\nKoi sawaal ho to reply karein. 🙏`
  )
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true); setError("")
    try {
      const res = await sendReceipt(req.telegram_id, message, req.id)
      if (res.success) { onSent(req.id); onClose() }
      else setError("Message nahi gaya. Dobara try karein.")
    } catch { setError("Network error.") }
    finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#071e27]/40 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[var(--color-surface-lowest)] shadow-ambient rounded-[20px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[var(--color-surface-low)]">
          <div>
            <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase">Send Receipt</p>
            <h2 className="text-[16px] font-bold text-[#0A1A40] mt-1 font-display">{req.student_name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 bg-[var(--color-surface-base)] rounded-full">
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 bg-[var(--color-surface-base)] flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium">
            <ClipboardList size={13} />
            <span>{CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}</span>
          </div>
          {req.student_phone && (
            <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium">
              <Phone size={13} />
              <span className="font-mono">{req.student_phone}</span>
            </div>
          )}
          {req.student_username && (
            <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium">
              <MessageSquare size={13} />
              <span className="font-mono">{req.student_username}</span>
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="px-6 py-5">
          <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-3">
            Receipt Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="w-full bg-[var(--color-surface-base)] border-none px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 resize-none shadow-ambient transition-all rounded-[14px]"
          />
          <p className="text-[10px] text-gray-400 mt-2 font-medium">{message.length} chars</p>

          {error && <p className="text-[12px] text-red-600 font-medium mt-2 bg-red-50 p-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[var(--color-surface-low)] text-[13px] font-bold text-gray-600 hover:bg-[var(--color-surface-base)] transition-all rounded-[12px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 py-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Documents Modal ─────────────────────────────────────────────────────────────
function DocumentsModal({ telegramId, studentName, onClose }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    getStudentDocuments(telegramId)
      .then(data => { setDocs(data.documents || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [telegramId])

  const handleOpenDoc = async (fileId) => {
    setDownloading(fileId)
    try {
      const res = await getDocumentUrl(fileId)
      if (res.url) window.open(res.url, "_blank")
      else alert("Could not fetch file link")
    } catch { alert("Network error") }
    finally { setDownloading(null) }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#071e27]/40 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--color-surface-lowest)] shadow-ambient flex flex-col max-h-[80vh] rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 bg-[var(--color-surface-low)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] flex items-center justify-center rounded-[10px]">
              <Paperclip size={14} />
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase">Documents</p>
              <h2 className="text-[14px] font-bold text-[#0A1A40] font-display">{studentName}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 bg-[var(--color-surface-base)] rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[13px] text-gray-500 font-medium">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => (
                <div key={doc.id} className="bg-[var(--color-surface-low)] shadow-ambient p-4 flex items-center justify-between hover:bg-[var(--color-surface-base)] transition-all rounded-[14px]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-primary)] rounded-[12px]">
                      {doc.file_type === "photo" ? <ImageIcon size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 truncate max-w-[160px]">{doc.file_name}</p>
                      <p className="text-[11px] text-gray-500 font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDoc(doc.file_id)}
                    disabled={downloading === doc.file_id}
                    className="w-9 h-9 bg-[var(--color-surface-lowest)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary-fixed)] transition-all rounded-full shadow-ambient disabled:opacity-40"
                  >
                    {downloading === doc.file_id
                      ? <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                      : <Download size={14} />}
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ServiceRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("pending")
  const [selectedReq, setSelectedReq] = useState(null)
  const [selectedDocsReq, setSelectedDocsReq] = useState(null)
  const [stats, setStats] = useState({ total: 0, pending: 0 })

  const fetchRequests = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await getServiceRequests(filter)
      setRequests(data.requests || [])
      setStats({ total: data.total || 0, pending: data.pending || 0 })
    } catch {
      setError("Failed to fetch requests."); setRequests([])
    } finally { setLoading(false) }
  }, [filter])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleSent = (id) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "completed" } : r))
  const formatTime = (dt) => new Date(dt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  const completed = stats.total - stats.pending

  return (
    <div className="space-y-6">
      {selectedReq && <ReceiptModal req={selectedReq} onClose={() => setSelectedReq(null)} onSent={handleSent} />}
      {selectedDocsReq && <DocumentsModal telegramId={selectedDocsReq.telegram_id} studentName={selectedDocsReq.student_name} onClose={() => setSelectedDocsReq(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">e-Mitra</p>
          <h1 className="text-3xl font-black text-[#0A1A40] tracking-tight leading-tight font-display">Service Requests</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed font-medium">Manage pending seva requests and issue receipts.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-lowest)] text-[13px] font-bold text-gray-700 hover:text-[var(--color-primary)] transition-all rounded-[14px] shadow-ambient hover:shadow-lg"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards — no borders, shadow-ambient */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-[var(--color-primary-fixed)] rounded-[20px] p-6 shadow-ambient">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-primary)] mb-2">Total Received</p>
          <p className="text-4xl font-black text-[#0A1A40] mt-2">{stats.total}</p>
        </div>
        <div className="bg-[var(--color-surface-low)] rounded-[20px] p-6 shadow-ambient">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500 mb-2">Pending</p>
          <p className="text-4xl font-black text-gray-900 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-[var(--color-surface-lowest)] rounded-[20px] p-6 shadow-ambient">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-emerald-600 mb-2">Completed</p>
          <p className="text-4xl font-black text-gray-800 mt-2">{completed}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { key: "pending", label: "Pending" },
          { key: "completed", label: "Completed" },
          { key: "", label: "All Requests" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2 text-[12px] font-bold transition-all rounded-[14px] shadow-ambient ${
              filter === tab.key ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-lowest)] text-gray-500 hover:bg-[var(--color-surface-low)] hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface-lowest)] overflow-hidden rounded-[20px] shadow-ambient">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 text-center px-8">
            <p className="text-red-500 text-[13px] mb-2">{error}</p>
            <button onClick={fetchRequests} className="text-[12px] text-[var(--color-primary)] font-bold underline">Try again</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[13px] text-gray-500 font-medium">
              {filter === "pending" ? "Koi pending request nahi hai 🎉" : "Koi request nahi mili."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden divide-y-0">
              {requests.map((req, idx) => (
                <div key={req.id} className={`p-4 hover:bg-[var(--color-surface-bright)] transition-colors ${idx % 2 === 0 ? "bg-[var(--color-surface-lowest)]" : "bg-[var(--color-surface-low)]"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[14px] font-bold text-[#0A1A40]">{req.student_name}</p>
                      {req.student_phone && <p className="text-[11px] text-gray-500 font-medium">{req.student_phone}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                      req.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {req.status === "pending" ? <Clock size={10} /> : <CheckCircle size={10} />}
                      {req.status === "pending" ? "Pending" : "Completed"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-[12px] font-medium text-gray-800">{CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}</p>
                    <p className="text-[11px] text-gray-400">{formatTime(req.requested_at)}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                        title="View Documents"
                        onClick={() => setSelectedDocsReq(req)}
                        className="p-2 border border-blue-100 bg-blue-50 text-blue-600 rounded-[10px]"
                    >
                        <Paperclip size={14} />
                    </button>
                    {req.status === "pending" && (
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--color-primary)] text-white text-[12px] font-bold rounded-[10px]"
                        >
                          <Send size={12} />
                          Issue Receipt
                        </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[var(--color-surface-base)]">
                    {["Student", "Service", "Status", "Requested At", "Actions"].map((h, i) => (
                      <th key={h} className={`py-4 px-6 text-[10px] font-bold text-[var(--color-primary)] tracking-widest uppercase ${i === 4 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, idx) => (
                    <tr key={req.id} className={`group hover:bg-[var(--color-surface-bright)] transition-colors ${idx % 2 === 0 ? "bg-[var(--color-surface-lowest)]" : "bg-[var(--color-surface-low)]"}`}>
                      <td className="py-5 px-6">
                        <p className="text-[14px] font-bold text-[#0A1A40]">{req.student_name}</p>
                        {req.student_phone && <p className="text-[12px] text-gray-500 font-medium">{req.student_phone}</p>}
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-[13px] font-medium text-gray-800">{CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}</p>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${
                          req.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {req.status === "pending" ? <Clock size={12} /> : <CheckCircle size={12} />}
                          {req.status === "pending" ? "Pending" : "Completed"}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-[12px] text-gray-500 font-medium">{formatTime(req.requested_at)}</span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            title="View Documents"
                            onClick={() => setSelectedDocsReq(req)}
                            className="w-9 h-9 bg-[var(--color-surface-low)] text-gray-500 flex items-center justify-center hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-fixed)] transition-all rounded-[12px] shadow-ambient"
                          >
                            <Paperclip size={13} />
                          </button>
                          {req.status === "pending" ? (
                            <button
                              onClick={() => setSelectedReq(req)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[12px] font-bold hover:shadow-lg transition-all rounded-[12px]"
                            >
                              <Send size={12} />
                              Receipt
                            </button>
                          ) : (
                            <span className="text-[12px] text-gray-400 italic px-2 font-medium">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
