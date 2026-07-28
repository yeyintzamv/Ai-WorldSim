"use client"

import { useMemo } from "react"
import type { ThreeEvent } from "@react-three/fiber"
import { BUILDING_COLORS, BUILDING_TOP_COLORS } from "@/lib/palette"
import type { Building } from "@/lib/simulation-types"

function Structure({
  building,
  selected,
  night,
  onSelect,
}: {
  building: Building
  selected: boolean
  night: boolean
  onSelect: (id: string) => void
}) {
  const body = BUILDING_COLORS[building.colorKey % BUILDING_COLORS.length]
  const roof = BUILDING_TOP_COLORS[building.colorKey % BUILDING_TOP_COLORS.length]

  // window band rows scale with height
  const bands = useMemo(() => {
    const rows = Math.max(1, Math.floor(building.height / 1.35))
    return Array.from({ length: rows }, (_, i) => 0.75 + i * 1.35).filter((y) => y < building.height - 0.25)
  }, [building.height])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(building.id)
  }

  return (
    <group position={[building.x, 0, building.z]}>
      {/* main volume */}
      <mesh
        position={[0, building.height / 2, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto"
        }}
      >
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <meshStandardMaterial
          color={selected ? "#0f4c5c" : body}
          roughness={0.62}
          metalness={0.22}
          emissive={selected ? "#22d3ee" : "#000000"}
          emissiveIntensity={selected ? 0.55 : 0}
          flatShading
        />
      </mesh>

      {/* roof cap for the low-poly silhouette */}
      <mesh position={[0, building.height + 0.09, 0]} castShadow>
        <boxGeometry args={[building.width * 0.82, 0.18, building.depth * 0.82]} />
        <meshStandardMaterial color={selected ? "#22d3ee" : roof} roughness={0.5} metalness={0.3} flatShading />
      </mesh>

      {/* lit window bands — inset slightly so they read as windows, not collars */}
      {bands.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} raycast={() => null}>
          <boxGeometry args={[building.width * 0.94, 0.1, building.depth * 1.005]} />
          <meshStandardMaterial
            color={night ? "#0b1220" : "#6b7885"}
            emissive={night ? (i % 3 === 0 ? "#f59e0b" : "#22d3ee") : "#94a3b8"}
            emissiveIntensity={night ? 0.75 : 0.04}
            toneMapped={false}
          />
        </mesh>
      ))}
      {bands.map((y, i) => (
        <mesh key={`b-${i}`} position={[0, y, 0]} raycast={() => null}>
          <boxGeometry args={[building.width * 1.005, 0.1, building.depth * 0.94]} />
          <meshStandardMaterial
            color={night ? "#0b1220" : "#6b7885"}
            emissive={night ? (i % 3 === 0 ? "#f59e0b" : "#22d3ee") : "#94a3b8"}
            emissiveIntensity={night ? 0.75 : 0.04}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* selection ring on the ground */}
      {selected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[Math.max(building.width, building.depth) * 0.75, Math.max(building.width, building.depth) * 0.92, 24]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}

export function Buildings({
  buildings,
  selectedId,
  night,
  onSelect,
}: {
  buildings: Building[]
  selectedId: string | null
  night: boolean
  onSelect: (id: string) => void
}) {
  return (
    <group>
      {buildings.map((b) => (
        <Structure key={b.id} building={b} selected={selectedId === b.id} night={night} onSelect={onSelect} />
      ))}
    </group>
  )
}
