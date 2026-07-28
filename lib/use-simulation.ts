"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Agent, Building, LogEntry, Selection, TaskState } from "./simulation-types"
import { formatClock, generateAgents, generateBuildings, makeAgent, makeRng, stepAgent } from "./world"

const MAX_LOGS = 120
const INITIAL_POPULATION = 18

const TASK_VERB: Record<TaskState, string> = {
  Idle: "entered standby at junction",
  Patrolling: "began patrol sweep of sector",
  Gathering: "started resource collection at",
  Building: "commenced construction near",
  Charging: "docked to power node at",
  Analyzing: "running telemetry scan at",
}

export function useSimulation() {
  /** live mutable simulation state — never triggers renders */
  const agentsRef = useRef<Agent[]>([])
  const buildings = useMemo(() => generateBuildings(20260728), [])
  const rngRef = useRef(makeRng(4242))
  const serialRef = useRef(INITIAL_POPULATION)
  const clockRef = useRef(9 * 3600) // start at 09:00
  const tickRef = useRef(0)
  const logIdRef = useRef(0)

  if (agentsRef.current.length === 0) {
    agentsRef.current = generateAgents(INITIAL_POPULATION)
  }

  /** controls */
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [population, setPopulation] = useState(INITIAL_POPULATION)
  const [night, setNight] = useState(true)
  const [autoCycle, setAutoCycle] = useState(false)

  /** selection + throttled UI mirrors */
  const [selection, setSelection] = useState<Selection>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [clock, setClock] = useState(formatClock(9 * 3600))
  const [fps, setFps] = useState(60)
  const [agentCount, setAgentCount] = useState(INITIAL_POPULATION)
  const [avgEnergy, setAvgEnergy] = useState(80)
  const [inspected, setInspected] = useState<Agent | null>(null)

  const pushLog = useCallback((level: LogEntry["level"], actor: string, message: string) => {
    logIdRef.current += 1
    const entry: LogEntry = {
      id: logIdRef.current,
      tick: tickRef.current,
      clock: formatClock(clockRef.current),
      level,
      actor,
      message,
    }
    setLogs((prev) => {
      const next = [...prev, entry]
      return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next
    })
  }, [])

  /** boot log */
  useEffect(() => {
    pushLog("system", "KERNEL", "Simulation core online — world mesh generated")
    pushLog("system", "KERNEL", `${INITIAL_POPULATION} agents instantiated on road network`)
  }, [pushLog])

  /** ------- population slider reconciliation ------- */
  useEffect(() => {
    const current = agentsRef.current
    if (population > current.length) {
      const added: Agent[] = []
      for (let i = current.length; i < population; i++) {
        serialRef.current += 1
        added.push(makeAgent(serialRef.current, rngRef.current))
      }
      agentsRef.current = [...current, ...added]
      pushLog("success", "SPAWNER", `${added.length} agent(s) joined the simulation`)
    } else if (population < current.length) {
      const removed = current.length - population
      const kept = current.slice(0, population)
      const removedIds = current.slice(population).map((a) => a.id)
      agentsRef.current = kept
      setSelection((sel) => (sel?.kind === "agent" && removedIds.includes(sel.id) ? null : sel))
      pushLog("warn", "SPAWNER", `${removed} agent(s) decommissioned`)
    }
    setAgentCount(agentsRef.current.length)
  }, [population, pushLog])

  const spawnAgent = useCallback(() => {
    serialRef.current += 1
    const agent = makeAgent(serialRef.current, rngRef.current)
    agentsRef.current = [...agentsRef.current, agent]
    setPopulation(agentsRef.current.length)
    setAgentCount(agentsRef.current.length)
    pushLog("success", agent.id, `${agent.name} (${agent.role}) spawned and linked to grid`)
  }, [pushLog])

  const reset = useCallback(() => {
    agentsRef.current = generateAgents(INITIAL_POPULATION)
    serialRef.current = INITIAL_POPULATION
    clockRef.current = 9 * 3600
    tickRef.current = 0
    setPopulation(INITIAL_POPULATION)
    setAgentCount(INITIAL_POPULATION)
    setSelection(null)
    setSpeed(1)
    pushLog("system", "KERNEL", "World state reset to checkpoint 0")
  }, [pushLog])

  /**
   * The frame step is called by the R3F render loop so 3D motion and the
   * simulation stay perfectly in sync (no duplicate timers).
   */
  const uiAccum = useRef(0)
  const logAccum = useRef(0)
  const fpsFrames = useRef(0)
  const fpsAccum = useRef(0)

  const step = useCallback(
    (rawDelta: number) => {
      const delta = Math.min(rawDelta, 0.1)

      // fps meter always runs
      fpsFrames.current += 1
      fpsAccum.current += rawDelta
      if (fpsAccum.current >= 0.5) {
        setFps(Math.round(fpsFrames.current / fpsAccum.current))
        fpsFrames.current = 0
        fpsAccum.current = 0
      }

      if (!running) return

      const dt = delta * speed
      tickRef.current += 1
      clockRef.current += dt * 90 // 1 real second ≈ 1.5 world minutes

      if (autoCycle) {
        const hour = (clockRef.current % 86400) / 3600
        const shouldBeNight = hour < 6.5 || hour >= 19
        setNight((prev) => (prev === shouldBeNight ? prev : shouldBeNight))
      }

      const agents = agentsRef.current
      const rng = rngRef.current
      let energySum = 0

      // only log a couple of events per second to keep the feed readable
      logAccum.current += delta
      const canLog = logAccum.current > 0.45

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i]
        const event = stepAgent(agent, dt, rng)
        energySum += agent.energy

        if (event && canLog) {
          logAccum.current = 0
          if (event.type === "lowEnergy") {
            pushLog("warn", agent.id, `energy critical (${agent.energy.toFixed(0)}%) — rerouting to power node`)
          } else if (event.type === "recharged") {
            pushLog("success", agent.id, `recharge complete, resuming patrol duties`)
          } else if (event.type === "task" && event.task) {
            pushLog("info", agent.id, `${TASK_VERB[event.task]} ${agent.x.toFixed(1)}, ${agent.z.toFixed(1)}`)
          } else {
            pushLog("info", agent.id, `reached junction ${agent.node} — recalculating path`)
          }
        }
      }

      // throttle React mirrors to ~6/s
      uiAccum.current += delta
      if (uiAccum.current >= 0.16) {
        uiAccum.current = 0
        setClock(formatClock(clockRef.current))
        setAvgEnergy(agents.length ? energySum / agents.length : 0)
        setAgentCount(agents.length)
      }
    },
    [running, speed, autoCycle, pushLog],
  )

  /** keep the inspector panel fed with fresh values for the selected agent */
  useEffect(() => {
    if (selection?.kind !== "agent") {
      setInspected(null)
      return
    }
    const id = selection.id
    const sync = () => {
      const found = agentsRef.current.find((a) => a.id === id)
      setInspected(found ? { ...found } : null)
    }
    sync()
    const interval = window.setInterval(sync, 180)
    return () => window.clearInterval(interval)
  }, [selection])

  const selectAgent = useCallback(
    (id: string) => {
      setSelection({ kind: "agent", id })
      const agent = agentsRef.current.find((a) => a.id === id)
      if (agent) pushLog("system", "INSPECTOR", `locked onto ${agent.name} (${agent.id})`)
    },
    [pushLog],
  )

  const selectBuilding = useCallback(
    (id: string) => {
      setSelection({ kind: "building", id })
      const b = buildings.find((x) => x.id === id)
      if (b) pushLog("system", "INSPECTOR", `structure scan: ${b.name} (${b.id})`)
    },
    [buildings, pushLog],
  )

  const clearSelection = useCallback(() => setSelection(null), [])
  const clearLogs = useCallback(() => setLogs([]), [])

  const selectedBuilding: Building | null =
    selection?.kind === "building" ? (buildings.find((b) => b.id === selection.id) ?? null) : null

  const health = Math.round(Math.max(0, Math.min(100, avgEnergy * 0.6 + (fps / 60) * 40)))

  return {
    // live refs for the 3D layer
    agentsRef,
    buildings,
    // stepping
    step,
    // header stats
    clock,
    fps,
    agentCount,
    avgEnergy,
    health,
    // controls
    running,
    setRunning,
    speed,
    setSpeed,
    population,
    setPopulation,
    night,
    setNight,
    autoCycle,
    setAutoCycle,
    spawnAgent,
    reset,
    // selection
    selection,
    selectAgent,
    selectBuilding,
    clearSelection,
    inspected,
    selectedBuilding,
    // logs
    logs,
    clearLogs,
  }
}

export type SimulationApi = ReturnType<typeof useSimulation>
