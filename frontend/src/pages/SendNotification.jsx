import { useState, useEffect } from "react"
import { Send, CheckCircle, Loader2, Bot, Info } from "lucide-react"
import { getStats, sendNotification } from "../api"
import { EXAM_COLORS } from "../components/ExamBadge"

const EXAMS = ["JEE", "NEET", "SSC", "UPSC", "CUET"]

export default function SendNotification() {
  const [stats, setStats] = useState(null)
  const [selectedExams, setSelectedExams] = useState([])
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState("idle") // idle, sending, success, error
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
  }, [])

  const toggleExam = (ex) => {
    if (selectedExams.includes("ALL")) {
      setSelectedExams([ex])
    } else {
      if (selectedExams.includes(ex)) {
        setSelectedExams(selectedExams.filter(e => e !== ex))
      } else {
        setSelectedExams([...selectedExams, ex])
      }
    }
  }

  const selectAll = () => setSelectedExams(["ALL"])

  let targetCount = 0
  if (stats) {
    if (selectedExams.includes("ALL")) {
      targetCount = stats.total_students || 0
    } else {
      targetCount = selectedExams.reduce((acc, ex) => acc + (stats.by_exam?.[ex] || 0), 0)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || targetCount === 0 || status === 'sending') return
    setStatus("sending")
    setErrorMsg("")
    
    try {
      let examsToSend = selectedExams.includes("ALL") ? ["ALL"] : selectedExams
      
      for (const ex of examsToSend) {
         const res = await sendNotification(ex, message)
         if (!res.success) throw new Error(res.error || `Failed sending to ${ex}`)
      }
      
      setStatus("success")
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
        setSelectedExams([])
      }, 3000)
    } catch(e) {
      console.error(e)
      setStatus("error")
      setErrorMsg(e.message)
    }
  }

  const isSelected = (ex) => selectedExams.includes(ex) || selectedExams.includes("ALL")

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-wide">Broadcast Message</h1>
        <p className="text-slate-400 mt-2">Send updates to specific target exams or all registered students.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN - EDITOR */}
        <div className="space-y-8">
          
          <div className="bg-[#0D0D14] p-6 rounded-lg border border-[#1E1E2E] shadow-xl">
            <h2 className="text-sm font-semibold mb-4 tracking-widest uppercase text-slate-400">1. Target Audience</h2>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <button 
                onClick={selectAll}
                className={`px-4 py-2 rounded-md font-bold tracking-wider text-sm transition-all border ${
                  selectedExams.includes("ALL") 
                  ? "bg-[#FF6B35]/20 border-[#FF6B35] text-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.3)]" 
                  : "bg-[#1E1E2E]/50 border-[#1E1E2E] text-slate-400 hover:border-[#333344] hover:text-white"
                }`}
              >
                ALL STUDENTS
              </button>
              
              {EXAMS.map(ex => {
                const checked = selectedExams.includes("ALL") || selectedExams.includes(ex)
                const color = EXAM_COLORS[ex]
                return (
                  <button 
                    key={ex}
                    onClick={() => toggleExam(ex)}
                    className={`px-4 py-2 rounded-md font-bold tracking-wider text-sm transition-all border`}
                    style={{
                      backgroundColor: checked ? `${color}20` : '#1E1E2E80',
                      borderColor: checked ? color : '#1E1E2E',
                      color: checked ? color : '#94a3b8',
                      boxShadow: checked ? `0 0 15px ${color}40` : 'none'
                    }}
                  >
                    {ex}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#1E1E2E]/50 border border-[#333344] rounded-md text-slate-300">
              <Info size={18} className="text-[#4ECDC4]" />
              <span className="font-mono text-sm">
                📨 <strong>{targetCount}</strong> students ko message jayega
              </span>
            </div>
          </div>

          <div className="bg-[#0D0D14] p-6 rounded-lg border border-[#1E1E2E] shadow-xl flex flex-col h-[350px]">
            <h2 className="text-sm font-semibold mb-4 tracking-widest uppercase text-slate-400 flexjustify-between">
               2. Content
            </h2>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Notification message likho... (Hindi/English dono chalega)\n\nUpdates, Mock Test alerts, etc."
              className="w-full flex-1 bg-[#1E1E2E]/30 border border-[#333344] rounded-lg p-4 text-slate-200 focus:outline-none focus:border-[#FF6B35] transition-colors resize-none font-sans"
            ></textarea>
            <div className="text-right text-xs mt-2 text-slate-500 font-mono">
              {message.length} characters
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - PREVIEW & SEND */}
        <div className="space-y-8">
          
          <div className="bg-[#0D0D14] p-6 rounded-lg border border-[#1E1E2E] shadow-xl relative overflow-hidden h-full flex flex-col">
            <h2 className="text-sm font-semibold mb-4 tracking-widest uppercase text-slate-400">Preview (Telegram)</h2>
            
            <div className="flex-1 bg-gradient-to-b from-[#0F1626] to-[#172138] rounded-xl border border-[#2a3b5c] p-4 flex flex-col shadow-inner">
               <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a3b5c]/50">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#FF6B35] to-[#FF8E53] rounded-full flex items-center justify-center text-white shadow-lg">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">E-Mitra Seva</h3>
                    <p className="text-xs text-[#8ca4d4]">bot</p>
                  </div>
               </div>

               <div className="flex flex-col gap-4 overflow-y-auto">
                 {/* Fake old message */}
                 <div className="self-end bg-[#2b5278] text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-md font-sans">
                   /start
                   <div className="text-[10px] text-[#8ca4d4] text-right mt-1">10:00 AM</div>
                 </div>

                 {/* New Message preview */}
                 {message.trim() ? (
                   <div className="self-start bg-[#182533] text-white px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm shadow-md font-sans border border-[#2a3b5c]">
                     {message.split('\n').map((line, i) => (
                       <span key={i}>{line}<br/></span>
                     ))}
                     <div className="text-[10px] text-[#8ca4d4] text-right mt-1">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                   </div>
                 ) : (
                   <div className="self-start text-[#8ca4d4]/50 text-xs italic mt-4 text-center w-full">
                     Message preview will appear here...
                   </div>
                 )}
               </div>
            </div>

            <div className="mt-6">
              {errorMsg && <div className="text-red-400 text-sm mb-3 bg-red-400/10 p-3 rounded-md">{errorMsg}</div>}
              
              <button 
                onClick={handleSend}
                disabled={!message.trim() || targetCount === 0 || status === 'sending'}
                className={`w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
                  !message.trim() || targetCount === 0 
                  ? "bg-[#1E1E2E] text-slate-500 cursor-not-allowed"
                  : status === 'success'
                  ? "bg-[#4ADE80] text-[#0A0A0F] shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                  : "bg-[#FF6B35] text-white hover:bg-[#FF8E53] hover:shadow-[0_0_20px_rgba(255,107,53,0.4)]"
                }`}
              >
                {status === 'sending' && <><Loader2 className="animate-spin" size={20} /> SENDING...</>}
                {status === 'success' && <><CheckCircle size={20} /> SENT SUCCESSFULLY!</>}
                {status === 'idle' && <><Send size={20} /> SEND TO {targetCount} STUDENTS</>}
                {status === 'error' && "RETRY SENDING"}
              </button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}
