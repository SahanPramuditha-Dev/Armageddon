import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SovremennyModelProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const SovremennyModel: React.FC<SovremennyModelProps> = ({
  scale = 3.3,
  position = [0, 0.45, 0],
  rotation = [0, 0, 0],
}) => {
  // Load the self-contained GLB from public directory
  const { scene } = useGLTF('/models/sovremenny.glb');

  // Clone scene so multiple instances don't conflict and customize materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
          mesh.material = mat;
          mat.roughness = 0.42;
          mat.metalness = 0.38;
          mat.envMapIntensity = 1.3;

          // If material has alpha transparency (railings/masts)
          if (mat.transparent || mat.opacity < 1.0) {
            mat.alphaTest = 0.25;
            mat.depthWrite = true;
          }
        }
      }
    });

    return clone;
  }, [scene]);

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 
        The Sovremenny GLB was authored in Z-up with Y as the longitudinal axis (length).
        We rotate -Math.PI / 2 around X to convert to Three.js standard (Y-up, Z-length).
        The model center offset is approximately Z: +0.15 in original coordinates.
      */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.15]}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
};

// Preload the model asset
useGLTF.preload('/models/sovremenny.glb');
