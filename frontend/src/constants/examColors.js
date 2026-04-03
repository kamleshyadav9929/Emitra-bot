export const EXAM_COLORS = {
  JEE: "#F97316",
  NEET: "#2DD4BF",
  SSC: "#38BDF8",
  UPSC: "#A3E635",
  CUET: "#FBBF24",
  ALL: "#6366F1",
}

export function getExamColor(examName) {
  if (!examName) return "#A3A3A3"
  if (EXAM_COLORS[examName]) return EXAM_COLORS[examName]
  
  // Simple hash function for string
  let hash = 0
  for (let i = 0; i < examName.length; i++) {
    hash = examName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Pick hue from hash
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 70%, 50%)`
}
