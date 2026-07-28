"use client"

import { useMemo } from "react"
import { DAY, NIGHT } from "@/lib/palette"
import { CELL, GRID, WORLD_HALF, gridToWorld } from "@/lib/world"

/** Ground plate + emissive road strips laid out on the agent navigation grid. */
export function Terrain({ night }: { night: boolean }) {
  const theme = night ? NIGHT : DAY

  const roads = useMemo(() => {
    const list: { key: string; pos: [number, number, number]; scale: [number, number, number] }[] = []
    const span = WORLD_HALF * 2
    for (let i = 0; i < GRID; i++) {
      const p = gridToWorld(i)
      list.push({ key: `x-${i}`, pos: [p, 0.015, 0], scale: [1.7, 1, span] })
      list.push({ key: `z-${i}`, pos: [0, 0.015, p], scale: [span, 1, 1.7] })
    }
    return list
  }, [])

  return (
    <group>
      {/* ground plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_HALF * 2 + CELL, WORLD_HALF * 2 + CELL]} />
        <meshStandardMaterial color={theme.ground} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* subtle plate border rim (four thin edge strips) */}
      {(
        [
          [0, WORLD_HALF + CELL * 0.42, WORLD_HALF * 2 + CELL, 0.18],
          [0, -(WORLD_HALF + CELL * 0.42), WORLD_HALF * 2 + CELL, 0.18],
          [WORLD_HALF + CELL * 0.42, 0, 0.18, WORLD_HALF * 2 + CELL],
          [-(WORLD_HALF + CELL * 0.42), 0, 0.18, WORLD_HALF * 2 + CELL],
        ] as const
      ).map(([x, z, w, d], i) => (
        <mesh key={`rim-${i}`} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color={theme.grid} transparent opacity={night ? 0.6 : 0.32} />
        </mesh>
      ))}

      {/* roads */}
      {roads.map((r) => (
        <mesh key={r.key} position={r.pos} scale={r.scale} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={night ? "#0e1b2b" : "#7b8b96"}
            emissive={theme.grid}
            emissiveIntensity={night ? 0.5 : 0.08}
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* junction pads */}
      {Array.from({ length: GRID * GRID }).map((_, i) => {
        const gx = i % GRID
        const gz = Math.floor(i / GRID)
        return (
          <mesh
            key={`j-${i}`}
            position={[gridToWorld(gx), 0.025, gridToWorld(gz)]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.5, 6]} />
            <meshStandardMaterial
              color={night ? "#123243" : "#8b9aa4"}
              emissive={theme.grid}
              emissiveIntensity={night ? 0.9 : 0.12}
            />
          </mesh>
        )
      })}
    </group>
  )
}
