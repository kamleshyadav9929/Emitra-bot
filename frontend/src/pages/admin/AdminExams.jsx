import React, { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Calendar, DollarSign, Globe, Award } from "lucide-react"
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

const CATEGORIES = [
  { id: 1, label: "Engineering", key: "engineering" },
  { id: 2, label: "Medical", key: "medical" },
  { id: 3, label: "Central Government", key: "central_govt" },
  { id: 4, label: "Rajasthan Government", key: "rajasthan_govt" },
  { id: 5, label: "Banking & Finance", key: "banking" },
  { id: 6, label: "Defense", key: "defense" },
  { id: 7, label: "Teaching & Education", key: "teaching" },
  { id: 8, label: "Other", key: "other" }
]

function ExamModal({ exam, onSave, onClose, loading }) {
  const defaultForm = {
    name: "",
    description: "",
    category_id: 1,
    cycle_year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    exam_date: "",
    fees_gen_obc: "",
    fees_sc_st: "",
    eligibility: "",
    official_url: "",
    enabled: true
  }

  const [form, setForm] = useState(exam ? {
    name: exam.name,
    description: exam.description || "",
    category_id: exam.category_id || 1,
    cycle_year: exam.cycle_year || new Date().getFullYear(),
    cycle_id: exam.cycle_id,
    start_date: exam.start_date || "",
    end_date: exam.end_date || "",
    exam_date: exam.exam_date || "",
    fees_gen_obc: exam.fees_gen_obc || "",
    fees_sc_st: exam.fees_sc_st || "",
    eligibility: exam.eligibility || "",
    official_url: exam.official_url || "",
    enabled: exam.enabled === 1 || exam.enabled === true
  } : defaultForm)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 bg-[#071e27]/40 backdrop-blur-md flex items-center justify-center px-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--color-surface-lowest)] shadow-ambient rounded-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[var(--color-surface-low)] border-b border-gray-100">
          <div>
            <p className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase">
              {exam ? "Edit Examination" : "New Examination"}
            </p>
            <h2 className="text-[16px] font-bold text-[var(--color-on-surface)] mt-1">
              {exam?.name || "Create Exam Profile"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 bg-[var(--color-surface-base)] rounded-full">
            <X size={16} />
          </button>
        </div>

        {/* Content form */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Exam Name *</label>
              <input
                type="text" value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] outline-none"
                placeholder="e.g. JEE Main 2026"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Short Description</label>
              <textarea
                value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] outline-none h-16 resize-none"
                placeholder="Brief information about this exam..."
              />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Cycle Year</label>
              <input
                type="number" value={form.cycle_year} onChange={e => set("cycle_year", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] focus:ring-1 focus:ring-[#164FA8] outline-none"
                placeholder="2024"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Category</label>
              <select
                value={form.category_id} onChange={e => set("category_id", parseInt(e.target.value))}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 bg-white rounded-xl focus:border-[#164FA8] outline-none"
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Eligibility</label>
              <input
                type="text" value={form.eligibility} onChange={e => set("eligibility", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
                placeholder="e.g. 12th Pass, Graduate"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Gen/OBC Fees</label>
              <input
                type="text" value={form.fees_gen_obc} onChange={e => set("fees_gen_obc", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
                placeholder="e.g. ₹1000"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">SC/ST/Female Fees</label>
              <input
                type="text" value={form.fees_sc_st} onChange={e => set("fees_sc_st", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
                placeholder="e.g. ₹500 or Free"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Registration Start Date</label>
              <input
                type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Registration Deadline</label>
              <input
                type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Exam Date</label>
              <input
                type="date" value={form.exam_date} onChange={e => set("exam_date", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase block mb-1.5">Official Website URL</label>
              <input
                type="url" value={form.official_url} onChange={e => set("official_url", e.target.value)}
                className="w-full border border-gray-200 px-4 py-2.5 text-[13px] text-gray-900 rounded-xl focus:border-[#164FA8] outline-none"
                placeholder="https://example.nta.nic.in"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between bg-[var(--color-surface-low)] p-4 rounded-xl mt-2">
              <div>
                <p className="text-[13px] font-bold text-[var(--color-on-surface)]">Registration Enabled</p>
                <p className="text-[10px] text-gray-500">Toggles whether students can click 'Fill Form' on portal</p>
              </div>
              <button type="button" onClick={() => set("enabled", !form.enabled)} className="transition-all hover:scale-105 active:scale-95">
                {form.enabled
                  ? <ToggleRight size={30} className="text-[#10B981]" />
                  : <ToggleLeft size={30} className="text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-[var(--color-surface-bright)] text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-all rounded-xl border border-gray-200">Cancel</button>
          <button
            onClick={() => valid && !loading && onSave(form)}
            disabled={!valid || loading}
            className="flex-1 py-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white text-[13px] font-bold hover:shadow-ambient transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : exam ? "Update Details" : "Publish Exam"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // null | "add" | { ...exam }
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  const load = () => {
    setLoading(true)
    api.getAdminExams()
      .then(d => {
        const mappedExams = (d.exams || []).map(ex => {
          const cycle = ex.exam_cycles && ex.exam_cycles.length > 0 ? ex.exam_cycles[0] : {}
          return {
            id: ex.id,
            name: ex.name,
            description: ex.description,
            category_id: ex.category_id,
            category_label: ex.exam_categories?.label || "Unknown",
            official_url: ex.official_url,
            enabled: ex.is_active ? 1 : 0,
            cycle_id: cycle.id,
            cycle_year: cycle.cycle_year || new Date().getFullYear(),
            start_date: cycle.start_date,
            end_date: cycle.end_date,
            exam_date: cycle.exam_date,
            fees_gen_obc: cycle.fees_gen_obc,
            fees_sc_st: cycle.fees_sc_st,
            eligibility: cycle.eligibility
          }
        })
        setExams(mappedExams)
      })
      .catch(() => showToast("Failed to load examinations list"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (exam) => {
    try {
      const updatedEnabled = exam.enabled === 1 ? false : true
      await api.updateAdminExam(exam.id, {
        name: exam.name,
        description: exam.description || "",
        category_id: exam.category_id || 1,
        cycle_id: exam.cycle_id,
        cycle_year: exam.cycle_year,
        start_date: exam.start_date || "",
        end_date: exam.end_date || "",
        exam_date: exam.exam_date || "",
        fees_gen_obc: exam.fees_gen_obc || "",
        fees_sc_st: exam.fees_sc_st || "",
        eligibility: exam.eligibility || "",
        official_url: exam.official_url || "",
        enabled: updatedEnabled
      })
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, enabled: updatedEnabled ? 1 : 0 } : e))
      showToast(`${exam.name} status updated!`)
    } catch {
      showToast("Error updating exam status.")
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the exam '${name}'?`)) return
    try {
      await api.deleteAdminExam(id)
      setExams(prev => prev.filter(e => e.id !== id))
      showToast("Exam profile deleted successfully!")
    } catch {
      showToast("Error deleting exam profile.")
    }
  }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal === "add") {
        await api.createAdminExam(form)
        showToast("✓ Exam details published successfully!")
      } else {
        await api.updateAdminExam(modal.id, form)
        showToast("✓ Exam details updated successfully!")
      }
      setModal(null)
      load()
    } catch (err) {
      showToast(err?.message || "Error: Save failed")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dt) => {
    if (!dt) return "-"
    return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <Toast visible={toastVisible} message={toastMsg} />

      {modal && (
        <ExamModal
          exam={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">Configure Portal</p>
          <h1 className="text-3xl font-black text-[#0A1A40] tracking-tight leading-tight font-display">Manage Exams</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed font-medium">Add dates, registration fees, eligibility and official URLs for student exam portal profiles.</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-5 py-3 bg-[#0A1A40] text-white hover:bg-[#164FA8] transition-all rounded-[14px] text-[13px] font-bold shadow-ambient"
        >
          <Plus size={16} />
          Create Exam Profile
        </button>
      </div>

      {/* Grid List */}
      <div className="bg-[var(--color-surface-lowest)] overflow-hidden rounded-[20px] shadow-ambient">
        {loading ? (
          <TableSkeleton />
        ) : exams.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[13px] text-gray-500 font-medium">No exam profiles configured. Click 'Create Exam Profile' to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-[var(--color-surface-base)]">
                  {["Exam Details", "Category", "Deadline Date", "Exam Date", "Fees", "Portal Status", "Actions"].map((h, i) => (
                    <th key={h} className={`py-4 px-6 text-[10px] font-bold text-[var(--color-primary)] tracking-widest uppercase ${i === 6 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((exam) => {
                  const isClosed = exam.end_date ? new Date(exam.end_date) < new Date() : false
                  return (
                    <tr key={exam.id} className="hover:bg-[var(--color-surface-bright)] transition-colors">
                      <td className="py-5 px-6">
                        <p className="text-[14px] font-bold text-[#0A1A40]">{exam.name}</p>
                        <p className="text-[11px] text-gray-500 font-medium line-clamp-1 max-w-xs mt-0.5">{exam.description || "No description provided."}</p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {exam.category_label || "Unknown"}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-700 font-medium">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{formatDate(exam.end_date)}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-700 font-medium">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{formatDate(exam.exam_date)}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="text-[11.5px] leading-relaxed font-semibold">
                          <span className="text-gray-500 block text-[9.5px] font-bold uppercase tracking-wider">Gen: {exam.fees_gen_obc || "₹0"}</span>
                          <span className="text-emerald-600 block text-[9.5px] font-bold uppercase tracking-wider">SC/ST: {exam.fees_sc_st || "Free"}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(exam)}
                            className="transition-all hover:scale-105 active:scale-95"
                          >
                            {exam.enabled === 1
                              ? <ToggleRight size={26} className="text-[#10B981]" />
                              : <ToggleLeft size={26} className="text-gray-300" />}
                          </button>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${exam.enabled === 1 ? "text-emerald-700" : "text-gray-400"}`}>
                            {exam.enabled === 1 ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-end gap-2.5">
                          {exam.official_url && (
                            <a
                              href={exam.official_url} target="_blank" rel="noopener noreferrer"
                              className="p-2 bg-gray-50 text-gray-500 hover:text-[#0071e3] transition-all rounded-[10px] border border-gray-200"
                              title="Official Website"
                            >
                              <Globe size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => setModal(exam)}
                            className="p-2 bg-gray-50 text-gray-600 hover:text-[#0071e3] hover:bg-blue-50 transition-all rounded-[10px] border border-gray-200"
                            title="Edit Details"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, exam.name)}
                            className="p-2 bg-gray-50 text-red-500 hover:bg-red-50 transition-all rounded-[10px] border border-gray-200"
                            title="Delete Profile"
                          >
                            <Trash2 size={13} />
                          </button>
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
