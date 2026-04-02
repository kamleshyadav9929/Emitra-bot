import { useState, useEffect, useRef } from "react"
import { getStudents } from "../api"
import ExamBadge from "../components/ExamBadge"
import { Phone, MessagesSquare, Search, X, Download, ChevronDown } from "lucide-react"

const FILTERS = ["ALL", "JEE", "NEET", "SSC", "UPSC", "CUET"]

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
  const [changingExam, setChangingExam] = useState(null) // telegram_id of student being edited
  const changeRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getStudents(activeFilter)
      .then(r => { if (!cancelled) setStudents(r.students || []) })
      .catch(() => { if (!cancelled) { setStudents([]); setError("Failed to fetch.") } })
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

  // Close change-exam dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (changeRef.current && !changeRef.current.contains(e.target)) setChangingExam(null) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">Students</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Registered Students</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">View and filter all E-Mitra registered students.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-3 py-2 border border-[#E5E5E3] text-[12px] text-[#7A7A78] hover:border-black hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-[12px] font-semibold border transition-colors ${
                activeFilter === f
                  ? "bg-black text-white border-black"
                  : "bg-white text-[#7A7A78] border-[#E5E5E3] hover:border-black hover:text-black"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEAC]" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-52 border border-[#E5E5E3] pl-8 pr-8 py-1.5 text-[13px] text-black placeholder:text-[#AEAEAC] bg-white focus:outline-none focus:border-black transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AEAEAC] hover:text-black">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#AEAEAC] font-mono -mt-2">
        {filtered.length} of {students.length} students
      </p>

      {/* Table */}
      <div className="border border-[#E5E5E3] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 text-center px-8">
            <p className="text-[#C62828] text-[13px] mb-2">{error}</p>
            <button onClick={() => setActiveFilter(activeFilter)} className="text-[12px] text-black underline">
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-[#E5E5E3] bg-[#F7F7F5]">
                  {["Student", "Exam", "Phone", "Telegram", "Joined"].map((h, i) => (
                    <th key={h} className={`py-3 px-5 text-[10px] font-semibold text-[#AEAEAC] tracking-[0.18em] uppercase ${i === 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(student => (
                  <tr
                    key={student.telegram_id}
                    className="border-b border-[#E5E5E3] last:border-0 hover:bg-[#F7F7F5] transition-colors"
                  >
                    {/* Student */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F7F7F5] border border-[#E5E5E3] flex items-center justify-center text-black text-[11px] font-semibold flex-shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-black">{student.name}</p>
                          <p className="text-[11px] text-[#AEAEAC] font-mono">{student.telegram_id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Exam + Change button */}
                    <td className="py-4 px-5">
                      <div className="relative inline-block" ref={changingExam === student.telegram_id ? changeRef : null}>
                        <div className="flex items-center gap-1.5">
                          <ExamBadge exam={student.exam_preference} />
                          <button
                            onClick={() => setChangingExam(changingExam === student.telegram_id ? null : student.telegram_id)}
                            className="flex items-center gap-0.5 text-[10px] text-[#AEAEAC] hover:text-black transition-colors"
                            title="Change Exam"
                          >
                            <ChevronDown size={11} />
                          </button>
                        </div>
                        {changingExam === student.telegram_id && (
                          <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-[#E5E5E3] shadow-lg py-1 min-w-[120px]">
                            <p className="px-3 py-1.5 text-[9px] font-semibold text-[#AEAEAC] tracking-[0.15em] uppercase border-b border-[#E5E5E3]">Change Exam</p>
                            {["JEE", "NEET", "SSC", "UPSC", "CUET"].map(exam => (
                              <button
                                key={exam}
                                className={`w-full text-left px-3 py-2 text-[12px] font-semibold hover:bg-[#F7F7F5] transition-colors ${
                                  student.exam_preference === exam ? "text-black" : "text-[#7A7A78]"
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
                    {/* Phone */}
                    <td className="py-4 px-5">
                      {student.phone_number ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-[#7A7A78]" />
                          <span className="text-[13px] text-[#3D3D3D] font-mono">{student.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#AEAEAC] italic">Not shared</span>
                      )}
                    </td>
                    {/* Telegram */}
                    <td className="py-4 px-5">
                      {student.username ? (
                        <div className="flex items-center gap-1.5">
                          <MessagesSquare size={12} className="text-[#7A7A78]" />
                          <span className="text-[13px] text-[#3D3D3D] font-mono">{student.username}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#AEAEAC] italic">—</span>
                      )}
                    </td>
                    {/* Joined */}
                    <td className="py-4 px-5 text-right">
                      <span className="text-[11px] text-[#AEAEAC] font-mono">
                        {new Date(student.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <p className="text-[13px] text-[#AEAEAC]">
                        {search ? `No results for "${search}"` : `No students in ${activeFilter}.`}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
