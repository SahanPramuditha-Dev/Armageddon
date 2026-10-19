import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const OceanSurface: React.FC = () => {
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Custom vertex shader for fluid ocean wave displacement
  const oceanShader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color('#092540') },
        uShallowColor: { value: new THREE.Color('#1E597E') },
        uFoamColor: { value: new THREE.Color('#F0F9FF') },
      },
      vertexShader: `
        uniform float uTime;
        varying float vElevation;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          vUv = uv;
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);

          // Harmonic Gerstner-style ocean wave displacement
          float wave1 = sin(modelPosition.x * 0.06 + uTime * 1.1) * cos(modelPosition.z * 0.05 + uTime * 0.9) * 0.95;
          float wave2 = sin(modelPosition.x * 0.14 - uTime * 1.5 + modelPosition.z * 0.08) * 0.42;
          float wave3 = cos(modelPosition.z * 0.18 + uTime * 1.3) * 0.28;
          float totalElevation = wave1 + wave2 + wave3;

          modelPosition.y += totalElevation;
          vElevation = totalElevation;
          vWorldPos = modelPosition.xyz;
          vNormal = normalize(vec3(-wave1 * 0.15, 1.0, -wave3 * 0.15));

          gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        varying float vElevation;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          // Dynamic gradient between deep abyss and turquoise crest
          float mixStrength = smoothstep(-1.2, 0.9, vElevation);
          vec3 waterCol = mix(uDeepColor, uShallowColor, mixStrength);

          // Realistic white wave crest foam
          if (vElevation > 0.45) {
            float foamFactor = smoothstep(0.45, 1.1, vElevation);
            waterCol = mix(waterCol, uFoamColor, foamFactor * 0.85);
          }

          // Specular sun glint
          vec3 sunDir = normalize(vec3(0.6, 0.8, 0.4));
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 halfVec = normalize(sunDir + viewDir);
          float spec = pow(max(dot(vNormal, halfVec), 0.0), 32.0);
          waterCol += vec3(1.0, 0.96, 0.88) * spec * 0.55;

          gl_FragColor = vec4(waterCol, 0.95);
        }
      `,
    };
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      oceanShader.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[400, 400, 128, 128]} />
      <shaderMaterial
        vertexShader={oceanShader.vertexShader}
        fragmentShader={oceanShader.fragmentShader}
        uniforms={oceanShader.uniforms}
        transparent={true}
      />
    </mesh>
  );
};
