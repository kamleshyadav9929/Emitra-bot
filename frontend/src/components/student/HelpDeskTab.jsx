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
            <div className="border-b border-[var(--color-outline-variant)] pb-4">
                <h2 className="text-xl font-black text-slate-900">
                    {lang === 'EN' ? 'Support Desk & Callback Support' : 'सहायता डेस्क और कॉलबैक सहायता'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Submit your support query or direct request for verification.' : 'सत्यापन के लिए अपना समर्थन प्रश्न या सीधा अनुरोध सबमिट करें।'}
                </p>
            </div>

            <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-sm p-6 md:p-8 max-w-xl mx-auto space-y-6 border-solid">
                {cbSubmitted ? (
                    <div className="text-center py-6 space-y-5">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-505 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/5">
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">Support Query Received!</h3>
                        <p className="text-[13px] text-slate-500 leading-relaxed font-normal">
                            Your callback request has been logged successfully. Our operator will call you back shortly.
                        </p>
                        <button
                            onClick={() => setCbSubmitted(false)}
                            className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[13px] font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm"
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
                                className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm placeholder:text-gray-400 border-solid text-[var(--color-on-surface)]"
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
                                className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm placeholder:text-gray-400 border-solid text-[var(--color-on-surface)]"
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
                                className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none resize-none focus:border-[var(--color-primary)] transition-all shadow-sm placeholder:text-gray-400 border-solid text-[var(--color-on-surface)]"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer border-none"
                        >
                            Submit Callback Request
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
