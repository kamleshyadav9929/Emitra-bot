export default function StatCard({ title, value, icon: Icon, colorTheme = "teal" }) {
  const colors = {
    teal: { icon: "text-[#4ECDC4]", bg: "bg-[#4ECDC4]/10", border: 'border-[#4ECDC4]/20' },
    orange: { icon: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10", border: 'border-[#FF6B35]/20' },
    green: { icon: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10", border: 'border-[#4ADE80]/20' },
  }

  const tw = colors[colorTheme] || colors.teal

  return (
    <div className={`p-6 bg-[#0D0D14] border border-[#1E1E2E] rounded-lg flex items-center justify-between hover:border-[#333344] transition-colors relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${tw.bg} rounded-full blur-3xl opacity-20 -mr-10 -mt-10`}></div>
      <div className="relative z-10">
        <h3 className="text-slate-500 text-xs font-semibold tracking-[0.2em] uppercase mb-2">{title}</h3>
        <p className="text-4xl font-bold text-white tracking-widest">{value}</p>
      </div>
      <div className={`p-4 rounded-xl border ${tw.border} ${tw.bg} ${tw.icon} relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  )
}
