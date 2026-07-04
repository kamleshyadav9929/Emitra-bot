import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, CheckCircle2, Clock, XCircle, ArrowRight, ClipboardList, Award, Smartphone } from "lucide-react";

const StatusPortal = ({ phone, setPhone, history, onSearch, isSearching }) => {
    
    const getStatusStyles = (status) => {
        if (status === "completed") {
            return {
                icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
                pill: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                itemBorder: "hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(16,185,129,0.03)]"
            }
        }
        if (status === "pending") {
            return {
                icon: <Clock size={18} className="text-amber-500 shrink-0" />,
                pill: "bg-amber-50 text-amber-700 border border-amber-100",
                itemBorder: "hover:border-amber-200 hover:shadow-[0_8px_20px_rgba(245,158,11,0.03)]"
            }
        }
        if (status === "processing") {
            return {
                icon: <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />,
                pill: "bg-blue-50 text-blue-700 border border-blue-100",
                itemBorder: "hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(59,130,246,0.03)]"
            }
        }
        return {
            icon: <XCircle size={18} className="text-gray-400 shrink-0" />,
            pill: "bg-gray-50 text-gray-700 border border-gray-200",
            itemBorder: "hover:border-gray-300"
        }
    }

    return (
        <div className="bg-white border border-[#e5e5e7] p-6 md:p-12 lg:p-16 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-bl-full pointer-events-none z-0"></div>
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Left Side: Headline & Form */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#0071e3] font-semibold text-[10px] uppercase tracking-wider border border-[#e5e5e7] shadow-sm">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             Live Portal Tracker
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-[1.1] font-sans">
                            Track Your <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066cc] to-[#0071e3]">
                                Active Applications
                            </span>
                        </h2>
                        <p className="text-[#86868b] text-[14px] leading-relaxed max-w-sm">
                            Enter your registered 10-digit mobile number to fetch real-time application updates and files status.
                        </p>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <div className="flex flex-col gap-3 max-w-sm">
                            <div className="relative flex items-center">
                                <Smartphone size={18} className="absolute left-4.5 text-[#86868b] pointer-events-none" />
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter Phone Number (e.g. 916377...)"
                                    className="w-full bg-[#f5f5f7] border border-[#e5e5e7] focus:border-[#0071e3] focus:bg-white p-4.5 pl-12 rounded-2xl text-base font-semibold text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all"
                                />
                            </div>
                            <button 
                                onClick={onSearch}
                                disabled={isSearching}
                                className="w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSearching ? <Loader2 className="animate-spin text-white" size={15} /> : <Search size={15} />}
                                {isSearching ? 'Fetching Database...' : 'Check Status'}
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest px-1">Verify with 10 digit Indian code</p>
                    </div>
                </div>

                {/* Right Side: Search Results / Status Container */}
                <div className="bg-[#f5f5f7] rounded-3xl p-6 md:p-8 min-h-[380px] border border-[#e5e5e7] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        {!history ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="my-auto flex flex-col items-center justify-center text-center space-y-5 py-10"
                            >
                                <div className="w-16 h-16 bg-white border border-[#e5e5e7] rounded-2xl flex items-center justify-center text-[#86868b] shadow-sm">
                                    <Search size={22} />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-[16px] font-bold text-[#1d1d1f]">No History Loaded</h3>
                                    <p className="text-[12.5px] text-[#86868b] max-w-[260px] mx-auto leading-normal">
                                        Submit your active phone number to retrieve your service filing logs.
                                    </p>
                                </div>
                            </motion.div>
                        ) : history.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="my-auto flex flex-col items-center justify-center text-center space-y-5 py-10"
                            >
                                <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                                    <XCircle size={24} />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-[16px] font-bold text-[#1d1d1f]">No Records Found</h3>
                                    <p className="text-[12.5px] text-[#86868b] max-w-[260px] mx-auto leading-normal">
                                        We couldn't locate any service applications or exam forms registered to this mobile number.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-5 flex-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">Applications Found ({history.length})</span>
                                    <div className="h-[1px] flex-1 bg-[#e5e5e7] ml-4"></div>
                                </div>
                                
                                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-hide">
                                    {history.map((item, idx) => {
                                        const styles = getStatusStyles(item.status)
                                        const isExam = item.type === "exam_form"
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`bg-white border border-[#e5e5e7] p-4.5 rounded-2xl flex items-center justify-between 
                                                           transition-all duration-300 shadow-sm ${styles.itemBorder}`}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                                        isExam ? "bg-[#f5f5f7] border-[#e5e5e7] text-[#0071e3]" : "bg-[#f5f5f7] border-[#e5e5e7] text-indigo-600"
                                                    }`}>
                                                        {isExam ? <Award size={16} /> : <ClipboardList size={16} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-[13.5px] font-bold text-[#1d1d1f] tracking-tight truncate leading-tight">
                                                            {item.service_name}
                                                        </h4>
                                                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#86868b] mt-0.5">
                                                            {item.category}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-4">
                                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.pill}`}>
                                                        {item.status}
                                                    </span>
                                                    <p className="text-[9px] font-medium text-[#86868b] mt-1">
                                                        {new Date(item.requested_at).toLocaleDateString("en-IN", { 
                                                            day: 'numeric', 
                                                            month: 'short' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="pt-6 border-t border-[#e5e5e7]/60 text-center shrink-0 mt-4">
                        <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wide flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            For official receipts or modifications, ping WhatsApp desk
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatusPortal;
