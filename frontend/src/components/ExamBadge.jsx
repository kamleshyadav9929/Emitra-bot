const EXAM_STYLE = {
  JEE:  { bg: "#FEF3EC", text: "#D4450C", border: "#FBBF9A" },
  NEET: { bg: "#EBF7F5", text: "#0A7A6B", border: "#99DACF" },
  SSC:  { bg: "#EBF2FB", text: "#0A52A3", border: "#9ABDE8" },
  UPSC: { bg: "#F3F7E9", text: "#5A7A0A", border: "#BBDD7F" },
  CUET: { bg: "#FBF7E9", text: "#A37A0A", border: "#E8D07F" },
  ALL:  { bg: "#F7F7F5", text: "#0A0A0A", border: "#E5E5E3" },
}

export default function ExamBadge({ exam }) {
  const style = EXAM_STYLE[exam] || EXAM_STYLE["ALL"]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
      style={{ backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {exam || "—"}
    </span>
  )
}
