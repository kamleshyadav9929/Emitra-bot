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
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -30px 0px" }}
            transition={{ duration: 0.35, ease: "easeOut", delay: (index % 6) * 0.03 }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="cursor-pointer group relative flex flex-col h-full bg-white border border-[#e5e5e7] hover:border-[#0071e3]/45 hover:shadow-[0_12px_32px_rgba(0,0,0,0.03)] transition-all duration-300 rounded-[24px] p-6 overflow-hidden"
        >
            {/* Bold index watermark with premium blue tint */}
            <span className="absolute top-3 right-4 text-[48px] font-black text-gray-100/50 leading-none select-none pointer-events-none tabular-nums group-hover:text-[#0071e3]/5 transition-colors duration-300">
                {String(index + 1).padStart(2, "0")}
            </span>

            {/* Left accent bar (appears on hover) */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#0071e3] rounded-l-2xl scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />

            {/* Icon + price row */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f5f7] border border-gray-100 group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300">
                    <Icon size={16} className="text-[#86868b] group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
                </div>
                {price && (
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#86868b] bg-[#f5f5f7] border border-gray-100 rounded-full px-2.5 py-0.5 group-hover:border-[#0071e3]/20 group-hover:text-[#0071e3] transition-all">
                        ₹{price}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="text-[13.5px] font-bold leading-snug mb-2 text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors line-clamp-2">
                    {name}
                </h3>
                <p className="text-[12px] text-[#86868b] leading-relaxed line-clamp-2 flex-1">
                    {description}
                </p>
            </div>

            {/* CTA */}
            <div className="mt-5 relative z-10 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest text-[#86868b] group-hover:text-[#0071e3] transition-all duration-200">
                Apply Online
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </div>
        </motion.div>
    )
}

export default ServiceCard;
