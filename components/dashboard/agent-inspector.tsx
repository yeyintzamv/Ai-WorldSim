"use client"

import type { LucideIcon } from "lucide-react"
import { Battery, Building2, Crosshair, MapPin, MousePointerClick, Radar, Tag, X } from "lucide-react"
import { AGENT_COLORS } from "@/lib/palette"
import type { SimulationApi } from "@/lib/use-simulation"
import { cn } from "@/lib/utils"

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 py-2 last:border-0">
      <span className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="truncate font-mono text-xs font-medium text-slate-200">{value}</span>
    </div>
  )
}

function EnergyBar({ value }: { value: number }) {
  const tone = value > 60 ? "bg-cyan-400" : value > 25 ? "bg-amber-400" : "bg-red-400"
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-slate-500">
          <Battery className="size-3.5" aria-hidden="true" />
          Energy
        </span>
        <span className="font-mono font-medium text-slate-200">{value.toFixed(1)}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Agent energy"
      >
        <div className={cn("h-full rounded-full transition-all duration-300", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function AgentInspector({ sim }: { sim: SimulationApi }) {
  const { inspected, selectedBuilding, selection, clearSelection } = sim

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4" aria-labelledby="inspector-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="inspector-heading" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Radar className="size-3.5 text-cyan-400" aria-hidden="true" />
          Inspector
        </h2>
        {selection && (
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
            aria-label="Clear selection"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {!selection && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center">
          <MousePointerClick className="size-6 text-slate-600" aria-hidden="true" />
          <p className="text-xs text-slate-400">Click an agent or building</p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Selected entities are highlighted in the 3D world with live telemetry here.
          </p>
        </div>
      )}

      {inspected && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
            <span
              className="size-8 shrink-0 rounded-lg ring-2 ring-slate-700"
              style={{ backgroundColor: AGENT_COLORS[inspected.colorKey % AGENT_COLORS.length] }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{inspected.name}</p>
              <p className="font-mono text-[11px] text-cyan-300">{inspected.id}</p>
            </div>
          </div>

          <EnergyBar value={inspected.energy} />

          <div>
            <Row icon={Tag} label="Role" value={inspected.role} />
            <Row icon={Crosshair} label="Task state" value={inspected.task} />
            <Row
              icon={MapPin}
              label="Coordinates"
              value={`X ${inspected.x.toFixed(2)} / Z ${inspected.z.toFixed(2)}`}
            />
            <Row icon={Radar} label="Node → target" value={`${inspected.node} → ${inspected.target}`} />
            <Row icon={Battery} label="Velocity" value={`${inspected.speed.toFixed(2)} u/s`} />
          </div>
        </div>
      )}

      {selectedBuilding && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/70 ring-2 ring-slate-600">
              <Building2 className="size-4 text-cyan-300" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{selectedBuilding.name}</p>
              <p className="font-mono text-[11px] text-cyan-300">{selectedBuilding.id}</p>
            </div>
          </div>

          <div>
            <Row icon={Tag} label="Class" value={selectedBuilding.kind} />
            <Row icon={Building2} label="Height" value={`${selectedBuilding.height.toFixed(2)} u`} />
            <Row
              icon={MapPin}
              label="Coordinates"
              value={`X ${selectedBuilding.x.toFixed(2)} / Z ${selectedBuilding.z.toFixed(2)}`}
            />
            <Row icon={Radar} label="Block" value={`${selectedBuilding.gx}, ${selectedBuilding.gz}`} />
            <Row icon={Crosshair} label="Load" value={`${selectedBuilding.load}%`} />
            <Row icon={Battery} label="Integrity" value={`${selectedBuilding.integrity}%`} />
          </div>
        </div>
      )}
    </section>
  )
}
