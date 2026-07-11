import React, { useState, useEffect, useCallback } from "react"
import { ClipboardList, Clock, CheckCircle, Send, X, Phone, Mail, RefreshCw, Paperclip, FileText, Image as ImageIcon, Download, Search, CheckCircle2, XCircle } from "lucide-react"
import * as api from "../../api"
import { TableSkeleton } from "../../components/common/Skeleton"

// Helper Toast
function Toast({ visible, message }) {
  return (
    <div className={`fixed bottom-8 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-[12px] font-semibold rounded-xl shadow-xl transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <span className="text-emerald-400">✓</span> {message}
    </div>
  )
}

function ApplicationDetailsModal({ appId, onClose, onStatusUpdated, toastMsgSetter }) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [status, setStatus] = useState("pending")
  const [downloadingFile, setDownloadingFile] = useState(null)

  const loadDetails = useCallback(() => {
    setLoading(true)
    api.getApplicationDetails(appId)
      .then(res => {
        if (res.success) {
          setApp(res.application)
          setStatus(res.application.status)
          setRemarks(res.application.remarks || "")
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        onClose()
      })
  }, [appId, onClose])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await api.updateApplicationStatus(appId, { status, remarks })
      toastMsgSetter("✓ Application updated successfully!")
      onStatusUpdated()
      onClose()
    } catch {
      alert("Error updating application status.")
    } finally {
      setUpdating(false)
    }
  }

  const handleDownload = async (filename) => {
    setDownloadingFile(filename)
    try {
      await api.downloadApplicationDocument(filename)
    } catch {
      alert("Failed to download document.")
    } finally {
      setDownloadingFile(null)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#071e27]/40 backdrop-blur-md flex items-center justify-center px-4">
        <div className="w-8 h-8 border-[3px] border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    )
  }

  if (!app) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#071e27]/40 backdrop-blur-md flex items-center justify-center px-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[var(--color-surface-lowest)] shadow-ambient rounded-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[var(--color-surface-low)] border-b border-gray-100">
          <div>
            <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase">Form Application Details</p>
            <h2 className="text-[16px] font-bold text-[#0A1A40] mt-1 font-display">#EM-{app.id} — {app.exam_name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 bg-[var(--color-surface-base)] rounded-full">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Student Profile */}
          <div className="space-y-3">
            <h4 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">Student Profile</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12.5px]">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Full Name</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.student_name}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Phone Number</span>
                <a href={`tel:${app.phone_number}`} className="text-[#0071e3] font-semibold mt-0.5 flex items-center gap-1 hover:underline">
                  <Phone size={11} /> {app.phone_number}
                </a>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Email</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.email || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Date of Birth</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.dob || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Gender</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.gender || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Category</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.category || "-"}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-3">
            <h4 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">Academic Record</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12.5px]">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Qualification</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.academic_qualification || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Board / University</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.board || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Passing Year</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.passingYear || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Marks / CGPA</span>
                <span className="text-[#1d1d1f] font-semibold mt-0.5 block">{app.marks || "-"}</span>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-3">
            <h4 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">Student Documents</h4>
            
            {app.doc_submission_method === "whatsapp" ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[12px] font-semibold">
                💬 Documents Delivery: Student has chosen to share required files directly on WhatsApp with operator.
              </div>
            ) : !app.documents || app.documents.length === 0 ? (
              <p className="text-[12.5px] text-gray-500 font-medium">No files uploaded online.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="bg-[var(--color-surface-low)] border border-gray-200/55 p-3 rounded-2xl flex items-center justify-between hover:bg-gray-100/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-blue-50 text-[#0071e3] flex items-center justify-center rounded-[10px]">
                        {(doc.file_type?.toLowerCase().includes("photo") || doc.file_type?.toLowerCase().includes("signature") || doc.file_type?.toLowerCase().includes("image") || doc.file_type?.toLowerCase().includes("pic")) ? <ImageIcon size={14} /> : <FileText size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-gray-900 truncate max-w-[120px]">{doc.file_name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{doc.file_type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.file_path)}
                      disabled={downloadingFile === doc.file_path}
                      className="w-8 h-8 bg-white border border-gray-200 text-[#0071e3] flex items-center justify-center hover:bg-blue-50 transition-all rounded-full shadow-sm disabled:opacity-40"
                    >
                      {downloadingFile === doc.file_path 
                        ? <div className="w-3.5 h-3.5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                        : <Download size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Form */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Application Status</label>
                <select
                  value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 bg-white rounded-xl focus:border-[#164FA8] outline-none"
                >
                  <option value="pending">Pending Review</option>
                  <option value="processing">In Progress / Processing</option>
                  <option value="completed">Completed / Filled</option>
                  <option value="rejected">Rejected / Invalid</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Remarks / Remarks for Student</label>
                <input
                  type="text" value={remarks} onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Filled. Receipt uploaded."
                  className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-[var(--color-surface-bright)] text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-all rounded-xl border border-gray-200">Close</button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex-1 py-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold hover:shadow-ambient transition-all rounded-xl disabled:opacity-50"
          >
            {updating ? "Updating..." : "Save Status Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const fetchApps = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getFormApplications(filter)
      setApps(data.applications || [])
    } catch (err) {
      setError(err?.message || "Failed to load form applications.")
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  const filteredApps = apps.filter(a => 
    !searchQuery || 
    a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phone_number.includes(searchQuery) ||
    a.exam_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dt) => {
    return new Date(dt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <Toast visible={toastVisible} message={toastMsg} />

      {selectedAppId && (
        <ApplicationDetailsModal
          appId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onStatusUpdated={fetchApps}
          toastMsgSetter={showToast}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">Student Desk</p>
          <h1 className="text-3xl font-black text-[#0A1A40] tracking-tight leading-tight font-display">Exam Applications</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed font-medium">Process direct exam form filing requests, view uploaded documents and update processing status.</p>
        </div>
        <button
          onClick={fetchApps}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-lowest)] text-[13px] font-bold text-gray-700 hover:text-[var(--color-primary)] transition-all rounded-[14px] shadow-ambient hover:shadow-lg"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "pending", label: "Pending Review" },
            { key: "processing", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "rejected", label: "Rejected" },
            { key: "", label: "All Forms" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4.5 py-2 text-[12px] font-bold transition-all rounded-xl shadow-sm ${
                filter === tab.key 
                  ? "bg-[var(--color-primary)] text-white" 
                  : "bg-[var(--color-surface-lowest)] text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 border border-gray-200 focus-within:border-[#0071e3] rounded-xl overflow-hidden bg-white shadow-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student or exam..."
            className="w-full h-10 bg-transparent pl-10 pr-4 text-[13px] text-[#1d1d1f] outline-none"
          />
        </div>
      </div>

      {/* Grid list */}
      <div className="bg-[var(--color-surface-lowest)] overflow-hidden rounded-[20px] shadow-ambient">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="py-20 text-center px-8">
            <p className="text-red-500 text-[13px] mb-2">{error}</p>
            <button onClick={fetchApps} className="text-[12px] text-[var(--color-primary)] font-bold underline">Try again</button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[13px] text-gray-500 font-medium">
              No exam form applications found matching status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-[var(--color-surface-base)]">
                  {["Student Info", "Examination", "Doc Delivery", "Submitted At", "Status", "Actions"].map((h, i) => (
                    <th key={h} className={`py-4 px-6 text-[10px] font-bold text-[var(--color-primary)] tracking-widest uppercase ${i === 5 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--color-surface-bright)] transition-colors">
                    <td className="py-5 px-6">
                      <p className="text-[14px] font-bold text-[#0A1A40]">{app.student_name}</p>
                      <p className="text-[11.5px] text-gray-500 font-medium mt-0.5">{app.phone_number}</p>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-[13px] font-semibold text-gray-800">{app.exam_name}</span>
                    </td>
                    <td className="py-5 px-6 text-[12px]">
                      {app.doc_submission_method === "whatsapp" ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">💬 WhatsApp</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">🌐 Online Upload</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-[12px] text-gray-500 font-medium">{formatTime(app.submitted_at)}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        app.status === "completed" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : app.status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : app.status === "processing"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {app.status === "completed" && <CheckCircle2 size={11} />}
                        {app.status === "rejected" && <XCircle size={11} />}
                        {(app.status === "pending" || app.status === "processing") && <Clock size={11} />}
                        {app.status}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="px-4 py-2 border border-gray-200 hover:bg-[#f5f5f7] text-[12px] font-bold text-[#0A1A40] transition-all rounded-xl shadow-sm"
                        >
                          View &amp; Process
                        </button>
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
