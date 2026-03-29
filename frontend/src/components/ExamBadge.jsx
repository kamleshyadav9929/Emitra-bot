export const EXAM_COLORS = {
  JEE: "#FF6B35",
  NEET: "#4ECDC4",
  SSC: "#45B7D1",
  UPSC: "#96CEB4",
  CUET: "#FFEAA7",
  ALL: "#FF6B35"
}

export default function ExamBadge({ exam, className = "" }) {
  const color = 
    exam === "ALL" 
      ? "#FF6B35" 
      : (EXAM_COLORS[exam] || "#333344")
  
  const displayLabel = exam === "ALL" ? "Sabhi Exams" : exam

  return (
    <span
      className={`px-3 py-1 rounded border text-xs font-bold tracking-widest ${className}`}
      style={{
        borderColor: `${color}40`,
        color: color,
        backgroundColor: `${color}15`
      }}
    >
      {displayLabel}
    </span>
  )
}
