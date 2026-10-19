import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const T = THREE;

interface HarbingerExactShipProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  shieldActive?: boolean;
}

export const HarbingerExactShip: React.FC<HarbingerExactShipProps> = ({
  scale = 0.55,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  shieldActive = true,
}) => {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);

  // Animate glowing plasma core, rings, and shield pulse
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (coreRef.current) {
      const pulse = 1.0 + Math.sin(t * 4.0) * 0.15;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 2.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * 1.6;
    }
    if (dishRef.current) {
      dishRef.current.rotation.y += delta * 2.5;
    }
    if (shieldRef.current) {
      const s = 1.0 + Math.sin(t * 3.0) * 0.05;
      shieldRef.current.scale.set(s, s, s);
    }
  });

  const carapaceDark = '#1B1528';
  const carapaceEdge = '#3B1A5C';
  const plateMetal = '#4A3568';
  const glowOrange = '#FF7A2E';
  const ionCyan = '#5FE3FF';

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1. CENTRAL MULTI-FACETED BIOMORPHIC CARAPACE */}
      <mesh position={[0, 0.4, 0]}>
        <octahedronGeometry args={[3.2, 1]} />
        <meshStandardMaterial
          color={carapaceDark}
          emissive={carapaceEdge}
          emissiveIntensity={0.4}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* Dorsal Spine Ridge */}
      <mesh position={[0, 1.8, -0.6]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.3, 1.2, 5.2]} />
        <meshStandardMaterial color={plateMetal} metalness={0.7} />
      </mesh>

      {/* 2. GLOWING ANTIMATTER / PLASMA CORE */}
      <group position={[0, 1.6, 0.4]}>
        {/* Pulsing Core Sphere */}
        <group ref={coreRef}>
          <mesh>
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshBasicMaterial color={glowOrange} />
          </mesh>
          <pointLight color={glowOrange} intensity={2.5} distance={12} />
        </group>

        {/* Concentric Rotating Magnetic Containment Toruses */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.7, 0.12, 8, 32]} />
          <meshBasicMaterial color={ionCyan} />
        </mesh>
        <mesh ref={ring2Ref} rotation={[Math.PI / 2 + 0.45, 0, 0]}>
          <torusGeometry args={[2.2, 0.14, 6, 24]} />
          <meshStandardMaterial color={plateMetal} metalness={0.9} />
        </mesh>
      </group>

      {/* 3. DORSAL SCANNER DISH */}
      <group ref={dishRef} position={[0, 2.5, -2.4]}>
        <mesh rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.2, 0.3, 16]} />
          <meshStandardMaterial color={plateMetal} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color={glowOrange} />
        </mesh>
      </group>

      {/* 4. KINETIC LANCE MANDIBLES (FORWARD PROW) */}
      <group position={[0, 0.4, 4.2]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Center Main Lance */}
        <mesh>
          <coneGeometry args={[0.6, 4.2, 6]} />
          <meshStandardMaterial
            color="#7E22CE"
            emissive="#9333EA"
            emissiveIntensity={0.8}
            metalness={0.9}
          />
        </mesh>

        {/* Outer Flanking Prow Spikes */}
        {[-1.8, 1.8].map((xOffset, i) => (
          <mesh
            key={i}
            position={[xOffset, 0, -1.2]}
            rotation={[0, 0, i === 0 ? 0.3 : -0.3]}
          >
            <coneGeometry args={[0.35, 3.4, 5]} />
            <meshStandardMaterial color="#6B21A8" metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* 5. VERNIER PLASMA NOZZLES (STERN) */}
      {[-1.4, 1.4].map((xOffset, i) => (
        <group key={i} position={[xOffset, 0.3, -3.8]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.6, 1.4, 8]} />
            <meshStandardMaterial color={carapaceDark} metalness={0.9} />
          </mesh>
          {/* Flame Plume */}
          <mesh position={[0, 0, -1.1]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.42, 1.8, 8]} />
            <meshBasicMaterial color={glowOrange} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}

      {/* 6. BIOMORPHIC ION SHIELD HALO */}
      {shieldActive && (
        <mesh ref={shieldRef} position={[0, 0.8, 0]}>
          <sphereGeometry args={[4.8, 24, 24]} />
          <meshBasicMaterial
            color={ionCyan}
            transparent
            opacity={0.18}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};
