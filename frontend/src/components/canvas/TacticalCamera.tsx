import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraMode, ShipState, InFlightProjectile } from '@/types/combat';

interface TacticalCameraProps {
  mode: CameraMode;
  selectedShip: ShipState | null;
  activeProjectile: InFlightProjectile | null;
}

export const TacticalCamera: React.FC<TacticalCameraProps> = ({
  mode,
  selectedShip,
  activeProjectile,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (mode === 'TACTICAL_TOPDOWN') {
      // High-angle tactical CIC view
      const targetX = selectedShip ? selectedShip.position.x : 0;
      const targetZ = selectedShip ? -selectedShip.position.y : 0;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3.0);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 80.0, delta * 3.0);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ + 0.1, delta * 3.0);

      if (controlsRef.current) {
        controlsRef.current.target.set(targetX, 0, targetZ);
        controlsRef.current.update();
      }
    } else if (mode === 'ACTION_CHASE' && activeProjectile) {
      // Chase active missile in flight
      const progress = Math.min(1.0, activeProjectile.elapsed_time / activeProjectile.total_travel_time);
      const projX = activeProjectile.origin.x + (activeProjectile.target_position.x - activeProjectile.origin.x) * progress;
      const projZ = -(activeProjectile.origin.y + (activeProjectile.target_position.y - activeProjectile.origin.y) * progress);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, projX - 6.0, delta * 5.0);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5.0, delta * 5.0);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, projZ + 8.0, delta * 5.0);

      if (controlsRef.current) {
        controlsRef.current.target.set(projX, 1.0, projZ);
        controlsRef.current.update();
      }
    } else if (mode === 'BRIDGE_FIRST_PERSON' && selectedShip) {
      // First-person bridge conning tower & flight deck view
      const targetX = selectedShip.position.x;
      const targetZ = -selectedShip.position.y;
      const rotY = -THREE.MathUtils.degToRad(selectedShip.heading) + Math.PI;

      const bridgeHeight = selectedShip.ship_type === 'CARRIER' ? 2.8 : selectedShip.ship_type === 'SUBMARINE' ? 1.8 : 2.2;
      const fwdX = Math.sin(rotY);
      const fwdZ = Math.cos(rotY);

      // Bridge viewpoint
      const eyeX = targetX + fwdX * 0.4;
      const eyeZ = targetZ + fwdZ * 0.4;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, eyeX, delta * 8.0);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, bridgeHeight, delta * 8.0);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, eyeZ, delta * 8.0);

      const lookTargetX = eyeX + fwdX * 60.0;
      const lookTargetZ = eyeZ + fwdZ * 60.0;

      if (controlsRef.current) {
        controlsRef.current.target.set(lookTargetX, bridgeHeight - 0.1, lookTargetZ);
        controlsRef.current.update();
      }
    } else if (mode === 'TACTICAL_ORBIT') {
      // Smooth orbit around selected warship
      const targetX = selectedShip ? selectedShip.position.x : 0;
      const targetZ = selectedShip ? -selectedShip.position.y : 0;

      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(targetX, 0, targetZ), delta * 3.0);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      maxPolarAngle={mode === 'TACTICAL_TOPDOWN' ? 0.05 : Math.PI / 2 - 0.05}
      minDistance={10}
      maxDistance={140}
      enablePan={true}
      enableZoom={true}
    />
  );
};
