import type { Agent, AgentRole, Building, TaskState } from "./simulation-types"

/** ---------------- deterministic PRNG (mulberry32) ---------------- */
export function makeRng(seed: number) {
  let a = seed >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** ---------------- world constants ---------------- */
/** number of road lines per axis */
export const GRID = 7
/** distance between road center lines */
export const CELL = 6
/** half extent of the whole terrain plate */
export const WORLD_HALF = ((GRID - 1) * CELL) / 2 + CELL / 2

/** convert a road-grid coordinate (0..GRID-1) to world space */
export function gridToWorld(i: number) {
  return i * CELL - ((GRID - 1) * CELL) / 2
}

export const nodeIndex = (gx: number, gz: number) => gz * GRID + gx
export const nodeCoords = (index: number) => ({ gx: index % GRID, gz: Math.floor(index / GRID) })

export function nodeToWorld(index: number) {
  const { gx, gz } = nodeCoords(index)
  return { x: gridToWorld(gx), z: gridToWorld(gz) }
}

/** valid orthogonal neighbours of a grid node */
export function neighbors(index: number): number[] {
  const { gx, gz } = nodeCoords(index)
  const out: number[] = []
  if (gx > 0) out.push(nodeIndex(gx - 1, gz))
  if (gx < GRID - 1) out.push(nodeIndex(gx + 1, gz))
  if (gz > 0) out.push(nodeIndex(gx, gz - 1))
  if (gz < GRID - 1) out.push(nodeIndex(gx, gz + 1))
  return out
}

/** ---------------- buildings ---------------- */
const BUILDING_KINDS = [
  "Data Tower",
  "Fabrication Bay",
  "Habitat Block",
  "Power Node",
  "Logistics Hub",
  "Research Spire",
  "Coolant Plant",
]

const DISTRICTS = ["Aurora", "Meridian", "Vertex", "Cobalt", "Helix", "Quarry", "Solace", "Nexus"]

/**
 * Buildings sit inside the blocks *between* road lines, so agents can travel
 * the roads without intersecting geometry.
 */
export function generateBuildings(seed = 20260728): Building[] {
  const rng = makeRng(seed)
  const buildings: Building[] = []
  let n = 0

  for (let gz = 0; gz < GRID - 1; gz++) {
    for (let gx = 0; gx < GRID - 1; gx++) {
      // leave a few empty plazas
      if (rng() < 0.16) continue

      const blockCenterX = gridToWorld(gx) + CELL / 2
      const blockCenterZ = gridToWorld(gz) + CELL / 2

      // 1 or 2 structures per block
      const count = rng() < 0.45 ? 2 : 1
      for (let c = 0; c < count; c++) {
        const width = 1.5 + rng() * (count === 2 ? 1.4 : 2.6)
        const depth = 1.5 + rng() * (count === 2 ? 1.4 : 2.6)

        // distance from center drives height => taller in the middle (downtown)
        const dist = Math.hypot(blockCenterX, blockCenterZ) / WORLD_HALF
        const falloff = Math.max(0.15, 1 - dist * 0.85)
        const height = 1.2 + Math.pow(rng(), 1.7) * 11 * falloff + falloff * 1.6

        const jitter = count === 2 ? 1.15 : 0.45
        const offX = (c === 0 ? -1 : 1) * (count === 2 ? jitter : 0) + (rng() - 0.5) * 0.5
        const offZ = (rng() - 0.5) * jitter

        n += 1
        const kind = BUILDING_KINDS[Math.floor(rng() * BUILDING_KINDS.length)]
        const district = DISTRICTS[Math.floor(rng() * DISTRICTS.length)]
        buildings.push({
          id: `B-${String(n).padStart(3, "0")}`,
          name: `${district} ${kind}`,
          kind,
          gx,
          gz,
          x: blockCenterX + offX,
          z: blockCenterZ + offZ,
          width,
          depth,
          height,
          colorKey: Math.floor(rng() * 5),
          load: Math.round(20 + rng() * 78),
          integrity: Math.round(72 + rng() * 28),
        })
      }
    }
  }
  return buildings
}

/** ---------------- agents ---------------- */
const ROLES: AgentRole[] = ["Scout", "Builder", "Courier", "Analyst", "Guardian"]
const TASKS: TaskState[] = ["Patrolling", "Gathering", "Building", "Analyzing", "Idle", "Charging"]

const FIRST = [
  "Orion",
  "Vega",
  "Lyra",
  "Atlas",
  "Nova",
  "Echo",
  "Juno",
  "Kite",
  "Onyx",
  "Pike",
  "Rune",
  "Sable",
  "Talos",
  "Umbra",
  "Wren",
  "Zephyr",
  "Ibis",
  "Halo",
  "Cinder",
  "Drift",
]

export function makeAgent(serial: number, rng: () => number): Agent {
  const node = Math.floor(rng() * GRID * GRID)
  const world = nodeToWorld(node)
  const nb = neighbors(node)
  const target = nb[Math.floor(rng() * nb.length)]
  return {
    id: `AG-${String(serial).padStart(4, "0")}`,
    name: `${FIRST[serial % FIRST.length]}-${(serial * 7) % 97}`,
    role: ROLES[serial % ROLES.length],
    colorKey: serial % 5,
    energy: 55 + rng() * 45,
    task: TASKS[Math.floor(rng() * TASKS.length)],
    node,
    target,
    progress: rng(),
    speed: 0.55 + rng() * 0.85,
    x: world.x,
    z: world.z,
  }
}

export function generateAgents(count: number, seed = 991): Agent[] {
  const rng = makeRng(seed)
  return Array.from({ length: count }, (_, i) => makeAgent(i + 1, rng))
}

/**
 * Advance one agent along the road network. Mutates in place for perf, then
 * returns an optional event describing something worth logging.
 */
export function stepAgent(
  agent: Agent,
  dt: number,
  rng: () => number,
): { type: "arrive" | "task" | "lowEnergy" | "recharged"; task?: TaskState } | null {
  let event: { type: "arrive" | "task" | "lowEnergy" | "recharged"; task?: TaskState } | null = null

  const charging = agent.task === "Charging"
  const moveSpeed = charging ? agent.speed * 0.18 : agent.speed

  agent.progress += dt * moveSpeed * 0.55

  if (agent.progress >= 1) {
    agent.progress = 0
    agent.node = agent.target

    const nb = neighbors(agent.node)
    // prefer to keep going straight-ish, but allow turns
    agent.target = nb[Math.floor(rng() * nb.length)]

    if (rng() < 0.35) {
      const next = TASKS[Math.floor(rng() * TASKS.length)]
      if (next !== agent.task) {
        agent.task = next
        event = { type: "task", task: next }
      }
    } else if (rng() < 0.12) {
      event = { type: "arrive" }
    }
  }

  // energy model
  if (charging) {
    const before = agent.energy
    agent.energy = Math.min(100, agent.energy + dt * 9)
    if (before < 92 && agent.energy >= 92) {
      agent.task = "Patrolling"
      event = { type: "recharged" }
    }
  } else {
    const before = agent.energy
    agent.energy = Math.max(0, agent.energy - dt * (0.9 + agent.speed * 0.7))
    if (before >= 18 && agent.energy < 18) {
      agent.task = "Charging"
      event = { type: "lowEnergy" }
    }
  }

  // interpolate world position
  const from = nodeToWorld(agent.node)
  const to = nodeToWorld(agent.target)
  const t = agent.progress
  agent.x = from.x + (to.x - from.x) * t
  agent.z = from.z + (to.z - from.z) * t

  return event
}

/** format simulated minutes-of-day into HH:MM:SS */
export function formatClock(totalSeconds: number) {
  const s = Math.floor(totalSeconds % 86400)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = (v: number) => String(v).padStart(2, "0")
  return `${p(h)}:${p(m)}:${p(sec)}`
}
