import { MapPin, MessageSquare, ShieldCheck } from "lucide-react"

export default function AboutUsTab({
    lang,
    config
}) {
    return (
        <div className="space-y-6 md:space-y-8 animate-fadeIn text-left">
            <div className="border-b border-[var(--color-outline-variant)] pb-4">
                <h2 className="text-lg md:text-xl font-black text-slate-900 font-display">
                    {lang === 'EN' ? 'About Krishna Emitra Digital Seva' : 'कृष्णा ई-मित्र डिजिटल सेवा के बारे में'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                    {lang === 'EN' ? 'Rajasthan students unified desk support.' : 'राजस्थान के छात्रों के लिए एकीकृत डिजिटल सहायता डेस्क।'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Center Location */}
                <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-ambient transition-all duration-300 space-y-3 md:space-y-4 text-left border-solid">
                    <h4 className="text-[13.5px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider font-display">
                        {lang === 'EN' ? 'Center Location' : 'केंद्र का स्थान'}
                    </h4>
                    <p className="text-[12.5px] text-slate-600 font-semibold leading-relaxed">
                        Ward No. 42, New Indra Colony,<br />Near Janki Tower, Sikar,<br />Rajasthan - 332001
                    </p>
                    <div className="pt-2">
                        <a 
                            href="https://www.google.com/maps/search/?api=1&query=ward+no+42+new+indra+colony+near+janki+tower+Sikar+Rajasthan+332001" target="_blank" rel="noopener noreferrer"
                            className="px-4 py-1.5 md:py-2 bg-[var(--color-surface-low)] hover:bg-slate-100 text-slate-700 border border-[var(--color-outline-variant)] hover:border-slate-350 text-[11px] font-semibold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all border-solid cursor-pointer decoration-none"
                        >
                            {lang === 'EN' ? 'Get Directions' : 'दिशा-निर्देश प्राप्त करें'} <MapPin size={12} className="text-[var(--color-primary)]" />
                        </a>
                    </div>
                </div>

                {/* Our Commitment */}
                <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-ambient transition-all duration-300 space-y-3 md:space-y-4 text-left border-solid">
                    <h4 className="text-[13.5px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider font-display">
                        {lang === 'EN' ? 'Our Commitment' : 'हमारी प्रतिबद्धता'}
                    </h4>
                    <p className="text-[12.5px] text-slate-600 font-semibold leading-relaxed">
                        {lang === 'EN'
                            ? 'We ensure 100% secure form filings, instant status updates, and digital receipt delivery directly to your dashboard and WhatsApp.'
                            : 'हम 100% सुरक्षित फॉर्म भरने, तत्काल स्थिति अपडेट और सीधे आपके डैशबोर्ड व व्हाट्सएप पर डिजिटल रसीद वितरण सुनिश्चित करते हैं।'}
                    </p>
                    <span className="text-[9.5px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase font-extrabold inline-flex items-center gap-1">
                        <ShieldCheck size={10} />
                        {lang === 'EN' ? 'Safe & Secure' : 'सुरक्षित और विश्वसनीय'}
                    </span>
                </div>

                {/* WhatsApp Desk */}
                <div className="bg-[var(--color-surface-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-ambient transition-all duration-300 space-y-3 md:space-y-4 text-left border-solid">
                    <h4 className="text-[13.5px] font-extrabold text-[var(--color-primary)] uppercase tracking-wider font-display">
                        {lang === 'EN' ? 'Direct WhatsApp Desk' : 'सीधा व्हाट्सएप डेस्क'}
                    </h4>
                    <p className="text-[12.5px] text-slate-600 font-semibold leading-relaxed">
                        {lang === 'EN'
                            ? 'Need quick manual support? Directly message our desk to verify fees or document uploads.'
                            : 'त्वरित सहायता की आवश्यकता है? शुल्क या दस्तावेज़ अपलोड को सत्यापित करने के लिए हमारे डेस्क पर संदेश भेजें।'}
                    </p>
                    <div className="pt-2">
                        <a 
                            href={`https://wa.me/${config.whatsapp_number || "916377964293"}?text=Hello%20Krishna%20Emitra!%20I%20need%20assistance.`} 
                            target="_blank" rel="noopener noreferrer"
                            className="px-4.5 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all border-none cursor-pointer decoration-none"
                        >
                            {lang === 'EN' ? 'Chat on WhatsApp' : 'व्हाट्सएप पर चैट करें'} <MessageSquare size={13} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

