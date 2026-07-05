import { Sparkles, ExternalLink, Clock } from "lucide-react"

export default function PublicOverview({
    announcements,
    carouselIndex,
    setCarouselIndex,
    upcomingDeadlines,
    triggerSignIn
}) {
    return (
        <div className="space-y-8 animate-fadeIn animate-slideUp">
            {/* Rotating Hero Carousel */}
            {announcements.length > 0 && (
                <div className="relative h-72 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-2xl overflow-hidden shadow-ambient border-none flex items-center p-8 md:p-14 border-solid">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent z-10" />
                    <div className="relative z-20 space-y-4 max-w-xl text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/30 border-solid">
                            <Sparkles size={11} className="animate-pulse" /> Latest Notification
                        </span>
                        <h2 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight line-clamp-2 bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200 font-display">
                            {announcements[carouselIndex]?.title}
                        </h2>
                        <p className="text-[12.5px] text-white/90 line-clamp-3 leading-relaxed font-normal">
                            {announcements[carouselIndex]?.content}
                        </p>
                        {announcements[carouselIndex]?.links && (
                            <a 
                                href={announcements[carouselIndex].links} target="_blank" rel="noopener noreferrer"
                                className="text-white hover:text-slate-200 text-[12px] font-bold inline-flex items-center gap-1.5 underline transition-colors group decoration-none"
                            >
                                Read Official PDF Document <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        )}
                    </div>
                    
                    {/* Dots pagination indicator */}
                    <div className="absolute bottom-6 right-8 z-20 flex gap-2">
                        {announcements.slice(0, 4).map((_, dotIdx) => (
                            <button 
                                key={dotIdx} 
                                onClick={() => setCarouselIndex(dotIdx)} 
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer border-none ${carouselIndex === dotIdx ? "bg-white w-6" : "bg-white/30 hover:bg-white/55"}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Deadlines Horizontal Ticker */}
            {upcomingDeadlines.length > 0 && (
                <div className="bg-white border border-[var(--color-outline-variant)] shadow-ambient rounded-2xl p-4 flex items-center overflow-hidden border-solid">
                    <div className="flex items-center gap-2 shrink-0 border-r border-[var(--color-outline-variant)] border-solid pr-4 mr-4 text-[var(--color-primary)] text-[11px] font-extrabold uppercase tracking-wider">
                        <Clock size={14} className="animate-pulse" /> Deadlines Ticker
                    </div>
                    <div className="flex items-center gap-10 whitespace-nowrap animate-marquee">
                        {upcomingDeadlines.map((ex, exIdx) => (
                            <span key={exIdx} className="text-[12.5px] font-semibold text-slate-700">
                                🔥 <span className="font-extrabold text-slate-900">{ex.name}</span> closes on <span className="text-[var(--color-primary)] font-bold">{new Date(ex.end_date).toLocaleDateString("en-IN")}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Public Notifications list & Why Krishna Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* Latest Announcements */}
                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-ambient lg:col-span-2 space-y-4 border-solid">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <div>
                            <h3 className="text-[15px] font-extrabold text-slate-900 font-display">Public Notification Board</h3>
                            <p className="text-[11.5px] text-slate-400 mt-0.5">Scrollable lists of recent exam circulars.</p>
                        </div>
                        <span className="text-[10px] font-extrabold text-[var(--color-primary)] uppercase bg-[var(--color-surface-low)] px-2.5 py-1 rounded-lg border border-[var(--color-outline-variant)] border-solid">Public Reads</span>
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                        {announcements.slice(0, 6).map((ann, idx) => (
                            <div key={idx} className="border border-slate-100 hover:border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all text-left border-solid">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold mb-1">
                                    <span className="text-[var(--color-primary)] uppercase tracking-wider">Government Alert</span>
                                    <span>{new Date(ann.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
                                </div>
                                <h4 className="text-[13.5px] font-extrabold text-slate-900 leading-snug">{ann.title}</h4>
                                <p className="text-[12px] text-slate-500 font-normal leading-relaxed mt-1.5">{ann.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why Krishna Emitra trust section */}
                <div className="bg-white border border-[var(--color-outline-variant)] rounded-2xl p-6 shadow-ambient space-y-4 text-left border-solid">
                    <h3 className="text-[15px] font-extrabold text-slate-900 border-b border-slate-100 pb-3 font-display border-solid">Why Krishna Emitra?</h3>
                    <div className="space-y-5 text-[12px] leading-relaxed text-slate-500 font-normal">
                        <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 border-solid">✓</div>
                            <p><span className="font-extrabold text-slate-800 block">100% Secure Uploads:</span> All marksheets and passport documents are stored locally in the locker.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 border-solid">✓</div>
                            <p><span className="font-extrabold text-slate-800 block">Automatic Status Alerts:</span> Get real-time updates via Telegram broadcast or SMS.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 border-solid">✓</div>
                            <p><span className="font-extrabold text-slate-800 block">WhatsApp File Intake:</span> Submit correction documents with one click.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Block */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] text-white rounded-2xl p-8 md:p-12 text-center space-y-5 shadow-ambient border-none relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_35%)]" />
                <h3 className="text-lg md:text-2xl font-extrabold tracking-tight relative z-10 font-display">Select your exams and never miss a deadline!</h3>
                <p className="text-[13px] text-slate-200 max-w-lg mx-auto font-normal leading-relaxed relative z-10">
                    Subscribe to SSC, Railways, State PCS, or NEET counselling updates to receive personalized inboxes and countdown alerts.
                </p>
                <div className="pt-2 relative z-10">
                    <button 
                        onClick={triggerSignIn}
                        className="px-6 py-3 bg-white hover:bg-slate-100 text-[var(--color-primary)] text-[12.5px] font-bold uppercase rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none"
                    >
                        Sign In &amp; Get Started
                    </button>
                </div>
            </div>
        </div>
    )
}
