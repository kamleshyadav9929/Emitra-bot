import { useEffect, useState } from "react"
import { History, CheckCircle2 } from "lucide-react"
import { getLogs } from "../api"
import ExamBadge from "../components/ExamBadge"

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLogs().then(res => {
      setLogs(res.logs || [])
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-[#1E1E2E] rounded-xl outline outline-1 outline-[#333344]">
           <History className="text-[#4ECDC4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Message History</h1>
          <p className="text-slate-400 mt-2">View an audit log of all dispatched broadcasts.</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4ECDC4]"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#0D0D14] p-12 rounded-xl border border-[#1E1E2E] text-center shadow-lg">
           <History className="mx-auto text-slate-600 mb-4" size={48} />
           <p className="text-slate-400">No message logs found. Start broadcasting!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="bg-[#0D0D14] p-6 rounded-xl border border-[#1E1E2E] flex flex-col md:flex-row gap-6 items-start hover:border-[#333344] transition-colors shadow-lg group">
               
               <div className="flex-1 space-y-3 w-full">
                 <div className="flex items-center gap-3">
                   <ExamBadge exam={log.target_exam} />
                   <span className="text-slate-500 text-xs font-mono tracking-widest">
                     {new Date(log.sent_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                   </span>
                 </div>
                 
                 <div className="bg-[#1E1E2E]/30 p-4 rounded-lg text-slate-300 font-sans border border-[#2a3b5c]/30 text-sm whitespace-pre-wrap leading-relaxed shadow-inner relative">
                   {log.message_text}
                   <div className="absolute left-0 top-0 w-1 h-full bg-[#333344] rounded-l-lg group-hover:bg-[#4ECDC4] transition-colors"></div>
                 </div>
               </div>

               <div className="flex items-center gap-2 px-4 py-2 bg-[#4ADE80]/10 text-[#4ADE80] rounded-full border border-[#4ADE80]/30 font-bold tracking-widest text-xs self-start shrink-0 mt-2 md:mt-0 shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                 <CheckCircle2 size={16} />
                 {log.total_recipients} DELIVERED
               </div>
               
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
