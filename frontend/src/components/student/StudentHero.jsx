import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Landmark, BookOpen, ShieldCheck, Users, FileText, FileBadge, ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

export default function StudentHero({ onGetStarted }) {
  return (
    <section className="relative w-full rounded-[32px] overflow-hidden bg-gradient-to-br from-white via-[#fafafc] to-[#f5f5f7] mb-12 border border-[#e5e5e7] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
      {/* Background abstract waves/shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[70%] rounded-full bg-gradient-to-br from-blue-50/40 to-indigo-50/20 blur-3xl" />
        <div className="absolute top-[50%] -right-[15%] w-[60%] h-[80%] rounded-full bg-gradient-to-tl from-sky-50/40 to-blue-50/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 lg:p-16 gap-12">
        {/* Left Content */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f7] text-[#0071e3] font-semibold text-[11px] uppercase tracking-wider mb-6 border border-[#e5e5e7] shadow-sm">
              <Sparkles size={11} className="animate-pulse" />
              For Students & Aspirants
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold text-[#1d1d1f] font-sans leading-[1.08] mb-6 tracking-tight">
              Gateway to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066cc] to-[#0071e3]">
                Digital Services
              </span>
            </h1>
            
            <p className="text-[15px] md:text-[16px] text-[#86868b] font-normal leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Access educational schemes, government forms, exam registrations, and essential certificates—all unified in one premium, secure platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start">
              <button 
                onClick={onGetStarted} 
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold rounded-full shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Explore Services <ArrowRight size={14} />
              </button>
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-[13px] font-semibold rounded-full border border-[#d2d2d7] transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Content - Premium Bento Showcase */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none flex justify-center items-center mt-8 lg:mt-0 relative h-[400px]">
          
          {/* Decorative subtle background circle */}
          <div className="absolute w-[340px] h-[340px] rounded-full border border-[#e5e5e7] opacity-60 pointer-events-none" />

          {/* Bento Card 1: Active Services Tracker */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -3 }}
            className="absolute top-[10%] left-[5%] z-20 w-[230px] p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-[#e5e5e7] shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Live Tracker</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/50">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#1d1d1f] truncate">Caste Certificate</p>
                  <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Approved</p>
                </div>
              </div>

              <div className="h-[1px] bg-[#f5f5f7]" />

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100/50">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#1d1d1f] truncate">Scholarship Form</p>
                  <p className="text-[9px] text-[#86868b] font-medium mt-0.5">Pending Review</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 2: Main Featured Service Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -3 }}
            className="absolute top-[28%] right-[10%] z-10 w-[240px] p-5 bg-white border border-[#e5e5e7] rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#eef2ff] flex items-center justify-center mb-4 border border-[#e0e7ff]">
              <GraduationCap size={18} className="text-[#4f46e5]" strokeWidth={2} />
            </div>
            
            <h4 className="text-[13px] font-bold text-[#1d1d1f] leading-snug tracking-tight mb-1.5">Scholarship Registration</h4>
            <p className="text-[11px] text-[#86868b] leading-normal font-normal mb-4">Redeem state education allowances in 100% digital steps.</p>
            
            <button 
              onClick={onGetStarted}
              className="w-full py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0066cc] text-[11px] font-bold rounded-full tracking-wide transition-all uppercase flex items-center justify-center gap-1"
            >
              Apply <ArrowRight size={10} />
            </button>
          </motion.div>

          {/* Bento Card 3: Live Stats Floating Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -3 }}
            className="absolute bottom-[10%] left-[8%] z-20 w-[180px] p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-[#e5e5e7] shadow-[0_8px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center shrink-0">
                <Users size={14} className="text-[#0071e3]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#1d1d1f] tracking-tight">12,400+</p>
                <p className="text-[9px] text-[#86868b] font-medium tracking-wide uppercase">Students Active</p>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
