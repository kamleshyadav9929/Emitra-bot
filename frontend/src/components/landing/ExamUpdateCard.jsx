import React from 'react';
import { motion } from "motion/react";
import { ArrowRight, Bell, Calendar } from "lucide-react";

const ExamUpdateCard = ({ update }) => (
    <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        className="flex-shrink-0 w-80 bg-slate-50 border border-black/5 rounded-3xl p-6 flex flex-col gap-6 group hover:shadow-2xl hover:shadow-black/10 transition-all duration-300"
    >
        <div className="flex justify-between items-start">
            <div className={`p-2 rounded-xl bg-black/5 group-hover:bg-black group-hover:text-white transition-colors`}>
                <Bell size={18} />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-ink-4">Publish Date</span>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Calendar size={12} className="text-ink-4" />
                    {new Date(update.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
            </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="text-xl font-display font-bold leading-tight group-hover:text-black transition-colors">{update.title}</h3>
            <p className="text-xs text-ink-2 line-clamp-2 leading-relaxed">{update.content || 'Naye update ke liye abhi notification on karein.'}</p>
        </div>

        <div className="mt-auto pt-6 border-t border-black/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-success">Live Now</span>
            </div>
            <a 
                href="https://t.me/Kamlesh6377_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
            >
                Notify Me <ArrowRight size={12} />
            </a>
        </div>
    </motion.div>
)

export default ExamUpdateCard;
