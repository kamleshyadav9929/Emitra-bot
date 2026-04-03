import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";

const StatusPortal = ({ phone, setPhone, history, onSearch, isSearching }) => {
    return (
        <div className="bg-white border-2 border-black p-8 md:p-16 rounded-[40px] shadow-2xl shadow-black/5 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 underline"></div>
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                             Live Tracking
                        </div>
                        <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase leading-[0.9]">Track your Application</h2>
                        <p className="text-ink-2 text-lg">Apne registered mobile number se status check karein.</p>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <div className="relative group">
                            <input 
                                type="tel" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="91XXXXXXXXXX"
                                className="w-full bg-slate-50 border-2 border-black/5 p-6 rounded-2xl text-xl font-display font-bold outline-none focus:border-black focus:bg-white transition-all group-hover:border-black/20"
                            />
                            <button 
                                onClick={onSearch}
                                disabled={isSearching}
                                className="absolute right-3 top-3 bottom-3 bg-black text-white px-8 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black/90 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                                {isSearching ? 'Checking...' : 'Track'}
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest px-2">Kripya 10 ankon ka mobile number daalein</p>
                    </div>
                </div>

                <div className="bg-slate-50/50 rounded-3xl p-8 min-h-[400px] border border-black/[0.03]">
                    <AnimatePresence mode="wait">
                        {!history ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12"
                            >
                                <div className="w-20 h-20 border-2 border-dashed border-black/10 rounded-full flex items-center justify-center">
                                    <Search size={32} className="text-black/10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-bold">No History Loaded</h3>
                                    <p className="text-sm text-ink-3 max-w-[240px]">Apna number upar box mein daalkar 'Track' par click karein.</p>
                                </div>
                            </motion.div>
                        ) : history.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12"
                            >
                                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                                    <XCircle size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-bold">No Records Found</h3>
                                    <p className="text-sm text-ink-3 max-w-[240px]">Humein is number se koi application nahi mili. Kya aapne sahi number dala hai?</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-ink-4">Applications Found ({history.length})</span>
                                    <div className="h-px flex-1 bg-black/5 mx-4"></div>
                                </div>
                                <div className="space-y-4">
                                    {history.map((item, idx) => (
                                        <div key={idx} className="bg-white border border-black/5 p-6 rounded-2xl flex items-center justify-between group hover:border-black transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    item.status === 'completed' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {item.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-display font-bold text-lg">{item.service_name}</h4>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-4">{item.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                    item.status === 'completed' ? 'bg-success text-white' : 'bg-amber-500 text-white'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                <p className="text-[9px] font-bold text-ink-4 mt-2">{new Date(item.requested_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-8 text-center">
                                    <p className="text-[10px] font-bold text-ink-3 uppercase italic">Detailed inquiry ke liye WhatsApp support ka use karein.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default StatusPortal;
