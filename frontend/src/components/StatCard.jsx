export default function StatCard({ title, value, icon: Icon, colorTheme = "teal", subtitle }) {
  const colors = {
    teal:   { accent: "#4ECDC4", light: "rgba(78,205,196,0.1)",  border: "rgba(78,205,196,0.15)" },
    orange: { accent: "#FF6B35", light: "rgba(255,107,53,0.1)",  border: "rgba(255,107,53,0.15)" },
    green:  { accent: "#4ADE80", light: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.15)" },
  }

  const c = colors[colorTheme] || colors.teal

  return (
    <div className="bg-[#0F0F17] border border-[#1A1A28] rounded-xl p-6 hover:border-[#2a2a3a] transition-colors group relative overflow-hidden">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-3">{title}</p>
          <p className="text-4xl font-extrabold text-white tracking-tight leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-600 mt-2">{subtitle}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.light, border: `1px solid ${c.border}` }}
        >
          {Icon && <Icon size={20} style={{ color: c.accent }} />}
        </div>
      </div>
    </div>
  )
}
