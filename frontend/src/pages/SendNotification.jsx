import { useState, useEffect, useCallback, useRef } from "react"
import { useLocation } from "react-router-dom"
import { Send, CheckCircle, Loader2, Bot, Users, MessageSquare, Clock, Calendar, Trash2, ArrowRight, CheckCircle2 } from "lucide-react"
import { getStats, sendNotification, getExams } from "../api"
import Stepper, { Step } from "../components/Stepper"

const CHAR_LIMIT = 4096
const BASE_URL = import.meta.env.VITE_API_URL || ""
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` })


// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ visible, message }) {
  return (
    <div
      className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-[#071E27] text-white text-[13px] font-bold rounded-[14px] shadow-2xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <CheckCircle2 size={16} className="text-emerald-400" />
      {message}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SendNotification() {
  const location = useLocation()
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState("idle") // idle | sending | polling | success | error
  const [errorMsg, setErrorMsg] = useState("")
  const [stepperKey, setStepperKey] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [jobProgress, setJobProgress] = useState(null) // { sent, total, status }
  const [availableExams, setAvailableExams] = useState([])
  const [selectedExams, setSelectedExams] = useState([])
  const [stats, setStats] = useState(null)
  const pollRef = useRef(null)

  // Pre-select exam from URL param e.g. /send?exam=JEE
  useEffect(() => {
    getExams().then(data => {
      const examNames = data.exams.map(e => e.name)
      setAvailableExams(examNames)
      const params = new URLSearchParams(location.search)
      const examParam = params.get("exam")
      if (examParam && examNames.includes(examParam)) {
        setSelectedExams([examParam])
      }
    }).catch(console.error)
  }, [location.search])

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
  }, [])

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }

  const pollJob = (jobId, total) => {
    setStatus("polling")
    setJobProgress({ sent: 0, total, status: "running" })
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/broadcast-status/${jobId}`, { headers: getAuthHeaders() })
        const data = await res.json()
        setJobProgress(data)
        if (data.status === "done" || data.status === "error") {
          clearInterval(pollRef.current)
          if (data.status === "done") {
            setStatus("success")
            showToast(`✓ ${data.sent} students ko message mil gaya!`)
            setTimeout(() => {
              setStatus("idle"); setMessage(""); setSelectedExams([]);
              setStepperKey(k => k + 1); setJobProgress(null)
            }, 3000)
          } else {
            setStatus("error"); setErrorMsg(data.error || "Broadcast failed")
          }
        }
      } catch { /* network glitch, keep polling */ }
    }, 2000)
  }

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
    if (!message.trim() || targetCount === 0 || status === "sending" || status === "polling") return
    setStatus("sending")
    setErrorMsg("")
    try {
      const targets = selectedExams.includes("ALL") ? ["ALL"] : selectedExams
      for (const exam of targets) {
        let response = await sendNotification(exam, message)
        if (!response.success) throw new Error(response.error || `Failed for ${exam}`)
        // New API returns job_id for background processing
        if (response.queued && response.job_id) {
          pollJob(response.job_id, response.total_eligible)
          return // polling handles the rest
        }
      }
      setStatus("success")
      showToast(`✓ Broadcast sent!`)
      setTimeout(() => {
        setStatus("idle"); setMessage(""); setSelectedExams([]);
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
      <Toast visible={toastVisible} message={toastMsg} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--color-primary)] mb-2">Broadcast</p>
          <h1 className="text-3xl font-black text-[#0A1A40] tracking-tight leading-tight font-display">Send Notification</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-2xl leading-relaxed font-medium">Send instantly to your students.</p>
        </div>
      </div>

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
                  <Users size={16} className="text-[#164FA8]" />
                  <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">Target Audience</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* All Students */}
                  <button
                    onClick={selectAll}
                    className={`px-5 py-2 text-[12px] font-bold transition-all rounded-[14px] shadow-ambient ${
                      selectedExams.includes("ALL")
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-lowest)] text-gray-500 hover:bg-[var(--color-surface-low)] hover:text-gray-900"
                    }`}
                  >
                    All Students
                  </button>

                  {availableExams.map(exam => {
                    const active = selectedExams.includes("ALL") || selectedExams.includes(exam)
                    return (
                      <button
                        key={exam}
                        onClick={() => toggleExam(exam)}
                        className={`px-5 py-2 text-[12px] font-bold transition-all rounded-[14px] shadow-ambient ${
                          active
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-[var(--color-surface-lowest)] text-gray-500 hover:bg-[var(--color-surface-low)] hover:text-gray-900"
                        }`}
                      >
                        {exam}
                      </button>
                    )
                  })}
                </div>

                {/* Recipient count */}
                <div className="flex items-center gap-3 px-5 py-4 bg-[var(--color-primary-fixed)] rounded-[16px] shadow-ambient">
                  <div className="w-2 h-2 bg-[#164FA8] rounded-full" />
                  <span className="text-[13px] font-medium text-[#164FA8]">
                    <span className="font-bold text-gray-900 text-[14px]">{targetCount}</span> students will receive this
                  </span>
                </div>
              </div>
            </div>
          </Step>

          {/* ── Step 2: Message ──────────────────────────────── */}
          <Step>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[#164FA8]" />
                <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">Message</h2>
              </div>
              <textarea
                value={message}
                onChange={e => { if (e.target.value.length <= CHAR_LIMIT) setMessage(e.target.value) }}
                placeholder={"Important Update!\n\nAaj ka Mock Test raat 8 baje hoga.\n\n— E-Mitra Team"}
                rows={8}
                className={`w-full bg-[var(--color-surface-lowest)] border-none px-5 py-4 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none shadow-ambient transition-all leading-relaxed rounded-[20px] ${
                  message.length > CHAR_LIMIT * 0.9 ? "ring-2 ring-red-400/40" : "focus:ring-2 focus:ring-[var(--color-primary)]/10"
                }`}
              />
              <div className="flex justify-between items-center px-1">
                <span className={`text-[11px] font-semibold ${message.trim() ? "text-[#10B981]" : "text-gray-400"}`}>
                  {message.trim() ? "✓ Ready" : "Write a message above"}
                </span>
                <span className={`text-[11px] font-semibold ${
                  message.length > CHAR_LIMIT * 0.9 ? "text-red-500" : "text-gray-400"
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
                <Bot size={16} className="text-[#164FA8]" />
                <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">
                  Preview & Send
                </h2>
              </div>

              {/* Telegram-style preview */}
              <div className="bg-[var(--color-surface-low)] p-5 rounded-[20px] overflow-hidden shadow-ambient">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-9 h-9 bg-[#EBF1FA] text-[#164FA8] flex items-center justify-center rounded-[12px]">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">E-Mitra Bot</p>
                    <p className="text-[10px] text-[#164FA8] font-semibold tracking-widest uppercase">Automated</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 px-5 py-4 shadow-sm max-w-[88%] text-[13px] text-gray-800 leading-relaxed rounded-[20px] rounded-tl-none">
                  {message.trim() ? (
                    message.split("\n").map((line, i) => <div key={i}>{line || <br />}</div>)
                  ) : (
                    <span className="text-gray-400 italic text-[12px]">Message preview will appear here...</span>
                  )}
                  <div className="text-[10px] text-gray-400 text-right mt-3 font-semibold">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between text-[12px] px-2">
                <span className="text-gray-500 font-medium">
                  To: <span className="text-gray-900 font-bold ml-1">
                    {selectedExams.includes("ALL") ? "All Students" : selectedExams.join(", ") || "None"}
                  </span>
                </span>
                <span className="bg-[#EBF1FA] text-[#164FA8] font-bold px-3 py-1 rounded-full text-[11px]">
                  {targetCount} Recipients
                </span>
              </div>

              {errorMsg && (
                <div className="text-red-600 text-[12px] font-medium border border-red-200 bg-red-50 p-4 rounded-[16px]">
                  {errorMsg}
                </div>
              )}

              {/* Live progress bar during polling */}
              {(status === "polling" || status === "sending") && jobProgress && (
                <div className="bg-[var(--color-primary-fixed)] p-5 space-y-3 rounded-[20px] shadow-ambient">
                  <div className="flex justify-between text-[12px] font-semibold text-[#164FA8]">
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Broadcasting...
                    </span>
                    <span>
                      {jobProgress.sent || 0} / {jobProgress.total || targetCount}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-lowest)] h-2 overflow-hidden rounded-full shadow-ambient">
                    <div
                      className="h-full bg-[#164FA8] transition-all duration-500 rounded-full"
                      style={{ width: `${jobProgress.total ? Math.round(((jobProgress.sent || 0) / jobProgress.total) * 100) : 5}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {jobProgress.total ? Math.round(((jobProgress.sent || 0) / jobProgress.total) * 100) : 0}% complete · Please keep this page open.
                  </p>
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || targetCount === 0 || status === "sending" || status === "polling"}
                className={`w-full py-4 font-bold text-[14px] flex items-center justify-center gap-2 transition-all rounded-[16px] shadow-sm ${
                  !message.trim() || targetCount === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : status === "success"
                      ? "bg-[#10B981] text-white shadow-md"
                      : status === "sending" || status === "polling"
                        ? "bg-[#164FA8] text-white cursor-wait opacity-80"
                        : "bg-[#4162EE] text-white hover:bg-[#3451D4] hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {(status === "sending" || status === "polling") && <><Loader2 size={18} className="animate-spin" /> Broadcasting...</>}
                {status === "success" && <><CheckCircle size={15} /> Sent!</>}
                {(status === "idle" || status === "error") && (
                  <>
                    <ArrowRight size={15} />
                    {`Send to ${targetCount} Students`}
                  </>
                )}
              </button>

            </div>
          </Step>
        </Stepper>
    </div>
  )
}
