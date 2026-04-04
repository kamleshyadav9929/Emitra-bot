import React from 'react';
import { motion } from "motion/react";
import { 
    ArrowRight, 
    CreditCard, 
    Zap, 
    GraduationCap, 
    Home, 
    Car, 
    FileSignature, 
    FileText 
} from "lucide-react";

const ServiceCard = ({ id, name, description, price, category, onClick }) => {
    const icons = {
        id: CreditCard,
        bills: Zap,
        forms: GraduationCap,
        schemes: Home,
        land_auto: Car,
        cert: FileSignature,
        default: FileText
    }
    const Icon = icons[category] || icons.default

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -50px 0px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`cursor-pointer group flex flex-col h-full bg-slate-50 border-2 border-black/10 hover:border-black/40 shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 hover:bg-white transition-all duration-300 rounded-2xl p-4 md:p-6`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 flex items-center justify-center border border-black/5 rounded-full bg-slate-50 group-hover:bg-black group-hover:text-white transition-all duration-300`}>
                    <Icon size={14} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#B5B5B3] px-2 py-0.5 border border-black/5 rounded-full">{price || 'Free'}</span>
            </div>
            
            <h3 className="text-base md:text-lg font-display font-bold mb-1 leading-tight">{name}</h3>
            <p className="text-xs text-ink-2 mb-4 line-clamp-2 md:line-clamp-3">{description}</p>
            
            <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter group-hover:gap-4 transition-all">
                Service Details <ArrowRight size={12} />
            </div>
        </motion.div>
    )
}

export default ServiceCard;
