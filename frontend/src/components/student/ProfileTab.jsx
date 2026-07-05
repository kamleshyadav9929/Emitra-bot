export default function ProfileTab({
    lang,
    profileSavedMessage,
    editableProfile,
    setEditableProfile,
    notificationPrefs,
    setNotificationPrefs,
    handleSaveProfile
}) {
    return (
        <div className="space-y-8 animate-fadeIn text-left">
            <div className="border-b border-apple-divider-soft pb-4">
                <h2 className="text-xl font-black text-slate-900">
                    {lang === 'EN' ? 'Profile & Subscription Settings' : 'प्रोफ़ाइल एवं सदस्यता सेटिंग्स'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Configure messaging channels and maintain contact parameters.' : 'संदेश भेजने वाले चैनलों को कॉन्फ़िगर करें और संपर्क मापदंडों को बनाए रखें।'}
                </p>
            </div>

            <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] shadow-sm p-6 md:p-8 max-w-xl mx-auto space-y-6 border-solid">
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
                                className="w-full p-3.5 bg-apple-canvas border border-apple-hairline rounded-xl text-[13px] font-semibold outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm border-solid text-apple-ink"
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
                                    className="w-full p-3.5 bg-apple-canvas-parchment border border-apple-hairline text-slate-400 rounded-xl text-[13px] font-semibold cursor-not-allowed outline-none border-solid"
                                />
                            </div>
                            <div>
                                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    value={editableProfile.email}
                                    onChange={e => setEditableProfile({...editableProfile, email: e.target.value})}
                                    className="w-full p-3.5 bg-apple-canvas border border-apple-hairline rounded-xl text-[13px] font-semibold outline-none focus:border-apple-primary-focus focus:ring-2 focus:ring-apple-primary-focus/10 transition-all shadow-sm border-solid text-apple-ink"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-apple-divider-soft pt-5 space-y-4">
                        <h3 className="text-[11.5px] font-extrabold text-slate-900 uppercase tracking-wider">Alert Notifications Configuration</h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receive alerts via WhatsApp</span>
                                <input 
                                    type="checkbox"
                                    checked={notificationPrefs.whatsapp}
                                    onChange={e => setNotificationPrefs({...notificationPrefs, whatsapp: e.target.checked})}
                                    className="rounded-lg text-apple-primary focus:ring-apple-primary w-5.5 h-5.5 cursor-pointer border-apple-hairline border border-solid"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receive alerts via Telegram Bot</span>
                                <input 
                                    type="checkbox"
                                    checked={notificationPrefs.telegram}
                                    onChange={e => setNotificationPrefs({...notificationPrefs, telegram: e.target.checked})}
                                    className="rounded-lg text-apple-primary focus:ring-apple-primary w-5.5 h-5.5 cursor-pointer border-apple-hairline border border-solid"
                                />
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3.5 bg-apple-primary hover:bg-apple-primary-focus text-white text-[12.5px] font-bold uppercase rounded-full transition-all shadow-sm cursor-pointer active:scale-98 hover:-translate-y-0.5 duration-200 border-none apple-active-scale"
                    >
                        Save Settings
                    </button>
                </form>
            </div>
        </div>
    )
}
