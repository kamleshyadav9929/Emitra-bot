export default function StatCard({ title, value, icon: Icon, colorTheme = "indigo", subtitle }) {
  const colors = {
    indigo: { accent: "#6366F1", light: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.18)" },
    cyan:   { accent: "#22D3EE", light: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.18)" },
    green:  { accent: "#4ADE80", light: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.18)" },
    orange: { accent: "#F97316", light: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.18)" },
    teal:   { accent: "#2DD4BF", light: "rgba(45,212,191,0.1)",  border: "rgba(45,212,191,0.18)" },
  }

  const c = colors[colorTheme] || colors.indigo

  return (
    <div className="bg-[#111119] border border-[#1D1D2D] rounded-xl p-5 hover:border-[#2a2a3f] transition-colors group relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${c.accent}80, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em] mb-3">{title}</p>
          <p className="text-4xl font-extrabold text-white leading-none tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-700 mt-2">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.light, border: `1px solid ${c.border}` }}
        >
          {Icon && <Icon size={18} style={{ color: c.accent }} />}
        </div>
      </div>
    </div>
  )
}
