import { useState, useEffect } from "react"
import { getStudents } from "../api"
import ExamBadge from "../components/ExamBadge"

const FILTERS = ["ALL", "JEE", "NEET", "SSC", "UPSC", "CUET"]

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("ALL")

  const fetchStudents = (filter) => {
    setLoading(true)
    getStudents(filter).then(res => {
      setStudents(res.students || [])
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setStudents([])
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchStudents(activeFilter)
  }, [activeFilter])

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-wide">Registered Students</h1>
        <p className="text-slate-400 mt-2">Manage and view all students opting for E-Mitra notifications.</p>
      </header>

      {/* FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full font-bold tracking-widest text-xs transition-all border ${
              activeFilter === f 
              ? "bg-[#FF6B35] text-white border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.3)]"
              : "bg-[#0D0D14] text-slate-400 border-[#1E1E2E] hover:border-[#333344] hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-[#0D0D14] rounded-lg border border-[#1E1E2E] shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF6B35]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#1E1E2E]/30 text-slate-500 text-xs tracking-widest uppercase border-b border-[#1E1E2E]">
                  <th className="py-4 px-6 font-semibold">Student Name</th>
                  <th className="py-4 px-6 font-semibold">Exam Target</th>
                  <th className="py-4 px-6 font-semibold">Phone Number</th>
                  <th className="py-4 px-6 font-semibold">Telegram</th>
                  <th className="py-4 px-6 font-semibold text-right">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {students.map((s) => (
                  <tr key={s.telegram_id} className="hover:bg-[#1E1E2E]/20 transition-colors group">
                    <td className="py-4 px-6 relative">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E1E2E] to-[#333344] border border-[#333344] flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:border-[#FF6B35] transition-colors">
                          {getInitials(s.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{s.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{s.telegram_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <ExamBadge exam={s.exam_preference} />
                    </td>
                    <td className="py-4 px-6">
                      {s.phone_number ? (
                        <span className="text-[#4ECDC4] font-mono text-sm">{s.phone_number}</span>
                      ) : (
                        <span className="text-slate-600 italic text-sm">Not shared</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {s.username ? (
                        <span className="text-slate-300 font-mono text-sm">{s.username}</span>
                      ) : (
                        <span className="text-slate-600 italic text-sm">Not provided</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-400 text-sm">
                      {new Date(s.joined_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
                
                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-500 border-none">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl block mb-2 opacity-50">📂</span>
                        <p>No students found for {activeFilter} category.</p>
                      </div>
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
