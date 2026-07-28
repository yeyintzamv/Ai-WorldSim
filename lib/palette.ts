/**
 * Single source of truth for 3D + UI colors.
 * Restricted palette: deep slate neutrals + cyan primary + amber accent.
 */
export const PALETTE = {
  cyan: "#22d3ee",
  amber: "#f59e0b",
  slate: "#94a3b8",
  steel: "#475569",
  ice: "#e2e8f0",
} as const

/** building face colors (neutral steel tones so the agents pop) */
export const BUILDING_COLORS = ["#334155", "#3f4c60", "#2b3849", "#46556b", "#38465a"]
export const BUILDING_TOP_COLORS = ["#475569", "#526278", "#3c4a5d", "#5a6a80", "#4a596e"]

/** agent colors — cyan/amber family only */
export const AGENT_COLORS = ["#22d3ee", "#f59e0b", "#38bdf8", "#fbbf24", "#67e8f9"]

export const DAY = {
  sky: "#93b4cc",
  fog: "#a8c2d6",
  ground: "#8fa3ae",
  grid: "#64748b",
  ambient: 0.85,
  sunColor: "#fff6e0",
  sunIntensity: 2.1,
  sunPos: [18, 26, 14] as [number, number, number],
  rimColor: "#bcd6e8",
  rimIntensity: 0.5,
  emissive: 0.06,
}

export const NIGHT = {
  sky: "#070b14",
  fog: "#0b1220",
  ground: "#131c2b",
  grid: "#22d3ee",
  ambient: 0.22,
  sunColor: "#8fb8ff",
  sunIntensity: 0.45,
  sunPos: [-16, 20, -12] as [number, number, number],
  rimColor: "#22d3ee",
  rimIntensity: 0.85,
  emissive: 0.9,
}
