"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, Stars } from "@react-three/drei"
import * as THREE from "three"
import { DAY, NIGHT } from "@/lib/palette"
import { WORLD_HALF } from "@/lib/world"
import type { SimulationApi } from "@/lib/use-simulation"
import { Terrain } from "./terrain"
import { Buildings } from "./buildings"
import { Agents } from "./agents"

/** Drives the simulation from the render loop so motion is frame-synced. */
function SimulationDriver({ step }: { step: (dt: number) => void }) {
  useFrame((_, delta) => step(delta))
  return null
}

/** Smoothly interpolates scene lighting/fog between day and night presets. */
function Atmosphere({ night }: { night: boolean }) {
  const { scene } = useThree()
  const ambient = useRef<THREE.AmbientLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)

  const target = useRef({ t: night ? 1 : 0 })
  const bgColor = useRef(new THREE.Color(night ? NIGHT.sky : DAY.sky))
  const fogColor = useRef(new THREE.Color(night ? NIGHT.fog : DAY.fog))

  useFrame((_, delta) => {
    // ease the transition value toward the requested mode
    const want = night ? 1 : 0
    target.current.t += (want - target.current.t) * Math.min(1, delta * 2.4)
    const t = target.current.t

    bgColor.current.set(DAY.sky).lerp(new THREE.Color(NIGHT.sky), t)
    fogColor.current.set(DAY.fog).lerp(new THREE.Color(NIGHT.fog), t)

    scene.background = bgColor.current
    if (!scene.fog) scene.fog = new THREE.Fog(fogColor.current.getHex(), 40, 130)
    const fog = scene.fog as THREE.Fog
    fog.color.copy(fogColor.current)
    fog.near = 38 - t * 6
    fog.far = 135 - t * 35

    if (ambient.current) ambient.current.intensity = DAY.ambient + (NIGHT.ambient - DAY.ambient) * t
    if (sun.current) {
      sun.current.intensity = DAY.sunIntensity + (NIGHT.sunIntensity - DAY.sunIntensity) * t
      sun.current.color.set(DAY.sunColor).lerp(new THREE.Color(NIGHT.sunColor), t)
      sun.current.position.set(
        DAY.sunPos[0] + (NIGHT.sunPos[0] - DAY.sunPos[0]) * t,
        DAY.sunPos[1] + (NIGHT.sunPos[1] - DAY.sunPos[1]) * t,
        DAY.sunPos[2] + (NIGHT.sunPos[2] - DAY.sunPos[2]) * t,
      )
    }
    if (rim.current) {
      rim.current.intensity = DAY.rimIntensity + (NIGHT.rimIntensity - DAY.rimIntensity) * t
      rim.current.color.set(DAY.rimColor).lerp(new THREE.Color(NIGHT.rimColor), t)
    }
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={night ? NIGHT.ambient : DAY.ambient} />
      <directionalLight
        ref={sun}
        position={night ? NIGHT.sunPos : DAY.sunPos}
        intensity={night ? NIGHT.sunIntensity : DAY.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-WORLD_HALF - 8}
        shadow-camera-right={WORLD_HALF + 8}
        shadow-camera-top={WORLD_HALF + 8}
        shadow-camera-bottom={-WORLD_HALF - 8}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
      />
      <directionalLight ref={rim} position={[-14, 9, -18]} intensity={night ? NIGHT.rimIntensity : DAY.rimIntensity} />
    </>
  )
}

export function WorldScene({ sim }: { sim: SimulationApi }) {
  const { agentsRef, buildings, night, selection, selectAgent, selectBuilding, clearSelection, step, agentCount } = sim

  const selectedAgentId = selection?.kind === "agent" ? selection.id : null
  const selectedBuildingId = selection?.kind === "building" ? selection.id : null

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [26, 22, 30], fov: 46, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => clearSelection()}
    >
      <SimulationDriver step={step} />
      <Atmosphere night={night} />

      <Suspense fallback={null}>
        {night && <Stars radius={140} depth={50} count={2200} factor={4} saturation={0} fade speed={0.6} />}

        <Terrain night={night} />
        <Buildings
          buildings={buildings}
          selectedId={selectedBuildingId}
          night={night}
          onSelect={selectBuilding}
        />
        <Agents agentsRef={agentsRef} count={agentCount} selectedId={selectedAgentId} onSelect={selectAgent} />

        <ContactShadows
          position={[0, 0.04, 0]}
          opacity={night ? 0.5 : 0.35}
          scale={WORLD_HALF * 2.4}
          blur={2.4}
          far={12}
          resolution={512}
          color="#000000"
        />

        <Environment preset={night ? "night" : "city"} environmentIntensity={night ? 0.35 : 0.6} />
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.7}
        minDistance={8}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1.5, 0]}
      />
    </Canvas>
  )
}
