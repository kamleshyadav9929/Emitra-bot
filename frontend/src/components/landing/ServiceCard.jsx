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
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`bento-card cursor-pointer group flex flex-col h-full bg-slate-50 border-2 border-black/10 hover:border-black/40 shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 hover:bg-white transition-all duration-300 ${
                category === 'forms' ? 'md:col-span-2' : ''
            }`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`w-10 h-10 flex items-center justify-center border border-black/5 rounded-full bg-slate-50 group-hover:bg-black group-hover:text-white transition-all duration-300`}>
                    <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B5B5B3] px-2 py-0.5 border border-black/5 rounded-full">{price || 'Free'}</span>
            </div>
            
            <h3 className="text-xl md:text-2xl font-display font-semibold mb-2 leading-tight">{name}</h3>
            <p className="text-sm text-ink-2 mb-8 line-clamp-2 md:line-clamp-none">{description}</p>
            
            <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter group-hover:gap-4 transition-all">
                Seva Jankari <ArrowRight size={12} />
            </div>
        </motion.div>
    )
}

export default ServiceCard;
