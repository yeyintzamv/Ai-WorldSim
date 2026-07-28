"use client"

import { useRef, type RefObject } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { AGENT_COLORS } from "@/lib/palette"
import type { Agent } from "@/lib/simulation-types"

/**
 * One agent avatar: a glowing core sphere, an orbiting ring, and a ground
 * shadow disc. Position is pulled from the mutable simulation array each frame
 * so no React re-render is involved.
 */
function AgentAvatar({
  index,
  agentsRef,
  selectedId,
  onSelect,
}: {
  index: number
  agentsRef: RefObject<Agent[]>
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)
  const beacon = useRef<THREE.Mesh>(null)

  const agent = agentsRef.current?.[index]
  const color = AGENT_COLORS[(agent?.colorKey ?? 0) % AGENT_COLORS.length]

  useFrame((state) => {
    const list = agentsRef.current
    const a = list?.[index]
    if (!a || !group.current) return

    // resolve selection per-frame against live data (ids shift as agents spawn)
    const selected = selectedId != null && a.id === selectedId
    const t = state.clock.elapsedTime
    const bob = Math.sin(t * 2.6 + index) * 0.12

    group.current.position.set(a.x, 0.85 + bob, a.z)

    // face direction of travel
    const angle = Math.atan2(a.x - group.current.userData.px || 0, a.z - group.current.userData.pz || 0)
    group.current.userData.px = a.x
    group.current.userData.pz = a.z
    if (Number.isFinite(angle)) {
      group.current.rotation.y += (angle - group.current.rotation.y) * 0.08
    }

    if (ring.current) {
      ring.current.rotation.y = t * (1.4 + index * 0.05)
      ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.8 + index) * 0.35
    }

    if (core.current) {
      const mat = core.current.material as THREE.MeshStandardMaterial
      // dim when low on energy, flare when selected
      const energyFactor = 0.35 + (a.energy / 100) * 0.9
      mat.emissiveIntensity = (selected ? 2.6 : 1.5) * energyFactor
      const pulse = selected ? 1 + Math.sin(t * 6) * 0.09 : 1
      core.current.scale.setScalar(pulse)
    }

    if (halo.current) {
      halo.current.scale.setScalar(selected ? 1.25 + Math.sin(t * 5) * 0.12 : 1)
      const hm = halo.current.material as THREE.MeshBasicMaterial
      hm.opacity = selected ? 0.95 : 0.3
      hm.color.set(selected ? "#f59e0b" : color)
    }

    if (beacon.current) {
      beacon.current.visible = selected
    }

    if (ring.current) {
      const rm = (ring.current.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
      rm.emissiveIntensity = selected ? 2 : 0.9
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const a = agentsRef.current?.[index]
    if (a) onSelect(a.id)
  }

  return (
    <group ref={group}>
      {/* glow core */}
      <mesh
        ref={core}
        castShadow
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto"
        }}
      >
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          roughness={0.25}
          metalness={0.1}
          toneMapped={false}
          flatShading
        />
      </mesh>

      {/* hit target slightly larger than the visible core for easy clicking */}
      <mesh onClick={handleClick} visible={false}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* orbiting ring */}
      <group ref={ring}>
        <mesh raycast={() => null}>
          <torusGeometry args={[0.55, 0.035, 3, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
      </group>

      {/* selection halo on the ground */}
      <mesh ref={halo} position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.5, 0.72, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* vertical beacon, toggled per-frame for the selected agent */}
      <mesh ref={beacon} position={[0, 3.2, 0]} visible={false} raycast={() => null}>
        <cylinderGeometry args={[0.035, 0.035, 6, 6]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

export function Agents({
  agentsRef,
  count,
  selectedId,
  onSelect,
}: {
  agentsRef: RefObject<Agent[]>
  count: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <AgentAvatar key={i} index={i} agentsRef={agentsRef} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </group>
  )
}
