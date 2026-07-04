import { useState, useEffect, useRef } from "react"
import { getStudents, blockStudent, deleteStudent, addStudent, getExams } from "../../api"
import ExamBadge from "../../components/common/ExamBadge"
import { Phone, MessagesSquare, Search, X, Download, ChevronDown, Trash2, Plus, Grid, List } from "lucide-react"

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
  const [viewMode, setViewMode] = useState("grid")

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
    <div className="space-y-8 font-sans pb-16 text-apple-ink">
      {/* Header & Sub-Nav */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-apple-divider-soft pb-6 mb-8">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.2em] uppercase text-apple-primary mb-1.5">Directory</p>
          <h1 className="text-[34px] md:text-[40px] font-semibold text-apple-ink tracking-[-0.02em] leading-tight font-sans">
            Registered Students
          </h1>
          <p className="text-[15px] text-apple-ink/50 mt-1 max-w-xl leading-relaxed">
            Manage, search, and update categories for all registered Krishna Emitra bureau students.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Capsule */}
          <div className="flex bg-apple-canvas-parchment p-1 rounded-full border border-apple-divider-soft mr-2 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-full transition-all apple-active-scale ${
                viewMode === "grid"
                  ? "bg-apple-canvas text-apple-primary shadow-sm"
                  : "text-apple-ink/50 hover:text-apple-ink"
              }`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-full transition-all apple-active-scale ${
                viewMode === "list"
                  ? "bg-apple-canvas text-apple-primary shadow-sm"
                  : "text-apple-ink/50 hover:text-apple-ink"
              }`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-apple-primary text-white text-[14px] font-semibold rounded-full hover:bg-apple-primary-focus transition-all apple-active-scale shadow-sm"
          >
            <Plus size={15} />
            Add Student
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-apple-primary text-apple-primary text-[14px] font-semibold rounded-full hover:bg-apple-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed apple-active-scale"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Search Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
        {/* Configurator Option Chips style Filter List */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[12px] font-semibold text-apple-ink/40 tracking-wider uppercase mr-2">Filter Category:</span>
          {examList.map(f => {
            const isSelected = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-full border transition-all apple-active-scale ${
                  isSelected
                    ? "bg-apple-canvas border-apple-primary-focus border-2 ring-1 ring-apple-primary-focus/20 text-apple-ink font-semibold"
                    : "bg-apple-canvas border-apple-hairline text-apple-ink/75 hover:border-apple-ink/40"
                }`}
              >
                {f}
              </button>
            )
          })}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-apple-ink/40" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 bg-apple-canvas border border-apple-hairline text-[14px] text-apple-ink placeholder:text-apple-ink/40 pl-11 pr-8 py-2.5 rounded-full focus:outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apple-ink/40 hover:text-apple-ink transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <p className="text-[13px] text-apple-ink/45 font-medium">
          Showing <span className="font-semibold text-apple-ink/70">{filtered.length}</span> of <span className="font-semibold text-apple-ink/70">{students.length}</span> Registered Students
        </p>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-apple-canvas border border-apple-hairline rounded-2xl">
          <div className="w-7 h-7 border-2 border-apple-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-apple-ink/40 font-bold tracking-widest uppercase mt-4">Loading directory</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center px-8 bg-apple-canvas border border-apple-hairline rounded-2xl">
          <p className="text-red-500 text-[14px] font-medium mb-3">{error}</p>
          <button
            onClick={() => setActiveFilter(activeFilter)}
            className="px-4 py-2 text-[12px] bg-apple-surface-pearl text-apple-primary border border-apple-hairline font-bold rounded-lg hover:bg-apple-canvas transition-all apple-active-scale"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-apple-canvas border border-apple-hairline rounded-2xl">
          <p className="text-[14px] text-apple-ink/50 font-medium">
            {search ? `No students found matching "${search}"` : `No students registered under category "${activeFilter}"`}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Redesigned Grid View: Store Utility Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(student => (
            <div
              key={student.telegram_id}
              className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-6 hover:border-apple-ink/30 transition-all duration-300 relative flex flex-col justify-between min-h-[250px] shadow-sm hover:shadow-md"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-apple-surface-pearl text-apple-ink flex items-center justify-center text-[13px] font-semibold border border-apple-divider-soft rounded-full shadow-apple-product">
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-apple-ink tracking-tight leading-snug truncate max-w-[120px] sm:max-w-[140px]" title={student.name}>
                        {student.name}
                      </h3>
                      <p className="text-[11px] text-apple-ink/40 font-mono mt-0.5">ID: {student.telegram_id}</p>
                    </div>
                  </div>
                  
                  <ExamBadge exam={student.exam_preference} />
                </div>

                {/* Contact details */}
                <div className="space-y-2.5 my-3 text-[13px] text-apple-ink/70">
                  {student.phone_number ? (
                    <div className="flex items-center gap-2.5">
                      <Phone size={13} className="text-apple-ink/30 flex-shrink-0" />
                      <span className="font-mono text-apple-ink/80">{student.phone_number}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-apple-ink/30 italic">
                      <Phone size={13} className="flex-shrink-0" />
                      <span>No phone shared</span>
                    </div>
                  )}
                  {student.username ? (
                    <div className="flex items-center gap-2.5">
                      <MessagesSquare size={13} className="text-apple-primary flex-shrink-0" />
                      <span className="font-medium text-apple-primary hover:underline cursor-pointer truncate max-w-[150px]">
                        @{student.username}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-apple-ink/30 italic">
                      <MessagesSquare size={13} className="flex-shrink-0" />
                      <span>No Telegram username</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-apple-divider-soft">
                <span className="text-[11px] text-apple-ink/40">
                  Joined {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Category selector */}
                  <div className="relative" ref={changingExam === student.telegram_id ? changeRef : null}>
                    <button
                      onClick={() => setChangingExam(changingExam === student.telegram_id ? null : student.telegram_id)}
                      className="px-2 py-1 bg-apple-surface-pearl text-apple-ink/75 text-[11px] font-semibold rounded-lg border border-apple-hairline hover:bg-apple-canvas hover:text-apple-primary hover:border-apple-primary/30 transition-all flex items-center gap-1 apple-active-scale"
                      title="Change Category"
                    >
                      Edit <ChevronDown size={11} />
                    </button>
                    {changingExam === student.telegram_id && (
                      <div className="absolute right-0 bottom-full mb-2 z-30 bg-apple-canvas border border-apple-hairline shadow-apple-product py-1.5 min-w-[145px] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <p className="px-3 py-1 text-[9px] font-bold text-apple-ink/40 tracking-wider uppercase border-b border-apple-divider-soft mb-1">Change Category</p>
                        {examList.filter(e => e !== "ALL").map(exam => (
                          <button
                            key={exam}
                            className={`w-full text-left px-3 py-1.5 text-[12px] font-medium hover:bg-apple-canvas-parchment transition-colors flex items-center justify-between ${
                              student.exam_preference === exam ? "text-apple-primary font-semibold" : "text-apple-ink/80"
                            }`}
                            onClick={() => {
                              setStudents(prev => prev.map(s =>
                                s.telegram_id === student.telegram_id ? { ...s, exam_preference: exam } : s
                              ))
                              setChangingExam(null)
                            }}
                          >
                            <span>{exam}</span>
                            {student.exam_preference === exam && <span className="text-apple-primary">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Block/Delete Capsule buttons */}
                  {student.exam_preference !== "BLOCKED" && (
                    <button
                      onClick={() => {
                        if (window.confirm("Block this student from receiving broadcasts?")) {
                          blockStudent(student.telegram_id).then(() => {
                            setStudents(prev => prev.map(s => s.telegram_id === student.telegram_id ? { ...s, exam_preference: "BLOCKED" } : s))
                          })
                        }
                      }}
                      className="w-7.5 h-7.5 flex items-center justify-center bg-apple-surface-pearl hover:bg-red-50 text-apple-ink/50 hover:text-red-500 border border-apple-hairline rounded-lg transition-colors apple-active-scale"
                      title="Block Student"
                    >
                      <X size={12} />
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
                    className="w-7.5 h-7.5 flex items-center justify-center bg-apple-surface-pearl hover:bg-red-50 text-apple-ink/50 hover:text-red-500 border border-apple-hairline rounded-lg transition-colors apple-active-scale"
                    title="Delete Student"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Redesigned List View: Clean Minimalist Apple-style Table */
        <div className="bg-apple-canvas border border-apple-hairline rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-apple-canvas-parchment border-b border-apple-divider-soft">
                  {["Student Name", "Category Preference", "Phone Contact", "Telegram Username", "Action / History"].map((h, idx) => (
                    <th
                      key={h}
                      className={`py-4 px-6 text-[11px] font-bold text-apple-ink/50 tracking-wider uppercase ${
                        idx === 4 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-divider-soft">
                {filtered.map(student => (
                  <tr key={student.telegram_id} className="hover:bg-apple-canvas-parchment/30 transition-colors group">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-apple-surface-pearl text-apple-ink flex items-center justify-center text-[12px] font-semibold border border-apple-divider-soft rounded-full shadow-apple-product flex-shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-apple-ink tracking-tight leading-snug">{student.name}</p>
                          <p className="text-[11px] text-apple-ink/40 font-mono mt-0.5">ID: {student.telegram_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="relative inline-flex items-center gap-2" ref={changingExam === student.telegram_id ? changeRef : null}>
                        <ExamBadge exam={student.exam_preference} />
                        <button
                          onClick={() => setChangingExam(changingExam === student.telegram_id ? null : student.telegram_id)}
                          className="p-1 text-apple-ink/40 hover:text-apple-primary transition-colors rounded apple-active-scale"
                          title="Update Category"
                        >
                          <ChevronDown size={13} />
                        </button>
                        {changingExam === student.telegram_id && (
                          <div className="absolute left-0 top-full mt-1.5 z-30 bg-apple-canvas border border-apple-hairline shadow-apple-product py-1.5 min-w-[145px] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <p className="px-3 py-1 text-[9px] font-bold text-apple-ink/40 tracking-wider uppercase border-b border-apple-divider-soft mb-1">Update Category</p>
                            {examList.filter(e => e !== "ALL").map(exam => (
                              <button
                                key={exam}
                                className={`w-full text-left px-3 py-1.5 text-[12px] font-medium hover:bg-apple-canvas-parchment transition-colors flex items-center justify-between ${
                                  student.exam_preference === exam ? "text-apple-primary font-semibold" : "text-apple-ink/80"
                                }`}
                                onClick={() => {
                                  setStudents(prev => prev.map(s =>
                                    s.telegram_id === student.telegram_id ? { ...s, exam_preference: exam } : s
                                  ))
                                  setChangingExam(null)
                                }}
                              >
                                <span>{exam}</span>
                                {student.exam_preference === exam && <span className="text-apple-primary">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      {student.phone_number ? (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-apple-ink/30 flex-shrink-0" />
                          <span className="text-[14px] font-mono text-apple-ink/80">{student.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-apple-ink/30 italic">No contact details</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      {student.username ? (
                        <div className="flex items-center gap-2">
                          <MessagesSquare size={13} className="text-apple-primary flex-shrink-0" />
                          <span className="text-[14px] font-medium text-apple-primary hover:underline cursor-pointer">
                            @{student.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-apple-ink/30 italic">—</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 pr-8">
                      <div className="flex items-center justify-end gap-4">
                        <span className="text-[13px] text-apple-ink/40">
                          {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {student.exam_preference !== "BLOCKED" && (
                            <button
                              onClick={() => {
                                if (window.confirm("Block this student from receiving broadcasts?")) {
                                  blockStudent(student.telegram_id).then(() => {
                                    setStudents(prev => prev.map(s => s.telegram_id === student.telegram_id ? { ...s, exam_preference: "BLOCKED" } : s))
                                  })
                                }
                              }}
                              className="w-7.5 h-7.5 flex items-center justify-center bg-apple-surface-pearl hover:bg-red-50 text-apple-ink/50 hover:text-red-500 border border-apple-hairline rounded-lg transition-colors apple-active-scale"
                              title="Block Student"
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
                            className="w-7.5 h-7.5 flex items-center justify-center bg-apple-surface-pearl hover:bg-red-50 text-apple-ink/50 hover:text-red-500 border border-apple-hairline rounded-lg transition-colors apple-active-scale"
                            title="Delete Student"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Redesigned Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-apple-ink/40 backdrop-blur-sm p-4">
          <div className="bg-apple-canvas border border-apple-hairline w-full max-w-md rounded-2xl shadow-apple-product overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-apple-divider-soft">
              <h2 className="text-[20px] font-semibold text-apple-ink tracking-tight font-sans">Add Student Profile</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-apple-ink/40 hover:text-apple-ink transition-colors p-1.5 hover:bg-apple-canvas-parchment rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              {addError && (
                <div className="px-4 py-3 bg-red-50 text-red-600 text-[13px] font-medium rounded-xl border border-red-100">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="px-4 py-3 bg-emerald-50 text-emerald-600 text-[13px] font-medium rounded-xl border border-emerald-100">
                  {addSuccess}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-apple-ink/40 uppercase pl-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-apple-canvas border border-apple-hairline px-4 py-3 text-[14px] text-apple-ink placeholder-apple-ink/30 focus:outline-none focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/10 rounded-full transition-all"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-apple-ink/40 uppercase pl-1">Indian Mobile Number</label>
                <input
                  type="text"
                  required
                  pattern="^[6-9]\d{9}$"
                  title="10 digit Indian mobile number starting with 6-9"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full bg-apple-canvas border border-apple-hairline px-4 py-3 text-[14px] text-apple-ink placeholder-apple-ink/30 focus:outline-none focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/10 rounded-full transition-all font-mono"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-apple-ink/40 uppercase pl-1">Target Exam Category</label>
                <div className="relative">
                  <select
                    value={newStudent.exam_preference}
                    onChange={e => setNewStudent({ ...newStudent, exam_preference: e.target.value })}
                    className="w-full bg-apple-canvas border border-apple-hairline px-4 py-3 text-[14px] text-apple-ink focus:outline-none focus:border-apple-primary focus:ring-2 focus:ring-apple-primary/10 rounded-full transition-all appearance-none cursor-pointer"
                  >
                    <option value="NONE">None / General</option>
                    {examList.filter(e => e !== "ALL").map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-apple-ink/40 pointer-events-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-apple-divider-soft mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-[14px] font-semibold text-apple-ink/80 bg-apple-surface-pearl hover:bg-apple-canvas-parchment rounded-full border border-apple-hairline transition-colors apple-active-scale"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-apple-primary hover:bg-apple-primary-focus text-white text-[14px] font-semibold rounded-full shadow-sm transition-all apple-active-scale"
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
