import { EXAM_COLORS } from "../constants/examColors"

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
