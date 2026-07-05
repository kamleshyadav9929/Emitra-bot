import { CheckCircle2 } from "lucide-react"

export default function NeetCounsellingTab({
    lang,
    neetFormSubmitted,
    setNeetFormSubmitted,
    neetRank,
    setNeetRank,
    neetCategory,
    setNeetCategory,
    neetPhone,
    setNeetPhone,
    handleNeetCounsellingSubmit
}) {
    return (
        <div className="space-y-8 animate-fadeIn text-left">
            <div className="border-b border-[var(--color-outline-variant)] pb-4">
                <h2 className="text-xl font-black text-slate-900">
                    {lang === 'EN' ? 'NEET UG Counselling Assistance' : 'नीट यूजी काउंसलिंग सहायता'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Enter your details to request custom choice-filling templates and professional guidance.' : 'कस्टम चॉइस-फिलिंग टेम्पलेट और पेशेवर मार्गदर्शन के लिए अपने विवरण दर्ज करें।'}
                </p>
            </div>

            <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-sm p-6 md:p-8 max-w-xl mx-auto space-y-6 border-solid">
                {neetFormSubmitted ? (
                    <div className="text-center py-6 space-y-5">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-full mx-auto border border-emerald-100 shadow-sm shadow-emerald-500/5">
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">Counselling Request Submitted!</h3>
                        <p className="text-[13px] text-slate-500 leading-relaxed font-normal">
                            Your NEET Counselling guidance request has been registered. You are being redirected to chat with Krishna Emitra on WhatsApp to receive choice templates.
                        </p>
                        <button
                            onClick={() => setNeetFormSubmitted(false)}
                            className="px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[13px] font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm"
                        >
                            Submit Another Response
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleNeetCounsellingSubmit} className="space-y-5">
                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">NEET All India Rank (AIR) *</label>
                            <input 
                                type="number"
                                value={neetRank}
                                onChange={e => setNeetRank(e.target.value)}
                                placeholder="e.g. 15430"
                                className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm placeholder:text-gray-400 border-solid text-[var(--color-on-surface)]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Counselling Category *</label>
                                <select
                                    value={neetCategory}
                                    onChange={e => setNeetCategory(e.target.value)}
                                    className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm cursor-pointer border-solid text-[var(--color-on-surface)]"
                                >
                                    <option value="GEN">General (UR)</option>
                                    <option value="OBC">OBC-NCL</option>
                                    <option value="EWS">EWS</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">WhatsApp Phone Number *</label>
                                <input 
                                    type="tel"
                                    value={neetPhone}
                                    onChange={e => setNeetPhone(e.target.value)}
                                    placeholder="10-digit number"
                                    className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm placeholder:text-gray-400 border-solid text-[var(--color-on-surface)]"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer border-none"
                        >
                            Get Counselling Guidance
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
