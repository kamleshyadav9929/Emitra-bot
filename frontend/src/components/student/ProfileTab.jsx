import { Send } from "lucide-react"

export default function ProfileTab({
    lang,
    profileSavedMessage,
    editableProfile,
    setEditableProfile,
    notificationPrefs,
    setNotificationPrefs,
    handleSaveProfile,
    onLinkTelegram
}) {
    return (
        <div className="space-y-6 md:space-y-8 animate-fadeIn text-left relative z-10">
            <div className="border-b border-white/5 pb-4">
                <h2 className="text-lg md:text-xl font-black text-white font-display">
                    {lang === 'EN' ? 'Profile & Subscription Settings' : 'प्रोफ़ाइल एवं सदस्यता सेटिंग्स'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Configure messaging channels and maintain contact parameters.' : 'संदेश भेजने वाले चैनलों को कॉन्फ़िगर करें और संपर्क मापदंडों को बनाए रखें।'}
                </p>
            </div>

            <div className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-lg p-4 md:p-8 max-w-xl mx-auto space-y-4 md:space-y-6">
                {profileSavedMessage && (
                    <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[12px] font-semibold">
                        {profileSavedMessage}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 md:space-y-6">
                    <div className="space-y-3 md:space-y-4">
                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-450 tracking-wider block mb-1">Display Name</label>
                            <input 
                                type="text" 
                                value={editableProfile.name}
                                onChange={e => setEditableProfile({...editableProfile, name: e.target.value})}
                                className="w-full p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm text-white"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-450 tracking-wider block mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={editableProfile.phone}
                                    disabled
                                    className="w-full p-2.5 md:p-3.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl text-[12px] md:text-[13px] font-semibold cursor-not-allowed outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-450 tracking-wider block mb-1">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    value={editableProfile.email}
                                    onChange={e => setEditableProfile({...editableProfile, email: e.target.value})}
                                    className="w-full p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-450 tracking-wider block mb-1">Social Category</label>
                                <select 
                                    value={editableProfile.category || "General"}
                                    onChange={e => setEditableProfile({...editableProfile, category: e.target.value})}
                                    className="w-full p-2.5 md:p-3.5 bg-zinc-900 border border-white/10 rounded-xl text-[12px] md:text-[13px] font-semibold outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm text-white cursor-pointer"
                                >
                                    {["General", "OBC", "SC", "ST", "EWS"].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Telegram Link Status Block */}
                        <div className="pt-2">
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-450 tracking-wider block mb-1">Telegram Bot Link Status</label>
                            {editableProfile.telegram_id ? (
                                <div className="p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[11px] md:text-[12.5px] font-semibold flex items-center justify-between">
                                    <span className="text-slate-300">Linked to Chat ID: <span className="font-mono font-extrabold text-blue-400">{editableProfile.telegram_id}</span></span>
                                    <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Connected
                                    </span>
                                </div>
                            ) : (
                                <div className="p-2.5 md:p-3.5 bg-white/5 border border-white/10 rounded-xl text-[11px] md:text-[12.5px] font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <span className="text-slate-400 font-normal leading-relaxed">Receive alerts and check service status directly on Telegram.</span>
                                    <button
                                        type="button"
                                        onClick={onLinkTelegram}
                                        className="px-4 py-2 md:py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold rounded-xl transition-all shadow-sm border-none cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Send size={11} /> {lang === 'EN' ? 'Link Telegram Bot' : 'टेलीग्राम बॉट लिंक करें'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 md:pt-5 space-y-3 md:space-y-4">
                        <h3 className="text-[11.5px] font-extrabold text-white uppercase tracking-wider">Alert Notifications Configuration</h3>
                        <div className="space-y-3 md:space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[13px] font-semibold text-slate-300 group-hover:text-white transition-colors">Receive alerts via WhatsApp</span>
                                <input 
                                    type="checkbox"
                                    checked={notificationPrefs.whatsapp}
                                    onChange={e => setNotificationPrefs({...notificationPrefs, whatsapp: e.target.checked})}
                                    className="rounded border border-white/15 bg-white/5 text-blue-600 focus:ring-blue-500 w-5.5 h-5.5 cursor-pointer"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[13px] font-semibold text-slate-300 group-hover:text-white transition-colors">Receive alerts via Telegram Bot</span>
                                <input 
                                    type="checkbox"
                                    checked={notificationPrefs.telegram}
                                    onChange={e => setNotificationPrefs({...notificationPrefs, telegram: e.target.checked})}
                                    className="rounded border border-white/15 bg-white/5 text-blue-600 focus:ring-blue-500 w-5.5 h-5.5 cursor-pointer"
                                />
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-2.5 md:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer active:scale-98 border-none"
                    >
                        Save Settings
                    </button>
                </form>
            </div>
        </div>
    )
}
