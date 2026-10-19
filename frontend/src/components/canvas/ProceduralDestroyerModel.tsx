import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProceduralDestroyerModelProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  hullNumber?: string;
  isAlien?: boolean;
}

export const ProceduralDestroyerModel: React.FC<ProceduralDestroyerModelProps> = ({
  scale = 1.0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  hullNumber = '79',
  isAlien = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const mainGunRef = useRef<THREE.Group>(null);
  const gunBarrelRef = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Group>(null);
  const secRadarRef = useRef<THREE.Group>(null);
  const heloRotorRef = useRef<THREE.Group>(null);
  const ciwsFwdRef = useRef<THREE.Group>(null);
  const ciwsAftRef = useRef<THREE.Group>(null);
  const flagMeshRef = useRef<THREE.Mesh>(null);
  const flagOrigPosRef = useRef<Float32Array | null>(null);

  // Colors & Faction Palette
  const colors = useMemo(() => {
    if (isAlien) {
      return {
        keel: 0x220538,
        bootTop: 0x120224,
        hazeGray: 0x3b1c66,
        deck: 0x1f0e38,
        darkTrim: 0x130724,
        radar: 0x7c3aed,
        accent: 0xc084fc,
        window: 0xe879f9,
      };
    }
    return {
      keel: 0x7a1814,        // Antifouling oxide red
      bootTop: 0x181c20,     // Waterline boot-topping black
      hazeGray: 0x828c96,    // Naval haze gray topsides
      deck: 0x3d444b,        // Non-skid dark flight/weather deck
      darkTrim: 0x24282c,    // Masts & machinery casing
      radar: 0xa8b4c0,       // SPY planar array light face
      accent: 0x38bdf8,      // Modern sensor glow
      window: 0x0ea5e9,      // Bridge glass day/night cyan
    };
  }, [isAlien]);

  // Procedural Textures (Non-skid deck grit & plate lines)
  const deckTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isAlien ? '#24103e' : '#454c54';
      ctx.fillRect(0, 0, 256, 256);
      // Non-skid grit noise
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
      // Steel deck plate seams
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 1.5, 256);
      for (let y = 0; y < 256; y += 64) ctx.fillRect(0, y, 256, 1.5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 8);
    return tex;
  }, [isAlien]);

  // Hull Pennant Number Texture
  const pennantTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 128);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 96px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hullNumber, 128, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, [hullNumber]);

  // Naval Ensign Flag Texture
  const flagTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isAlien ? '#3b0764' : '#0a192f';
      ctx.fillRect(0, 0, 256, 160);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 68, 256, 24);
      ctx.fillRect(80, 0, 24, 160);
      ctx.fillStyle = isAlien ? '#c084fc' : '#0284c7';
      ctx.fillRect(0, 74, 256, 12);
      ctx.fillRect(86, 0, 12, 160);
    }
    return new THREE.CanvasTexture(canvas);
  }, [isAlien]);

  // Parametric Destroyer Hull Geometry
  // Length L = 9.2, Half-beam HB = 0.66, Draft = 0.45
  const { hullGeo, deckGeo } = useMemo(() => {
    const L = 9.2;
    const HB = 0.66;
    const N = 72; // Longitudinal segments
    const Mr = 36; // Radial girth segments

    const prof = (t: number) => {
      if (t < 0.15) return 0.75 + 0.25 * Math.sin((t / 0.15) * Math.PI * 0.5);
      if (t < 0.65) return 1.0;
      const u = (t - 0.65) / 0.35;
      return Math.pow(Math.max(1 - Math.pow(u, 1.8), 0), 0.65);
    };

    const deckYt = (t: number) => 0.38 + 0.24 * Math.pow(Math.max(0, Math.min(1, t)), 2.8);
    const keelYt = (t: number) => -0.32 * (1 - Math.pow(t, 4.5)) * (0.75 + 0.25 * Math.min(t / 0.12, 1));
    const zOf = (t: number) => -L / 2 + L * t;

    const hullPt = (t: number, a: number) => {
      const B = HB * prof(t);
      const s = Math.sin(a);
      const dY = deckYt(t);
      const kY = keelYt(t);
      const flare = 1.0 + 0.18 * Math.pow(t, 2.4) * (1 - s);
      return new THREE.Vector3(
        B * Math.cos(a) * flare,
        dY - (dY - kY) * Math.pow(s, 0.82),
        zOf(t) - 0.45 * Math.pow(t, 6.0) * Math.pow(s, 1.1)
      );
    };

    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];

    const cTop = isAlien ? new THREE.Color(0x3b1c66) : new THREE.Color(0x828c96);
    const cMid = isAlien ? new THREE.Color(0x120224) : new THREE.Color(0x181c20);
    const cBot = isAlien ? new THREE.Color(0x220538) : new THREE.Color(0x7a1814);

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      for (let j = 0; j <= Mr; j++) {
        const p = hullPt(t, (j / Mr) * Math.PI);
        pos.push(p.x, p.y, p.z);

        if (p.y > 0.08) {
          col.push(cTop.r, cTop.g, cTop.b);
        } else if (p.y > -0.06) {
          col.push(cMid.r, cMid.g, cMid.b);
        } else {
          col.push(cBot.r, cBot.g, cBot.b);
        }
      }
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < Mr; j++) {
        const a = i * (Mr + 1) + j;
        const b = a + 1;
        const c = a + Mr + 1;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }

    // Transom stern cap
    const cIdx = pos.length / 3;
    pos.push(0, 0.15, -L / 2);
    col.push(cTop.r, cTop.g, cTop.b);
    for (let j = 0; j < Mr; j++) {
      idx.push(cIdx, j + 1, j);
    }

    const hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    hg.setIndex(idx);
    hg.computeVertexNormals();

    // Deck Surface
    const dp: number[] = [];
    const du: number[] = [];
    const di: number[] = [];

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = hullPt(t, 0);
      const b = hullPt(t, Math.PI);
      dp.push(a.x, a.y + 0.005, a.z, b.x, b.y + 0.005, b.z);
      du.push(1, t, 0, t);
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }

    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2));
    dg.setIndex(di);
    dg.computeVertexNormals();

    return { hullGeo: hg, deckGeo: dg };
  }, [isAlien]);

  // Instanced Deck Perimeter Railing Stanchions
  const railingMesh = useMemo(() => {
    const L = 9.2;
    const HB = 0.66;
    const prof = (t: number) => {
      if (t < 0.15) return 0.75 + 0.25 * Math.sin((t / 0.15) * Math.PI * 0.5);
      if (t < 0.65) return 1.0;
      const u = (t - 0.65) / 0.35;
      return Math.pow(Math.max(1 - Math.pow(u, 1.8), 0), 0.65);
    };
    const deckYt = (t: number) => 0.38 + 0.24 * Math.pow(Math.max(0, Math.min(1, t)), 2.8);

    const stanchions: THREE.Vector3[] = [];
    const step = 0.26;
    for (let z = -L / 2 + 0.2; z <= L / 2 - 0.3; z += step) {
      const t = (z + L / 2) / L;
      const x = HB * prof(t) * 0.96;
      const y = deckYt(t);
      stanchions.push(new THREE.Vector3(x, y + 0.08, z));
      stanchions.push(new THREE.Vector3(-x, y + 0.08, z));
    }

    const geo = new THREE.CylinderGeometry(0.007, 0.007, 0.15, 5);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.6,
    });
    const inst = new THREE.InstancedMesh(geo, mat, stanchions.length);
    const dummy = new THREE.Object3D();

    stanchions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
    return inst;
  }, []);

  // Frame Loop: Animated gun tracking, radar rotation, helo rotor, and flag flutter
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Main 5" Gun Azimuth Tracking & Elevation
    if (mainGunRef.current) {
      mainGunRef.current.rotation.y = Math.sin(t * 0.4) * 0.45;
    }
    if (gunBarrelRef.current) {
      gunBarrelRef.current.rotation.x = -0.08 - Math.sin(t * 0.6) * 0.05;
    }

    // 2. Spinning Radar Scanners
    if (radarRef.current) {
      radarRef.current.rotation.y += delta * 2.8;
    }
    if (secRadarRef.current) {
      secRadarRef.current.rotation.y -= delta * 1.9;
    }

    // 3. Helicopter Rotors
    if (heloRotorRef.current) {
      heloRotorRef.current.rotation.y += delta * 12.0;
    }

    // 4. CIWS Point-Defense Scanning
    if (ciwsFwdRef.current) {
      ciwsFwdRef.current.rotation.y = Math.sin(t * 1.2) * 1.1;
    }
    if (ciwsAftRef.current) {
      ciwsAftRef.current.rotation.y = Math.PI + Math.sin(t * 1.4 + 1.0) * 1.0;
    }

    // 5. GPU-Style Cloth Flag Waving on Stern Staff
    if (flagMeshRef.current) {
      const geo = flagMeshRef.current.geometry as THREE.BufferGeometry;
      const posAttr = geo.attributes.position;
      if (!flagOrigPosRef.current) {
        flagOrigPosRef.current = new Float32Array(posAttr.array);
      }
      const orig = flagOrigPosRef.current;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const ox = orig[i * 3];
        const oy = orig[i * 3 + 1];
        const nx = ox / 0.55;
        posAttr.setZ(
          i,
          Math.sin(ox * 8.0 - t * 8.0) * 0.05 * nx +
          Math.sin(ox * 4.0 - t * 4.0 + oy) * 0.02 * nx
        );
        posAttr.setY(i, oy + Math.sin(ox * 6.0 - t * 6.0) * 0.015 * nx);
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1. PARAMETRIC HYDRODYNAMIC HULL & WEATHER DECK */}
      <mesh geometry={hullGeo} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.52} metalness={0.28} side={THREE.DoubleSide} />
      </mesh>

      <mesh geometry={deckGeo} receiveShadow>
        <meshStandardMaterial map={deckTexture} roughness={0.88} metalness={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Perimeter Wire Stanchion Railings */}
      <primitive object={railingMesh} />

      {/* 2. BOW PENNANT HULL NUMBERS */}
      <group position={[0.48, 0.42, 3.4]} rotation={[0, 0.16, 0]}>
        <mesh>
          <planeGeometry args={[0.7, 0.35]} />
          <meshBasicMaterial map={pennantTexture} transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[-0.48, 0.42, 3.4]} rotation={[0, -0.16, 0]}>
        <mesh scale={[-1, 1, 1]}>
          <planeGeometry args={[0.7, 0.35]} />
          <meshBasicMaterial map={pennantTexture} transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 3. FORWARD 5-INCH (127MM) STEALTH NAVAL GUN */}
      <group position={[0, 0.48, 2.7]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.34, 0.38, 0.08, 24]} />
          <meshStandardMaterial color={colors.darkTrim} roughness={0.4} />
        </mesh>

        <group ref={mainGunRef} position={[0, 0.08, 0]}>
          <mesh position={[0, 0.14, -0.05]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 0.22, 6]} />
            <meshStandardMaterial color={colors.hazeGray} metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.13, 0.14]} rotation={[-0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.26, 0.18, 0.12]} />
            <meshStandardMaterial color={colors.hazeGray} metalness={0.45} roughness={0.35} />
          </mesh>

          <group ref={gunBarrelRef} position={[0, 0.13, 0.18]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.055, 0.25, 12]} />
              <meshStandardMaterial color={colors.darkTrim} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.58]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.035, 0.95, 16]} />
              <meshStandardMaterial color={0x1e293b} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.08, 12]} />
              <meshStandardMaterial color={0x0f172a} metalness={0.95} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 4. FORWARD 32-CELL VLS HATCH GRID */}
      <group position={[0, 0.47, 1.85]}>
        <mesh position={[0, 0.015, 0]} receiveShadow>
          <boxGeometry args={[0.74, 0.03, 0.95]} />
          <meshStandardMaterial color={colors.darkTrim} roughness={0.7} metalness={0.3} />
        </mesh>
        {[-0.24, -0.08, 0.08, 0.24].map((x, xi) =>
          [-0.36, -0.24, -0.12, 0.0, 0.12, 0.24, 0.36].map((z, zi) => (
            <mesh key={`vls-fwd-${xi}-${zi}`} position={[x, 0.032, z]}>
              <boxGeometry args={[0.11, 0.015, 0.09]} />
              <meshStandardMaterial color={0x475569} roughness={0.6} metalness={0.5} />
            </mesh>
          ))
        )}
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.05, 0.018, 0.85]} />
          <meshStandardMaterial color={0x0f172a} roughness={0.9} />
        </mesh>
      </group>

      {/* 5. MODERN STEALTH SUPERSTRUCTURE & SPY PHASED-ARRAY RADARS */}
      <group position={[0, 0.45, 0.4]}>
        <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.48, 1.9]} />
          <meshStandardMaterial color={colors.hazeGray} metalness={0.4} roughness={0.4} />
        </mesh>

        <mesh position={[0, 0.65, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.35, 1.4]} />
          <meshStandardMaterial color={colors.hazeGray} metalness={0.42} roughness={0.38} />
        </mesh>

        <mesh position={[0, 0.94, 0.25]} castShadow>
          <boxGeometry args={[0.82, 0.24, 0.85]} />
          <meshStandardMaterial color={colors.hazeGray} metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.86, 0.35]}>
          <boxGeometry args={[1.25, 0.05, 0.32]} />
          <meshStandardMaterial color={colors.darkTrim} metalness={0.5} />
        </mesh>

        {/* Panoramic Bridge Windows */}
        <mesh position={[0, 0.96, 0.68]}>
          <boxGeometry args={[0.76, 0.1, 0.02]} />
          <meshStandardMaterial
            color={colors.window}
            emissive={colors.window}
            emissiveIntensity={0.7}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0.415, 0.96, 0.45]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.42, 0.1, 0.02]} />
          <meshStandardMaterial
            color={colors.window}
            emissive={colors.window}
            emissiveIntensity={0.65}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[-0.415, 0.96, 0.45]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.42, 0.1, 0.02]} />
          <meshStandardMaterial
            color={colors.window}
            emissive={colors.window}
            emissiveIntensity={0.65}
            roughness={0.1}
          />
        </mesh>

        {/* 4x SPY Planar Phased-Array Faces */}
        <mesh position={[0.38, 0.72, 0.72]} rotation={[-0.2, 0.38, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.02]} />
          <meshStandardMaterial color={colors.radar} metalness={0.65} roughness={0.25} />
        </mesh>
        <mesh position={[-0.38, 0.72, 0.72]} rotation={[-0.2, -0.38, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.02]} />
          <meshStandardMaterial color={colors.radar} metalness={0.65} roughness={0.25} />
        </mesh>
        <mesh position={[0.44, 0.72, -0.45]} rotation={[0.2, 1.2, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.02]} />
          <meshStandardMaterial color={colors.radar} metalness={0.65} roughness={0.25} />
        </mesh>
        <mesh position={[-0.44, 0.72, -0.45]} rotation={[0.2, -1.2, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.02]} />
          <meshStandardMaterial color={colors.radar} metalness={0.65} roughness={0.25} />
        </mesh>

        {/* Forward CIWS Mount */}
        <group ref={ciwsFwdRef} position={[0, 1.1, 0.42]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.09, 0.06, 12]} />
            <meshStandardMaterial color={colors.darkTrim} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color={0xf8fafc} roughness={0.3} />
          </mesh>
          <mesh position={[0.06, 0.08, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
            <meshStandardMaterial color={0x0f172a} metalness={0.9} />
          </mesh>
        </group>

        {/* 6. ENCLOSED STEALTH MAINMAST */}
        <group position={[0, 1.05, -0.05]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.22, 0.85, 4]} />
            <meshStandardMaterial color={colors.darkTrim} roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[0.85, 0.03, 0.04]} />
            <meshStandardMaterial color={colors.darkTrim} />
          </mesh>

          {/* Primary Spinning 3D Air-Search Radar */}
          <group ref={radarRef} position={[0, 0.92, 0]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
              <meshStandardMaterial color={0x0f172a} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.55, 0.08, 0.04]} />
              <meshStandardMaterial color={0xe2e8f0} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>

          {/* Masthead Navigation Light */}
          <mesh position={[0, 0.98, 0]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color={0xffffff} emissive={0xffffff} emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>

      {/* 7. MIDSHIPS EXHAUST FUNNEL & HARPOON CANISTERS */}
      <group position={[0, 0.45, -1.0]}>
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.72, 0.75, 0.95]} />
          <meshStandardMaterial color={colors.hazeGray} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[0.58, 0.06, 0.78]} />
          <meshStandardMaterial color={0x0f172a} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.85, -0.1]}>
          <cylinderGeometry args={[0.12, 0.14, 0.18, 12]} />
          <meshStandardMaterial color={0x1e293b} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.85, 0.16]}>
          <cylinderGeometry args={[0.12, 0.14, 0.18, 12]} />
          <meshStandardMaterial color={0x1e293b} metalness={0.8} />
        </mesh>

        <group ref={secRadarRef} position={[0, 0.94, -0.1]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.36, 0.05, 0.03]} />
            <meshStandardMaterial color={0x94a3b8} metalness={0.8} />
          </mesh>
        </group>

        {/* Angled Quad Anti-Ship Missile Tubes */}
        <group position={[0.38, 0.45, 0]} rotation={[0, 0.5, 0.35]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.38, 8]} />
            <meshStandardMaterial color={colors.darkTrim} metalness={0.8} />
          </mesh>
          <mesh position={[0.08, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.38, 8]} />
            <meshStandardMaterial color={colors.darkTrim} metalness={0.8} />
          </mesh>
        </group>
        <group position={[-0.38, 0.45, 0]} rotation={[0, -0.5, -0.35]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.38, 8]} />
            <meshStandardMaterial color={colors.darkTrim} metalness={0.8} />
          </mesh>
          <mesh position={[-0.08, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.38, 8]} />
            <meshStandardMaterial color={colors.darkTrim} metalness={0.8} />
          </mesh>
        </group>

        {/* Port / Starboard Navigation Lights */}
        <mesh position={[0.54, 0.35, 0.3]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={0xef4444} emissive={0xef4444} emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[-0.54, 0.35, 0.3]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={0x22c55e} emissive={0x22c55e} emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* 8. AFT HELICOPTER HANGAR & SECONDARY CIWS */}
      <group position={[0, 0.45, -2.1]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.82, 0.62, 1.2]} />
          <meshStandardMaterial color={colors.hazeGray} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.28, -0.61]}>
          <planeGeometry args={[0.42, 0.46]} />
          <meshStandardMaterial color={0x1e293b} roughness={0.85} metalness={0.4} side={THREE.DoubleSide} />
        </mesh>

        {/* Aft CIWS */}
        <group ref={ciwsAftRef} position={[0, 0.68, 0.25]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.09, 0.06, 12]} />
            <meshStandardMaterial color={colors.darkTrim} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color={0xf8fafc} roughness={0.3} />
          </mesh>
          <mesh position={[0.06, 0.08, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
            <meshStandardMaterial color={0x0f172a} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* 9. AFT FLIGHT DECK (HELIPAD WITH TOUCHDOWN MARKINGS) */}
      <group position={[0, 0.42, -3.4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.48, 0.52, 32]} />
          <meshBasicMaterial color="#f8fafc" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <planeGeometry args={[0.18, 0.04]} />
          <meshBasicMaterial color="#f8fafc" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.08, 0.012, 0]}>
          <planeGeometry args={[0.04, 0.26]} />
          <meshBasicMaterial color="#f8fafc" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.08, 0.012, 0]}>
          <planeGeometry args={[0.04, 0.26]} />
          <meshBasicMaterial color="#f8fafc" side={THREE.DoubleSide} />
        </mesh>

        {/* Parked MH-60 Seahawk Naval Helicopter */}
        <group position={[0, 0.08, 0.15]} scale={[0.55, 0.55, 0.55]}>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.22, 0.18, 0.85]} />
            <meshStandardMaterial color={0x334155} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.14, 0.38]}>
            <boxGeometry args={[0.18, 0.14, 0.18]} />
            <meshStandardMaterial color={0x0284c7} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.18, -0.65]}>
            <cylinderGeometry args={[0.04, 0.08, 0.65, 8]} />
            <meshStandardMaterial color={0x334155} />
          </mesh>
          <group ref={heloRotorRef} position={[0, 0.26, 0]}>
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[1.2, 0.01, 0.05]} />
              <meshBasicMaterial color={0x0f172a} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.05, 0.01, 1.2]} />
              <meshBasicMaterial color={0x0f172a} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 10. WAVING CLOTH NAVAL ENSIGN ON STERN JACKSTAFF */}
      <group position={[0, 0.42, -4.45]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.44, 8]} />
          <meshStandardMaterial color={0x94a3b8} metalness={0.8} />
        </mesh>
        <mesh
          ref={flagMeshRef}
          position={[0, 0.34, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
        >
          <planeGeometry args={[0.55, 0.32, 16, 8]} />
          <meshStandardMaterial
            map={flagTexture}
            side={THREE.DoubleSide}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.43, 0]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={0xf59e0b} emissive={0xf59e0b} emissiveIntensity={1.8} />
        </mesh>
      </group>
    </group>
  );
};
