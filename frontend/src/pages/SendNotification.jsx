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
      className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-[#1a1a1a] text-white text-[13px] font-medium shadow-xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <CheckCircle2 size={16} className="text-[#4ade80]" />
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
      <div className="flex items-end justify-between border-b border-[#A3A3A3] pb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#737373] mb-2">Broadcast</p>
          <h1 className="text-3xl font-light text-black tracking-tight">Send Notification</h1>
          <p className="text-[13px] text-[#7A7A78] mt-1">Send instantly to your students.</p>
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
                  <Users size={14} className="text-[#7A7A78]" />
                  <h2 className="text-[13px] font-semibold text-black tracking-wide uppercase">Target Audience</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* All Students */}
                  <button
                    onClick={selectAll}
                    className={`px-4 py-2 text-[13px] font-semibold border transition-colors rounded-xl ${
                      selectedExams.includes("ALL")
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#7A7A78] border-[#A3A3A3] hover:border-black hover:text-black"
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
                        className={`px-4 py-2 text-[13px] font-semibold border transition-colors rounded-xl ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-[#7A7A78] border-[#A3A3A3] hover:border-black hover:text-black"
                        }`}
                      >
                        {exam}
                      </button>
                    )
                  })}
                </div>

                {/* Recipient count */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#F7F7F5] border border-[#A3A3A3] rounded-xl">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                  <span className="text-[13px] text-[#3D3D3D]">
                    <span className="font-semibold text-black">{targetCount}</span> students will receive this
                  </span>
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
                className={`w-full border px-4 py-3 text-[13px] text-black placeholder:text-[#737373] bg-white focus:outline-none resize-none transition-colors leading-relaxed rounded-2xl ${
                  message.length > CHAR_LIMIT * 0.9 ? "border-[#C62828]" : "border-[#A3A3A3] focus:border-black"
                }`}
              />
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-medium ${message.trim() ? "text-[#2E7D32]" : "text-[#737373]"}`}>
                  {message.trim() ? "✓ Ready" : "Write a message above"}
                </span>
                <span className={`text-[11px] font-mono ${
                  message.length > CHAR_LIMIT * 0.9 ? "text-[#C62828]" : "text-[#737373]"
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
                  Preview & Send
                </h2>
              </div>

              {/* Telegram-style preview */}
              <div className="border border-[#A3A3A3] p-4 bg-[#F7F7F5] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#A3A3A3]">
                  <div className="w-7 h-7 bg-black flex items-center justify-center rounded-lg">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-black">E-Mitra Seva</p>
                    <p className="text-[10px] text-[#737373]">bot</p>
                  </div>
                </div>
                <div className="bg-white border border-[#A3A3A3] px-4 py-3 max-w-[88%] text-[13px] text-black leading-relaxed rounded-2xl rounded-tl-none">
                  {message.trim() ? (
                    message.split("\n").map((line, i) => <div key={i}>{line || <br />}</div>)
                  ) : (
                    <span className="text-[#737373] italic text-[12px]">No message yet...</span>
                  )}
                  <div className="text-[10px] text-[#737373] text-right mt-2 font-mono">
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
                  <span><span className="text-black font-semibold">{targetCount}</span> recipients</span>
                </div>
              </div>

              {errorMsg && (
                <div className="text-[#C62828] text-[12px] border border-[#FECACA] bg-[#FEF2F2] p-3">
                  {errorMsg}
                </div>
              )}

              {/* Live progress bar during polling */}
              {(status === "polling" || status === "sending") && jobProgress && (
                <div className="border border-[#A3A3A3] p-4 space-y-2 rounded-xl">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#7A7A78] flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin" /> Bhej raha hai...
                    </span>
                    <span className="font-mono text-black">
                      {jobProgress.sent || 0} / {jobProgress.total || targetCount}
                    </span>
                  </div>
                  <div className="w-full bg-[#F7F7F5] h-1.5 overflow-hidden rounded-full">
                    <div
                      className="h-full bg-black transition-all duration-500 rounded-full"
                      style={{ width: `${jobProgress.total ? Math.round(((jobProgress.sent || 0) / jobProgress.total) * 100) : 5}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#737373] font-mono">
                    {jobProgress.total ? Math.round(((jobProgress.sent || 0) / jobProgress.total) * 100) : 0}% complete · Yeh page band mat karein
                  </p>
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() || targetCount === 0 || status === "sending" || status === "polling"}
                className={`w-full py-3 font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors ${
                  !message.trim() || targetCount === 0
                    ? "bg-[#F7F7F5] text-[#737373] cursor-not-allowed border border-[#A3A3A3]"
                    : status === "success"
                      ? "bg-[#2E7D32] text-white border border-[#2E7D32]"
                      : status === "sending" || status === "polling"
                        ? "bg-[#3D3D3D] text-white cursor-wait border border-[#3D3D3D]"
                        : "bg-black text-white hover:bg-[#3D3D3D] border border-black rounded-xl"
                }`}
              >
                {(status === "sending" || status === "polling") && <><Loader2 size={15} className="animate-spin" /> Bhej raha hai...</>}
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
