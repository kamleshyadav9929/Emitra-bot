import { useState, useEffect } from "react"
import { getStudents } from "../api"
import ExamBadge from "../components/ExamBadge"
import { Phone, MessagesSquare, Search, X, Download } from "lucide-react"

const FILTERS = ["ALL", "JEE", "NEET", "SSC", "UPSC", "CUET"]

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const fetchStudents = (filter) => {
    setLoading(true)
    getStudents(filter).then(res => {
      setStudents(res.students || [])
      setLoading(false)
    }).catch(() => {
      setStudents([])
      setLoading(false)
    })
  }

  useEffect(() => { fetchStudents(activeFilter) }, [activeFilter])

  const getInitials = (name) => {
    if (!name) return "?"
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

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
      s.name || "",
      s.telegram_id || "",
      s.exam_preference || "",
      s.phone_number || "",
      s.username || "",
      new Date(s.joined_at).toLocaleDateString('en-IN')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `emitra_students_${activeFilter}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#FF6B35] font-semibold tracking-widest uppercase mb-1">Students</p>
          <h1 className="text-2xl font-bold text-white">Registered Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and filter all E-Mitra registered students.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-[#0F0F17] border border-[#1A1A28] rounded-lg text-xs text-slate-400 hover:text-white hover:border-[#2a2a3a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                activeFilter === f
                  ? "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/25"
                  : "bg-[#0F0F17] text-slate-500 border-[#1A1A28] hover:text-slate-300 hover:border-[#2a2a3a]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-56 bg-[#0F0F17] border border-[#1A1A28] rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-600 font-mono -mt-3">{filtered.length} of {students.length} students</p>

      {/* Table */}
      <div className="bg-[#0F0F17] border border-[#1A1A28] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[750px]">
              <thead>
                <tr className="border-b border-[#1A1A28]">
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-600 tracking-[0.15em] uppercase">Student</th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-600 tracking-[0.15em] uppercase">Exam</th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-600 tracking-[0.15em] uppercase">Phone</th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-600 tracking-[0.15em] uppercase">Telegram</th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-600 tracking-[0.15em] uppercase text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.telegram_id} className="border-b border-[#1A1A28]/60 hover:bg-[#1A1A28]/40 transition-colors last:border-0">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1A1A28] border border-[#2a2a3a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(s.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                          <p className="text-[11px] text-slate-600 font-mono">{s.telegram_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <ExamBadge exam={s.exam_preference} />
                    </td>
                    <td className="py-4 px-5">
                      {s.phone_number ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-[#4ECDC4]" />
                          <span className="text-sm text-[#4ECDC4] font-mono">{s.phone_number}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-700 italic">Not shared</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {s.username ? (
                        <div className="flex items-center gap-1.5">
                          <MessagesSquare size={12} className="text-slate-500" />
                          <span className="text-sm text-slate-400 font-mono">{s.username}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-700 italic">Not provided</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(s.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm text-slate-600">{search ? `No results for "${search}"` : `No students in ${activeFilter} category.`}</p>
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
