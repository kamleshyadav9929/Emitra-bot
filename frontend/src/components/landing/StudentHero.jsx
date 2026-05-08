import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Landmark, BookOpen, ShieldCheck, Users, FileText, FileBadge, ArrowRight } from "lucide-react";

export default function StudentHero({ onGetStarted }) {
  const icons = [
    { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Landmark, color: "text-indigo-500", bg: "bg-indigo-50" },
    { icon: BookOpen, color: "text-sky-500", bg: "bg-sky-50" },
    { icon: ShieldCheck, color: "text-teal-500", bg: "bg-teal-50" },
    { icon: Users, color: "text-cyan-500", bg: "bg-cyan-50" },
    { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: FileBadge, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <section className="relative w-full rounded-[32px] overflow-hidden bg-gradient-to-br from-[#e8f3ff] via-[#f0f7ff] to-white mb-12 shadow-ambient border border-white/60">
      {/* Background abstract waves/shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-gradient-to-br from-blue-200/30 to-blue-100/10 blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[80%] rounded-full bg-gradient-to-tl from-blue-300/20 to-blue-100/10 blur-3xl" />
        <svg className="absolute bottom-0 left-0 w-full h-auto text-blue-100/50" viewBox="0 0 1440 320" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,165.3C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 lg:p-16 gap-12">
        {/* Left Content */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 font-bold text-[11px] uppercase tracking-widest mb-6 border border-blue-200 backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              For Students & Aspirants
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0A1A40] font-display leading-[1.1] mb-6 tracking-tight">
              Your Gateway to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Digital Services
              </span>
            </h1>
            
            <p className="text-[15px] md:text-[17px] text-gray-600 font-medium leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Access educational schemes, government forms, exam registrations, and essential certificates—all unified in one premium platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button onClick={onGetStarted} className="w-full sm:w-auto px-8 py-3.5 bg-[#164FA8] text-white text-[14px] font-black rounded-xl shadow-[0_8px_20px_rgba(22,79,168,0.25)] hover:shadow-[0_12px_25px_rgba(22,79,168,0.35)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Explore Services <ArrowRight size={16} />
              </button>
              <button className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#164FA8] text-[14px] font-black rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Content - The Illustration */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none flex justify-center items-center mt-8 lg:mt-0 relative h-[400px]">
          
          {/* Orbital path */}
          <div className="absolute w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] rounded-full border border-blue-200/50 border-dashed animate-[spin_40s_linear_infinite]" />
          
          {/* Pedestal */}
          <div className="absolute bottom-[20px] w-[200px] sm:w-[280px] h-[60px] bg-white rounded-[100%] shadow-[0_20px_40px_rgba(0,0,0,0.08)] border-b-8 border-gray-100" />
          <div className="absolute bottom-[40px] w-[180px] sm:w-[240px] h-[40px] bg-blue-50/50 rounded-[100%] blur-sm" />

          {/* Laptop Mockup */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: [0, -10, 0], opacity: 1 }}
            transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.8 } }}
            className="relative z-10 w-[220px] sm:w-[280px]"
          >
            {/* Screen */}
            <div className="w-full aspect-[16/10] bg-[#1a1a1a] rounded-t-xl sm:rounded-t-2xl p-1.5 sm:p-2.5 shadow-2xl relative border-[3px] border-gray-800">
              {/* Inner Screen */}
              <div className="w-full h-full bg-white rounded-sm sm:rounded-md overflow-hidden relative flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg sm:rounded-xl flex items-center justify-center text-white mb-2 shadow-lg">
                    <span className="font-display font-black text-xl sm:text-3xl">e</span>
                  </div>
                  <h3 className="text-blue-900 font-display font-black text-[12px] sm:text-[16px] tracking-tight">e-Mitra Digital</h3>
                  <p className="text-gray-400 text-[8px] sm:text-[10px] font-bold tracking-widest uppercase mt-0.5">Student Portal</p>
                </div>
              </div>
            </div>
            {/* Base */}
            <div className="w-[115%] -ml-[7.5%] h-3 sm:h-4 bg-gray-300 rounded-t-sm rounded-b-xl sm:rounded-b-3xl relative shadow-xl border-t border-gray-400">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-1 sm:h-1.5 bg-gray-400 rounded-b-md" />
            </div>
          </motion.div>

          {/* Orbiting Icons */}
          {icons.map((item, index) => {
            const angle = (index / icons.length) * 360;
            const radiusClass = "w-[140px] sm:w-[180px]"; // distance from center
            return (
              <div
                key={index}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${radiusClass} h-1`}
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5, type: "spring" }}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.06)] flex items-center justify-center border border-gray-100 ${item.color} group hover:scale-110 transition-transform cursor-pointer`}
                    style={{
                      transform: `rotate(-${angle}deg)`, // counter-rotate to keep icon upright
                    }}
                  >
                    <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-full transition-opacity" />
                    <item.icon size={20} strokeWidth={2.5} className="sm:w-6 sm:h-6" />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
