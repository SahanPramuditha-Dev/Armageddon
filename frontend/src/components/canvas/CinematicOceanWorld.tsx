import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SentinelExactShip, SentinelExactShipRef } from './SentinelExactShip';

export type TimeOfDay = 'day' | 'dusk' | 'night';
export type CameraMode = 'orbit' | 'bow' | 'side' | 'stern' | 'top' | 'bridge';

interface CinematicOceanWorldProps {
  shipType?: any;
  timeOfDay?: TimeOfDay;
  cameraMode?: CameraMode;
  speed?: number; // 0 to 14
  seaState?: number; // 0.1 to 2.2
  triggerFireGuns?: number;
  triggerFireMissiles?: number;
  onCameraModeChange?: (mode: CameraMode) => void;
}

const T = THREE;
const V3 = T.Vector3;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/* ========================================================================= */
/* GLSL SHADERS: NOISE & GERSTNER WAVES (VERBATIM FROM WARSHIP.HTML)         */
/* ========================================================================= */
const NOISE_GLSL = `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){s+=a*noise(p);p*=2.03;a*=0.5;}return s;}
`;

const WAVE_GLSL = `
float wave(vec2 p,vec2 d,float k,float a,float w,float t,inout vec2 g){
  float ph=dot(p,d)*k-w*t;
  g+=d*(k*a*cos(ph));
  return a*sin(ph);
}
float height(vec2 p,float t,float amp,out vec2 g){
  g=vec2(0.0);float h=0.0;
  h+=wave(p,vec2(0.80,0.60),0.22,0.40,1.47,t,g);
  h+=wave(p,vec2(-0.50,0.87),0.35,0.24,1.85,t,g);
  h+=wave(p,vec2(0.95,-0.31),0.52,0.13,2.26,t,g);
  h+=wave(p,vec2(-0.20,-0.98),0.90,0.055,2.97,t,g);
  g*=amp;return h*amp;
}
`;

const WV = [
  [0.8, 0.6, 0.22, 0.4, 1.47],
  [-0.5, 0.87, 0.35, 0.24, 1.85],
  [0.95, -0.31, 0.52, 0.13, 2.26],
  [-0.2, -0.98, 0.9, 0.055, 2.97],
];

function calcWaveH(x: number, z: number, shipDist: number, time: number, amp: number) {
  const pz = z + shipDist;
  let h = 0;
  for (const w of WV) {
    h += w[3] * Math.sin((x * w[0] + pz * w[1]) * w[2] - w[4] * time);
  }
  return h * amp;
}

const PRESETS = {
  day: {
    sunDir: new V3(0.55, 0.55, 0.62).normalize(),
    sunCol: new T.Color(1, 0.94, 0.82),
    sunInt: 2.3,
    hSky: new T.Color(0.62, 0.75, 0.95),
    hGnd: new T.Color(0.2, 0.25, 0.3),
    hInt: 0.85,
    top: new T.Color(0.12, 0.34, 0.72),
    hor: new T.Color(0.62, 0.78, 0.92),
    cloud: new T.Color(1, 1, 1),
    stars: 0,
    deep: new T.Color(0.012, 0.085, 0.16),
    shal: new T.Color(0.04, 0.26, 0.33),
    lum: 1.0,
    fogCol: new T.Color(0x9fb8d0),
  },
  dusk: {
    sunDir: new V3(-0.85, 0.11, -0.5).normalize(),
    sunCol: new T.Color(1, 0.5, 0.22),
    sunInt: 2.2,
    hSky: new T.Color(0.55, 0.42, 0.5),
    hGnd: new T.Color(0.18, 0.14, 0.16),
    hInt: 0.55,
    top: new T.Color(0.08, 0.12, 0.32),
    hor: new T.Color(0.95, 0.5, 0.28),
    cloud: new T.Color(0.95, 0.5, 0.42),
    stars: 0.15,
    deep: new T.Color(0.03, 0.045, 0.11),
    shal: new T.Color(0.17, 0.15, 0.21),
    lum: 0.55,
    fogCol: new T.Color(0.95, 0.5, 0.28),
  },
  night: {
    sunDir: new V3(0.4, 0.5, -0.7).normalize(),
    sunCol: new T.Color(0.55, 0.65, 1),
    sunInt: 0.6,
    hSky: new T.Color(0.14, 0.19, 0.34),
    hGnd: new T.Color(0.03, 0.04, 0.06),
    hInt: 0.55,
    top: new T.Color(0.008, 0.018, 0.06),
    hor: new T.Color(0.035, 0.065, 0.13),
    cloud: new T.Color(0.06, 0.08, 0.14),
    stars: 1.0,
    deep: new T.Color(0.004, 0.012, 0.028),
    shal: new T.Color(0.02, 0.045, 0.085),
    lum: 0.12,
    fogCol: new T.Color(0.035, 0.065, 0.13),
  },
};

/* ========================================================================= */
/* FAST PARTICLE POOL                                                        */
/* ========================================================================= */
class Particles {
  n: number;
  i = 0;
  fadeIn: boolean;
  pos: Float32Array;
  col: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  vel: Float32Array;
  age: Float32Array;
  max: Float32Array;
  s0: Float32Array;
  s1: Float32Array;
  a0: Float32Array;
  gr: Float32Array;
  dr: Float32Array;
  points: THREE.Points;
  geo: THREE.BufferGeometry;

  constructor(scene: THREE.Scene, n: number, additive: boolean, fadeIn: boolean) {
    this.n = n;
    this.fadeIn = fadeIn;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.vel = new Float32Array(n * 3);
    this.age = new Float32Array(n).fill(1e9);
    this.max = new Float32Array(n).fill(1);
    this.s0 = new Float32Array(n);
    this.s1 = new Float32Array(n);
    this.a0 = new Float32Array(n);
    this.gr = new Float32Array(n);
    this.dr = new Float32Array(n);

    const g = new T.BufferGeometry();
    const mkA = (arr: Float32Array, c: number) => new T.BufferAttribute(arr, c).setUsage(T.DynamicDrawUsage);
    g.setAttribute('position', mkA(this.pos, 3));
    g.setAttribute('aColor', mkA(this.col, 3));
    g.setAttribute('aSize', mkA(this.size, 1));
    g.setAttribute('aAlpha', mkA(this.alpha, 1));

    const mat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: { uScale: { value: 600 } },
      vertexShader: `
        attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
        uniform float uScale; varying float vA; varying vec3 vC;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uScale / max(-mv.z, 0.1);
          vA = aAlpha; vC = aColor;
        }
      `,
      fragmentShader: `
        varying float vA; varying vec3 vC;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.08, d) * vA;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vC, a);
        }
      `,
    });

    this.points = new T.Points(g, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.geo = g;
  }

  emit(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    life: number, s0: number, s1: number, a0: number,
    r: number, g: number, b: number,
    grav: number = 0, drag: number = 0
  ) {
    const i = this.i;
    this.i = (i + 1) % this.n;
    const k = i * 3;
    this.pos[k] = x; this.pos[k + 1] = y; this.pos[k + 2] = z;
    this.vel[k] = vx; this.vel[k + 1] = vy; this.vel[k + 2] = vz;
    this.col[k] = r; this.col[k + 1] = g; this.col[k + 2] = b;
    this.age[i] = 0; this.max[i] = life;
    this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a0;
    this.gr[i] = grav; this.dr[i] = drag;
  }

  update(dt: number) {
    const n = this.n;
    for (let i = 0; i < n; i++) {
      if (this.age[i] >= this.max[i]) {
        this.alpha[i] = 0;
        continue;
      }
      this.age[i] += dt;
      const r = this.age[i] / this.max[i];
      if (r >= 1) {
        this.alpha[i] = 0;
        continue;
      }
      const k = i * 3;
      const dm = Math.max(0, 1 - this.dr[i] * dt);
      this.vel[k] *= dm; this.vel[k + 1] *= dm; this.vel[k + 2] *= dm;
      this.vel[k + 1] += this.gr[i] * dt;
      this.pos[k] += this.vel[k] * dt;
      this.pos[k + 1] += this.vel[k + 1] * dt;
      this.pos[k + 2] += this.vel[k + 2] * dt;
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * r;
      this.alpha[i] = this.a0[i] * (this.fadeIn ? Math.min(r * 6, 1) * (1 - r) : Math.pow(1 - r, 2));
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.points);
    this.geo.dispose();
  }
}

export const CinematicOceanWorld: React.FC<CinematicOceanWorldProps> = ({
  timeOfDay = 'day',
  cameraMode = 'orbit',
  speed = 9.0,
  seaState = 1.0,
  triggerFireGuns = 0,
  triggerFireMissiles = 0,
}) => {
  const { camera, scene, gl } = useThree();

  const shipRef = useRef<SentinelExactShipRef>(null);
  const shipPosGroup = useRef<THREE.Group>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const muzzleFlashRef = useRef<THREE.PointLight>(null);

  // Particles
  const particlesRef = useRef<{
    smoke: Particles;
    fire: Particles;
    spray: Particles;
  } | null>(null);

  // Shells in flight
  const shellsRef = useRef<{ p: THREE.Vector3; v: THREE.Vector3; age: number }[]>([]);
  // Missiles in flight
  const missilesRef = useRef<{ m: THREE.Group; p: THREE.Vector3; v: THREE.Vector3; t: number; yaw: number; dir: THREE.Vector3 }[]>([]);

  // Simulation State (scaled to exact L=60 warship)
  const simState = useRef({
    time: 0,
    shipDist: 0,
    camTheta: 0.75,
    camPhi: 1.2,
    camR: 96,
    goalTheta: 0.75,
    goalPhi: 1.2,
    goalR: 96,
    goalX: 0,
    goalY: 5,
    goalZ: 0,
    camX: 0,
    camY: 5,
    camZ: 0,
    screenShake: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    smokeAcc: 0,
    sprayAcc: 0,
  });

  // Setup Particles
  useEffect(() => {
    const smoke = new Particles(scene, 3200, false, true);
    const fire = new Particles(scene, 1600, true, false);
    const spray = new Particles(scene, 2200, false, false);
    particlesRef.current = { smoke, fire, spray };

    return () => {
      smoke.dispose(scene);
      fire.dispose(scene);
      spray.dispose(scene);
    };
  }, [scene]);

  // Pointer Interaction
  useEffect(() => {
    const dom = gl.domElement;
    const s = simState.current;

    const onPointerDown = (e: PointerEvent) => {
      s.isDragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      dom.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.isDragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;

      if (cameraMode === 'bridge') {
        s.goalTheta = clamp(s.goalTheta - dx * 0.004, -1.7, 1.7);
        s.goalPhi = clamp(s.goalPhi - dy * 0.003, -0.3, 0.7);
      } else {
        s.goalTheta -= dx * 0.006;
        s.goalPhi = clamp(s.goalPhi - dy * 0.005, 0.12, 1.5);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      s.isDragging = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraMode !== 'bridge') {
        s.goalR = clamp(s.goalR * Math.exp(e.deltaY * 0.0012), 14, 190);
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl, cameraMode]);

  // Exact Camera Presets from warship.html
  const cameraConfigs = useMemo(
    () => ({
      orbit: { theta: 0.75, phi: 1.2, r: 96, tx: 0, ty: 5, tz: 0 },
      bow: { theta: 0.38, phi: 1.4, r: 42, tx: 0, ty: 6, tz: 12 },
      side: { theta: Math.PI / 2, phi: 1.42, r: 88, tx: 0, ty: 5, tz: 0 },
      stern: { theta: Math.PI + 0.4, phi: 1.3, r: 55, tx: 0, ty: 5, tz: -8 },
      top: { theta: 0, phi: 0.22, r: 105, tx: 0, ty: 2, tz: 0 },
      bridge: { theta: 0, phi: 0.05, r: 0, tx: 0, ty: 8.7, tz: 5.8 },
    }),
    []
  );

  useEffect(() => {
    const cfg = cameraConfigs[cameraMode] || cameraConfigs.orbit;
    const s = simState.current;
    s.goalTheta = cfg.theta;
    s.goalPhi = cfg.phi;
    s.goalR = cfg.r;
    s.goalX = cfg.tx;
    s.goalY = cfg.ty;
    s.goalZ = cfg.tz;
  }, [cameraMode, cameraConfigs]);

  // Audio Booms
  const playBoom = (vol = 0.95, low = 520, len = 1.4) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AudioCtx();
      const n = Math.floor(ac.sampleRate * (len || 1.4));
      const b = ac.createBuffer(1, n, ac.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const s = ac.createBufferSource();
      s.buffer = b;
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = low;
      const g = ac.createGain();
      g.gain.value = vol;
      s.connect(f);
      f.connect(g);
      g.connect(ac.destination);
      s.start();
    } catch {}
  };

  // Gun Fire Action (Fires all 3 triple 16" turrets)
  useEffect(() => {
    if (triggerFireGuns > 0) {
      simState.current.screenShake = 0.85;
      playBoom(0.95, 520, 1.6);

      if (shipRef.current) {
        shipRef.current.recoilAll();
      }

      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.intensity = 28;
      }

      // Fire muzzle flash and shells from the 3 turret positions
      const turretPositions = [
        new V3(0, 4.5, 27),
        new V3(0, 5.8, 19),
        new V3(0, 4.5, -27),
      ];

      turretPositions.forEach((pos, ti) => {
        setTimeout(() => {
          playBoom(0.45, 420, 1.2);
          const parts = particlesRef.current;
          const d = ti === 2 ? new V3(0, 0.15, -1).normalize() : new V3(0, 0.15, 1).normalize();

          if (parts) {
            for (let i = 0; i < 16; i++) {
              parts.fire.emit(
                pos.x, pos.y, pos.z,
                d.x * rnd(10, 30) + rnd(-3, 3),
                d.y * rnd(10, 30) + rnd(-3, 3),
                d.z * rnd(10, 30) + rnd(-3, 3),
                rnd(0.1, 0.28),
                rnd(0.6, 1.2) * 2,
                rnd(2, 4.5),
                1, 1, 0.72, 0.3
              );
            }
            for (let i = 0; i < 10; i++) {
              parts.smoke.emit(
                pos.x, pos.y, pos.z,
                d.x * rnd(2, 8) + rnd(-1, 1),
                d.y * rnd(2, 8) + rnd(0, 1.5),
                d.z * rnd(2, 8) + rnd(-1, 1) - speed,
                rnd(3, 4.5),
                rnd(1.5, 2.5) * 1.3,
                rnd(7, 11),
                0.5, 0.78, 0.78, 0.76, 0.3, 0.6
              );
            }
          }

          // Launch 3 shells per turret
          [-1.0, 0, 1.0].forEach((ox) => {
            shellsRef.current.push({
              p: pos.clone().add(new V3(ox, 0, 0)),
              v: d.clone().multiplyScalar(70).add(new V3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, 0)),
              age: 0,
            });
          });
        }, ti * 280);
      });
    }
  }, [triggerFireGuns, speed]);

  // Missile Launch Action (Fires 4 missiles from VLS)
  useEffect(() => {
    if (triggerFireMissiles > 0) {
      simState.current.screenShake = 0.65;
      playBoom(0.6, 900, 1.3);

      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.intensity = 15;
      }

      for (let k = 0; k < 4; k++) {
        setTimeout(() => {
          const rx = rnd(-2, 2);
          const rz = 9.5 + rnd(-1, 1);
          const p = new V3(rx, 3.2, rz);

          const m = new T.Group();
          const body = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 2.0, 10).rotateX(Math.PI / 2), new T.MeshStandardMaterial({ color: 0xe0e5e9 }));
          const nose = new T.Mesh(new T.ConeGeometry(0.13, 0.6, 10).rotateX(Math.PI / 2).translate(0, 0, 1.3), new T.MeshStandardMaterial({ color: 0x2a2f35 }));
          m.add(body);
          m.add(nose);
          m.position.copy(p);
          scene.add(m);

          missilesRef.current.push({
            m,
            p: p.clone(),
            v: new V3(0, 10, 0),
            t: 0,
            yaw: rnd(-0.45, 0.45),
            dir: new V3(0, 1, 0),
          });

          const parts = particlesRef.current;
          if (parts) {
            for (let i = 0; i < 14; i++) {
              parts.fire.emit(p.x, p.y, p.z, rnd(-3, 3), rnd(2, 9), rnd(-3, 3), rnd(0.2, 0.5), 1.5, 4, 1, 1, 0.75, 0.35, 0, 2);
            }
            for (let i = 0; i < 12; i++) {
              parts.smoke.emit(p.x, p.y + 0.3, p.z, rnd(-4, 4), rnd(1, 5), rnd(-4, 4) - speed, rnd(3, 5), 2, 9, 0.55, 0.9, 0.9, 0.9, 0.4, 0.8);
            }
          }
        }, k * 380);
      }
    }
  }, [triggerFireMissiles, scene, speed]);

  // 1. SKY SPHERE SHADER (EXACT FORMULA)
  const skyMat = useMemo(() => {
    const curP = PRESETS[timeOfDay];
    return new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: curP.top.clone() },
        uHor: { value: curP.hor.clone() },
        uSun: { value: curP.sunDir.clone() },
        uSunCol: { value: curP.sunCol.clone() },
        uCloud: { value: curP.cloud.clone() },
        uStars: { value: curP.stars },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vD;
        void main(){
          vD = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop, uHor, uSun, uSunCol, uCloud;
        uniform float uStars, uTime;
        varying vec3 vD;
        ${NOISE_GLSL}
        float hash3(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
        void main(){
          vec3 d = normalize(vD);
          float h = max(d.y, 0.0);
          vec3 col = mix(uHor, uTop, pow(h, 0.55));
          float sd = max(dot(d, uSun), 0.0);
          col += uSunCol * (pow(sd, 900.0) * 6.0 + pow(sd, 60.0) * 0.6 + pow(sd, 6.0) * 0.18);
          col += uSunCol * 0.25 * pow(sd, 3.0) * (1.0 - h) * (1.0 - h);
          if(d.y > 0.0){
            vec2 uv = d.xz / (d.y + 0.12) * 0.55 + vec2(uTime * 0.004, 0.0);
            float c = fbm(uv * 2.2);
            c = smoothstep(0.5, 0.82, c) * smoothstep(0.0, 0.18, d.y);
            col = mix(col, uCloud * (0.8 + 0.2 * sd), c * 0.7);
            float s = step(0.9972, hash3(floor(d * 260.0)));
            col += vec3(s) * uStars * smoothstep(0.05, 0.3, d.y) * (1.0 - c);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, [timeOfDay]);

  // 2. OCEAN WATER SHADER (EXACT 900x900 FORMULA WITH FOAM & WAKE)
  const waterMat = useMemo(() => {
    const curP = PRESETS[timeOfDay];
    return new T.ShaderMaterial({
      fog: false,
      uniforms: {
        uTime: { value: 0 },
        uShip: { value: 0 },
        uAmp: { value: seaState },
        uSpeedN: { value: speed / 14 },
        uLum: { value: curP.lum },
        uDeep: { value: curP.deep.clone() },
        uShal: { value: curP.shal.clone() },
        uHor: { value: curP.hor.clone() },
        uTop: { value: curP.top.clone() },
        uSun: { value: curP.sunDir.clone() },
        uSunCol: { value: curP.sunCol.clone() },
      },
      vertexShader: `
        uniform float uTime, uShip, uAmp;
        varying vec3 vW; varying vec2 vG; varying float vH; varying vec2 vP;
        ${WAVE_GLSL}
        void main(){
          vec4 w = modelMatrix * vec4(position, 1.0);
          vec2 p = vec2(w.x, w.z + uShip);
          vec2 g; float h = height(p, uTime, uAmp, g);
          vP = vec2(w.x, w.z); vG = g; vH = h; w.y += h; vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: `
        uniform float uTime, uShip, uAmp, uSpeedN, uLum;
        uniform vec3 uDeep, uShal, uHor, uTop, uSun, uSunCol;
        varying vec3 vW; varying vec2 vG; varying float vH; varying vec2 vP;
        ${NOISE_GLSL}
        float prof(float t){
          if(t < 0.18) return 0.78 + 0.22 * sin(t / 0.18 * 1.5708);
          if(t < 0.62) return 1.0;
          float u = (t - 0.62) / 0.38;
          return pow(max(1.0 - pow(u, 1.7), 0.0), 0.62);
        }
        vec3 skyCol(vec3 r){
          float sd = max(dot(r, uSun), 0.0);
          vec3 c = mix(uHor, uTop, pow(clamp(r.y, 0.0, 1.0), 0.55));
          c += uSunCol * (pow(sd, 60.0) * 0.6 + pow(sd, 6.0) * 0.18);
          return c;
        }
        void main(){
          vec2 p = vec2(vP.x, vP.y + uShip);
          vec2 rip = vec2(noise(p * 1.9 + uTime * 0.5) - 0.5, noise(p * 1.9 + 7.3 - uTime * 0.45) - 0.5) * 0.28
                   + vec2(noise(p * 5.0 - uTime * 0.8) - 0.5, noise(p * 5.0 + 3.1 + uTime * 0.7) - 0.5) * 0.12;
          vec3 n = normalize(vec3(-vG.x - rip.x, 1.0, -vG.y - rip.y));
          vec3 V = normalize(cameraPosition - vW);
          float fres = 0.03 + 0.97 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
          vec3 R = reflect(-V, n); R.y = abs(R.y);
          vec3 refl = skyCol(R);
          float sd = max(dot(R, uSun), 0.0);
          float spec = pow(sd, 420.0) * 3.0 + pow(sd, 40.0) * 0.22;
          float k = clamp(vH / (1.2 * uAmp + 0.001) + 0.5, 0.0, 1.0);
          vec3 base = mix(uDeep, uShal, k * 0.65);
          float diff = max(dot(n, uSun), 0.0);
          vec3 col = base * (0.7 + 0.5 * diff);
          col = mix(col, refl, fres) + uSunCol * spec;

          // Kelvin Wake & Foam (L=60 scale)
          float zz = vP.y;
          float ax = abs(vP.x);
          float tt = clamp((zz + 30.0) / 60.0, 0.0, 1.0);
          float hb = 4.1 * prof(tt);
          float inS = step(-31.0, zz) * step(zz, 31.0);
          float dd = ax - hb;
          vec2 q = vec2(vP.x, vP.y + uShip);
          float fn = fbm(q * 1.2 + vec2(0.0, uTime * 0.15));
          float fn2 = noise(q * 3.5 - uTime * 0.3);
          float hullF = (1.0 - smoothstep(0.0, 1.6 + fn * 1.2, dd)) * inS;
          float bowF = smoothstep(12.0, 30.0, zz) * (1.0 - smoothstep(0.0, 5.5, dd)) * inS;
          float zb = max(-zz - 30.0, 0.0);
          float inW = step(30.0, -zz);
          float wake = inW * (1.0 - smoothstep(0.0, 3.2 + zb * 0.17, ax)) * exp(-zb * 0.011);
          float kel = inW * exp(-pow((ax - (3.0 + zb * 0.33)) / (1.0 + zb * 0.03), 2.0)) * exp(-zb * 0.014) * 0.8;
          float foam = (hullF * 0.7 + bowF * 0.9 + wake + kel) * (0.25 + 0.75 * uSpeedN);
          float mask = mix(0.35, 1.0, smoothstep(0.3, 0.6, fn + 0.3 * fn2));
          foam = clamp(foam * 1.2, 0.0, 1.0) * mask;
          float cf = smoothstep(0.55, 0.95, vH / (0.825 * uAmp + 0.001)) * (0.4 + 0.6 * fn2) * 0.8;
          col = mix(col, vec3(0.92, 0.97, 1.0) * uLum * 1.1, clamp(foam + cf, 0.0, 1.0));

          float dist = length(cameraPosition - vW);
          col = mix(col, uHor, smoothstep(200.0, 430.0, dist));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, [timeOfDay, seaState, speed]);

  // Frame Loop (Buoyancy, Camera Lerp, Emitters, Shells)
  useFrame((_, delta) => {
    const s = simState.current;
    const dt = Math.min(delta, 0.05);
    s.time += dt;
    s.shipDist += speed * dt;

    if (cameraMode === 'orbit' && !s.isDragging) {
      s.goalTheta += dt * 0.08;
    }

    waterMat.uniforms.uTime.value = s.time;
    waterMat.uniforms.uShip.value = s.shipDist;
    waterMat.uniforms.uAmp.value = seaState;
    waterMat.uniforms.uSpeedN.value = speed / 14;
    skyMat.uniforms.uTime.value = s.time;

    // Physical Buoyancy on Wave Swell (Exact 60m formulas)
    const hB = calcWaveH(0, 27, s.shipDist, s.time, seaState);
    const hS = calcWaveH(0, -27, s.shipDist, s.time, seaState);
    const hP = calcWaveH(4, 0, s.shipDist, s.time, seaState);
    const hT = calcWaveH(-4, 0, s.shipDist, s.time, seaState);

    const pitchTarget = Math.atan((hS - hB) / 54) * 0.8;
    const rollTarget = Math.atan((hP - hT) / 8) * 0.7;
    const heaveTarget = ((hB + hS + hP + hT) / 4) * 0.8;

    const k = Math.min(1, dt * 5);
    if (shipPosGroup.current) {
      shipPosGroup.current.rotation.x += (pitchTarget - shipPosGroup.current.rotation.x) * k;
      shipPosGroup.current.rotation.z += (rollTarget - shipPosGroup.current.rotation.z) * k;
      shipPosGroup.current.position.y += (heaveTarget - shipPosGroup.current.position.y) * k;
    }

    // Emitters: Funnels Smoke and Bow Spray
    const parts = particlesRef.current;
    if (parts) {
      // Funnel smoke
      s.smokeAcc += dt * 36;
      while (s.smokeAcc >= 1) {
        s.smokeAcc--;
        [-8.3, -13.0].forEach((fz) => {
          const sy = (shipPosGroup.current?.position.y || 0) + 10.0;
          const c = rnd(0.13, 0.22);
          parts.smoke.emit(
            rnd(-0.5, 0.5), sy, fz + rnd(-0.8, 0.8),
            rnd(-0.1, 0.5) + 0.3, rnd(1.7, 2.7), -speed * 0.97 + rnd(-0.4, 0.4),
            4.2, 1.3, 6.5, 0.55,
            c, c, c * 1.05, 0.15, 0.1
          );
        });
      }

      // Bow spray
      const f = speed / 14;
      s.sprayAcc += dt * (18 + 110 * f);
      while (s.sprayAcc >= 1) {
        s.sprayAcc--;
        const sg = Math.random() < 0.5 ? -1 : 1;
        const bx = sg * rnd(1.9, 2.5);
        const by = (shipPosGroup.current?.position.y || 0) + 0.25;
        const bz = rnd(22, 27.5);
        parts.spray.emit(
          bx, by, bz,
          sg * rnd(1.2, 3.2), rnd(1.5, 3.5 + f * 3.5), -speed * 0.85 + rnd(-1, 1.5),
          rnd(0.5, 1.0), 0.5, 1.3, 0.55,
          0.95, 0.98, 1, -9, 0.4
        );
      }

      parts.smoke.update(dt);
      parts.fire.update(dt);
      parts.spray.update(dt);
    }

    // Update Shells
    for (let i = shellsRef.current.length - 1; i >= 0; i--) {
      const sh = shellsRef.current[i];
      sh.age += dt;
      sh.v.y -= 9.8 * dt;
      sh.p.addScaledVector(sh.v, dt);

      if (parts) {
        parts.fire.emit(sh.p.x, sh.p.y, sh.p.z, 0, 0, 0, 0.25, 0.55, 0.1, 0.8, 1, 0.75, 0.35);
      }

      if (sh.p.y < 0 || sh.age > 8) {
        if (parts && sh.p.y < 0.5) {
          playBoom(0.25, 260, 0.9);
          for (let k = 0; k < 28; k++) {
            const a = (k / 28) * Math.PI * 2;
            const r = rnd(5, 8);
            parts.spray.emit(
              sh.p.x, 0.2, sh.p.z,
              Math.cos(a) * r, rnd(0.5, 2), Math.sin(a) * r - speed * 0.9,
              rnd(0.7, 1.1), 1.2, 2.4, 0.5, 0.9, 0.95, 0.98, -6, 1.2
            );
          }
        }
        shellsRef.current.splice(i, 1);
      }
    }

    // Update Missiles
    for (let i = missilesRef.current.length - 1; i >= 0; i--) {
      const mis = missilesRef.current[i];
      mis.t += dt;

      if (mis.t < 0.75) {
        mis.v.y += 26 * dt;
      } else {
        const goalV = new V3(Math.sin(mis.yaw) * 0.55, 0.32, 0.95).normalize().multiplyScalar(78);
        mis.v.lerp(goalV, Math.min(1, dt * 2.2));
      }

      mis.p.addScaledVector(mis.v, dt);
      mis.dir.copy(mis.v).normalize();
      mis.m.position.copy(mis.p);
      mis.m.quaternion.setFromUnitVectors(new V3(0, 0, 1), mis.dir);

      if (parts) {
        const tx = mis.p.x - mis.dir.x * 1.2;
        const ty = mis.p.y - mis.dir.y * 1.2;
        const tz = mis.p.z - mis.dir.z * 1.2;
        parts.fire.emit(tx, ty, tz, -mis.dir.x * rnd(8, 16), -mis.dir.y * rnd(8, 16), -mis.dir.z * rnd(8, 16), rnd(0.12, 0.25), 1.0, 0.3, 0.9, 1, 0.7, 0.3);
        parts.smoke.emit(tx, ty, tz, rnd(-0.6, 0.6), rnd(-0.3, 0.8), rnd(-0.6, 0.6) - speed, rnd(4, 6), 0.8, 4.5, 0.4, 0.9, 0.9, 0.92, 0, 0.4);
      }

      if (mis.t > 5.5 || mis.p.z > 420) {
        if (parts) {
          playBoom(0.5, 600, 1.2);
          for (let k = 0; k < 30; k++) {
            parts.fire.emit(mis.p.x, mis.p.y, mis.p.z, rnd(-14, 14), rnd(-14, 14), rnd(-14, 14), rnd(0.3, 0.8), rnd(3, 6), rnd(8, 15), 1, 1, 0.6, 0.25);
          }
        }
        scene.remove(mis.m);
        missilesRef.current.splice(i, 1);
      }
    }

    // Camera Lerp
    const ke = 1 - Math.exp(-dt * 5.0);
    s.camTheta += (s.goalTheta - s.camTheta) * ke;
    s.camPhi += (s.goalPhi - s.camPhi) * ke;
    s.camR += (s.goalR - s.camR) * ke;
    s.camX += (s.goalX - s.camX) * ke;
    s.camY += (s.goalY - s.camY) * ke;
    s.camZ += (s.goalZ - s.camZ) * ke;

    if (cameraMode === 'bridge') {
      const bY = (shipPosGroup.current?.position.y || 0) + 8.7;
      camera.position.set(0, bY, 5.8);
      const lookDir = new V3(
        Math.sin(s.camTheta) * Math.cos(s.camPhi),
        Math.sin(s.camPhi),
        Math.cos(s.camTheta) * Math.cos(s.camPhi)
      );
      camera.lookAt(new V3(0, bY, 5.8).add(lookDir.multiplyScalar(40)));
    } else {
      const sp = Math.sin(s.camPhi);
      const cp = Math.cos(s.camPhi);
      const cx = s.camX + s.camR * sp * Math.sin(s.camTheta);
      const cy = s.camY + (shipPosGroup.current?.position.y || 0) * 0.5 + s.camR * cp;
      const cz = s.camZ + s.camR * sp * Math.cos(s.camTheta);

      if (s.screenShake > 0.005) {
        camera.position.set(
          cx + (Math.random() - 0.5) * s.screenShake * 1.5,
          cy + (Math.random() - 0.5) * s.screenShake * 1.5,
          cz + (Math.random() - 0.5) * s.screenShake * 1.5
        );
        s.screenShake *= Math.exp(-dt * 4.0);
      } else {
        camera.position.set(cx, cy, cz);
      }
      camera.lookAt(s.camX, s.camY + (shipPosGroup.current?.position.y || 0) * 0.5, s.camZ);
    }

    // Flash light decay
    if (muzzleFlashRef.current && muzzleFlashRef.current.intensity > 0.01) {
      muzzleFlashRef.current.intensity *= Math.exp(-dt * 14.0);
    }
  });

  const curPreset = PRESETS[timeOfDay];

  return (
    <>
      <directionalLight
        ref={sunLightRef}
        color={curPreset.sunCol}
        intensity={curPreset.sunInt}
        position={[curPreset.sunDir.x * 130, curPreset.sunDir.y * 130, curPreset.sunDir.z * 130]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={10}
        shadow-camera-far={320}
        shadow-bias={-0.0004}
      />
      <hemisphereLight
        ref={hemiLightRef}
        color={curPreset.hSky}
        groundColor={curPreset.hGnd}
        intensity={curPreset.hInt}
      />

      <pointLight ref={muzzleFlashRef} color={0xffb060} intensity={0} distance={60} position={[0, 6, 20]} />

      {/* Sky Sphere */}
      <mesh material={skyMat} frustumCulled={false} renderOrder={-10}>
        <sphereGeometry args={[1400, 32, 16]} />
      </mesh>

      {/* Ocean Water Plane (900x900) */}
      <mesh material={waterMat} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} position={[0, 0, 0]}>
        <planeGeometry args={[900, 900, 450, 450]} />
      </mesh>

      {/* The Exact SENTINEL Warship Group */}
      <group ref={shipPosGroup} position={[0, 0, 0]}>
        <SentinelExactShip ref={shipRef} timeOfDay={timeOfDay} />
      </group>
    </>
  );
};
