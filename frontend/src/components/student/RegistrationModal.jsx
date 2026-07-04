import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, ArrowRight } from "lucide-react";
import * as api from "../../api";

const RegistrationModal = ({ isOpen, onClose, exams, config }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', exam: 'NONE' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async () => {
        if (!formData.name.trim()) { setError('Naam likhna zaroori hai'); return }
        if (!/^[6-9]\d{9}$/.test(formData.phone)) { setError('Sahi 10-digit Indian Number daalein'); return }
        
        setLoading(true)
        setError('')
        try {
            const data = await api.publicRegister(formData)
            if (data.success) {
                setSuccess(true)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Registration failed. Phir se try karein.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="relative w-full max-w-lg bg-white border border-black/10 p-5 md:p-12 shadow-2xl rounded-2xl md:rounded-3xl"
                    >
                        <button onClick={onClose} className="absolute top-4 md:top-6 right-4 md:right-6 hover:rotate-90 transition-transform">
                            <X size={18} />
                        </button>

                        {!success ? (
                            <div className="space-y-6 md:space-y-8">
                                <div className="space-y-1 md:space-y-2">
                                    <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Abhi Register Karein</h2>
                                    <p className="text-ink-3 text-[12px] md:text-sm italic">Sahi updates sahi samay par milenge.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Aapka Naam</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter full name"
                                            className="w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors font-display text-lg"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Phone Number (+91)</label>
                                        <input 
                                            type="tel" 
                                            placeholder="9876543210"
                                            className="w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors font-display text-lg"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Exam Taiyari</label>
                                        <select 
                                            className="w-full border-b-2 border-black/10 py-3 focus:border-black outline-none bg-white transition-colors font-display text-lg appearance-none cursor-pointer"
                                            value={formData.exam}
                                            onChange={e => setFormData({...formData, exam: e.target.value})}
                                        >
                                            <option value="NONE">Koi ek chunein...</option>
                                            <option value="ALL">Sabhi Exams</option>
                                            {exams.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {error && <p className="text-danger text-xs font-bold uppercase">{error}</p>}

                                <button 
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-black text-white py-4 md:py-5 font-black uppercase tracking-widest text-[12px] md:text-[14px] hover:bg-black/90 transition-all flex items-center justify-center gap-3 active:scale-[0.98] rounded-xl"
                                >
                                    {loading ? 'Processing...' : 'Complete Registration'}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-4 md:py-8 space-y-6 md:space-y-8">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-success/10 text-success flex items-center justify-center rounded-full mx-auto">
                                    <CheckCircle2 size={32} md:size={40} />
                                </div>
                                <div className="space-y-2 md:space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-display font-bold">Setup Done!</h2>
                                    <p className="text-ink-2 text-xs md:text-sm leading-relaxed">
                                        Aapka registration ho gaya hai. Ab aap real-time updates aur priority services pa sakte hain.
                                    </p>
                                </div>
                                <div className="grid gap-2 md:gap-3">
                                    <a 
                                        href={config.telegram_bot_url || "https://t.me/Kamlesh6377_bot"} 
                                        target="_blank" 
                                        className="w-full bg-black text-white py-3.5 md:py-4 font-black uppercase tracking-widest text-[11px] md:text-xs flex items-center justify-center gap-3 rounded-xl"
                                    >
                                        Join Telegram Bot <ArrowRight size={14} />
                                    </a>
                                    <a 
                                        href={`https://wa.me/${config.whatsapp_number || '916377964293'}`} 
                                        target="_blank" 
                                        className="w-full border-2 border-black text-black py-3.5 md:py-4 font-black uppercase tracking-widest text-[11px] md:text-xs flex items-center justify-center gap-3 rounded-xl"
                                    >
                                        WhatsApp Help <ArrowRight size={14} />
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default RegistrationModal;
