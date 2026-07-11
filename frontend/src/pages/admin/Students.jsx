import { useState, useEffect, useRef } from "react"
import { getStudents, blockStudent, deleteStudent, addStudent, getExams, updateStudentCategory } from "../../api"
import ExamBadge from "../../components/common/ExamBadge"
import { Phone, MessagesSquare, Search, X, Download, ChevronDown, Trash2, Plus, Grid, List } from "lucide-react"
import { TableSkeleton } from "../../components/common/Skeleton"

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
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const [changingExam, setChangingExam] = useState(null)
  const [examList, setExamList] = useState(DEFAULT_FILTERS)
  const changeRef = useRef(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: "", phone: "", exam_preference: "NONE" })
  const [addError, setAddError] = useState("")
  const [addSuccess, setAddSuccess] = useState("")
  const [viewMode, setViewMode] = useState("list")

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
    setPage(1)
  }, [activeFilter])

  // Search debounce effect
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getStudents(activeFilter, page, limit, debouncedSearch)
      .then(r => {
        if (!cancelled) {
          setStudents(r.students || [])
          setTotal(r.total || 0)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setStudents([])
          setError(err?.message || "Failed to fetch.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [activeFilter, page, debouncedSearch])

  const filtered = students

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
    <div className="space-y-8 pb-16 text-[var(--color-on-surface)]">
      {/* Header & Sub-Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">Krishna Emitra</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight font-display">
            Registered Students
          </h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Manage, search, and update categories for all registered Krishna Emitra bureau students.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Capsule */}
          <div className="flex bg-[var(--color-surface-low)] p-1 rounded-xl border border-[var(--color-outline-variant)] mr-2 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-[var(--color-surface-base)] text-[var(--color-primary)] shadow-sm"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-[var(--color-surface-base)] text-[var(--color-primary)] shadow-sm"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white text-[13px] font-semibold rounded-xl hover:bg-[var(--color-primary)]/90 transition-all shadow-sm"
          >
            <Plus size={15} />
            Add Student
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] text-[13px] font-semibold rounded-xl hover:bg-[var(--color-primary)]/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
          <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mr-2">Filter Category:</span>
          {examList.map(f => {
            const isSelected = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-lg border transition-all ${
                  isSelected
                    ? "bg-[var(--color-surface-low)] border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-sm"
                    : "bg-[var(--color-surface-lowest)] border-[var(--color-outline-variant)] text-gray-500 hover:border-gray-400"
                }`}
              >
                {f}
              </button>
            )
          })}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] text-[13px] text-[var(--color-on-surface)] placeholder:text-gray-400 pl-11 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <p className="text-[13px] text-gray-500 font-medium">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{students.length}</span> Registered Students
        </p>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="py-20 text-center px-8 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl">
          <p className="text-red-500 text-[14px] font-medium mb-3">{error}</p>
          <button
            onClick={() => setActiveFilter(activeFilter)}
            className="px-4 py-2 text-[12px] bg-[var(--color-surface-low)] text-[var(--color-primary)] border border-[var(--color-outline-variant)] font-bold rounded-lg hover:bg-[var(--color-surface-lowest)] transition-all"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl">
          <p className="text-[14px] text-gray-400 font-medium">
            {search ? `No students found matching "${search}"` : `No students registered under category "${activeFilter}"`}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Redesigned Grid View: Store Utility Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(student => (
            <div
              key={student.id}
              className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 hover:shadow-ambient transition-all duration-300 relative flex flex-col justify-between min-h-[250px] shadow-sm"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center text-[13px] font-bold border border-[var(--color-outline-variant)] rounded-full">
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[var(--color-on-surface)] tracking-tight leading-snug truncate max-w-[120px] sm:max-w-[140px]" title={student.name}>
                        {student.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {student.telegram_id || "Web Registrant"}</p>
                    </div>
                  </div>
                  
                  <ExamBadge exam={student.exam_preference} />
                </div>

                {/* Contact details */}
                <div className="space-y-2.5 my-3 text-[13px] text-gray-600">
                  {student.phone_number ? (
                    <div className="flex items-center gap-2.5">
                      <Phone size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-gray-700">{student.phone_number}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-gray-400 italic">
                      <Phone size={13} className="flex-shrink-0" />
                      <span>No phone shared</span>
                    </div>
                  )}
                  {student.username ? (
                    <div className="flex items-center gap-2.5">
                      <MessagesSquare size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                      <span className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer truncate max-w-[150px]">
                        @{student.username}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-gray-400 italic">
                      <MessagesSquare size={13} className="flex-shrink-0" />
                      <span>No Telegram username</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[var(--color-outline-variant)]">
                <span className="text-[11px] text-gray-400">
                  Joined {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Category selector */}
                  <div className="relative" ref={changingExam === student.id ? changeRef : null}>
                    <button
                      onClick={() => setChangingExam(changingExam === student.id ? null : student.id)}
                      className="px-2 py-1 bg-[var(--color-surface-low)] text-gray-600 text-[11px] font-semibold rounded-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-lowest)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all flex items-center gap-1"
                      title="Change Category"
                    >
                      Edit <ChevronDown size={11} />
                    </button>
                    {changingExam === student.id && (
                      <div className="absolute right-0 bottom-full mb-2 z-30 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] shadow-ambient py-1.5 min-w-[145px] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <p className="px-3 py-1 text-[9px] font-bold text-gray-400 tracking-wider uppercase border-b border-[var(--color-outline-variant)] mb-1">Change Category</p>
                        {examList.filter(e => e !== "ALL").map(exam => (
                          <button
                            key={exam}
                            className={`w-full text-left px-3 py-1.5 text-[12px] font-semibold hover:bg-[var(--color-surface-low)] transition-colors flex items-center justify-between ${
                              student.exam_preference === exam ? "text-[var(--color-primary)] font-bold" : "text-gray-700"
                            }`}
                            onClick={() => {
                              updateStudentCategory(student.id, exam)
                                .then(() => {
                                  setStudents(prev => prev.map(s =>
                                    s.id === student.id ? { ...s, exam_preference: exam } : s
                                  ))
                                })
                                .catch(console.error)
                              setChangingExam(null)
                            }}
                          >
                            <span>{exam}</span>
                            {student.exam_preference === exam && <span className="text-[var(--color-primary)]">✓</span>}
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
                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, exam_preference: "BLOCKED" } : s))
                          })
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-low)] hover:bg-red-50 text-gray-400 hover:text-red-500 border border-[var(--color-outline-variant)] rounded-lg transition-colors"
                      title="Block Student"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm("Permanently delete this student?")) {
                        deleteStudent(student.telegram_id).then(() => {
                          setStudents(prev => prev.filter(s => s.id !== student.id))
                        })
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-low)] hover:bg-red-50 text-gray-400 hover:text-red-500 border border-[var(--color-outline-variant)] rounded-lg transition-colors"
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
        /* Redesigned List View: Clean Minimalist Dashboard-style Table */
        <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-ambient overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-low)] border-b border-[var(--color-outline-variant)]">
                  {["Student Name", "Category Preference", "Phone Contact", "Telegram Username", "Action / History"].map((h, idx) => (
                    <th
                      key={h}
                      className={`py-4 px-6 text-[10px] font-bold text-gray-400 tracking-wider uppercase ${
                        idx === 4 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)] text-[13px] font-medium">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-[var(--color-surface-bright)] transition-colors group">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[var(--color-surface-low)] text-[var(--color-primary)] flex items-center justify-center text-[12px] font-bold border border-[var(--color-outline-variant)] rounded-full flex-shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[var(--color-on-surface)] tracking-tight leading-snug">{student.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {student.telegram_id || "Web Registrant"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="relative inline-flex items-center gap-2" ref={changingExam === student.id ? changeRef : null}>
                        <ExamBadge exam={student.exam_preference} />
                        <button
                          onClick={() => setChangingExam(changingExam === student.id ? null : student.id)}
                          className="p-1 text-gray-400 hover:text-[var(--color-primary)] transition-colors rounded"
                          title="Update Category"
                        >
                          <ChevronDown size={13} />
                        </button>
                        {changingExam === student.id && (
                          <div className="absolute left-0 top-full mt-1.5 z-30 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] shadow-ambient py-1.5 min-w-[145px] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <p className="px-3 py-1 text-[9px] font-bold text-gray-400 tracking-wider uppercase border-b border-[var(--color-outline-variant)] mb-1">Update Category</p>
                            {examList.filter(e => e !== "ALL").map(exam => (
                              <button
                                key={exam}
                                className={`w-full text-left px-3 py-1.5 text-[12px] font-semibold hover:bg-[var(--color-surface-low)] transition-colors flex items-center justify-between ${
                                  student.exam_preference === exam ? "text-[var(--color-primary)] font-bold" : "text-gray-700"
                                }`}
                                onClick={() => {
                                  updateStudentCategory(student.id, exam)
                                    .then(() => {
                                      setStudents(prev => prev.map(s =>
                                        s.id === student.id ? { ...s, exam_preference: exam } : s
                                      ))
                                    })
                                    .catch(console.error)
                                  setChangingExam(null)
                                }}
                              >
                                <span>{exam}</span>
                                {student.exam_preference === exam && <span className="text-[var(--color-primary)]">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      {student.phone_number ? (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-[13px] font-mono text-gray-600">{student.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-gray-400 italic">No contact details</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      {student.username ? (
                        <div className="flex items-center gap-2">
                          <MessagesSquare size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                          <span className="text-[13px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer">
                            @{student.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-4.5 px-6 pr-8">
                      <div className="flex items-center justify-end gap-4">
                        <span className="text-[12px] text-gray-400">
                          {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {student.exam_preference !== "BLOCKED" && (
                            <button
                              onClick={() => {
                                if (window.confirm("Block this student from receiving broadcasts?")) {
                                  blockStudent(student.telegram_id).then(() => {
                                    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, exam_preference: "BLOCKED" } : s))
                                  })
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-low)] hover:bg-red-50 text-gray-400 hover:text-red-500 border border-[var(--color-outline-variant)] rounded-lg transition-colors"
                              title="Block Student"
                            >
                              <X size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm("Permanently delete this student?")) {
                                deleteStudent(student.telegram_id).then(() => {
                                  setStudents(prev => prev.filter(s => s.id !== student.id))
                                })
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-[var(--color-surface-low)] hover:bg-red-50 text-gray-400 hover:text-red-500 border border-[var(--color-outline-variant)] rounded-lg transition-colors"
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

      {/* Pagination Controls */}
      {Math.ceil(total / limit) > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[var(--color-outline-variant)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[var(--color-outline-variant)] text-[13px] font-bold rounded-xl bg-[var(--color-surface-lowest)] hover:bg-[var(--color-surface-low)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-[13px] text-gray-500 font-medium">
            Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{Math.ceil(total / limit)}</span> (Total: {total})
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page === Math.ceil(total / limit)}
            className="px-4 py-2 border border-[var(--color-outline-variant)] text-[13px] font-bold rounded-xl bg-[var(--color-surface-lowest)] hover:bg-[var(--color-surface-low)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Redesigned Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] w-full max-w-md rounded-2xl shadow-ambient overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-outline-variant)]">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight font-display">Add Student Profile</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
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
                <label className="text-[11px] font-bold tracking-wider text-gray-400 uppercase pl-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] px-4 py-3 text-[13px] text-[var(--color-on-surface)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-primary)] rounded-xl transition-all"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-400 uppercase pl-1">Indian Mobile Number</label>
                <input
                  type="text"
                  required
                  pattern="^[6-9]\d{9}$"
                  title="10 digit Indian mobile number starting with 6-9"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] px-4 py-3 text-[13px] text-[var(--color-on-surface)] placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-primary)] rounded-xl transition-all font-mono"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-400 uppercase pl-1">Target Exam Category</label>
                <div className="relative">
                  <select
                    value={newStudent.exam_preference}
                    onChange={e => setNewStudent({ ...newStudent, exam_preference: e.target.value })}
                    className="w-full bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] px-4 py-3 text-[13px] text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] rounded-xl transition-all appearance-none cursor-pointer"
                  >
                    <option value="NONE">None / General</option>
                    {examList.filter(e => e !== "ALL").map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[var(--color-outline-variant)] mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-gray-600 bg-[var(--color-surface-low)] hover:bg-gray-100 rounded-xl border border-[var(--color-outline-variant)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-all"
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
