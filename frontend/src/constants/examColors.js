export const EXAM_COLORS = {
  JEE:  "#E8500A",  // deep burnt orange
  NEET: "#00A37A",  // deep teal-emerald
  SSC:  "#2563EB",  // electric blue
  UPSC: "#7C3AED",  // rich violet
  CUET: "#D97706",  // deep amber
  ALL:  "#0D1B2A",  // midnight (default)
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
