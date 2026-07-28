"use client"

import type { LucideIcon } from "lucide-react"
import { Activity, Boxes, Cpu, Gauge, Globe2, Moon, Pause, Play, RotateCcw, Sun, Timer } from "lucide-react"
import type { SimulationApi } from "@/lib/use-simulation"
import { cn } from "@/lib/utils"

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: "default" | "good" | "warn" | "bad"
}) {
  const toneClass =
    tone === "good"
      ? "text-cyan-300"
      : tone === "warn"
        ? "text-amber-300"
        : tone === "bad"
          ? "text-red-300"
          : "text-slate-100"

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-800/80">
        <Icon className={cn("size-4", toneClass)} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className={cn("truncate font-mono text-sm font-semibold tabular-nums", toneClass)}>
          {value}
          {hint ? <span className="ml-1 text-[10px] font-normal text-slate-500">{hint}</span> : null}
        </p>
      </div>
    </div>
  )
}

export function SimHeader({ sim }: { sim: SimulationApi }) {
  const { clock, fps, agentCount, health, avgEnergy, running, setRunning, night, setNight, reset } = sim

  const fpsTone = fps >= 50 ? "good" : fps >= 30 ? "warn" : "bad"
  const healthTone = health >= 75 ? "good" : health >= 45 ? "warn" : "bad"

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 ring-1 ring-cyan-500/30">
            <Globe2 className="size-5 text-cyan-300" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-slate-100">AI World Simulation</h1>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  running ? "animate-pulse bg-cyan-400" : "bg-slate-600",
                )}
                aria-hidden="true"
              />
              <p className="text-[11px] font-medium text-slate-500">
                {running ? "Simulation active" : "Simulation paused"}
              </p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          >
            {running ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
            {running ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={() => setNight(!night)}
            aria-pressed={night}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-amber-500/50 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
          >
            {night ? <Moon className="size-3.5" aria-hidden="true" /> : <Sun className="size-3.5" aria-hidden="true" />}
            {night ? "Night" : "Day"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-800/70 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5 lg:px-6">
        <Stat icon={Boxes} label="Active agents" value={String(agentCount)} tone="good" />
        <Stat icon={Timer} label="World clock" value={clock} hint="UTC+0" />
        <Stat icon={Gauge} label="Frame rate" value={`${fps}`} hint="fps" tone={fpsTone} />
        <Stat icon={Activity} label="System health" value={`${health}%`} tone={healthTone} />
        <Stat icon={Cpu} label="Mean energy" value={`${avgEnergy.toFixed(1)}%`} tone={avgEnergy > 45 ? "good" : "warn"} />
      </div>
    </header>
  )
}
