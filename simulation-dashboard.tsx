"use client"

import dynamic from "next/dynamic"
import { Loader2, Maximize2, Move3d } from "lucide-react"
import { useSimulation } from "@/lib/use-simulation"
import { AgentInspector } from "./agent-inspector"
import { EventLog } from "./event-log"
import { SimControls } from "./sim-controls"
import { SimHeader } from "./sim-header"

/** WebGL canvas is browser-only — skip SSR entirely. */
const WorldScene = dynamic(() => import("@/components/world/scene").then((m) => m.WorldScene), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-cyan-400" aria-hidden="true" />
        <p className="text-xs font-medium text-slate-500">Compiling world mesh…</p>
      </div>
    </div>
  ),
})

export function SimulationDashboard() {
  const sim = useSimulation()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-200">
      <SimHeader sim={sim} />

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row lg:p-4">
        {/* 3D viewport + logs */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <WorldScene sim={sim} />

            {/* viewport chrome */}
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-950/70 px-2.5 py-1.5 backdrop-blur">
              <Move3d className="size-3.5 text-cyan-400" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                World viewport
              </span>
            </div>

            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-950/70 px-2.5 py-1.5 backdrop-blur">
              <Maximize2 className="size-3 text-slate-500" aria-hidden="true" />
              <span className="font-mono text-[10px] text-slate-500">orbit · zoom · pan</span>
            </div>
          </div>

          <div className="h-44 shrink-0 lg:h-52">
            <EventLog sim={sim} />
          </div>
        </div>

        {/* sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto lg:w-80 xl:w-[22rem]">
          <AgentInspector sim={sim} />
          <SimControls sim={sim} />
        </aside>
      </main>
    </div>
  )
}
