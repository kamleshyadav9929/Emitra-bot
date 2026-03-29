export const EXAM_COLORS = {
  JEE:  "#F97316",
  NEET: "#2DD4BF",
  SSC:  "#38BDF8",
  UPSC: "#A3E635",
  CUET: "#FBBF24",
  ALL:  "#6366F1"
}

export default function ExamBadge({ exam, className = "" }) {
  const color = EXAM_COLORS[exam] || "#6366F1"
  const displayLabel = exam === "ALL" ? "All Exams" : exam

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${className}`}
      style={{
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `${color}40`,
        color: color,
        backgroundColor: `${color}12`
      }}
    >
      {displayLabel}
    </span>
  )
}
