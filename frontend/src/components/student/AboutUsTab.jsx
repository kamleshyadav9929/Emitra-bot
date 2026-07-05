import { MapPin, MessageSquare } from "lucide-react"

export default function AboutUsTab({
    lang,
    config
}) {
    return (
        <div className="space-y-8 animate-fadeIn text-left">
            <div className="border-b border-apple-divider-soft pb-4">
                <h2 className="text-xl font-black text-slate-900">
                    {lang === 'EN' ? 'About Krishna Emitra Digital Seva' : 'कृष्णा ई-मित्र डिजिटल सेवा के बारे में'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Rajasthan students unified desk support.' : 'राजस्थान के छात्रों के लिए एकीकृत डिजिटल सहायता डेस्क।'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-6 shadow-sm hover:border-apple-ink/30 hover:shadow-md transition-all duration-300 space-y-4 text-left border-solid">
                    <h4 className="text-[13.5px] font-extrabold text-apple-primary uppercase tracking-wider font-display">Center Location</h4>
                    <p className="text-[12.5px] text-slate-655 font-semibold leading-relaxed">
                        Shop No. 12, Main Market Road,<br />Jodhpur, Rajasthan - 342001
                    </p>
                    <div className="pt-2">
                        <a 
                            href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                            className="px-4 py-2 bg-apple-canvas hover:bg-apple-canvas-parchment text-apple-ink/75 border border-apple-hairline hover:border-apple-ink/30 text-[11px] font-semibold rounded-full shadow-sm inline-flex items-center gap-1.5 transition-all apple-active-scale border-solid cursor-pointer decoration-none"
                        >
                            Get Directions <MapPin size={12} className="text-apple-primary" />
                        </a>
                    </div>
                </div>

                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-6 shadow-sm hover:border-apple-ink/30 hover:shadow-md transition-all duration-300 space-y-4 text-left border-solid">
                    <h4 className="text-[13.5px] font-extrabold text-apple-primary uppercase tracking-wider font-display">Working Hours</h4>
                    <p className="text-[12.5px] text-slate-655 font-semibold leading-relaxed">
                        Monday to Saturday: 9:00 AM - 8:00 PM<br />
                        Sunday: Closed for system maintenance
                    </p>
                    <span className="text-[9.5px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase font-extrabold inline-block">Open Now</span>
                </div>

                <div className="bg-apple-canvas border border-apple-hairline rounded-[18px] p-6 shadow-sm hover:border-apple-ink/30 hover:shadow-md transition-all duration-300 space-y-4 text-left border-solid">
                    <h4 className="text-[13.5px] font-extrabold text-apple-primary uppercase tracking-wider font-display">Direct WhatsApp Desk</h4>
                    <p className="text-[12.5px] text-slate-655 font-semibold leading-relaxed">
                        Need quick manual support? Directly message our desk to verify fees or document uploads.
                    </p>
                    <div className="pt-2">
                        <a 
                            href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%20Krishna%20Emitra!%20I%20need%20assistance.`} 
                            target="_blank" rel="noopener noreferrer"
                            className="px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-full inline-flex items-center gap-1.5 shadow-sm transition-all apple-active-scale border-none cursor-pointer decoration-none"
                        >
                            Chat on WhatsApp <MessageSquare size={13} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
