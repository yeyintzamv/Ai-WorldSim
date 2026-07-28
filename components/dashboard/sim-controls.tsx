"use client"

import type { LucideIcon } from "lucide-react"
import { FastForward, Moon, Repeat, SlidersHorizontal, UserPlus, Users } from "lucide-react"
import type { SimulationApi } from "@/lib/use-simulation"

function Slider({
  id,
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string
  label: string
  icon: LucideIcon
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Icon className="size-3.5 text-cyan-400" aria-hidden="true" />
          {label}
        </label>
        <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-300 tabular-nums">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400 outline-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cyan-400"
      />
    </div>
  )
}

export function SimControls({ sim }: { sim: SimulationApi }) {
  const { speed, setSpeed, population, setPopulation, spawnAgent, autoCycle, setAutoCycle } = sim

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4" aria-labelledby="controls-heading">
      <h2
        id="controls-heading"
        className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400"
      >
        <SlidersHorizontal className="size-3.5 text-cyan-400" aria-hidden="true" />
        Simulation controls
      </h2>

      <div className="space-y-4">
        <Slider
          id="speed"
          label="Simulation speed"
          icon={FastForward}
          value={speed}
          min={0}
          max={4}
          step={0.1}
          display={`${speed.toFixed(1)}x`}
          onChange={setSpeed}
        />

        <Slider
          id="population"
          label="Population count"
          icon={Users}
          value={population}
          min={1}
          max={80}
          step={1}
          display={String(population)}
          onChange={setPopulation}
        />

        <button
          type="button"
          onClick={spawnAgent}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          Spawn agent
        </button>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Repeat className="size-3.5 text-amber-400" aria-hidden="true" />
            Auto day/night cycle
          </span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              checked={autoCycle}
              onChange={(e) => setAutoCycle(e.target.checked)}
              className="peer size-0 opacity-0"
            />
            <span
              aria-hidden="true"
              className="block h-4 w-8 rounded-full bg-slate-700 transition peer-checked:bg-amber-500 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-950"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0.5 top-0.5 size-3 rounded-full bg-slate-300 transition peer-checked:translate-x-4 peer-checked:bg-slate-950"
            />
          </span>
        </label>

        <p className="flex items-start gap-2 rounded-lg bg-slate-800/40 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          <Moon className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          Drag to orbit, scroll to zoom, right-drag to pan the world.
        </p>
      </div>
    </section>
  )
}
