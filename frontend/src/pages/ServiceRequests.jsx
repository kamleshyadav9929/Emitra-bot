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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3] bg-[#F7F7F5]">
          <div>
            <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.18em] uppercase">Send Receipt</p>
            <h2 className="text-[15px] font-semibold text-black mt-0.5">{req.student_name}</h2>
          </div>
          <button onClick={onClose} className="text-[#AEAEAC] hover:text-black transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-3 border-b border-[#E5E5E3] flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-[12px] text-[#7A7A78]">
            <ClipboardList size={13} />
            <span>{CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}</span>
          </div>
          {req.student_phone && (
            <div className="flex items-center gap-2 text-[12px] text-[#7A7A78]">
              <Phone size={13} />
              <span className="font-mono">{req.student_phone}</span>
            </div>
          )}
          {req.student_username && (
            <div className="flex items-center gap-2 text-[12px] text-[#7A7A78]">
              <MessageSquare size={13} />
              <span className="font-mono">{req.student_username}</span>
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="px-6 py-5">
          <label className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.18em] uppercase block mb-2">
            Receipt Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            className="w-full border border-[#E5E5E3] px-4 py-3 text-[13px] text-black placeholder:text-[#AEAEAC] bg-white focus:outline-none focus:border-black resize-none transition-colors font-mono"
          />
          <p className="text-[10px] text-[#AEAEAC] mt-1 font-mono">{message.length} chars</p>

          {error && <p className="text-[12px] text-[#C62828] mt-2">{error}</p>}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#E5E5E3] text-[13px] text-[#7A7A78] hover:border-black hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 py-2.5 bg-black text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#3D3D3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3] bg-[#F7F7F5]">
          <div className="flex items-center gap-2">
            <Paperclip size={15} className="text-[#7A7A78]" />
            <div>
              <p className="text-[10px] text-[#AEAEAC] font-semibold tracking-[0.18em] uppercase">Documents</p>
              <h2 className="text-[14px] font-semibold text-black">{studentName}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AEAEAC] hover:text-black transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[13px] text-[#AEAEAC]">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="border border-[#E5E5E3] p-3 flex items-center justify-between hover:bg-[#F7F7F5] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F7F7F5] border border-[#E5E5E3] flex items-center justify-center text-[#7A7A78]">
                      {doc.file_type === "photo" ? <ImageIcon size={17} /> : <FileText size={17} />}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-black truncate max-w-[160px]">{doc.file_name}</p>
                      <p className="text-[10px] text-[#AEAEAC] font-mono">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDoc(doc.file_id)}
                    disabled={downloading === doc.file_id}
                    className="w-8 h-8 border border-[#E5E5E3] text-[#7A7A78] flex items-center justify-center hover:border-black hover:text-black transition-colors disabled:opacity-40"
                  >
                    {downloading === doc.file_id
                      ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
      <div className="flex items-start justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">E-Mitra</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Service Requests</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Pending seva requests dekho aur receipt bhejo.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-3 py-2 border border-[#E5E5E3] text-[12px] text-[#7A7A78] hover:border-black hover:text-black transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Completed", value: completed },
        ].map(s => (
          <div key={s.label} className="border border-[#E5E5E3] px-4 py-4 bg-white">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-1">{s.label}</p>
            <p className="text-3xl font-light text-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex border border-[#E5E5E3] w-fit">
        {[
          { key: "pending", label: "Pending" },
          { key: "completed", label: "Completed" },
          { key: "", label: "All" },
        ].map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-[12px] font-semibold transition-colors ${i > 0 ? "border-l border-[#E5E5E3]" : ""} ${
              filter === tab.key ? "bg-black text-white" : "bg-white text-[#7A7A78] hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-[#E5E5E3] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 text-center px-8">
            <p className="text-[#C62828] text-[13px] mb-2">{error}</p>
            <button onClick={fetchRequests} className="text-[12px] text-black underline">Try again</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[13px] text-[#AEAEAC]">
              {filter === "pending" ? "Koi pending request nahi hai 🎉" : "Koi request nahi mili."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-[#E5E5E3] bg-[#F7F7F5]">
                  {["Student", "Service", "Status", "Requested At", "Actions"].map((h, i) => (
                    <th key={h} className={`py-3 px-5 text-[10px] font-semibold text-[#AEAEAC] tracking-[0.18em] uppercase ${i === 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="border-b border-[#E5E5E3] last:border-0 hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-semibold text-black">{req.student_name}</p>
                      {req.student_phone && <p className="text-[11px] text-[#7A7A78] font-mono">{req.student_phone}</p>}
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] text-[#3D3D3D]">{CATEGORY_EMOJI[req.category] || "📋"} {req.service_name}</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-2 py-0.5 ${
                        req.status === "pending"
                          ? "border-[#0A0A0A] text-[#0A0A0A]"
                          : "border-[#2E7D32] text-[#2E7D32] bg-[#2E7D32]/5"
                      }`}>
                        {req.status === "pending" ? <Clock size={9} /> : <CheckCircle size={9} />}
                        {req.status === "pending" ? "Pending" : "Completed"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-[11px] text-[#AEAEAC] font-mono">{formatTime(req.requested_at)}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          title="View Documents"
                          onClick={() => setSelectedDocsReq(req)}
                          className="w-8 h-8 border border-[#E5E5E3] text-[#7A7A78] flex items-center justify-center hover:border-black hover:text-black transition-colors"
                        >
                          <Paperclip size={13} />
                        </button>
                        {req.status === "pending" ? (
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[12px] font-semibold hover:bg-[#3D3D3D] transition-colors whitespace-nowrap"
                          >
                            <Send size={11} />
                            Receipt
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#AEAEAC] italic px-2">Done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
