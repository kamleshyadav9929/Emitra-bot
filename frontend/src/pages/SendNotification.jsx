import { useState, useEffect } from "react"
import { Send, CheckCircle, Loader2, Bot, Users, MessageSquare } from "lucide-react"
import { getStats, sendNotification } from "../api"
import { EXAM_COLORS } from "../components/ExamBadge"
import Stepper, { Step } from "../components/Stepper"

const EXAMS = ["JEE", "NEET", "SSC", "UPSC", "CUET"]
const CHAR_LIMIT = 4096

export default function SendNotification() {
  const [stats, setStats]               = useState(null)
  const [selectedExams, setSelectedExams] = useState([])
  const [message, setMessage]           = useState("")
  const [status, setStatus]             = useState("idle")
  const [errorMsg, setErrorMsg]         = useState("")
  const [stepperKey, setStepperKey]     = useState(0) // reset stepper after completion

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
  }, [])

  const toggleExam = (ex) => {
    if (selectedExams.includes("ALL")) {
      setSelectedExams([ex])
    } else {
      setSelectedExams(prev =>
        prev.includes(ex) ? prev.filter(e => e !== ex) : [...prev, ex]
      )
    }
  }

  const selectAll = () => setSelectedExams(["ALL"])

  const targetCount = stats
    ? selectedExams.includes("ALL")
      ? stats.total_students || 0
      : selectedExams.reduce((acc, ex) => acc + (stats.by_exam?.[ex] || 0), 0)
    : 0

  const handleSend = async () => {
    if (!message.trim() || targetCount === 0 || status === "sending") return
    setStatus("sending")
    setErrorMsg("")
    try {
      const toSend = selectedExams.includes("ALL") ? ["ALL"] : selectedExams
      for (const ex of toSend) {
        const res = await sendNotification(ex, message)
        if (!res.success) throw new Error(res.error || `Failed for ${ex}`)
      }
      setStatus("success")
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
        setSelectedExams([])
        setStepperKey(k => k + 1) // reset stepper to step 1
      }, 2500)
    } catch (e) {
      setStatus("error")
      setErrorMsg(e.message)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs text-[#FF6B35] font-semibold tracking-widest uppercase mb-1">Broadcast</p>
        <h1 className="text-2xl font-bold text-white">Send Notification</h1>
        <p className="text-sm text-slate-500 mt-0.5">3 simple steps to broadcast a message to students.</p>
      </div>

      {/* Stepper */}
      <Stepper
        key={stepperKey}
        initialStep={1}
        backButtonText="← Back"
        nextButtonText="Next →"
        onFinalStepCompleted={handleSend}
        nextButtonProps={{
          disabled:
            (status === "sending") ||
            (undefined), // per-step validation handled inside
        }}
      >

        {/* ── STEP 1: Target Audience ── */}
        <Step>
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-[#FF6B35]" />
              <h2 className="text-base font-bold text-white">Select Target Audience</h2>
            </div>
            <p className="text-xs text-slate-500">Who should receive this notification?</p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  selectedExams.includes("ALL")
                    ? "bg-[#FF6B35]/15 border-[#FF6B35]/40 text-[#FF6B35]"
                    : "bg-[#1A1A28] border-[#1A1A28] text-slate-500 hover:text-slate-200 hover:border-[#2a2a3a]"
                }`}
              >
                All Students
              </button>
              {EXAMS.map(ex => {
                const active = selectedExams.includes("ALL") || selectedExams.includes(ex)
                const color = EXAM_COLORS[ex]
                return (
                  <button
                    key={ex}
                    onClick={() => toggleExam(ex)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      backgroundColor: active ? `${color}18` : "#1A1A28",
                      borderColor:     active ? `${color}50` : "#1A1A28",
                      color:           active ? color : "#64748b",
                    }}
                  >
                    {ex}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#09090E] border border-[#1A1A28] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#FF6B35]"></div>
              <span className="text-sm text-slate-400">
                <span className="font-bold text-white">{targetCount}</span> students will receive this message
              </span>
            </div>
          </div>
        </Step>

        {/* ── STEP 2: Write Message ── */}
        <Step>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={16} className="text-[#FF6B35]" />
              <h2 className="text-base font-bold text-white">Write Your Message</h2>
            </div>
            <p className="text-xs text-slate-500">Hindi or English dono chalega.</p>

            <textarea
              value={message}
              onChange={e => e.target.value.length <= CHAR_LIMIT && setMessage(e.target.value)}
              placeholder={"📢 Important Update!\n\nAaj ka Mock Test raat 8 baje hoga. Sab log join karein.\n\n— E-Mitra Team"}
              rows={7}
              className={`w-full bg-[#09090E] border rounded-lg p-4 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none resize-none transition-colors ${
                message.length > CHAR_LIMIT * 0.9
                  ? "border-red-500/50 focus:border-red-500/70"
                  : "border-[#1A1A28] focus:border-[#FF6B35]/50"
              }`}
            />
            <div className="flex justify-between items-center text-xs">
              <span className={message.trim() ? "text-[#4ADE80]" : "text-slate-600"}>
                {message.trim() ? "✓ Message ready" : "Type a message above"}
              </span>
              <div className="flex items-center gap-2">
                {message.length > CHAR_LIMIT * 0.9 && (
                  <span className="text-red-400 text-[10px] font-medium animate-pulse">
                    ⚠ {CHAR_LIMIT - message.length} chars left
                  </span>
                )}
                <span className={`font-mono ${
                  message.length > CHAR_LIMIT * 0.9 ? "text-red-400" :
                  message.length > CHAR_LIMIT * 0.75 ? "text-yellow-500" :
                  "text-slate-600"
                }`}>
                  {message.length} / {CHAR_LIMIT}
                </span>
              </div>
            </div>
          </div>
        </Step>

        {/* ── STEP 3: Preview & Send ── */}
        <Step>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={16} className="text-[#FF6B35]" />
              <h2 className="text-base font-bold text-white">Preview & Send</h2>
            </div>

            {/* Telegram Preview */}
            <div className="bg-[#17212B] rounded-xl border border-[#2a3b5c] p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2a3b5c]/60">
                <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">E-Mitra Seva</p>
                  <p className="text-[11px] text-[#8ca4d4]">bot</p>
                </div>
              </div>
              <div className="bg-[#182533] border border-[#2a3b5c] rounded-xl rounded-tl-none px-4 py-3 max-w-[90%] text-sm text-white">
                {message.trim()
                  ? message.split("\n").map((line, i) => <div key={i}>{line || <br />}</div>)
                  : <span className="text-[#8ca4d4] italic text-xs">No message written yet...</span>
                }
                <div className="text-[10px] text-[#8ca4d4] text-right mt-1.5">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Summary & Send */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span>Sending to: <span className="text-slate-400 font-semibold">{selectedExams.includes("ALL") ? "All Students" : selectedExams.join(", ") || "None selected"}</span></span>
              <span><span className="text-white font-bold">{targetCount}</span> recipients</span>
            </div>

            {errorMsg && (
              <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 p-3 rounded-lg">{errorMsg}</div>
            )}

            <button
              onClick={handleSend}
              disabled={!message.trim() || targetCount === 0 || status === "sending"}
              className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                !message.trim() || targetCount === 0
                  ? "bg-[#1A1A28] text-slate-600 cursor-not-allowed"
                  : status === "success"
                  ? "bg-[#4ADE80] text-black"
                  : status === "sending"
                  ? "bg-[#FF6B35]/70 text-white cursor-wait"
                  : "bg-[#FF6B35] text-white hover:bg-[#ff805a]"
              }`}
            >
              {status === "sending" && <><Loader2 size={16} className="animate-spin" /> Sending...</>}
              {status === "success" && <><CheckCircle size={16} /> Sent Successfully!</>}
              {(status === "idle" || status === "error") && <><Send size={16} /> Send to {targetCount} Students</>}
            </button>
          </div>
        </Step>

      </Stepper>

    </div>
  )
}
