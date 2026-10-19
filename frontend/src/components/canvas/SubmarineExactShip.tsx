import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const T = THREE;

interface SubmarineExactShipProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isAlien?: boolean;
}

export const SubmarineExactShip: React.FC<SubmarineExactShipProps> = ({
  scale = 0.65,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isAlien = false,
}) => {
  const propRef = useRef<THREE.Group>(null);
  const radarMastRef = useRef<THREE.Mesh>(null);

  // Animate spinning skewed propeller and periscope radar
  useFrame((_, delta) => {
    if (propRef.current) {
      propRef.current.rotation.z += delta * 6.5;
    }
    if (radarMastRef.current) {
      radarMastRef.current.rotation.y += delta * 3.0;
    }
  });

  const hullDark = isAlien ? '#1E0B36' : '#2D343C';
  const keelRed = '#5E1F19';
  const sailGray = isAlien ? '#3B0764' : '#3A424A';
  const finMat = isAlien ? '#2D114D' : '#2F363C';
  const brassProp = '#B08A3C';
  const sensorGlow = isAlien ? '#C084FC' : '#4FE0D0';

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1. HYDRODYNAMIC MAIN PRESSURE HULL */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 10.5, 24]} />
        <meshStandardMaterial color={hullDark} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Keel Antifouling Bottom */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[1.5, 0.4, 10.2]} />
        <meshStandardMaterial color={keelRed} roughness={0.6} />
      </mesh>

      {/* 2. BOW SPHERICAL SONAR ARRAY */}
      <mesh position={[0, 0.4, 5.25]}>
        <sphereGeometry args={[1.09, 24, 24]} />
        <meshStandardMaterial color="#0B131E" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bow acoustic baffle ring */}
      <mesh position={[0, 0.4, 4.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.04, 8, 32]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 3. FOUR TORPEDO TUBE OUTER SHUTTERS */}
      {[
        [-0.45, 0.7, 5.4],
        [0.45, 0.7, 5.4],
        [-0.45, 0.1, 5.4],
        [0.45, 0.1, 5.4],
      ].map((doorPos, i) => (
        <mesh key={i} position={doorPos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
          <meshStandardMaterial color="#090D14" metalness={0.9} />
        </mesh>
      ))}

      {/* 4. FREE-FLOOD CASING SLOTS */}
      {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((z, i) => (
        <group key={i} position={[0, 1.48, z]}>
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.25, 0.03, 0.5]} />
            <meshBasicMaterial color="#0B0E12" />
          </mesh>
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.25, 0.03, 0.5]} />
            <meshBasicMaterial color="#0B0E12" />
          </mesh>
        </group>
      ))}

      {/* 5. STREAMLINED CONNING TOWER SAIL & MASTS */}
      <group position={[0, 1.8, 1.4]}>
        {/* Sail Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.65, 1.7, 2.6]} />
          <meshStandardMaterial color={sailGray} metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Sail Bow Fairing */}
        <mesh position={[0, 0, 1.3]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.45, 1.7, 0.45]} />
          <meshStandardMaterial color={sailGray} metalness={0.5} />
        </mesh>

        {/* Fairwater Dive Planes */}
        <mesh position={[0, 0.2, 0.3]}>
          <boxGeometry args={[2.5, 0.08, 0.7]} />
          <meshStandardMaterial color={finMat} metalness={0.6} />
        </mesh>

        {/* Attack Periscope Mast */}
        <mesh position={[0.15, 1.3, 0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.9} />
        </mesh>

        {/* Search Periscope Optronics */}
        <mesh position={[-0.15, 1.1, -0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.9} />
        </mesh>

        {/* ESM & Radar Sensor Mast */}
        <mesh ref={radarMastRef} position={[0, 1.2, -0.6]}>
          <boxGeometry args={[0.4, 0.08, 0.16]} />
          <meshStandardMaterial color={sensorGlow} emissive={sensorGlow} emissiveIntensity={0.8} />
        </mesh>

        {/* Navigation Lights */}
        <mesh position={[0.34, 0.4, 0.5]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <mesh position={[-0.34, 0.4, 0.5]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#22C55E" />
        </mesh>
      </group>

      {/* 6. TAPERED STERN CONE */}
      <mesh position={[0, 0.4, -5.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.1, 1.8, 24]} />
        <meshStandardMaterial color={hullDark} metalness={0.65} />
      </mesh>

      {/* 7. CRUCIFORM STERN RUDDERS & PLANES */}
      <group position={[0, 0.4, -6.1]}>
        {/* Vertical Rudder (Upper & Lower) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 3.4, 1.0]} />
          <meshStandardMaterial color={finMat} metalness={0.6} />
        </mesh>
        {/* Horizontal Stern Planes (Port & Starboard) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.4, 0.08, 1.0]} />
          <meshStandardMaterial color={finMat} metalness={0.6} />
        </mesh>
      </group>

      {/* 8. PROPELLER SHAFT & SKEWED 7-BLADE BRONZE SCREW */}
      <group ref={propRef} position={[0, 0.4, -6.9]}>
        {/* Propeller Boss Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.6, 16]} />
          <meshStandardMaterial color={brassProp} metalness={0.9} roughness={0.25} />
        </mesh>
        {/* 7 Skewed Blades */}
        {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
          const angle = (idx / 7) * Math.PI * 2;
          return (
            <group key={idx} rotation={[0, 0, angle]}>
              <mesh position={[0, 0.55, 0]} rotation={[0.45, 0.15, 0]}>
                <boxGeometry args={[0.22, 0.95, 0.03]} />
                <meshStandardMaterial color={brassProp} metalness={0.9} roughness={0.25} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};
