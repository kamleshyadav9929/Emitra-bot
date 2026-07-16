import { CheckCircle2 } from "lucide-react"

export default function HelpDeskTab({
    lang,
    cbSubmitted,
    setCbSubmitted,
    cbName,
    setCbName,
    cbPhone,
    setCbPhone,
    cbQuery,
    setCbQuery,
    handleCallbackQuerySubmit
}) {
    return (
        <div className="space-y-6 md:space-y-8 animate-fadeIn text-left relative z-10">
            <div className="border-b border-white/5 pb-4">
                <h2 className="text-lg md:text-xl font-black text-white font-display">
                    {lang === 'EN' ? 'Support Desk & Callback Support' : 'सहायता डेस्क और कॉलबैक सहायता'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Submit your support query or direct request for verification.' : 'सत्यापन के लिए अपना समर्थन प्रश्न या सीधा अनुरोध सबमिट करें।'}
                </p>
            </div>

            <div className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-lg p-4 md:p-8 max-w-xl mx-auto space-y-4 md:space-y-6">
                {cbSubmitted ? (
                    <div className="text-center py-4 md:py-6 space-y-4 md:space-y-5">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-full mx-auto border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 className="text-lg font-extrabold text-white">Support Query Received!</h3>
                        <p className="text-[13px] text-slate-400 leading-relaxed font-normal">
                            Your callback request has been logged successfully. Our operator will call you back shortly.
                        </p>
                        <button
                            onClick={() => setCbSubmitted(false)}
                            className="px-4 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[12px] md:text-[13px] font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm"
                        >
                            Submit Another Query
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCallbackQuerySubmit} className="space-y-4 md:space-y-5">
                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Your Full Name *</label>
                            <input 
                                type="text"
                                value={cbName}
                                onChange={e => setCbName(e.target.value)}
                                placeholder="e.g. Rahul Sharma"
                                className="w-full p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-slate-500 text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Mobile Phone Number *</label>
                            <input 
                                type="tel"
                                value={cbPhone}
                                onChange={e => setCbPhone(e.target.value)}
                                placeholder="10-digit number"
                                className="w-full p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-slate-500 text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">What can we help you with? *</label>
                            <textarea 
                                rows={4}
                                value={cbQuery}
                                onChange={e => setCbQuery(e.target.value)}
                                placeholder="Ask about marksheet uploads, fee payments, document correction, etc."
                                className="w-full p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-slate-500 text-white"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 md:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer border-none"
                        >
                            Submit Callback Request
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
