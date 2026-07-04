import React from 'react';
import { motion } from "motion/react";
import useCountUp from "../../hooks/useCountUp";

const StatCard = ({ value, suffix, label, sublabel, icon: Icon, delay }) => {
    const { count, ref } = useCountUp(value)
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="flex items-center gap-6 group"
        >
            <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                <Icon size={20} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-black tracking-tight">{count}</span>
                    <span className="text-xl font-bold text-ink-3">{suffix}</span>
                </div>
                <div className="flex flex-col -mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink-4">{label}</span>
                    <span className="text-[9px] font-bold text-ink-3/60 italic">{sublabel}</span>
                </div>
            </div>
        </motion.div>
    )
}

export default StatCard;
