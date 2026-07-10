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
        <div className="space-y-8 animate-fadeIn text-left">
            <div className="border-b border-[var(--color-outline-variant)] pb-4">
                <h2 className="text-xl font-black text-slate-900">
                    {lang === 'EN' ? 'Profile & Subscription Settings' : 'प्रोफ़ाइल एवं सदस्यता सेटिंग्स'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Configure messaging channels and maintain contact parameters.' : 'संदेश भेजने वाले चैनलों को कॉन्फ़िगर करें और संपर्क मापदंडों को बनाए रखें।'}
                </p>
            </div>

            <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-sm p-6 md:p-8 max-w-xl mx-auto space-y-6 border-solid">
                {profileSavedMessage && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[12px] font-semibold">
                        {profileSavedMessage}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Display Name</label>
                            <input 
                                type="text" 
                                value={editableProfile.name}
                                onChange={e => setEditableProfile({...editableProfile, name: e.target.value})}
                                className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm border-solid text-[var(--color-on-surface)]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={editableProfile.phone}
                                    disabled
                                    className="w-full p-3.5 bg-[var(--color-surface-low)] border border-[var(--color-outline-variant)] text-slate-400 rounded-xl text-[13px] font-semibold cursor-not-allowed outline-none border-solid"
                                />
                            </div>
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    value={editableProfile.email}
                                    onChange={e => setEditableProfile({...editableProfile, email: e.target.value})}
                                    className="w-full p-3.5 bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-[13px] font-semibold outline-none focus:border-[var(--color-primary)] transition-all shadow-sm border-solid text-[var(--color-on-surface)]"
                                />
                            </div>
                        </div>

                        {/* Telegram Link Status Block */}
                        <div className="pt-2">
                            <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Telegram Bot Link Status</label>
                            {editableProfile.telegram_id ? (
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold flex items-center justify-between">
                                    <span className="text-slate-650">Linked to Chat ID: <span className="font-mono font-extrabold text-[#0a4a83]">{editableProfile.telegram_id}</span></span>
                                    <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected
                                    </span>
                                </div>
                            ) : (
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <span className="text-slate-500 font-normal leading-relaxed">Receive alerts and check service status directly on Telegram.</span>
                                    <button
                                        type="button"
                                        onClick={onLinkTelegram}
                                        className="px-4 py-2.5 bg-[#229ED9] hover:bg-[#1c8ec4] text-white text-[11px] font-extrabold rounded-xl transition-all shadow-sm border-none cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Send size={11} /> {lang === 'EN' ? 'Link Telegram Bot' : 'टेलीग्राम बॉट लिंक करें'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-[var(--color-outline-variant)] pt-5 space-y-4">
                        <h3 className="text-[11.5px] font-extrabold text-slate-900 uppercase tracking-wider">Alert Notifications Configuration</h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receive alerts via WhatsApp</span>
                                <input 
                                    type="checkbox"
                                    checked={notificationPrefs.whatsapp}
                                    onChange={e => setNotificationPrefs({...notificationPrefs, whatsapp: e.target.checked})}
                                    className="rounded-lg text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-5.5 h-5.5 cursor-pointer border-[var(--color-outline-variant)] border border-solid"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receive alerts via Telegram Bot</span>
                                <input 
                                    type="checkbox"
                                    checked={notificationPrefs.telegram}
                                    onChange={e => setNotificationPrefs({...notificationPrefs, telegram: e.target.checked})}
                                    className="rounded-lg text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-5.5 h-5.5 cursor-pointer border-[var(--color-outline-variant)] border border-solid"
                                />
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer active:scale-98 hover:-translate-y-0.5 duration-200 border-none"
                    >
                        Save Settings
                    </button>
                </form>
            </div>
        </div>
    )
}
