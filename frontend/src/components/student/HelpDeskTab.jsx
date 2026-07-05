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
        <div className="space-y-8 animate-fadeIn text-left">
            <div className="border-b border-apple-divider-soft pb-4">
                <h2 className="text-xl font-black text-slate-900">
                    {lang === 'EN' ? 'Support Desk & Callback Support' : 'सहायता डेस्क और कॉलबैक सहायता'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Submit your support query or direct request for verification.' : 'सत्यापन के लिए अपना समर्थन प्रश्न या सीधा अनुरोध सबमिट करें।'}
                </p>
            </div>

            <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] shadow-sm p-6 md:p-8 max-w-xl mx-auto space-y-6 border-solid">
                {cbSubmitted ? (
                    <div className="text-center py-6 space-y-5">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/5">
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">Support Query Received!</h3>
                        <p className="text-[13px] text-slate-500 leading-relaxed font-normal">
                            Your callback request has been logged successfully. Our operator will call you back shortly.
                        </p>
                        <button
                            onClick={() => setCbSubmitted(false)}
                            className="px-5 py-2.5 bg-apple-primary hover:bg-apple-primary-focus text-white text-[13px] font-semibold rounded-full transition-all apple-active-scale cursor-pointer border-none shadow-sm"
                        >
                            Submit Another Query
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCallbackQuerySubmit} className="space-y-5">
                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Your Full Name *</label>
                            <input 
                                type="text"
                                value={cbName}
                                onChange={e => setCbName(e.target.value)}
                                placeholder="e.g. Rahul Sharma"
                                className="w-full p-3.5 bg-apple-canvas border border-apple-hairline rounded-xl text-[13px] font-semibold outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm placeholder:text-apple-ink/30 border-solid text-apple-ink"
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
                                className="w-full p-3.5 bg-apple-canvas border border-apple-hairline rounded-xl text-[13px] font-semibold outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm placeholder:text-apple-ink/30 border-solid text-apple-ink"
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
                                className="w-full p-3.5 bg-apple-canvas border border-apple-hairline rounded-xl text-[13px] font-semibold outline-none resize-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm placeholder:text-apple-ink/30 border-solid text-apple-ink"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-apple-primary hover:bg-apple-primary-focus text-white text-[12.5px] font-bold uppercase rounded-full transition-all shadow-sm cursor-pointer active:scale-98 hover:-translate-y-0.5 duration-200 border-none apple-active-scale"
                        >
                            Submit Callback Request
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
