import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OceanSurface } from './OceanSurface';
import { Warship3D } from './Warship3D';
import { ProjectileTrailsAndVFX } from './ProjectileTrailsAndVFX';
import { TacticalCamera } from './TacticalCamera';
import { useTacticalStore } from '@/store/tacticalStore';
import { ShipState } from '@/types/combat';

export const BattleScene: React.FC = () => {
  const {
    tacticalView,
    selectedShipId,
    cameraMode,
  } = useTacticalStore();

  const friendlyFleet: ShipState[] = tacticalView?.friendly_fleet || [];
  const projectiles = tacticalView?.projectiles || [];
  const selectedShip = friendlyFleet.find((s: ShipState) => s.id === selectedShipId) || friendlyFleet[0] || null;
  const activeProjectile = projectiles[0] || null;

  return (
    <div className="w-full h-full relative bg-[#040810] overflow-hidden select-none">
      <Canvas
        camera={{ position: [25, 20, 35], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Atmospheric Naval Sky & Horizon Fog */}
        <color attach="background" args={['#8CB3D9']} />
        <fog attach="fog" args={['#9BBEDF', 70, 320]} />

        {/* Ambient Sky / Sea Reflective Hemisphere Light */}
        <hemisphereLight args={['#C5E1FA', '#1A3B5C', 1.05]} />

        {/* Primary Sun Directional Light with Specular Glints */}
        <directionalLight
          position={[55, 85, 40]}
          intensity={2.3}
          color="#FFF8E7"
        />

        {/* Tactical Horizon Blue Fill Light */}
        <directionalLight
          position={[-40, 25, -45]}
          intensity={0.65}
          color="#38BDF8"
        />

        {/* Camera Controller */}
        <TacticalCamera
          mode={cameraMode}
          selectedShip={selectedShip}
          activeProjectile={activeProjectile}
        />

        {/* Animated Ocean Surface */}
        <OceanSurface />

        {/* 3D Warships */}
        {friendlyFleet.map((ship: ShipState) => (
          <Warship3D
            key={ship.id}
            ship={ship}
            isSelected={selectedShipId === ship.id}
          />
        ))}

        {/* Projectiles & Trajectory Visual Effects */}
        <ProjectileTrailsAndVFX projectiles={projectiles} />
      </Canvas>
    </div>
  );
};
