"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDownToLine, ScrollText, Trash2 } from "lucide-react"
import type { LogEntry } from "@/lib/simulation-types"
import type { SimulationApi } from "@/lib/use-simulation"
import { cn } from "@/lib/utils"

const LEVEL_STYLES: Record<LogEntry["level"], { dot: string; text: string; tag: string }> = {
  info: { dot: "bg-cyan-400", text: "text-slate-300", tag: "text-cyan-300" },
  success: { dot: "bg-emerald-400", text: "text-slate-200", tag: "text-emerald-300" },
  warn: { dot: "bg-amber-400", text: "text-amber-100", tag: "text-amber-300" },
  system: { dot: "bg-slate-400", text: "text-slate-400", tag: "text-slate-300" },
}

export function EventLog({ sim }: { sim: SimulationApi }) {
  const { logs, clearLogs } = sim
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!autoScroll) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, autoScroll])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }

  return (
    <section
      className="flex h-full min-h-0 flex-col rounded-xl border border-slate-800 bg-slate-900/50"
      aria-labelledby="log-heading"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <h2
          id="log-heading"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400"
        >
          <ScrollText className="size-3.5 text-cyan-400" aria-hidden="true" />
          AI event logs
          <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 tabular-nums">
            {logs.length}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          {!autoScroll && (
            <button
              type="button"
              onClick={() => {
                setAutoScroll(true)
                const el = scrollRef.current
                if (el) el.scrollTop = el.scrollHeight
              }}
              className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] font-medium text-cyan-300 transition hover:bg-cyan-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
            >
              <ArrowDownToLine className="size-3" aria-hidden="true" />
              Follow
            </button>
          )}
          <button
            type="button"
            onClick={clearLogs}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
            aria-label="Clear event log"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {logs.length === 0 ? (
          <p className="px-1 py-3 text-slate-600">No events recorded yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {logs.map((entry) => {
              const style = LEVEL_STYLES[entry.level]
              return (
                <li key={entry.id} className="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-slate-800/40">
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
                  <span className="shrink-0 text-slate-600 tabular-nums">{entry.clock}</span>
                  <span className={cn("shrink-0 font-semibold", style.tag)}>{entry.actor}</span>
                  <span className={cn("min-w-0 break-words", style.text)}>{entry.message}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
