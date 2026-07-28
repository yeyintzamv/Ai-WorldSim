export type TaskState = "Idle" | "Patrolling" | "Gathering" | "Building" | "Charging" | "Analyzing"

export type AgentRole = "Scout" | "Builder" | "Courier" | "Analyst" | "Guardian"

export interface Agent {
  id: string
  name: string
  role: AgentRole
  colorKey: number
  energy: number
  task: TaskState
  /** grid node index the agent currently occupies */
  node: number
  /** grid node index the agent is travelling to */
  target: number
  /** 0..1 progress between node and target */
  progress: number
  speed: number
  x: number
  z: number
}

export interface Building {
  id: string
  name: string
  kind: string
  gx: number
  gz: number
  x: number
  z: number
  width: number
  depth: number
  height: number
  colorKey: number
  load: number
  integrity: number
}

export interface LogEntry {
  id: number
  tick: number
  clock: string
  level: "info" | "warn" | "success" | "system"
  actor: string
  message: string
}

export type Selection = { kind: "agent"; id: string } | { kind: "building"; id: string } | null
