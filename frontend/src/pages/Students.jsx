import { useState, useEffect, useRef } from "react"
import { getStudents, blockStudent, deleteStudent, addStudent, getExams } from "../api"
import ExamBadge from "../components/ExamBadge"
import { Phone, MessagesSquare, Search, X, Download, ChevronDown, Trash2, Plus } from "lucide-react"

const DEFAULT_FILTERS = ["ALL", "JEE", "NEET", "SSC", "UPSC", "CUET"]

function getInitials(name) {
  if (!name?.trim()) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.map(p => p[0]).join("").substring(0, 2).toUpperCase()
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [changingExam, setChangingExam] = useState(null)
  const [examList, setExamList] = useState(DEFAULT_FILTERS)
  const changeRef = useRef(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: "", phone: "", exam_preference: "NONE" })
  const [addError, setAddError] = useState("")
  const [addSuccess, setAddSuccess] = useState("")

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setAddError("")
    setAddSuccess("")
    try {
      const res = await addStudent(newStudent)
      if (res.success) {
        setAddSuccess("Student added successfully!")
        setNewStudent({ name: "", phone: "", exam_preference: "NONE" })
        setTimeout(() => {
          setIsAddModalOpen(false)
          setAddSuccess("")
          setLoading(true)
          getStudents(activeFilter)
            .then(r => setStudents(r.students || []))
            .catch(() => {})
            .finally(() => setLoading(false))
        }, 1500)
      } else {
        setAddError(res.error || "Failed to add student")
      }
    } catch (err) {
      setAddError(err?.message || "An error occurred")
    }
  }

  useEffect(() => {
    getExams().then(d => {
       const names = d.exams.map(e => e.name)
       setExamList(["ALL", ...names])
    }).catch(console.error)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getStudents(activeFilter)
      .then(r => { if (!cancelled) setStudents(r.students || []) })
      .catch(err => { if (!cancelled) { setStudents([]); setError(err?.message || "Failed to fetch.") } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeFilter])

  const filtered = search.trim()
    ? students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone_number?.includes(search) ||
        String(s.telegram_id).includes(search)
      )
    : students

  const exportCSV = () => {
    const headers = ["Name", "Telegram ID", "Exam", "Phone Number", "Username", "Joined"]
    const rows = filtered.map(s => [
      s.name || "", s.telegram_id || "", s.exam_preference || "",
      s.phone_number || "", s.username || "",
      new Date(s.joined_at).toLocaleDateString("en-IN"),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url; a.download = `emitra_${activeFilter}_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const handler = (e) => { if (changeRef.current && !changeRef.current.contains(e.target)) setChangingExam(null) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">Directory</p>
          <h1 className="text-3xl font-black text-[#0A1A40] tracking-tight leading-tight font-display">Registered Students</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed font-medium">View and filter all e-Mitra registered students.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white text-[13px] font-bold transition-all rounded-[14px] shadow-ambient hover:shadow-lg"
          >
            <Plus size={14} />
            Add Student
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-lowest)] text-[13px] font-bold text-gray-700 hover:text-[var(--color-primary)] transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-[14px] shadow-ambient hover:shadow-lg"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {examList.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 text-[12px] font-bold transition-all rounded-[14px] shadow-ambient ${
                activeFilter === f
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-lowest)] text-gray-500 hover:bg-[var(--color-surface-low)] hover:text-gray-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 bg-[var(--color-surface-lowest)] border-none pl-11 pr-8 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 shadow-ambient transition-all rounded-[14px]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[12px] text-gray-500 font-medium px-1">
        {filtered.length} of {students.length} Total Students
      </p>

      {/* Table */}
      <div className="bg-[var(--color-surface-lowest)] overflow-hidden rounded-[20px] shadow-ambient">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 text-center px-8">
            <p className="text-red-500 text-[13px] mb-2">{error}</p>
            <button onClick={() => setActiveFilter(activeFilter)} className="text-[12px] text-[var(--color-primary)] font-bold underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden divide-y-0">
              {filtered.map((student, i) => (
                <div key={student.telegram_id} className={`p-4 hover:bg-[var(--color-surface-bright)] transition-colors relative group ${i % 2 === 0 ? "bg-[var(--color-surface-lowest)]" : "bg-[var(--color-surface-low)]"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] flex items-center justify-center text-[11px] font-black flex-shrink-0 rounded-[10px]">
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#0A1A40]">{student.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{student.telegram_id}</p>
                      </div>
                    </div>
                    <div className="relative inline-block" ref={changingExam === student.telegram_id ? changeRef : null}>
                      <div className="flex items-center gap-1.5">
                        <ExamBadge exam={student.exam_preference} />
                        <button
                          onClick={() => setChangingExam(changingExam === student.telegram_id ? null : student.telegram_id)}
                          className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <ChevronDown size={11} />
                        </button>
                      </div>
                      {changingExam === student.telegram_id && (
                        <div className="absolute right-0 top-full mt-1 z-30 bg-[var(--color-surface-lowest)] shadow-ambient py-1 min-w-[140px] rounded-[14px] overflow-hidden">
                          <p className="px-3 py-1.5 text-[9px] font-bold text-gray-400 tracking-[0.15em] uppercase">Change Exam</p>
                          {examList.filter(e => e !== "ALL").map(exam => (
                            <button
                              key={exam}
                              className={`w-full text-left px-3 py-2 text-[12px] font-bold hover:bg-[var(--color-surface-low)] transition-colors ${
                                student.exam_preference === exam ? "text-[var(--color-primary)]" : "text-gray-600"
                              }`}
                              onClick={() => {
                                setStudents(prev => prev.map(s =>
                                  s.telegram_id === student.telegram_id ? { ...s, exam_preference: exam } : s
                                ))
                                setChangingExam(null)
                              }}
                            >
                              {student.exam_preference === exam ? `✓ ${exam}` : exam}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-3">
                    {student.phone_number ? (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-gray-400" />
                        <span className="text-[12px] text-gray-700 font-mono">{student.phone_number}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Phone not shared</span>
                    )}
                    {student.username ? (
                      <div className="flex items-center gap-2">
                        <MessagesSquare size={12} className="text-gray-400" />
                        <span className="text-[12px] text-gray-700 font-mono">{student.username}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Telegram unshared</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-[11px] text-gray-400 font-mono">
                      Joined: {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1">
                      {student.exam_preference !== "BLOCKED" && (
                        <button
                          onClick={() => {
                            if (window.confirm("Block this student from receiving broadcasts?")) {
                              blockStudent(student.telegram_id).then(() => {
                                setStudents(prev => prev.map(s => s.telegram_id === student.telegram_id ? { ...s, exam_preference: "BLOCKED" } : s))
                              })
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-[var(--color-surface-low)] text-gray-500 hover:text-red-600 shadow-ambient transition-colors rounded-lg"
                          title="Block"
                        >
                          <X size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm("Permanently delete this student?")) {
                            deleteStudent(student.telegram_id).then(() => {
                              setStudents(prev => prev.filter(s => s.telegram_id !== student.telegram_id))
                            })
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-[var(--color-surface-low)] text-gray-500 hover:text-red-600 shadow-ambient transition-colors rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-gray-500 font-medium">
                    {search ? `No results for "${search}"` : `No students in ${activeFilter}.`}
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[var(--color-surface-base)]">
                    {["Student Name", "Category", "Contact Number", "Telegram App", "Joined At"].map((h, i) => (
                      <th key={h} className={`py-4 px-6 text-[10px] font-bold text-[var(--color-primary)] tracking-widest uppercase ${i === 4 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, idx) => (
                    <tr
                      key={student.telegram_id}
                      className={`group hover:bg-[var(--color-surface-bright)] transition-colors ${idx % 2 === 0 ? "bg-[var(--color-surface-lowest)]" : "bg-[var(--color-surface-low)]"}`}
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] flex items-center justify-center text-[12px] font-black flex-shrink-0 rounded-[12px]">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-[#0A1A40]">{student.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium">ID: {student.telegram_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="relative inline-block" ref={changingExam === student.telegram_id ? changeRef : null}>
                          <div className="flex items-center gap-2">
                            <ExamBadge exam={student.exam_preference} />
                            <button
                              onClick={() => setChangingExam(changingExam === student.telegram_id ? null : student.telegram_id)}
                              className="flex items-center gap-0.5 text-gray-400 hover:text-[var(--color-primary)] transition-colors p-1"
                              title="Change Exam"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                          {changingExam === student.telegram_id && (
                            <div className="absolute left-0 top-full mt-2 z-30 bg-[var(--color-surface-lowest)] shadow-ambient py-2 min-w-[160px] rounded-[16px] overflow-hidden">
                              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Update Category</p>
                              {examList.filter(e => e !== "ALL").map(exam => (
                                <button
                                  key={exam}
                                  className={`w-full text-left px-4 py-2.5 text-[12px] font-bold hover:bg-[var(--color-surface-low)] transition-colors ${
                                    student.exam_preference === exam ? "text-[var(--color-primary)]" : "text-gray-600"
                                  }`}
                                  onClick={() => {
                                    setStudents(prev => prev.map(s =>
                                      s.telegram_id === student.telegram_id ? { ...s, exam_preference: exam } : s
                                    ))
                                    setChangingExam(null)
                                  }}
                                >
                                  {student.exam_preference === exam ? `✓ ${exam}` : exam}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {student.phone_number ? (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-[13px] font-medium text-gray-800">{student.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-gray-400 italic">Not shared</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {student.username ? (
                          <div className="flex items-center gap-2">
                            <MessagesSquare size={14} className="text-[var(--color-primary)]" />
                            <span className="text-[13px] font-medium text-gray-800">{student.username}</span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-5 px-6 pr-8">
                        <div className="flex items-center justify-end gap-4">
                          <span className="text-[12px] font-medium text-gray-500 mr-2">
                            {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {student.exam_preference !== "BLOCKED" && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Block this student from receiving broadcasts?")) {
                                    blockStudent(student.telegram_id).then(() => {
                                      setStudents(prev => prev.map(s => s.telegram_id === student.telegram_id ? { ...s, exam_preference: "BLOCKED" } : s))
                                    })
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-low)] text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-ambient transition-all rounded-[10px]"
                                title="Block"
                              >
                                <X size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm("Permanently delete this student?")) {
                                  deleteStudent(student.telegram_id).then(() => {
                                    setStudents(prev => prev.filter(s => s.telegram_id !== student.telegram_id))
                                  })
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-low)] text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-ambient transition-all rounded-[10px]"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <p className="text-[13px] text-gray-500 font-medium">
                          {search ? `No results for "${search}"` : `No students in ${activeFilter}.`}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1A40]/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface-lowest)] w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold font-display text-[#0A1A40]">Add Student</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              {addError && <div className="px-4 py-3 bg-red-50 text-red-600 text-[12px] font-bold rounded-xl border border-red-100">{addError}</div>}
              {addSuccess && <div className="px-4 py-3 bg-emerald-50 text-emerald-600 text-[12px] font-bold rounded-xl border border-emerald-100">{addSuccess}</div>}
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-[var(--color-primary)] uppercase">Student Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-[var(--color-surface-low)] border-none px-4 py-3.5 text-[13px] text-[#0A1A40] placeholder-gray-400 focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-[14px] transition-all"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-[var(--color-primary)] uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  pattern="^[6-9]\d{9}$"
                  title="10 digit Indian mobile number starting with 6-9"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full bg-[var(--color-surface-low)] border-none px-4 py-3.5 text-[13px] text-[#0A1A40] placeholder-gray-400 focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-[14px] transition-all"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-[var(--color-primary)] uppercase">Exam Category</label>
                <select
                  value={newStudent.exam_preference}
                  onChange={e => setNewStudent({ ...newStudent, exam_preference: e.target.value })}
                  className="w-full bg-[var(--color-surface-low)] border-none px-4 py-3.5 text-[13px] text-[#0A1A40] focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-[14px] appearance-none"
                >
                  <option value="NONE">None / Generic</option>
                  {examList.filter(e => e !== "ALL").map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:bg-[var(--color-surface-low)] rounded-[12px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0A1A40] hover:bg-[#0A1A40]/90 text-white text-[13px] font-bold rounded-[12px] shadow-ambient transition-all"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
