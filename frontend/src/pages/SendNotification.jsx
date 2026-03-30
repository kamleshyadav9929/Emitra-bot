import { useState, useEffect, useCallback } from "react"
import { Send, CheckCircle, Loader2, Bot, Users, MessageSquare, Clock, Calendar, Trash2, ArrowRight } from "lucide-react"
import { getStats, sendNotification, scheduleBroadcast, getSchedules, deleteSchedule } from "../api"
import Stepper, { Step } from "../components/Stepper"

const EXAMS = ["JEE", "NEET", "SSC", "UPSC", "CUET"]
const CHAR_LIMIT = 4096

// ── Scheduled List Tab ─────────────────────────────────────────────────────────
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
      alert("Failed to delete.")
    }
  }

  return (
    <div className="border border-[#E5E5E3]">
      <div className="px-6 py-4 border-b border-[#E5E5E3] bg-[#F7F7F5] flex items-center gap-2">
        <Calendar size={14} className="text-[#7A7A78]" />
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7A7A78]">Upcoming Broadcasts</p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13px] text-[#AEAEAC]">No scheduled broadcasts.</p>
        </div>
      ) : (
        <div>
          {schedules.map(s => (
            <div key={s.id} className="flex items-start justify-between px-6 py-4 border-b border-[#E5E5E3] last:border-0 hover:bg-[#F7F7F5] transition-colors">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold tracking-wider uppercase border border-[#0A0A0A] px-2 py-0.5 text-[#0A0A0A]">
                    {s.target_exam === "ALL" ? "All Students" : s.target_exam}
                  </span>
                  <span className="text-[11px] text-[#7A7A78] flex items-center gap-1 font-mono">
                    <Clock size={11} />
                    {new Date(s.run_at + "Z").toLocaleString()}
                  </span>
                </div>
                <p className="text-[13px] text-[#3D3D3D] line-clamp-2 max-w-xl">{s.message_text}</p>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="ml-4 w-8 h-8 flex items-center justify-center border border-[#E5E5E3] text-[#AEAEAC] hover:border-black hover:text-black transition-colors flex-shrink-0"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SendNotification() {
  const [activeTab, setActiveTab] = useState("new")
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
    if (selectedExams.includes("ALL")) { setSelectedExams([exam]); return }
    setSelectedExams(prev =>
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
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
          const utcDateStr = new Date(runAt).toISOString().slice(0, 19).replace("T", " ")
          response = await scheduleBroadcast(exam, message, utcDateStr)
        } else {
          response = await sendNotification(exam, message)
        }
        if (!response.success) throw new Error(response.error || `Failed for ${exam}`)
      }
      setStatus("success")
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
        setSelectedExams([])
        setRunAt("")
        setStepperKey(k => k + 1)
      }, 2500)
    } catch (error) {
      setStatus("error")
      setErrorMsg(error.message)
    }
  }

  const getMinDateTime = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 5)
    return d.toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-[#E5E5E3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#AEAEAC] mb-2">Broadcast</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Send Notification</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Send instantly or schedule for later.</p>
        </div>

        {/* Tabs */}
        <div className="flex border border-[#E5E5E3]">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 text-[12px] font-semibold transition-colors ${
              activeTab === "new"
                ? "bg-black text-white"
                : "bg-white text-[#7A7A78] hover:text-black"
            }`}
          >
            New
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2 text-[12px] font-semibold transition-colors border-l border-[#E5E5E3] ${
              activeTab === "scheduled"
                ? "bg-black text-white"
                : "bg-white text-[#7A7A78] hover:text-black"
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
          nextButtonText="Continue"
          onFinalStepCompleted={handleSend}
        >
          {/* ── Step 1: Audience + Schedule ─────────────────── */}
          <Step>
            <div className="space-y-8">
              {/* Audience */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#7A7A78]" />
                  <h2 className="text-[13px] font-semibold text-black tracking-wide uppercase">Target Audience</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* All Students */}
                  <button
                    onClick={selectAll}
                    className={`px-4 py-2 text-[13px] font-semibold border transition-colors ${
                      selectedExams.includes("ALL")
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#7A7A78] border-[#E5E5E3] hover:border-black hover:text-black"
                    }`}
                  >
                    All Students
                  </button>

                  {EXAMS.map(exam => {
                    const active = selectedExams.includes("ALL") || selectedExams.includes(exam)
                    return (
                      <button
                        key={exam}
                        onClick={() => toggleExam(exam)}
                        className={`px-4 py-2 text-[13px] font-semibold border transition-colors ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-[#7A7A78] border-[#E5E5E3] hover:border-black hover:text-black"
                        }`}
                      >
                        {exam}
                      </button>
                    )
                  })}
                </div>

                {/* Recipient count */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#F7F7F5] border border-[#E5E5E3]">
                  <div className="w-1.5 h-1.5 bg-black" />
                  <span className="text-[13px] text-[#3D3D3D]">
                    <span className="font-semibold text-black">{targetCount}</span> students will receive this
                  </span>
                </div>
              </div>

              {/* Schedule time */}
              <div className="space-y-3 pt-6 border-t border-[#E5E5E3]">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#7A7A78]" />
                  <h2 className="text-[13px] font-semibold text-black tracking-wide uppercase">Schedule Time</h2>
                  <span className="text-[10px] text-[#AEAEAC] font-medium border border-[#E5E5E3] px-1.5 py-0.5">Optional</span>
                </div>
                <p className="text-[12px] text-[#AEAEAC]">Leave blank to send immediately.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    min={getMinDateTime()}
                    value={runAt}
                    onChange={e => setRunAt(e.target.value)}
                    className="border border-[#E5E5E3] px-4 py-2.5 text-[13px] text-black bg-white focus:outline-none focus:border-black transition-colors"
                  />
                  {runAt && (
                    <button onClick={() => setRunAt("")} className="text-[12px] text-[#7A7A78] hover:text-black border-b border-dashed border-[#AEAEAC] hover:border-black transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Step>

          {/* ── Step 2: Message ──────────────────────────────── */}
          <Step>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-[#7A7A78]" />
                <h2 className="text-[13px] font-semibold text-black tracking-wide uppercase">Message</h2>
              </div>
              <textarea
                value={message}
                onChange={e => { if (e.target.value.length <= CHAR_LIMIT) setMessage(e.target.value) }}
                placeholder={"Important Update!\n\nAaj ka Mock Test raat 8 baje hoga.\n\n— E-Mitra Team"}
                rows={8}
                className={`w-full border px-4 py-3 text-[13px] text-black placeholder:text-[#AEAEAC] bg-white focus:outline-none resize-none transition-colors leading-relaxed ${
                  message.length > CHAR_LIMIT * 0.9 ? "border-[#C62828]" : "border-[#E5E5E3] focus:border-black"
                }`}
              />
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-medium ${message.trim() ? "text-[#2E7D32]" : "text-[#AEAEAC]"}`}>
                  {message.trim() ? "✓ Ready" : "Write a message above"}
                </span>
                <span className={`text-[11px] font-mono ${
                  message.length > CHAR_LIMIT * 0.9 ? "text-[#C62828]" : "text-[#AEAEAC]"
                }`}>
                  {message.length} / {CHAR_LIMIT}
                </span>
              </div>
            </div>
          </Step>

          {/* ── Step 3: Preview & Send ───────────────────────── */}
          <Step>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-[#7A7A78]" />
                <h2 className="text-[13px] font-semibold text-black tracking-wide uppercase">
                  Preview & {runAt ? "Schedule" : "Send"}
                </h2>
              </div>

              {/* Telegram-style preview */}
              <div className="border border-[#E5E5E3] p-4 bg-[#F7F7F5]">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#E5E5E3]">
                  <div className="w-7 h-7 bg-black flex items-center justify-center">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-black">E-Mitra Seva</p>
                    <p className="text-[10px] text-[#AEAEAC]">bot</p>
                  </div>
                </div>
                <div className="bg-white border border-[#E5E5E3] px-4 py-3 max-w-[88%] text-[13px] text-black leading-relaxed">
                  {message.trim() ? (
                    message.split("\n").map((line, i) => <div key={i}>{line || <br />}</div>)
                  ) : (
                    <span className="text-[#AEAEAC] italic text-[12px]">No message yet...</span>
                  )}
                  <div className="text-[10px] text-[#AEAEAC] text-right mt-2 font-mono">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between text-[11px] text-[#7A7A78] px-1">
                <span>
                  To: <span className="text-black font-semibold">
                    {selectedExams.includes("ALL") ? "All Students" : selectedExams.join(", ") || "None"}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  {runAt && (
                    <span className="flex items-center gap-1 text-[#3D3D3D] border border-[#E5E5E3] px-2 py-0.5">
                      <Clock size={10} />
                      {new Date(runAt).toLocaleString()}
                    </span>
                  )}
                  <span><span className="text-black font-semibold">{targetCount}</span> recipients</span>
                </div>
              </div>

              {errorMsg && (
                <div className="text-[#C62828] text-[12px] border border-[#FECACA] bg-[#FEF2F2] p-3">
                  {errorMsg}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || targetCount === 0 || status === "sending"}
                className={`w-full py-3 font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors ${
                  !message.trim() || targetCount === 0
                    ? "bg-[#F7F7F5] text-[#AEAEAC] cursor-not-allowed border border-[#E5E5E3]"
                    : status === "success"
                      ? "bg-[#2E7D32] text-white border border-[#2E7D32]"
                      : status === "sending"
                        ? "bg-[#3D3D3D] text-white cursor-wait border border-[#3D3D3D]"
                        : "bg-black text-white hover:bg-[#3D3D3D] border border-black"
                }`}
              >
                {status === "sending" && <><Loader2 size={15} className="animate-spin" /> {runAt ? "Scheduling..." : "Sending..."}</>}
                {status === "success" && <><CheckCircle size={15} /> {runAt ? "Scheduled!" : "Sent!"}</>}
                {(status === "idle" || status === "error") && (
                  <>
                    {runAt ? <Clock size={15} /> : <ArrowRight size={15} />}
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
