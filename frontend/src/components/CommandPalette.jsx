import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Send, Users, History, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CommandPalette({ isOpen, setIsOpen }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const actions = [
    { title: 'Dashboard',   path: '/',         icon: Home,    key: '1' },
    { title: 'Broadcast',   path: '/send',     icon: Send,    key: '2' },
    { title: 'Students',    path: '/students', icon: Users,   key: '3' },
    { title: 'Logs',        path: '/logs',     icon: History, key: '4' },
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-[#111119] border border-[#1D1D2D] rounded-xl shadow-2xl overflow-hidden shadow-indigo-500/10"
        >
          <div className="relative flex items-center border-b border-[#1D1D2D] px-4 py-3">
            <Search size={18} className="text-slate-500" />
            <input
              autoFocus
              type="text"
              placeholder="Search or jump to..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 px-3 placeholder:text-slate-700"
              onKeyDown={e => {
                if (e.key === 'Enter' && filtered[0]) {
                  navigate(filtered[0].path);
                  setIsOpen(false);
                }
              }}
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1D1D2D] border border-[#6366F1]/20">
              <span className="text-[10px] text-slate-600 font-mono">ESC</span>
            </div>
          </div>

          <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map((action) => (
                <button
                  key={action.path}
                  onClick={() => { navigate(action.path); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#6366F1]/10 group transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#18182A] group-hover:bg-[#6366F1]/20 flex items-center justify-center border border-[#1D1D2D]">
                      <action.icon size={16} className="text-slate-500 group-hover:text-[#818CF8]" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white">{action.title}</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-slate-700 group-hover:text-[#818CF8]">{action.key}</kbd>
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-700 text-center py-8 italic text-slate-700">No results found...</p>
            )}
          </div>

          <div className="bg-[#0C0C12] px-4 py-3 border-t border-[#1D1D2D] flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1">
                 <kbd className="px-1 py-0.5 rounded bg-[#1D1D2D] text-[9px] text-slate-600 border border-[#1D1D2D]">↑↓</kbd>
                 <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Navigate</span>
               </div>
               <div className="flex items-center gap-1">
                 <kbd className="px-1 py-0.5 rounded bg-[#1D1D2D] text-[9px] text-slate-600 border border-[#1D1D2D]">↵</kbd>
                 <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Select</span>
               </div>
            </div>
            <div className="flex items-center gap-1 text-[#6366F1]/40">
              <Command size={10} />
              <span className="text-[9px] font-bold uppercase tracking-wider">E-Mitra Pilot</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
