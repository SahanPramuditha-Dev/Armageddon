import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ShipType, Faction } from '@/types/combat';
import { SovremennyModel } from './SovremennyModel';
import { ProceduralDestroyerModel } from './ProceduralDestroyerModel';

interface MenuShipShowcaseProps {
  shipType: ShipType;
  faction?: Faction;
  className?: string;
}

// -------------------------------------------------------------------------
// HIGH-FIDELITY 3D WARSHIP MODEL WITH AUTHENTIC NAVAL ARCHITECTURE
// -------------------------------------------------------------------------
const ShowcaseWarshipModel: React.FC<{ shipType: ShipType; faction?: Faction }> = ({
  shipType,
  faction = 'PACIFIC_FLEET',
}) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const mainRadarRef = useRef<THREE.Mesh | null>(null);
  const secRadarRef = useRef<THREE.Mesh | null>(null);
  const scanBarRef = useRef<THREE.Mesh | null>(null);
  const alienCoreRef = useRef<THREE.Mesh | null>(null);

  const isAlien = faction === 'THE_HARVESTERS' || shipType.startsWith('ALIEN');

  // Naval Color & Material Palette (grounded in authentic naval livery)
  const redKeel = '#882222'; // Antifouling red lower keel
  const waterlineBoot = '#141A22'; // Matte black waterline boot-topping band
  const hullHazeGray = '#8494A5'; // US Navy Haze Gray freeboard
  const deckPlate = '#252F3E'; // Non-skid flight/weather deck plate
  const hullDarkTrim = '#374151'; // Exhaust cowlings and vents
  const metalGun = '#E2E8F0'; // Machined stainless steel for barrels and rails
  const cyanGlow = '#00E5FF'; // Friendly sensor glow
  const spyHex = '#38BDF8'; // Active SPY phased array radar faces
  const radomeWhite = '#F8FAFC'; // White satellite domes & CIWS radomes
  const hazardYellow = '#F59E0B'; // VLS and deck safety boundary lines
  const windowCyan = '#0284C7'; // Polarized bridge glass

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow cinematic continuous rotation
    groupRef.current.rotation.y += delta * 0.28;

    // Gentle buoyancy wave motion (pitch, roll, heave)
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.6) * 0.08;
    groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.022;
    groupRef.current.rotation.x = Math.cos(t * 1.0) * 0.016;

    // Spinning radar arrays
    if (mainRadarRef.current) {
      mainRadarRef.current.rotation.y += delta * 3.8;
    }
    if (secRadarRef.current) {
      secRadarRef.current.rotation.y -= delta * 2.2;
    }

    // Alien energy core pulse
    if (alienCoreRef.current) {
      const scale = 1.0 + Math.sin(t * 3.5) * 0.12;
      alienCoreRef.current.scale.set(scale, scale, scale);
    }

    // Holographic vertical scanning beam sweeping bow to stern
    if (scanBarRef.current) {
      scanBarRef.current.position.z = Math.sin(t * 1.5) * 4.6;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ------------------------------------------------------------- */}
      {/* 1. HOLOGRAPHIC TACTICAL PEDESTAL & COORDINATE COMPASS */}
      {/* ------------------------------------------------------------- */}
      <group position={[0, -0.7, 0]}>
        {/* Core disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.2, 48]} />
          <meshBasicMaterial color="#0A1526" transparent opacity={0.65} />
        </mesh>

        {/* Outer compass ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[4.8, 4.9, 64]} />
          <meshBasicMaterial color={isAlien ? '#C084FC' : cyanGlow} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>

        {/* Mid tactical range ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[3.2, 3.28, 48]} />
          <meshBasicMaterial color={isAlien ? '#A855F7' : '#0284C7'} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner keel ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.6, 1.66, 32]} />
          <meshBasicMaterial color={isAlien ? '#7E22CE' : cyanGlow} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>

        {/* Cardinal Axis crosshairs */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <planeGeometry args={[9.8, 0.04]} />
          <meshBasicMaterial color={cyanGlow} transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.015, 0]}>
          <planeGeometry args={[9.8, 0.04]} />
          <meshBasicMaterial color={cyanGlow} transparent opacity={0.3} />
        </mesh>

        {/* Moving Holographic Scanning Laser Plane */}
        <mesh ref={scanBarRef} position={[0, 1.5, 0]}>
          <planeGeometry args={[5.6, 2.8]} />
          <meshBasicMaterial
            color={isAlien ? '#E879F9' : cyanGlow}
            transparent
            opacity={0.14}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ------------------------------------------------------------- */}
      {/* 2. SHIP GEOMETRY BY TYPE (PROFESSIONAL NAVAL CAD DETAIL)      */}
      {/* ------------------------------------------------------------- */}

      {/* A. GUIDED MISSILE DESTROYER (100% PROCEDURAL THREE.JS WARSHIP) */}
      {shipType === 'DESTROYER' && (
        <ProceduralDestroyerModel
          scale={0.92}
          position={[0, -0.22, 0]}
          isAlien={isAlien}
          hullNumber="79"
        />
      )}

      {/* B. GUIDED MISSILE CRUISER (CG-78 TICONDEROGA MODERNIZED) */}
      {shipType === 'CRUISER' && (
        <group scale={[1.1, 1.1, 1.1]}>
          {/* Lower Keel (Red) */}
          <mesh position={[0, 0.1, -0.3]}>
            <boxGeometry args={[1.65, 0.25, 7.8]} />
            <meshStandardMaterial color={redKeel} roughness={0.65} metalness={0.15} />
          </mesh>
          {/* Waterline Stripe (Black) */}
          <mesh position={[0, 0.25, -0.3]}>
            <boxGeometry args={[1.72, 0.12, 7.9]} />
            <meshStandardMaterial color={waterlineBoot} roughness={0.5} />
          </mesh>
          {/* Upper Freeboard Hull */}
          <mesh position={[0, 0.52, -0.5]}>
            <boxGeometry args={[1.88, 0.44, 6.8]} />
            <meshStandardMaterial color={hullHazeGray} metalness={0.4} roughness={0.35} />
          </mesh>
          {/* Bow Wedge */}
          <mesh position={[0, 0.55, 3.4]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.35, 0.5, 1.35]} />
            <meshStandardMaterial color={hullHazeGray} metalness={0.4} />
          </mesh>
          {/* Weather Deck */}
          <mesh position={[0, 0.78, -0.3]}>
            <boxGeometry args={[1.82, 0.04, 7.8]} />
            <meshStandardMaterial color={deckPlate} roughness={0.85} />
          </mesh>

          {/* DUAL MAIN GUNS (FORE & AFT MK 45 TURRETS) */}
          {/* Fore Turret */}
          <group position={[0, 0.85, 3.1]}>
            <mesh><cylinderGeometry args={[0.32, 0.35, 0.1, 24]} /><meshStandardMaterial color={hullDarkTrim} /></mesh>
            <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.28, 0.35, 0.28, 8]} /><meshStandardMaterial color={hullHazeGray} metalness={0.5} /></mesh>
            <mesh position={[0, 0.24, 0.6]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.055, 1.2, 16]} /><meshStandardMaterial color={metalGun} metalness={0.9} /></mesh>
          </group>
          {/* Aft Turret */}
          <group position={[0, 0.85, -3.4]} rotation={[0, Math.PI, 0]}>
            <mesh><cylinderGeometry args={[0.32, 0.35, 0.1, 24]} /><meshStandardMaterial color={hullDarkTrim} /></mesh>
            <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.28, 0.35, 0.28, 8]} /><meshStandardMaterial color={hullHazeGray} metalness={0.5} /></mesh>
            <mesh position={[0, 0.24, 0.6]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.055, 1.2, 16]} /><meshStandardMaterial color={metalGun} metalness={0.9} /></mesh>
          </group>

          {/* DUAL 64-CELL VLS HATCH MATRICES (FORE & AFT) */}
          <group position={[0, 0.81, 2.1]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.1, 1.1]} /><meshStandardMaterial color="#0B1320" /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}><planeGeometry args={[0.95, 0.95]} /><meshStandardMaterial color="#0284C7" emissive={cyanGlow} emissiveIntensity={0.6} /></mesh>
          </group>
          <group position={[0, 0.81, -2.2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.1, 1.1]} /><meshStandardMaterial color="#0B1320" /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}><planeGeometry args={[0.95, 0.95]} /><meshStandardMaterial color="#0284C7" emissive={cyanGlow} emissiveIntensity={0.6} /></mesh>
          </group>

          {/* FORWARD SPY RADAR DECKHOUSE */}
          <group position={[0, 1.2, 0.9]}>
            <mesh><boxGeometry args={[1.45, 0.82, 1.9]} /><meshStandardMaterial color={hullHazeGray} metalness={0.5} /></mesh>
            <mesh position={[0, 0.42, 0.85]}><boxGeometry args={[1.1, 0.12, 0.06]} /><meshStandardMaterial color={windowCyan} emissive={windowCyan} emissiveIntensity={0.8} /></mesh>
            <mesh position={[0, 0.15, 0.98]}><circleGeometry args={[0.28, 8]} /><meshStandardMaterial color={spyHex} emissive={spyHex} emissiveIntensity={0.85} /></mesh>
          </group>

          {/* AFT DECKHOUSE */}
          <mesh position={[0, 1.15, -1.2]}>
            <boxGeometry args={[1.35, 0.72, 1.6]} />
            <meshStandardMaterial color={hullHazeGray} />
          </mesh>

          {/* TALL LATTICE RADAR MAST */}
          <group position={[0, 1.9, 0.6]}>
            <mesh><cylinderGeometry args={[0.08, 0.2, 1.4, 8]} /><meshStandardMaterial color="#334155" metalness={0.8} /></mesh>
            <mesh ref={mainRadarRef} position={[0, 0.8, 0]}>
              <boxGeometry args={[1.2, 0.18, 0.12]} />
              <meshStandardMaterial color={cyanGlow} emissive={cyanGlow} emissiveIntensity={1.0} />
            </mesh>
          </group>
        </group>
      )}

      {/* C. AIRCRAFT CARRIER (CVN-77 NIMITZ/FORD CLASS) */}
      {shipType === 'CARRIER' && (
        <group scale={[0.85, 0.85, 0.85]}>
          {/* Lower Keel (Antifouling Red) */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[2.8, 0.38, 9.6]} />
            <meshStandardMaterial color={redKeel} roughness={0.65} metalness={0.15} />
          </mesh>
          {/* Bulbous Bow (Red) */}
          <mesh position={[0, 0.18, 4.8]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color={redKeel} />
          </mesh>
          {/* Waterline Boot-Topping (Black) */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[3.0, 0.15, 9.8]} />
            <meshStandardMaterial color={waterlineBoot} roughness={0.5} />
          </mesh>

          {/* Main Upper Hull with Flared Freeboard */}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[3.4, 0.52, 9.8]} />
            <meshStandardMaterial color={hullHazeGray} metalness={0.4} roughness={0.4} />
          </mesh>

          {/* Wide Overhanging Catwalk Galleries & Sponsons */}
          <mesh position={[1.9, 0.85, -1.0]}>
            <boxGeometry args={[0.5, 0.15, 4.0]} />
            <meshStandardMaterial color={hullDarkTrim} />
          </mesh>
          <mesh position={[-1.9, 0.85, 0]}>
            <boxGeometry args={[0.5, 0.15, 5.0]} />
            <meshStandardMaterial color={hullDarkTrim} />
          </mesh>

          {/* MAIN ASYMMETRIC FLIGHT DECK */}
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[4.8, 0.12, 10.4]} />
            <meshStandardMaterial color="#1E2632" roughness={0.92} />
          </mesh>

          {/* CATAPULT TRACKS & RUNWAY LINES */}
          {/* Bow Catapult 1 */}
          <mesh position={[-0.8, 1.09, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 6.5]} />
            <meshBasicMaterial color="#E2E8F0" />
          </mesh>
          {/* Bow Catapult 2 */}
          <mesh position={[0.6, 1.09, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 6.0]} />
            <meshBasicMaterial color="#E2E8F0" />
          </mesh>
          {/* Angled Landing Runway (Tilted ~9 deg to port) */}
          <mesh position={[-0.85, 1.09, -1.4]} rotation={[-Math.PI / 2, 0, 0.16]}>
            <planeGeometry args={[0.15, 6.8]} />
            <meshBasicMaterial color={hazardYellow} />
          </mesh>
          {/* Arresting Gear Cables */}
          <mesh position={[-0.9, 1.095, -3.2]} rotation={[-Math.PI / 2, 0, 0.16]}>
            <planeGeometry args={[1.8, 0.02]} />
            <meshBasicMaterial color="#E2E8F0" />
          </mesh>
          <mesh position={[-0.9, 1.095, -3.6]} rotation={[-Math.PI / 2, 0, 0.16]}>
            <planeGeometry args={[1.8, 0.02]} />
            <meshBasicMaterial color="#E2E8F0" />
          </mesh>

          {/* STARBOARD-AFT ISLAND SUPERSTRUCTURE */}
          <group position={[1.85, 1.7, -0.6]}>
            <mesh>
              <boxGeometry args={[0.65, 1.25, 2.0]} />
              <meshStandardMaterial color={hullHazeGray} metalness={0.45} />
            </mesh>
            {/* Pri-Fly Glass Observation Bay */}
            <mesh position={[0, 0.45, 0.7]}>
              <boxGeometry args={[0.55, 0.15, 0.35]} />
              <meshStandardMaterial color={windowCyan} emissive={windowCyan} emissiveIntensity={0.8} />
            </mesh>
            {/* SPY Phased Array Panels */}
            <mesh position={[-0.34, 0.25, 0]}>
              <circleGeometry args={[0.18, 8]} />
              <meshStandardMaterial color={spyHex} emissive={spyHex} emissiveIntensity={0.8} />
            </mesh>
            {/* Mast & Radar */}
            <mesh position={[0, 0.9, -0.3]}>
              <cylinderGeometry args={[0.06, 0.12, 0.8, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh ref={mainRadarRef} position={[0, 1.4, -0.3]}>
              <boxGeometry args={[1.0, 0.18, 0.1]} />
              <meshStandardMaterial color={cyanGlow} emissive={cyanGlow} emissiveIntensity={1.0} />
            </mesh>
            {/* Radome Dome */}
            <mesh position={[0, 1.0, 0.4]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={radomeWhite} />
            </mesh>
          </group>

          {/* PARKED STRIKE FIGHTERS (F/A-18 STYLE SILHOUETTES) */}
          <group position={[1.35, 1.15, -3.2]} scale={[0.42, 0.42, 0.42]}>
            <mesh><boxGeometry args={[1.1, 0.18, 1.8]} /><meshStandardMaterial color="#475569" metalness={0.6} /></mesh>
            <mesh position={[0, 0.05, 0]}><boxGeometry args={[2.2, 0.04, 0.7]} /><meshStandardMaterial color="#334155" /></mesh>
            <mesh position={[0.4, 0.2, -0.6]} rotation={[0, 0, 0.2]}><boxGeometry args={[0.04, 0.35, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>
            <mesh position={[-0.4, 0.2, -0.6]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.04, 0.35, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>
          </group>

          <group position={[1.35, 1.15, -4.2]} scale={[0.42, 0.42, 0.42]}>
            <mesh><boxGeometry args={[1.1, 0.18, 1.8]} /><meshStandardMaterial color="#475569" metalness={0.6} /></mesh>
            <mesh position={[0, 0.05, 0]}><boxGeometry args={[2.2, 0.04, 0.7]} /><meshStandardMaterial color="#334155" /></mesh>
            <mesh position={[0.4, 0.2, -0.6]} rotation={[0, 0, 0.2]}><boxGeometry args={[0.04, 0.35, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>
            <mesh position={[-0.4, 0.2, -0.6]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.04, 0.35, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>
          </group>
        </group>
      )}

      {/* D. FAST ATTACK SUBMARINE (SSN-774 VIRGINIA CLASS) */}
      {shipType === 'SUBMARINE' && (
        <group scale={[1.1, 1.1, 1.1]}>
          {/* Main Teardrop Anechoic Cylindrical Hull */}
          <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.82, 0.82, 7.2, 32]} />
            <meshStandardMaterial color="#1E2530" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Lower Hull Contrast Band */}
          <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.82, 0.82, 7.2, 32, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#121720" metalness={0.8} roughness={0.4} />
          </mesh>

          {/* Hemispherical Bow Sonar Dome */}
          <mesh position={[0, 0.35, 3.6]}>
            <sphereGeometry args={[0.81, 24, 24]} />
            <meshStandardMaterial color="#0F172A" metalness={0.85} roughness={0.2} />
          </mesh>

          {/* Tapered Stern Tail Cone */}
          <mesh position={[0, 0.35, -4.0]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.82, 1.4, 32]} />
            <meshStandardMaterial color="#1E2530" metalness={0.7} />
          </mesh>

          {/* CRUCIFORM TAIL RUDDERS (+ STABILIZER ASSEMBLY) */}
          {/* Vertical Stabilizers (Upper & Lower Rudders) */}
          <mesh position={[0, 0.35, -4.3]}>
            <boxGeometry args={[0.08, 2.4, 0.65]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          {/* Horizontal Stabilizers (Port & Starboard) */}
          <mesh position={[0, 0.35, -4.3]}>
            <boxGeometry args={[2.4, 0.08, 0.65]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>

          {/* Shrouded Pump-Jet Propulsor Cowling */}
          <mesh position={[0, 0.35, -4.85]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.46, 0.6, 24]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>

          {/* STREAMLINED CONNING TOWER (SAIL) */}
          <group position={[0, 1.25, 0.9]}>
            {/* Sail Body */}
            <mesh>
              <boxGeometry args={[0.42, 0.95, 1.7]} />
              <meshStandardMaterial color="#141A24" metalness={0.75} roughness={0.3} />
            </mesh>
            {/* Sail Leading Edge Curved Fairing */}
            <mesh position={[0, 0, 0.85]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.3, 0.95, 0.3]} />
              <meshStandardMaterial color="#141A24" metalness={0.75} />
            </mesh>
            {/* Sail Hydroplanes (Dive Planes) */}
            <mesh position={[0, 0.05, 0.05]}>
              <boxGeometry args={[1.9, 0.06, 0.4]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            {/* Retractable Periscopes & Sensor Masts */}
            <mesh position={[0, 0.65, -0.1]}>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
              <meshStandardMaterial color={cyanGlow} emissive={cyanGlow} emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0, 0.6, 0.3]}>
              <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
              <meshStandardMaterial color={metalGun} metalness={0.9} />
            </mesh>
          </group>
        </group>
      )}

      {/* E. ALIEN LEVIATHAN (BIOMORPHIC EXTRATERRESTRIAL COMMAND MOTHERSHIP) */}
      {(isAlien || shipType.startsWith('ALIEN')) && (
        <group scale={[1.05, 1.05, 1.05]}>
          {/* Central Biomechanical Carapace Plates */}
          <mesh position={[0, 0.8, 0]}>
            <octahedronGeometry args={[2.7, 2]} />
            <meshStandardMaterial
              color="#2D114D"
              emissive="#3B0764"
              emissiveIntensity={0.6}
              metalness={0.85}
              roughness={0.15}
            />
          </mesh>

          {/* Menacing Kinetic Attack Mandibles / Lances */}
          <mesh position={[0, 0.9, 3.0]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.55, 3.4, 8]} />
            <meshStandardMaterial
              color="#9333EA"
              emissive="#A855F7"
              emissiveIntensity={0.9}
              metalness={0.9}
            />
          </mesh>

          {/* Lateral Carapace Spikes */}
          <mesh position={[1.5, 0.8, 1.6]} rotation={[0.4, 0.3, -0.4]}>
            <coneGeometry args={[0.35, 2.5, 6]} />
            <meshStandardMaterial color="#7E22CE" metalness={0.9} />
          </mesh>
          <mesh position={[-1.5, 0.8, 1.6]} rotation={[0.4, -0.3, 0.4]}>
            <coneGeometry args={[0.35, 2.5, 6]} />
            <meshStandardMaterial color="#7E22CE" metalness={0.9} />
          </mesh>

          {/* Central Pulsing Plasma Energy Core Orb */}
          <mesh ref={alienCoreRef} position={[0, 0.8, 0]}>
            <sphereGeometry args={[1.15, 24, 24]} />
            <meshBasicMaterial color="#EC4899" transparent opacity={0.85} />
          </mesh>

          {/* Outer Energy Shell Rings */}
          <mesh rotation={[0.8, 0.5, 0]} position={[0, 0.8, 0]}>
            <torusGeometry args={[2.1, 0.08, 16, 48]} />
            <meshBasicMaterial color="#C084FC" />
          </mesh>
          <mesh rotation={[-0.8, 0.5, 0]} position={[0, 0.8, 0]}>
            <torusGeometry args={[2.1, 0.08, 16, 48]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
        </group>
      )}
    </group>
  );
};

// -------------------------------------------------------------------------
// CAMERA PRESET CONTROLLER (SMOOTH WATERLINE TRANSITIONS)
// -------------------------------------------------------------------------
export type CameraPreset = 'HERO' | 'BROADSIDE' | 'BOW' | 'BRIDGE';

const CameraPresetController: React.FC<{ preset: CameraPreset }> = ({ preset }) => {
  const targetPos = useRef(new THREE.Vector3(10.5, 2.5, 8.5));
  const targetLook = useRef(new THREE.Vector3(0, 0.4, 0));
  const isTransitioning = useRef(true);

  React.useEffect(() => {
    switch (preset) {
      case 'HERO':
        targetPos.current.set(10.5, 2.5, 8.5);
        targetLook.current.set(0, 0.4, 0);
        break;
      case 'BROADSIDE':
        targetPos.current.set(0.0, 1.8, 13.8);
        targetLook.current.set(0, 0.4, 0);
        break;
      case 'BOW':
        targetPos.current.set(0.0, 2.5, 11.5);
        targetLook.current.set(0, 0.6, 1.2);
        break;
      case 'BRIDGE':
        targetPos.current.set(5.5, 2.8, 4.5);
        targetLook.current.set(0, 1.1, 0.5);
        break;
    }
    isTransitioning.current = true;
  }, [preset]);

  useFrame((state, delta) => {
    if (!isTransitioning.current) return;

    state.camera.position.lerp(targetPos.current, delta * 3.5);
    state.camera.lookAt(targetLook.current);

    if (state.camera.position.distanceTo(targetPos.current) < 0.08) {
      isTransitioning.current = false;
    }
  });

  return null;
};

// -------------------------------------------------------------------------
// SHOWCASE CANVAS CONTAINER WITH HIGH-CONTRAST DRAMATIC LIGHTING
// -------------------------------------------------------------------------
interface EnhancedMenuShipShowcaseProps extends MenuShipShowcaseProps {
  initialPreset?: CameraPreset;
  hideControls?: boolean;
  onPresetChange?: (preset: CameraPreset) => void;
  activePreset?: CameraPreset;
}

export const MenuShipShowcase: React.FC<EnhancedMenuShipShowcaseProps> = ({
  shipType,
  faction = 'PACIFIC_FLEET',
  initialPreset = 'HERO',
  hideControls = false,
  onPresetChange,
  activePreset,
  className = '',
}) => {
  const [internalPreset, setInternalPreset] = React.useState<CameraPreset>(initialPreset);
  const currentPreset = activePreset || internalPreset;

  const handleSelectPreset = (p: CameraPreset) => {
    setInternalPreset(p);
    if (onPresetChange) onPresetChange(p);
  };

  const isAlien = faction === 'THE_HARVESTERS' || shipType.startsWith('ALIEN');

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-radial from-[#0C1A30]/80 via-[#050C18] to-[#03060E] ${className}`}>
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [10.5, 2.5, 8.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraPresetController preset={currentPreset} />

        {/* 1. KEY SUN LIGHT: Sharp overhead sun highlighting naval gray & weapon metal */}
        <directionalLight position={[9, 12, 10]} intensity={3.5} color="#FFFFFF" />

        {/* 2. RIM LIGHT: Cyan/Magenta backlight defining the hull edges and superstructure */}
        <directionalLight
          position={[-9, 5, -9]}
          intensity={4.8}
          color={isAlien ? '#E879F9' : '#00E5FF'}
        />

        {/* 3. UNDER-HULL FILL LIGHT: Illuminating the red keel & waterline boot */}
        <pointLight
          position={[0, -0.6, 0]}
          intensity={3.2}
          color={isAlien ? '#A855F7' : '#00E5FF'}
          distance={12}
        />

        {/* 4. OPPOSITE FILL LIGHT: Soft sky blue to prevent dark silhouettes */}
        <pointLight position={[-6, 4, 6]} intensity={2.2} color="#93C5FD" />

        {/* 5. AMBIENT LIGHT */}
        <ambientLight intensity={1.6} color="#E2E8F0" />

        <Float speed={1.0} rotationIntensity={0.08} floatIntensity={0.15}>
          <ShowcaseWarshipModel shipType={shipType} faction={faction} />
        </Float>

        {/* Soft Contact Shadows anchoring the warship to the stage */}
        <ContactShadows
          position={[0, -0.68, 0]}
          opacity={0.65}
          scale={16}
          blur={2.0}
          far={5}
          resolution={512}
          color="#000000"
        />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxDistance={22}
          minDistance={4}
          maxPolarAngle={Math.PI / 2.02}
          minPolarAngle={Math.PI / 6}
          autoRotate={false}
        />
      </Canvas>

      {/* Floating Camera Angle Presets (Apple-Style Glass Capsule) */}
      {!hideControls && (
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          {(
            [
              { id: 'HERO', label: 'Hero 3/4' },
              { id: 'BROADSIDE', label: 'Broadside' },
              { id: 'BOW', label: 'Bow On' },
              { id: 'BRIDGE', label: 'Bridge Cam' },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectPreset(c.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                currentPreset === c.id
                  ? 'bg-[#0A84FF] text-white shadow-[0_2px_10px_rgba(10,132,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Sleek Floating Badges */}
      <div className="absolute top-3.5 left-3.5 pointer-events-none flex items-center gap-2 ios-pill px-3 py-1 text-xs text-slate-200 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]" />
        <span className="font-semibold tracking-tight text-white">{shipType.replace('_', ' ')}</span>
      </div>

      <div className="absolute top-3.5 right-3.5 pointer-events-none ios-pill px-3 py-1 text-[11px] text-slate-300 font-semibold shadow-lg">
        360° Tactical Turntable
      </div>
    </div>
  );
};
