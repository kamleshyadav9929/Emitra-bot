import { useState, useEffect, useCallback, useRef } from "react"
import { useLocation } from "react-router-dom"
import { Send, CheckCircle, Loader2, Bot, Users, MessageSquare, Clock, Calendar, Trash2, ArrowRight, CheckCircle2, Search } from "lucide-react"
import { getStats, sendNotification, getExams, getBroadcastStatus } from "../../api"
import Stepper, { Step } from "../../components/common/Stepper"

const CHAR_LIMIT = 4096


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

  const [currentStep, setCurrentStep] = useState(1)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredExams = availableExams.filter(exam => exam.toLowerCase().includes(searchQuery.toLowerCase()))
  const visibleExams = Array.from(new Set([...selectedExams.filter(e => e !== "ALL"), ...filteredExams]))

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
        const data = await getBroadcastStatus(jobId)
        setJobProgress(data)
        if (data.status === "done" || data.status === "error") {
          clearInterval(pollRef.current)
          if (data.status === "done") {
            setStatus("success")
            showToast(`✓ ${data.sent} students ko message mil gaya!`)
            setTimeout(() => {
              setStatus("idle"); setMessage(""); setSelectedExams([]); setImageFile(null); setImagePreview(null);
              setStepperKey(k => k + 1); setJobProgress(null); setCurrentStep(1);
            }, 3000)
          } else {
            setStatus("error"); setErrorMsg(data.error || "Broadcast failed")
          }
        }
      } catch (e) { 
        console.error("Polling error:", e)
      }
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

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSend = async () => {
    if ((!message.trim() && !imageFile) || targetCount === 0 || status === "sending" || status === "polling") return
    setStatus("sending")
    setErrorMsg("")
    try {
      const targets = selectedExams.includes("ALL") ? ["ALL"] : selectedExams
      for (const exam of targets) {
        let response = await sendNotification(exam, message, imageFile)
        if (!response.success) throw new Error(response.error || `Failed for ${exam}`)
        if (response.queued && response.job_id) {
          pollJob(response.job_id, response.total_eligible)
          return
        }
      }
      setStatus("success")
      showToast(`✓ Broadcast sent!`)
      setTimeout(() => {
        setStatus("idle"); setMessage(""); setSelectedExams([]); setImageFile(null); setImagePreview(null);
        setStepperKey(k => k + 1); setCurrentStep(1);
      }, 2500)
    } catch (error) {
      setStatus("error")
      setErrorMsg(error.message)
    }
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
        onStepChange={setCurrentStep}
        onFinalStepCompleted={handleSend}
        nextButtonProps={{
          style: currentStep === 2 ? { display: 'none' } : {}
        }}
      >
        {/* ── Step 1: Audience Selection ─────────────────── */}
        <Step>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#164FA8]" />
                <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">Target Audience</h2>
              </div>

              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search to filter exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-[14px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#164FA8]/20 focus:border-[#164FA8] transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
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

                {visibleExams.map(exam => {
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
                {visibleExams.length === 0 && (
                  <span className="text-[12px] text-gray-400 py-2 italic">No exams found matching "{searchQuery}"</span>
                )}
              </div>

              <div className="flex items-center gap-3 px-5 py-4 bg-[var(--color-primary-fixed)] rounded-[16px] shadow-ambient">
                <div className="w-2 h-2 bg-[#164FA8] rounded-full" />
                <span className="text-[13px] font-medium text-[#164FA8]">
                  <span className="font-bold text-gray-900 text-[14px]">{targetCount}</span> students will receive this
                </span>
              </div>
            </div>
          </div>
        </Step>

        {/* ── Step 2: Message, Image & Send ───────────────── */}
        <Step>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Inputs & Send Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Audience Summary Banner */}
              <div className="flex items-center justify-between px-5 py-4 bg-[var(--color-primary-fixed)] rounded-[16px] shadow-ambient text-[13px] font-medium text-[#164FA8]">
                <span className="flex items-center gap-2">
                  <Users size={14} /> To: <span className="font-bold text-gray-900">{selectedExams.includes("ALL") ? "All Students" : selectedExams.join(", ") || "None"}</span>
                </span>
                <span className="bg-[#EBF1FA] text-[#164FA8] font-bold px-3 py-1 rounded-full text-[11px]">
                  {targetCount} Recipients
                </span>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#164FA8]" />
                  <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">Message</h2>
                </div>
                <textarea
                  value={message}
                  onChange={e => { if (e.target.value.length <= CHAR_LIMIT) setMessage(e.target.value) }}
                  placeholder={"Important Update!\n\nAaj ka Mock Test raat 8 baje hoga.\n\n— Krishna Emitra Team"}
                  rows={6}
                  className={`w-full bg-[var(--color-surface-lowest)] border-none px-5 py-4 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none shadow-ambient transition-all leading-relaxed rounded-[20px] ${
                    message.length > CHAR_LIMIT * 0.9 ? "ring-2 ring-red-400/40" : "focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  }`}
                />
                <div className="flex justify-between items-center px-1">
                  <span className={`text-[11px] font-semibold ${message.trim() || imagePreview ? "text-[#10B981]" : "text-gray-400"}`}>
                    {message.trim() || imagePreview ? "✓ Ready" : "Write a message or upload an image"}
                  </span>
                  <span className={`text-[11px] font-semibold ${
                    message.length > CHAR_LIMIT * 0.9 ? "text-red-500" : "text-gray-400"
                  }`}>
                    {message.length} / {CHAR_LIMIT}
                  </span>
                </div>
              </div>

              {/* Image Upload Widget */}
              <div className="space-y-2">
                <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">Attach Image</h2>
                {imagePreview ? (
                  <div className="relative group w-full h-40 bg-[var(--color-surface-low)] rounded-[20px] overflow-hidden shadow-ambient flex items-center justify-center">
                    <img src={imagePreview} alt="Upload preview" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
                      title="Remove Image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-[var(--color-primary)]/40 bg-[var(--color-surface-lowest)] transition-all cursor-pointer flex flex-col items-center justify-center p-6 rounded-[20px] shadow-ambient group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <div className="p-3 bg-[#EBF1FA] text-[#164FA8] rounded-[14px] group-hover:scale-110 transition-transform">
                      <MessageSquare size={20} />
                    </div>
                    <span className="text-[13px] font-bold text-gray-700 mt-3">Upload a photo</span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">PNG, JPG, JPEG up to 10MB</span>
                  </label>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="text-red-600 text-[12px] font-medium border border-red-200 bg-red-50 p-4 rounded-[16px]">
                  {errorMsg}
                </div>
              )}

              {/* Polling progress bar */}
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
                type="button"
                onClick={handleSend}
                disabled={(!message.trim() && !imageFile) || targetCount === 0 || status === "sending" || status === "polling"}
                className={`w-full py-4 font-bold text-[14px] flex items-center justify-center gap-2 transition-all rounded-[16px] shadow-sm ${
                  (!message.trim() && !imageFile) || targetCount === 0
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
                    <Send size={15} />
                    {`Send to {targetCount} Students`.replace("{targetCount}", targetCount)}
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Telegram Live Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-[#164FA8]" />
                <h2 className="text-[13px] font-bold text-gray-900 tracking-wide uppercase">Live Preview</h2>
              </div>

              <div className="bg-[var(--color-surface-low)] p-5 rounded-[20px] overflow-hidden shadow-ambient min-h-[300px] flex flex-col">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-9 h-9 bg-[#EBF1FA] text-[#164FA8] flex items-center justify-center rounded-[12px]">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">Krishna Emitra Bot</p>
                    <p className="text-[10px] text-[#164FA8] font-semibold tracking-widest uppercase">Automated</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-sm max-w-[90%] text-[13px] text-gray-800 leading-relaxed rounded-[20px] rounded-tl-none overflow-hidden self-start">
                  {imagePreview && (
                    <div className="w-full max-h-56 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                      <img src={imagePreview} alt="Live preview attachment" className="w-full object-cover" />
                    </div>
                  )}
                  <div className="px-5 py-4">
                    {message.trim() ? (
                      message.split("\n").map((line, i) => <div key={i}>{line || <br />}</div>)
                    ) : imagePreview ? (
                      <span className="text-gray-400 italic text-[12px]">Photo only message</span>
                    ) : (
                      <span className="text-gray-400 italic text-[12px]">Your message will appear here...</span>
                    )}
                    <div className="text-[10px] text-gray-400 text-right mt-3 font-semibold">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Step>
      </Stepper>
    </div>
  )
}
