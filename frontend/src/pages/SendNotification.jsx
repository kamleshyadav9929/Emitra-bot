import { useState, useEffect, useCallback } from "react"
import { Send, CheckCircle, Loader2, Bot, Users, MessageSquare, Clock, Calendar, X, Trash2 } from "lucide-react"
import { getStats, sendNotification, scheduleBroadcast, getSchedules, deleteSchedule } from "../api"
import { EXAM_COLORS } from "../constants/examColors"
import Stepper, { Step } from "../components/Stepper"

const EXAMS = ["JEE", "NEET", "SSC", "UPSC", "CUET"]
const CHAR_LIMIT = 4096

function ScheduledList() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSchedules = useCallback(() => {
    setLoading(true)
    getSchedules()
      .then(data => setSchedules(data.schedules || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scheduled broadcast?")) return
    try {
      await deleteSchedule(id)
      fetchSchedules()
    } catch {
      alert("Failed to delete schedule.")
    }
  }

  return (
    <div className="bg-[#111119] border border-[#1D1D2D] rounded-xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-[#1D1D2D] bg-[#0C0C12]">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar size={16} className="text-[#818CF8]" />
          Upcoming Broadcasts
        </h2>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#6366F1]" /></div>
      ) : schedules.length === 0 ? (
        <div className="py-20 text-center text-sm text-slate-500">Koi scheduled broadcast nahi hai.</div>
      ) : (
        <div className="divide-y divide-[#1D1D2D]">
          {schedules.map(s => (
            <div key={s.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#18182A] transition-colors">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#818CF8] bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/20">
                    {s.target_exam === "ALL" ? "All Students" : s.target_exam}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(s.run_at + "Z").toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2 max-w-2xl">{s.message_text}</p>
              </div>
              <div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  title="Delete Schedule"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SendNotification() {
  const [activeTab, setActiveTab] = useState("new") // "new" or "scheduled"
  const [stats, setStats] = useState(null)
  const [selectedExams, setSelectedExams] = useState([])
  const [message, setMessage] = useState("")
  const [runAt, setRunAt] = useState("")
  const [status, setStatus] = useState("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [stepperKey, setStepperKey] = useState(0)

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
  }, [])

  const toggleExam = (exam) => {
    if (selectedExams.includes("ALL")) {
      setSelectedExams([exam])
      return
    }
    setSelectedExams((prev) =>
      prev.includes(exam) ? prev.filter((item) => item !== exam) : [...prev, exam]
    )
  }

  const selectAll = () => setSelectedExams(["ALL"])

  const targetCount = stats
    ? selectedExams.includes("ALL")
      ? stats.total_students || 0
      : selectedExams.reduce((acc, exam) => acc + (stats.by_exam?.[exam] || 0), 0)
    : 0

  const handleSend = async () => {
    if (!message.trim() || targetCount === 0 || status === "sending") return
    setStatus("sending")
    setErrorMsg("")

    try {
      const targets = selectedExams.includes("ALL") ? ["ALL"] : selectedExams

      for (const exam of targets) {
        let response
        if (runAt) {
          // Convert local datetime to UTC string for backend storage
          const utcDateStr = new Date(runAt).toISOString().slice(0, 19).replace('T', ' ')
          response = await scheduleBroadcast(exam, message, utcDateStr)
        } else {
          response = await sendNotification(exam, message)
        }
        
        if (!response.success) {
          throw new Error(response.error || `Failed for ${exam}`)
        }
      }

      setStatus("success")
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
        setSelectedExams([])
        setRunAt("")
        setStepperKey((key) => key + 1)
      }, 2500)
    } catch (error) {
      setStatus("error")
      setErrorMsg(error.message)
    }
  }

  // Calculate local minimum datetime for date-picker
  const getMinDateTime = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 5) // +5 mins buffer
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] text-[#818CF8] font-semibold tracking-[0.15em] uppercase mb-1">Broadcast</p>
          <h1 className="text-2xl font-bold text-white">Send Notification</h1>
          <p className="text-sm text-slate-600 mt-0.5">Broadcast instantly or schedule for later.</p>
        </div>
        
        <div className="flex bg-[#111119] border border-[#1D1D2D] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "new" ? "bg-[#6366F1] text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            New Broadcast
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "scheduled" ? "bg-[#6366F1] text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Schedules
          </button>
        </div>
      </div>

      {activeTab === "scheduled" ? (
        <ScheduledList />
      ) : (
        <Stepper
          key={stepperKey}
          initialStep={1}
          backButtonText="Back"
          nextButtonText="Next"
          onFinalStepCompleted={handleSend}
        >
          <Step>
             <div className="space-y-8">
               {/* Audience */}
               <div className="space-y-5">
                 <div className="flex items-center gap-2">
                   <Users size={15} className="text-[#818CF8]" />
                   <h2 className="text-base font-bold text-white">Select Target Audience</h2>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   <button
                     onClick={selectAll}
                     className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                       selectedExams.includes("ALL")
                         ? "bg-[#6366F1]/15 border-[#6366F1]/35 text-[#818CF8]"
                         : "bg-[#1D1D2D] border-[#1D1D2D] text-slate-600 hover:text-slate-300 hover:border-[#2a2a3f]"
                     }`}
                   >
                     All Students
                   </button>
                   {EXAMS.map((exam) => {
                     const active = selectedExams.includes("ALL") || selectedExams.includes(exam)
                     const color = EXAM_COLORS[exam]

                     return (
                       <button
                         key={exam}
                         onClick={() => toggleExam(exam)}
                         className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                         style={{
                           backgroundColor: active ? `${color}15` : "#1D1D2D",
                           borderColor: active ? `${color}45` : "#1D1D2D",
                           color: active ? color : "#475569",
                         }}
                       >
                         {exam}
                       </button>
                     )
                   })}
                 </div>
                 <div className="flex items-center gap-2 p-3 bg-[#0C0C12] border border-[#1D1D2D] rounded-lg">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"></div>
                   <span className="text-sm text-slate-500">
                     <span className="font-bold text-white">{targetCount}</span> students will receive this message
                   </span>
                 </div>
               </div>

               {/* Schedule Option */}
               <div className="space-y-3 pt-6 border-t border-[#1D1D2D]">
                 <div className="flex items-center gap-2">
                   <Clock size={15} className="text-emerald-400" />
                   <h2 className="text-base font-bold text-white">Schedule Time (Optional)</h2>
                 </div>
                 <p className="text-xs text-slate-500 mb-2">Agar turant bhejna hai to isko khaali chhod dein.</p>
                 <div className="flex items-center gap-3">
                    <input
                      type="datetime-local"
                      min={getMinDateTime()}
                      value={runAt}
                      onChange={(e) => setRunAt(e.target.value)}
                      className="bg-[#0C0C12] border border-[#1D1D2D] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#6366F1]/40"
                    />
                    {runAt && (
                      <button onClick={() => setRunAt("")} className="text-xs text-red-400 hover:underline">Clear</button>
                    )}
                 </div>
               </div>
             </div>
          </Step>

          <Step>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-[#818CF8]" />
                <h2 className="text-base font-bold text-white">Write Your Message</h2>
              </div>
              <textarea
                value={message}
                onChange={(event) => {
                  if (event.target.value.length <= CHAR_LIMIT) {
                    setMessage(event.target.value)
                  }
                }}
                placeholder={"Important Update!\n\nAaj ka Mock Test raat 8 baje hoga.\n\n- E-Mitra Team"}
                rows={7}
                className={`w-full bg-[#0C0C12] border rounded-lg p-4 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none resize-none transition-colors ${
                  message.length > CHAR_LIMIT * 0.9
                    ? "border-red-500/40 focus:border-red-500/60"
                    : "border-[#1D1D2D] focus:border-[#6366F1]/40"
                }`}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={message.trim() ? "text-[#4ADE80]" : "text-slate-700"}>
                  {message.trim() ? "Ready" : "Write a message above"}
                </span>
                <div className="flex items-center gap-2">
                  {message.length > CHAR_LIMIT * 0.9 && (
                    <span className="text-red-400 text-[10px] font-medium animate-pulse">
                      {CHAR_LIMIT - message.length} left
                    </span>
                  )}
                  <span
                    className={`font-mono ${
                      message.length > CHAR_LIMIT * 0.9
                        ? "text-red-400"
                        : message.length > CHAR_LIMIT * 0.75
                          ? "text-yellow-500"
                          : "text-slate-700"
                    }`}
                  >
                    {message.length} / {CHAR_LIMIT}
                  </span>
                </div>
              </div>
            </div>
          </Step>

          <Step>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot size={15} className="text-[#818CF8]" />
                <h2 className="text-base font-bold text-white">Preview & {runAt ? "Schedule" : "Send"}</h2>
              </div>

              <div className="bg-[#17212B] rounded-xl border border-[#2a3b5c] p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2a3b5c]/60">
                  <div className="w-8 h-8 bg-[#6366F1] rounded-full flex items-center justify-center">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">E-Mitra Seva</p>
                    <p className="text-[11px] text-[#8ca4d4]">bot</p>
                  </div>
                </div>
                <div className="bg-[#182533] border border-[#2a3b5c] rounded-xl rounded-tl-none px-4 py-3 max-w-[90%] text-sm text-white">
                  {message.trim() ? (
                    message.split("\n").map((line, index) => <div key={index}>{line || <br />}</div>)
                  ) : (
                    <span className="text-[#8ca4d4] italic text-xs">No message yet...</span>
                  )}
                  <div className="text-[10px] text-[#8ca4d4] text-right mt-1.5">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span>
                  To:{" "}
                  <span className="text-slate-400 font-semibold">
                    {selectedExams.includes("ALL") ? "All Students" : selectedExams.join(", ") || "None"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {runAt && (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Clock size={10} />
                          {new Date(runAt).toLocaleString()}
                      </span>
                  )}
                  <span>
                    <span className="text-white font-bold">{targetCount}</span> recipients
                  </span>
                </span>
              </div>

              {errorMsg && (
                <div className="text-red-400 text-xs bg-red-400/8 border border-red-400/20 p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={!message.trim() || targetCount === 0 || status === "sending"}
                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  !message.trim() || targetCount === 0
                    ? "bg-[#1D1D2D] text-slate-700 cursor-not-allowed"
                    : status === "success"
                      ? "bg-[#4ADE80] text-black"
                      : status === "sending"
                        ? "bg-[#6366F1]/60 text-white cursor-wait"
                        : "bg-[#6366F1] text-white hover:bg-[#5558E3]"
                }`}
              >
                {status === "sending" && (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {runAt ? "Scheduling..." : "Sending..."}
                  </>
                )}
                {status === "success" && (
                  <>
                    <CheckCircle size={16} /> {runAt ? "Scheduled Successfully!" : "Sent Successfully!"}
                  </>
                )}
                {(status === "idle" || status === "error") && (
                  <>
                    {runAt ? <Clock size={16} /> : <Send size={16} />} 
                    {runAt ? "Schedule for Later" : `Send to ${targetCount} Students`}
                  </>
                )}
              </button>
            </div>
          </Step>
        </Stepper>
      )}
    </div>
  )
}
