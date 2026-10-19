import React from 'react';
import * as THREE from 'three';
import { InFlightProjectile } from '@/types/combat';

interface ProjectileTrailsAndVFXProps {
  projectiles: InFlightProjectile[];
}

export const ProjectileTrailsAndVFX: React.FC<ProjectileTrailsAndVFXProps> = ({ projectiles }) => {
  return (
    <group>
      {projectiles.map((p) => {
        const progress = Math.min(1.0, Math.max(0.0, p.elapsed_time / p.total_travel_time));

        // Coordinate conversion: Map coords (x, y) -> 3D world (x, elevation, -y)
        const curX = p.origin.x + (p.target_position.x - p.origin.x) * progress;
        const curZ = -(p.origin.y + (p.target_position.y - p.origin.y) * progress);

        // Compute altitude based on trajectory type
        let altitude = 1.0;
        if (p.trajectory_type === 'high_ballistic' || p.trajectory_type === 'ballistic') {
          // Parabolic peak up to 15 units
          altitude = 1.0 + Math.sin(progress * Math.PI) * 15.0;
        } else if (p.trajectory_type === 'sea_skimming') {
          altitude = 0.8 + Math.sin(progress * 20.0) * 0.15;
        } else if (p.trajectory_type === 'torpedo') {
          altitude = -0.3; // underwater
        } else if (p.trajectory_type === 'energy') {
          altitude = 2.0;
        }

        const isAlien = p.attacker_faction === 'THE_HARVESTERS';
        const projColor = isAlien ? '#C084FC' : '#00E5FF';

        return (
          <group key={p.id} position={[curX, altitude, curZ]}>
            {/* Projectile Core */}
            <mesh>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color={projColor} />
            </mesh>

            {/* Glowing Exhaust Flare */}
            <mesh position={[0, -0.2, 0.4]}>
              <coneGeometry args={[0.2, 0.8, 6]} />
              <meshBasicMaterial color={isAlien ? '#E879F9' : '#F59E0B'} transparent opacity={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
