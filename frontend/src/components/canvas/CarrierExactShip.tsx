import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const T = THREE;

interface CarrierExactShipProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isAlien?: boolean;
}

export const CarrierExactShip: React.FC<CarrierExactShipProps> = ({
  scale = 0.55,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isAlien = false,
}) => {
  const radarRef = useRef<THREE.Mesh>(null);
  const heliRotorRef = useRef<THREE.Group>(null);
  const heliTailRef = useRef<THREE.Group>(null);

  // Animate rotating radar and helicopter rotors
  useFrame((_, delta) => {
    if (radarRef.current) {
      radarRef.current.rotation.y += delta * 2.2;
    }
    if (heliRotorRef.current) {
      heliRotorRef.current.rotation.y += delta * 12.0;
    }
    if (heliTailRef.current) {
      heliTailRef.current.rotation.x += delta * 16.0;
    }
  });

  const redKeel = '#6E2723';
  const bootStripe = '#181E24';
  const hazeGray = isAlien ? '#2D114D' : '#6A7885';
  const deckPlate = isAlien ? '#1E0B36' : '#2A323A';
  const metalSteel = '#CBD5E1';
  const bridgeCyan = '#38BDF8';
  const jetGray = '#94A3B8';
  const yellowLine = '#F59E0B';

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1. LOWER KEEL & ANTIFOULING RED BOTTOM */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[4.2, 0.9, 17.5]} />
        <meshStandardMaterial color={redKeel} roughness={0.7} />
      </mesh>

      {/* 2. WATERLINE BOOT-TOPPING BAND */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[4.35, 0.22, 17.8]} />
        <meshStandardMaterial color={bootStripe} roughness={0.5} />
      </mesh>

      {/* 3. MAIN FREEBOARD HULL */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[4.7, 1.3, 17.6]} />
        <meshStandardMaterial color={hazeGray} metalness={0.35} roughness={0.65} />
      </mesh>

      {/* Bow Flare Rake */}
      <mesh position={[0, 0.7, 9.4]} rotation={[0.42, 0, 0]}>
        <coneGeometry args={[2.3, 2.2, 4]} />
        <meshStandardMaterial color={hazeGray} metalness={0.35} roughness={0.65} />
      </mesh>

      {/* 4. OVERHANGING ANGLED FLIGHT DECK */}
      <mesh position={[-0.3, 1.35, 0.1]}>
        <boxGeometry args={[6.8, 0.2, 18.2]} />
        <meshStandardMaterial color={deckPlate} roughness={0.92} metalness={0.1} />
      </mesh>

      {/* Angled landing runway strip */}
      <mesh position={[-1.2, 1.46, -1.2]} rotation={[-Math.PI / 2, 0, 0.16]}>
        <planeGeometry args={[0.22, 12.0]} />
        <meshBasicMaterial color={yellowLine} />
      </mesh>

      {/* Catapult tracks */}
      <mesh position={[-0.8, 1.46, 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 7.5]} />
        <meshBasicMaterial color="#E2E8F0" />
      </mesh>
      <mesh position={[0.6, 1.46, 4.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 7.0]} />
        <meshBasicMaterial color="#E2E8F0" />
      </mesh>

      {/* Arresting cables across landing deck */}
      {[-3.5, -4.2, -4.9, -5.6].map((zPos, i) => (
        <mesh key={i} position={[-1.4, 1.47, zPos]} rotation={[0, 0.16, 0]}>
          <boxGeometry args={[3.2, 0.03, 0.04]} />
          <meshStandardMaterial color="#64748B" metalness={0.9} />
        </mesh>
      ))}

      {/* 5. STARBOARD ISLAND SUPERSTRUCTURE */}
      <group position={[2.5, 2.2, -1.0]}>
        {/* Lower tier */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 1.6, 2.8]} />
          <meshStandardMaterial color={hazeGray} metalness={0.4} />
        </mesh>

        {/* Bridge Navigation Windows */}
        <mesh position={[0, 0.45, 0.9]}>
          <boxGeometry args={[0.78, 0.22, 0.9]} />
          <meshStandardMaterial color={bridgeCyan} emissive={bridgeCyan} emissiveIntensity={0.65} />
        </mesh>

        {/* SPY Phased Array Panels */}
        <mesh position={[0.46, 0.1, 0.2]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.3, 8]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>

        {/* Primary Radar Mast */}
        <mesh position={[0, 1.3, 0.3]}>
          <cylinderGeometry args={[0.06, 0.15, 1.2, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        {/* Spinning 3D Air Surveillance Radar */}
        <mesh ref={radarRef} position={[0, 1.9, 0.3]}>
          <boxGeometry args={[1.2, 0.2, 0.12]} />
          <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.9} />
        </mesh>

        {/* Satellite Radomes */}
        <mesh position={[0, 1.1, -0.7]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>
      </group>

      {/* 6. PARKED FLIGHT WING (F/A-18 JETS ON DECK) */}
      {[
        { pos: [1.8, 1.5, 4.5] as [number, number, number], rot: 0.3 },
        { pos: [1.7, 1.5, 2.2] as [number, number, number], rot: 0.1 },
        { pos: [-2.2, 1.5, 5.2] as [number, number, number], rot: -0.4 },
        { pos: [-2.4, 1.5, 3.0] as [number, number, number], rot: -0.2 },
      ].map((jet, i) => (
        <group key={i} position={jet.pos} rotation={[0, jet.rot, 0]} scale={[0.38, 0.38, 0.38]}>
          {/* Fuselage */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.4, 0.25, 2.2]} />
            <meshStandardMaterial color={jetGray} metalness={0.5} />
          </mesh>
          {/* Nose radome */}
          <mesh position={[0, 0.18, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.2, 0.6, 8]} />
            <meshStandardMaterial color="#1E293B" />
          </mesh>
          {/* Cockpit Canopy */}
          <mesh position={[0, 0.36, 0.4]}>
            <boxGeometry args={[0.25, 0.18, 0.7]} />
            <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Swept Wings */}
          <mesh position={[0, 0.18, -0.2]}>
            <boxGeometry args={[2.1, 0.04, 0.9]} />
            <meshStandardMaterial color={jetGray} metalness={0.5} />
          </mesh>
          {/* Twin Vertical Stabilizers */}
          {[-0.2, 0.2].map((x, finIdx) => (
            <mesh key={finIdx} position={[x, 0.45, -0.7]} rotation={[0, 0, finIdx === 0 ? 0.2 : -0.2]}>
              <boxGeometry args={[0.04, 0.45, 0.4]} />
              <meshStandardMaterial color={jetGray} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 7. MH-60 HELICOPTER FLIGHT OPS */}
      <group position={[1.8, 1.5, -4.5]} scale={[0.4, 0.4, 0.4]}>
        {/* Fuselage */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.6, 0.55, 1.8]} />
          <meshStandardMaterial color="#475569" metalness={0.4} />
        </mesh>
        {/* Tail boom */}
        <mesh position={[0, 0.45, -1.4]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.18, 0.18, 1.4]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Main Rotor */}
        <group ref={heliRotorRef} position={[0, 0.7, -0.1]}>
          <cylinderGeometry args={[0.05, 0.05, 0.15, 8]} />
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[2.8, 0.02, 0.12]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[2.8, 0.02, 0.12]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
        </group>
        {/* Tail Rotor */}
        <group ref={heliTailRef} position={[0.12, 0.6, -2.1]}>
          <boxGeometry args={[0.02, 0.6, 0.08]} />
          <meshStandardMaterial color="#E2E8F0" />
        </group>
      </group>

      {/* 8. DEFENSIVE SPONSONS (PHALANX CIWS & SEARAM) */}
      {[
        [-3.6, 0.9, -6.5] as [number, number, number],
        [3.6, 0.9, -6.5] as [number, number, number],
        [3.3, 0.9, 7.2] as [number, number, number],
        [-3.4, 0.9, 7.2] as [number, number, number],
      ].map((sponsonPos, i) => (
        <group key={i} position={sponsonPos}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.25, 0.7]} />
            <meshStandardMaterial color={hazeGray} />
          </mesh>
          {/* White Radome Dome */}
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
          </mesh>
          {/* Gun Barrels */}
          <mesh position={[0, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
            <meshStandardMaterial color={metalSteel} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
