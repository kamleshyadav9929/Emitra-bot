import React from 'react';
import { motion } from "motion/react";
import { 
    ArrowUpRight, 
    CreditCard, 
    Zap, 
    GraduationCap, 
    Home, 
    Car, 
    FileSignature, 
    FileText 
} from "lucide-react";

const icons = {
    id: CreditCard,
    bills: Zap,
    forms: GraduationCap,
    schemes: Home,
    land_auto: Car,
    cert: FileSignature,
    default: FileText
}

const ServiceCard = ({ id, name, description, price, category, index = 0, onClick }) => {
    const Icon = icons[category] || icons.default

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.35, ease: "easeOut", delay: (index % 6) * 0.04 }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="cursor-pointer group relative flex flex-col h-full bg-white border border-black/[0.08] hover:border-black/30 hover:shadow-xl hover:shadow-black/[0.08] transition-all duration-300 rounded-2xl p-5 overflow-hidden"
        >
            {/* Bold index watermark */}
            <span className="absolute top-3 right-4 text-[56px] font-black text-black/[0.04] leading-none select-none pointer-events-none tabular-nums group-hover:text-black/[0.07] transition-colors duration-300">
                {String(index + 1).padStart(2, "0")}
            </span>

            {/* Left accent bar (appears on hover) */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black rounded-l-2xl scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />

            {/* Icon + price row */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/[0.04] group-hover:bg-black transition-all duration-300">
                    <Icon size={16} className="text-black/60 group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
                </div>
                {price && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-black/30 border border-black/10 rounded-full px-2.5 py-0.5 group-hover:border-black/20 group-hover:text-black/50 transition-all">
                        ₹{price}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="text-[13px] font-black leading-snug mb-1.5 text-black/85 group-hover:text-black transition-colors line-clamp-2">
                    {name}
                </h3>
                <p className="text-[11px] text-black/40 leading-relaxed line-clamp-2 flex-1">
                    {description}
                </p>
            </div>

            {/* CTA */}
            <div className="mt-4 relative z-10 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black/30 group-hover:text-black transition-all duration-200">
                Apply Now
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </div>
        </motion.div>
    )
}

export default ServiceCard;
