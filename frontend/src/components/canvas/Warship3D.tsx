import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShipState } from '@/types/combat';
import { SentinelExactShip } from './SentinelExactShip';
import { CarrierExactShip } from './CarrierExactShip';
import { SubmarineExactShip } from './SubmarineExactShip';
import { HarbingerExactShip } from './HarbingerExactShip';

interface Warship3DProps {
  ship: ShipState;
  isSelected?: boolean;
}

export const Warship3D: React.FC<Warship3DProps> = ({ ship, isSelected = false }) => {
  const groupRef = useRef<THREE.Group | null>(null);

  // Determine ship color scheme based on faction
  const isAlien = ship.faction === 'THE_HARVESTERS';
  const glowColor = isAlien ? '#C084FC' : '#00E5FF';

  // Damage visual parameters
  const isDamaged = ship.damage_state !== 'OPERATIONAL';
  const isCritical = ship.damage_state === 'CRITICAL' || ship.damage_state === 'DISABLED';
  const isSinking = ship.damage_state === 'SINKING';

  // Smooth position, listing, and sinking animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Target position in 3D world (x, 0, -y)
    const targetX = ship.position.x;
    const targetZ = -ship.position.y;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 3.0);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 3.0);

    // Sinking depth
    if (isSinking) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -4.5, delta * 0.5);
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.0, delta * 2.0);
    }

    // Heading rotation (0 deg = North/-Z; bow is at +Z so rotate Math.PI)
    const targetRotY = -THREE.MathUtils.degToRad(ship.heading) + Math.PI;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 3.0);

    // Roll / Listing angle due to hull damage
    let targetRoll = 0.0;
    if (isSinking) targetRoll = 0.65;
    else if (isCritical) targetRoll = 0.25;
    else if (isDamaged) targetRoll = 0.08;

    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRoll, delta * 2.0);
  });

  return (
    <group ref={groupRef} position={[ship.position.x, 0, -ship.position.y]}>
      {/* 1. SELECTION RING */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <ringGeometry args={[3.2, 3.45, 32]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 2. AUTHENTIC FINE-TUNED 3D WARSHIP ENGINES */}

      {/* AIRCRAFT CARRIER (USS MERIDIAN CVN-72 FLIGHT OPS ENGINE) */}
      {ship.ship_type === 'CARRIER' && (
        <CarrierExactShip
          scale={0.65}
          isAlien={isAlien}
          position={[0, 0.1, 0]}
        />
      )}

      {/* FAST-ATTACK SUBMARINE (SSN-21 ABYSS SUB-SURFACE ENGINE) */}
      {ship.ship_type === 'SUBMARINE' && (
        <SubmarineExactShip
          scale={0.75}
          isAlien={isAlien}
          position={[0, 0.1, 0]}
        />
      )}

      {/* ALIEN LEVIATHAN (THE HARVESTERS FLAGSHIP) */}
      {ship.ship_type === 'ALIEN_LEVIATHAN' && (
        <HarbingerExactShip
          scale={0.88}
          shieldActive={!isCritical}
          position={[0, 0.2, 0]}
        />
      )}

      {/* ALIEN CORVETTE / SKIFF / HARBINGER VANGUARD */}
      {(ship.ship_type === 'ALIEN_CORVETTE' || ship.ship_type === 'ALIEN_SCOUT' || (isAlien && ship.ship_type !== 'ALIEN_LEVIATHAN')) && (
        <HarbingerExactShip
          scale={0.55}
          shieldActive={!isDamaged}
          position={[0, 0.1, 0]}
        />
      )}

      {/* SURFACE COMBATANTS: USS SENTINEL / CRUISER / DESTROYER / FRIGATE */}
      {!isAlien && (ship.ship_type === 'CRUISER' || ship.ship_type === 'DESTROYER' || ship.ship_type === 'FRIGATE_SUPPORT' || (!['CARRIER', 'SUBMARINE'].includes(ship.ship_type))) && (
        <SentinelExactShip
          scale={ship.ship_type === 'CRUISER' ? 0.26 : ship.ship_type === 'DESTROYER' ? 0.22 : 0.18}
          position={[0, 0.05, 0]}
          timeOfDay="day"
        />
      )}

      {/* 3. COMBAT DAMAGE VISUAL EFFECTS (Fire & Smoke Plumes) */}
      {isDamaged && (
        <group position={[0, 1.2, 0]}>
          {/* Smoke Plume */}
          <mesh position={[0.2, 0.8, 0.2]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#1E293B" transparent opacity={0.7} />
          </mesh>

          {/* Fire Detonations for Critical Damage */}
          {isCritical && (
            <mesh position={[-0.2, 0.4, -0.4]}>
              <sphereGeometry args={[0.45, 8, 8]} />
              <meshBasicMaterial color="#FF3B30" />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
};
