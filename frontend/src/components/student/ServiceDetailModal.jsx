import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, CheckCircle2, Clock } from "lucide-react";

const ServiceDetailModal = ({ service, category, onClose, onApply, config }) => {
    if (!service) return null
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl"
                >
                    <button onClick={onClose} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 hover:bg-black/5 rounded-full transition-colors z-10">
                        <X size={18} md:size={20} />
                    </button>

                    <div className="p-5 md:p-12 space-y-4 md:space-y-8">
                        <div className="space-y-2 md:space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B5B3] block">{category}</span>
                            <h2 className="text-2xl md:text-5xl font-display font-extrabold tracking-tighter leading-tight">{service.name}</h2>
                            <div className="flex items-center gap-3 md:gap-4 py-1 md:py-2">
                                <span className="bg-black text-white px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold">{service.price || 'Free Service'}</span>
                                <span className="text-ink-4 text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={10} /> Priority Process
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-4 md:p-6 bg-slate-50 border border-black/5 rounded-2xl space-y-4 md:space-y-6">
                            <p className="text-[13px] md:text-sm text-ink-2 leading-relaxed">{service.description}</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-success mt-0.5" />
                                    <p className="text-xs font-semibold">100% Digital Processing</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-success mt-0.5" />
                                    <p className="text-xs font-semibold">Direct Updates on WhatsApp & Telegram</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:gap-4">
                            <button 
                                onClick={() => onApply(service, category)}
                                className="w-full bg-black text-white py-4 md:py-5 font-black uppercase tracking-widest text-xs md:text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4 rounded-xl md:rounded-2xl shadow-xl shadow-black/10"
                            >
                                Apply via WhatsApp <ArrowRight size={18} />
                            </button>
                            <p className="text-[9px] md:text-[10px] text-center font-bold text-ink-4 uppercase">WhatsApp pe direct chat shuru hogi</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default ServiceDetailModal;
