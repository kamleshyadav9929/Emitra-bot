import { useState, useEffect } from "react"
import { getStudents } from "../api"
import ExamBadge from "../components/ExamBadge"
import { Phone, MessagesSquare, Search, X, Download } from "lucide-react"

const FILTERS = ["ALL", "JEE", "NEET", "SSC", "UPSC", "CUET"]
const AVATAR_COLORS = {
  JEE: "#F97316",
  NEET: "#2DD4BF",
  SSC: "#38BDF8",
  UPSC: "#A3E635",
  CUET: "#FBBF24",
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const fetchStudents = async (filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getStudents(filter)
      setStudents(response.students || [])
    } catch {
      setStudents([])
      setError("Failed to fetch. Check connection or .env config.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadStudents = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getStudents(activeFilter)
        if (!cancelled) {
          setStudents(response.students || [])
        }
      } catch {
        if (!cancelled) {
          setStudents([])
          setError("Failed to fetch. Check connection or .env config.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStudents()

    return () => {
      cancelled = true
    }
  }, [activeFilter])

  const getInitials = (name) => {
    if (!name || !name.trim()) return "?"
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return parts.map((part) => part[0]).join("").substring(0, 2).toUpperCase()
  }

  const filtered = search.trim()
    ? students.filter(
        (student) =>
          student.name?.toLowerCase().includes(search.toLowerCase()) ||
          student.phone_number?.includes(search) ||
          String(student.telegram_id).includes(search)
      )
    : students

  const exportCSV = () => {
    const headers = ["Name", "Telegram ID", "Exam", "Phone Number", "Username", "Joined"]
    const rows = filtered.map((student) => [
      student.name || "",
      student.telegram_id || "",
      student.exam_preference || "",
      student.phone_number || "",
      student.username || "",
      new Date(student.joined_at).toLocaleDateString("en-IN"),
    ])
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${value}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `emitra_students_${activeFilter}_${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#818CF8] font-semibold tracking-[0.15em] uppercase mb-1">Students</p>
          <h1 className="text-2xl font-bold text-white">Registered Students</h1>
          <p className="text-sm text-slate-600 mt-0.5">View and filter all E-Mitra registered students.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-[#111119] border border-[#1D1D2D] rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:border-[#2a2a3f] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                activeFilter === filter
                  ? "bg-[#6366F1]/12 text-[#818CF8] border-[#6366F1]/25"
                  : "bg-[#111119] text-slate-600 border-[#1D1D2D] hover:text-slate-300 hover:border-[#2a2a3f]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:w-56 bg-[#111119] border border-[#1D1D2D] rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-[#6366F1]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-700 font-mono -mt-3">
        {filtered.length} of {students.length} students
      </p>

      <div className="bg-[#111119] border border-[#1D1D2D] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="py-20 text-center px-10">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={() => void fetchStudents(activeFilter)}
              className="text-xs text-[#818CF8] underline hover:text-[#6366F1]"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1D1D2D]">
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-700 tracking-[0.15em] uppercase">
                    Student
                  </th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-700 tracking-[0.15em] uppercase">
                    Exam
                  </th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-700 tracking-[0.15em] uppercase">
                    Phone
                  </th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-700 tracking-[0.15em] uppercase">
                    Telegram
                  </th>
                  <th className="py-3.5 px-5 text-[10px] font-semibold text-slate-700 tracking-[0.15em] uppercase text-right">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const color = AVATAR_COLORS[student.exam_preference] || "#6366F1"

                  return (
                    <tr
                      key={student.telegram_id}
                      className="border-b border-[#1D1D2D]/60 hover:bg-[#18182A] transition-colors last:border-0"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{
                              background: `${color}18`,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{student.name}</p>
                            <p className="text-[11px] text-slate-600 font-mono">{student.telegram_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <ExamBadge exam={student.exam_preference} />
                      </td>
                      <td className="py-4 px-5">
                        {student.phone_number ? (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-[#22D3EE]" />
                            <span className="text-sm text-[#22D3EE] font-mono">{student.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-700 italic">Not shared</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {student.username ? (
                          <div className="flex items-center gap-1.5">
                            <MessagesSquare size={12} className="text-slate-600" />
                            <span className="text-sm text-slate-500 font-mono">{student.username}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-700 italic">Not provided</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="text-xs text-slate-600 font-mono">
                          {new Date(student.joined_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <p className="text-sm text-slate-700">
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
