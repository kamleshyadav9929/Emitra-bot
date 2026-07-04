import React from 'react';
import { motion } from "motion/react";
import { ArrowRight, Bell, Calendar } from "lucide-react";

const ExamUpdateCard = ({ update }) => (
    <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="flex-shrink-0 w-80 bg-white border border-[#e5e5e7] rounded-[24px] p-6 flex flex-col gap-5 group hover:shadow-[0_12px_32px_rgba(0,0,0,0.03)] hover:border-[#0071e3]/45 transition-all duration-300"
    >
        <div className="flex justify-between items-start">
            <div className="p-2 rounded-xl bg-[#f5f5f7] border border-gray-100 group-hover:bg-[#0071e3] group-hover:text-white transition-colors duration-300">
                <Bell size={16} className="text-[#86868b] group-hover:text-white" />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b]">Publish Date</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f] mt-0.5">
                    <Calendar size={12} className="text-[#86868b]" />
                    {new Date(update.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
            </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="text-[17px] font-bold leading-snug text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">{update.title}</h3>
            <p className="text-[12px] text-[#86868b] line-clamp-2 leading-relaxed font-normal">{update.content || 'Naye update ke liye abhi notification on karein.'}</p>
        </div>

        <div className="mt-auto pt-5 border-t border-[#f5f5f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-600">Live Now</span>
            </div>
            <a 
                href="https://t.me/Kamlesh6377_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest active:scale-[0.97] transition-all shadow-sm"
            >
                Notify Me <ArrowRight size={12} />
            </a>
        </div>
    </motion.div>
)

export default ExamUpdateCard;
