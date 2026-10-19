import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const T = THREE;
const V3 = T.Vector3;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export interface SentinelExactShipRef {
  ship: THREE.Group;
  funnels: { g: THREE.Group; top: THREE.Object3D }[];
  turrets: any[];
  sideMounts: any[];
  flags: any[];
  flashLights: THREE.PointLight[];
  recoilAll: () => void;
}

interface SentinelExactShipProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  timeOfDay?: 'day' | 'dusk' | 'night';
}

export const SentinelExactShip = React.forwardRef<SentinelExactShipRef, SentinelExactShipProps>(
  ({ scale = 1.0, position = [0, 0, 0], rotation = [0, 0, 0], timeOfDay = 'day' }, ref) => {
    const shipGroupRef = useRef<THREE.Group>(null);

    // References to animated parts
    const animRef = useRef<{
      turrets: any[];
      sideMounts: any[];
      radarA: THREE.Group | null;
      radarB: THREE.Group | null;
      rotor: THREE.Group | null;
      tailRotor: THREE.Group | null;
      ciws: any[];
      flags: any[];
      funnels: { g: THREE.Group; top: THREE.Object3D }[];
      nightMats: THREE.MeshStandardMaterial[];
      navMat: {
        red: THREE.MeshStandardMaterial;
        green: THREE.MeshStandardMaterial;
        white: THREE.MeshStandardMaterial;
      };
    }>({
      turrets: [],
      sideMounts: [],
      radarA: null,
      radarB: null,
      rotor: null,
      tailRotor: null,
      ciws: [],
      flags: [],
      funnels: [],
      nightMats: [],
      navMat: {
        red: new T.MeshStandardMaterial({ color: 0x300000, emissive: 0xff1a1a, emissiveIntensity: 0.8 }),
        green: new T.MeshStandardMaterial({ color: 0x003008, emissive: 0x1aff4a, emissiveIntensity: 0.8 }),
        white: new T.MeshStandardMaterial({ color: 0x333333, emissive: 0xffffff, emissiveIntensity: 0.8 }),
      },
    });

    // Expose funnels and turrets for firing/smoke effects
    React.useImperativeHandle(ref, () => ({
      ship: shipGroupRef.current!,
      funnels: animRef.current.funnels,
      turrets: animRef.current.turrets,
      sideMounts: animRef.current.sideMounts,
      flags: animRef.current.flags,
      flashLights: [],
      recoilAll: () => {
        animRef.current.turrets.forEach((tu) => {
          if (tu.recoil) tu.recoil.forEach((_: any, i: number) => (tu.recoil[i] = 1));
        });
      },
    }));

    // Build the exact warship structure from warship.html verbatim
    const exactShipGroup = useMemo(() => {
      const ship = new T.Group();
      const nightMats: THREE.MeshStandardMaterial[] = [];
      const anim = animRef.current;
      anim.nightMats = nightMats;
      anim.turrets = [];
      anim.sideMounts = [];
      anim.ciws = [];
      anim.flags = [];
      anim.funnels = [];

      /* ============================ ship dimensions ============================ */
      const L = 60, HB = 4.6;
      const prof = (t: number) => {
        if (t < 0.18) return 0.78 + 0.22 * Math.sin((t / 0.18) * Math.PI / 2);
        if (t < 0.62) return 1;
        const u = (t - 0.62) / 0.38;
        return Math.pow(Math.max(1 - Math.pow(u, 1.7), 0), 0.62);
      };
      const deckYt = (t: number) => 2.6 + 1.6 * Math.pow(clamp(t, 0, 1), 3.2);
      const keelYt = (t: number) => -2.0 * (1 - Math.pow(t, 5)) * (0.72 + 0.28 * Math.min(t / 0.15, 1));
      const zOf = (t: number) => -L / 2 + L * t;
      const deckAt = (z: number) => deckYt((z + L / 2) / L);

      function hullPt(t: number, a: number) {
        const B = HB * prof(t), s = Math.sin(a), dY = deckYt(t), kY = keelYt(t);
        const flare = 1 + 0.14 * Math.pow(t, 2.5) * (1 - s);
        return new V3(B * Math.cos(a) * flare, dY - (dY - kY) * Math.pow(s, 0.8), zOf(t) - 3.2 * Math.pow(t, 7) * Math.pow(s, 1.2));
      }

      function hullSide(z: number, y: number) {
        const t = (z + L / 2) / L, B = HB * prof(t), dY = deckYt(t), kY = keelYt(t);
        const fx = (yy: number) => {
          const s = Math.pow(clamp((dY - yy) / (dY - kY), 0, 1), 1 / 0.8);
          const c = Math.sqrt(Math.max(1 - s * s, 0));
          return B * c * (1 + 0.14 * Math.pow(t, 2.5) * (1 - s));
        };
        const dx = (fx(y + 0.15) - fx(y - 0.15)) / 0.3;
        return { x: fx(y), tilt: Math.atan2(-dx, 1) };
      }

      /* ============================ materials & textures ============================ */
      const std = (c: number, r: number, m: number) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
      const M = {
        gray: std(0x7f888f, 0.6, 0.3),
        gray2: std(0x626b72, 0.65, 0.3),
        light: std(0x9aa3aa, 0.55, 0.3),
        dark: std(0x2a2f35, 0.7, 0.4),
        black: std(0x15181b, 0.8, 0.2),
        roof: std(0x59626a, 0.75, 0.3),
        turret: std(0x737c83, 0.55, 0.35),
        barrel: std(0x30353a, 0.45, 0.6),
        white: std(0xe0e5e9, 0.6, 0.1),
        orange: std(0xdb5d24, 0.6, 0.1),
        red: std(0xa8312a, 0.6, 0.2),
        glass: std(0x0b1620, 0.12, 0.8),
        rail: std(0xa9b0b6, 0.5, 0.4),
        yellow: std(0xd9b43a, 0.6, 0.2),
        heli: std(0x2f3b44, 0.5, 0.3),
      };

      function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void, repeat?: boolean) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (ctx) draw(ctx, w, h);
        const t = new T.CanvasTexture(c);
        if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
        return t;
      }

      function textTex(str: string, w: number, h: number, fg: string, bg: string | null, font: string) {
        return canvasTex(w, h, (g, W, H) => {
          if (bg) {
            g.fillStyle = bg;
            g.fillRect(0, 0, W, H);
          }
          g.fillStyle = fg;
          g.font = font;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(str, W / 2, H / 2 + 4);
        });
      }

      const deckTex = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#5d666d';
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 2600; i++) {
          g.fillStyle = (Math.random() < 0.5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (Math.random() * 0.07) + ')';
          g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
        g.fillStyle = 'rgba(0,0,0,.38)';
        for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 2, h);
      }, true);
      deckTex.repeat.set(3, 9);
      const deckMat = new T.MeshStandardMaterial({ map: deckTex, roughness: 0.85, metalness: 0.1, side: T.DoubleSide });

      function facadeTex(kind: 'cell' | 'band') {
        const winRect = (g: CanvasRenderingContext2D, w: number, h: number) =>
          kind === 'band' ? g.fillRect(2, 34, w - 4, 58) : g.fillRect(22, 38, 84, 46);
        const map = canvasTex(128, 128, (g, w, h) => {
          g.fillStyle = '#8d969d';
          g.fillRect(0, 0, w, h);
          g.fillStyle = 'rgba(0,0,0,.14)';
          g.fillRect(0, h - 6, w, 6);
          g.fillRect(0, 0, 3, h);
          g.fillStyle = '#0d1c28';
          winRect(g, w, h);
          g.fillStyle = 'rgba(120,150,170,.35)';
          if (kind === 'band') {
            g.fillRect(2, 34, w - 4, 8);
            for (let x = 18; x < w; x += 22) g.fillRect(x, 34, 3, 58);
          } else {
            g.fillRect(22, 38, 84, 8);
            for (let x = 42; x < 106; x += 21) g.fillRect(x, 38, 2, 46);
          }
        }, true);
        const em = canvasTex(128, 128, (g, w, h) => {
          g.fillStyle = '#000';
          g.fillRect(0, 0, w, h);
          g.fillStyle = '#ffcf85';
          winRect(g, w, h);
          g.fillStyle = '#000';
          if (kind === 'band') {
            for (let x = 18; x < w; x += 22) g.fillRect(x, 34, 3, 58);
          } else {
            for (let x = 42; x < 106; x += 21) g.fillRect(x, 38, 2, 46);
          }
        }, true);
        return { map, em };
      }

      const facades = { cell: facadeTex('cell'), band: facadeTex('band') };

      function mk(geo: THREE.BufferGeometry, mat: THREE.Material, x?: number, y?: number, z?: number, parent?: THREE.Object3D) {
        const m = new T.Mesh(geo, mat);
        m.position.set(x || 0, y || 0, z || 0);
        m.castShadow = true;
        m.receiveShadow = true;
        (parent || ship).add(m);
        return m;
      }

      function house(w: number, h: number, d: number, kind: 'cell' | 'band', x: number, y: number, z: number, parent?: THREE.Object3D) {
        const f = facades[kind];
        const side = (rw: number) => {
          const m = f.map.clone(), e = f.em.clone();
          [m, e].forEach((t) => {
            t.needsUpdate = true;
            t.repeat.set(
              kind === 'band' ? Math.max(1, Math.round(rw / 5)) : Math.max(1, Math.round(rw / 2.4)),
              kind === 'band' ? 1 : Math.max(1, Math.round(h / 1.3))
            );
          });
          const mat = new T.MeshStandardMaterial({
            map: m,
            emissiveMap: e,
            emissive: 0xffffff,
            emissiveIntensity: 0,
            roughness: 0.6,
            metalness: 0.25,
          });
          nightMats.push(mat);
          return mat;
        };
        const sx = side(d), sz = side(w);
        const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), [sx, sx, M.roof, M.roof, sz, sz]);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (parent || ship).add(mesh);
        return mesh;
      }

      const _up = new V3(0, 1, 0);
      function strut(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, parent?: THREE.Object3D) {
        const d = new V3().subVectors(b, a), len = d.length();
        const m = new T.Mesh(new T.CylinderGeometry(r, r, len, 6), mat);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(_up, d.normalize());
        m.castShadow = true;
        (parent || ship).add(m);
        return m;
      }

      /* ============================ hull ============================ */
      const N = 96, Mr = 56, pos: number[] = [], col: number[] = [], idx: number[] = [];
      const cTop = new T.Color(0x80898f), cBot = new T.Color(0x5a1612);
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        for (let j = 0; j <= Mr; j++) {
          const p = hullPt(t, (j / Mr) * Math.PI);
          pos.push(p.x, p.y, p.z);
          const k = smooth(-0.35, 0.12, p.y);
          col.push(lerp(cBot.r, cTop.r, k), lerp(cBot.g, cTop.g, k), lerp(cBot.b, cTop.b, k));
        }
      }
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < Mr; j++) {
          const a = i * (Mr + 1) + j, b = a + 1, c = a + Mr + 1, d = c + 1;
          idx.push(a, b, c, b, d, c);
        }
      }
      // stern transom cap
      const cIdx = pos.length / 3;
      const p0 = hullPt(0, 0), p1 = hullPt(0, Math.PI / 2);
      pos.push(0, (p0.y + p1.y) / 2, -L / 2);
      col.push(0.48, 0.5, 0.52);
      for (let j = 0; j < Mr; j++) idx.push(cIdx, j + 1, j);

      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const hull = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.25, side: T.DoubleSide }));
      hull.castShadow = true;
      hull.receiveShadow = true;
      ship.add(hull);

      // deck
      const dp: number[] = [], du: number[] = [], di: number[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, a = hullPt(t, 0), b = hullPt(t, Math.PI);
        dp.push(a.x, a.y + 0.01, a.z, b.x, b.y + 0.01, b.z);
        du.push(1, t, 0, t);
      }
      for (let i = 0; i < N; i++) {
        const a = i * 2;
        di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const dg = new T.BufferGeometry();
      dg.setAttribute('position', new T.Float32BufferAttribute(dp, 3));
      dg.setAttribute('uv', new T.Float32BufferAttribute(du, 2));
      dg.setIndex(di);
      dg.computeVertexNormals();
      const deck = new T.Mesh(dg, deckMat);
      deck.receiveShadow = true;
      ship.add(deck);

      /* hull markings */
      const numTex = textTex('57', 256, 128, '#f2f2f2', null, 'bold 104px sans-serif');
      const plateMat = new T.MeshBasicMaterial({ map: numTex, transparent: true, depthWrite: false, side: T.DoubleSide });
      [-1, 1].forEach((sg) => {
        const z = 15.5, y = 1.7, s = hullSide(z, y);
        const outer = new T.Group();
        outer.position.set(sg * (s.x + 0.05), y, z);
        outer.rotation.z = sg * s.tilt;
        if (sg < 0) outer.scale.x = -1;
        const m = new T.Mesh(new T.PlaneGeometry(3.4, 1.7), plateMat);
        m.rotation.y = Math.PI / 2;
        outer.add(m);
        ship.add(outer);
      });
      const nameTex = textTex('SENTINEL', 512, 96, '#f2f2f2', null, 'bold 70px sans-serif');
      const nm = new T.Mesh(new T.PlaneGeometry(5.6, 1.05), new T.MeshBasicMaterial({ map: nameTex, transparent: true, depthWrite: false }));
      nm.position.set(0, 1.5, -L / 2 - 0.04);
      nm.rotation.y = Math.PI;
      ship.add(nm);

      /* railings */
      const bars: [THREE.Vector3, THREE.Vector3, number][] = [];
      for (const sg of [-1, 1]) {
        const pts: THREE.Vector3[] = [];
        for (let z = -29; z <= 29.6; z += 1.5) {
          const p = hullPt((z + L / 2) / L, 0);
          pts.push(new V3(sg * Math.abs(p.x) * 0.97, p.y, p.z));
        }
        pts.forEach((p) => bars.push([p.clone(), p.clone().add(new V3(0, 1.0, 0)), 0.035]));
        for (let k = 0; k < pts.length - 1; k++) {
          for (const h of [0.5, 1.0]) {
            bars.push([pts[k].clone().add(new V3(0, h, 0)), pts[k + 1].clone().add(new V3(0, h, 0)), 0.028]);
          }
        }
      }
      const inst = new T.InstancedMesh(new T.CylinderGeometry(1, 1, 1, 5), M.rail, bars.length);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), p = new V3(), s = new V3(), d = new V3();
      bars.forEach((b, i) => {
        d.subVectors(b[1], b[0]);
        const len = d.length();
        q.setFromUnitVectors(_up, d.normalize());
        p.addVectors(b[0], b[1]).multiplyScalar(0.5);
        s.set(b[2], len, b[2]);
        m4.compose(p, q, s);
        inst.setMatrixAt(i, m4);
      });
      inst.castShadow = true;
      ship.add(inst);

      /* ============================ turrets ============================ */
      const GEO = {
        barrel: new T.CylinderGeometry(0.14, 0.2, 6.4, 12).rotateX(Math.PI / 2).translate(0, 0, 3.2),
        sleeve: new T.CylinderGeometry(0.32, 0.32, 1.7, 14).rotateX(Math.PI / 2).translate(0, 0, 0.85),
        muz: new T.CylinderGeometry(0.24, 0.24, 0.55, 12).rotateX(Math.PI / 2).translate(0, 0, 6.15),
        ring: new T.CylinderGeometry(0.22, 0.22, 0.16, 12).rotateX(Math.PI / 2).translate(0, 0, 5.4),
      };

      function makeTurret(nb: number, sc: number) {
        const g = new T.Group();
        mk(new T.CylinderGeometry(2.05 * sc, 2.3 * sc, 1.0 * sc, 28), M.gray2, 0, 0.5 * sc, 0, g);
        const rot = new T.Group();
        rot.position.y = 1.0 * sc;
        g.add(rot);
        const sh = new T.Shape();
        const PP = [
          [-1.5, -2.0], [1.5, -2.0], [1.85, -1.3], [1.85, 1.5],
          [1.15, 2.15], [-1.15, 2.15], [-1.85, 1.5], [-1.85, -1.3],
        ];
        PP.forEach((pt, i) => (i ? sh.lineTo(pt[0] * sc, pt[1] * sc) : sh.moveTo(pt[0] * sc, pt[1] * sc)));
        const geo = new T.ExtrudeGeometry(sh, {
          depth: 1.2 * sc,
          bevelEnabled: true,
          bevelSize: 0.12 * sc,
          bevelThickness: 0.12 * sc,
          bevelSegments: 2,
          steps: 1,
        });
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.12 * sc, 0);
        mk(geo, M.turret, 0, 0, 0, rot);
        mk(new T.BoxGeometry(3.2 * sc, 1.0 * sc, 0.5 * sc), M.gray2, 0, 0.75 * sc, 2.05 * sc, rot);
        mk(new T.BoxGeometry(0.9 * sc, 0.1 * sc, 0.9 * sc), M.dark, 0.7 * sc, 1.36 * sc, -0.4 * sc, rot);
        mk(new T.BoxGeometry(0.9 * sc, 0.1 * sc, 0.9 * sc), M.dark, -0.7 * sc, 1.36 * sc, -0.4 * sc, rot);
        if (sc > 0.5) {
          mk(new T.CylinderGeometry(0.16, 0.16, 3.8, 8).rotateZ(Math.PI / 2), M.gray2, 0, 1.52 * sc, -1.5 * sc, rot);
          mk(new T.SphereGeometry(0.22, 10, 8), M.dark, 1.9 * sc, 1.52 * sc, -1.5 * sc, rot);
          mk(new T.SphereGeometry(0.22, 10, 8), M.dark, -1.9 * sc, 1.52 * sc, -1.5 * sc, rot);
        }
        const gun = new T.Group();
        gun.position.set(0, 0.8 * sc, 2.15 * sc);
        gun.scale.setScalar(sc);
        rot.add(gun);
        const xs = nb === 3 ? [-1.0, 0, 1.0] : nb === 2 ? [-0.65, 0.65] : [0];
        const barrels: THREE.Group[] = [], tips: THREE.Object3D[] = [];
        xs.forEach((x) => {
          const bg = new T.Group();
          bg.position.x = x;
          gun.add(bg);
          mk(GEO.sleeve, M.barrel, 0, 0, 0, bg);
          mk(GEO.barrel, M.barrel, 0, 0, 0, bg);
          mk(GEO.muz, M.barrel, 0, 0, 0, bg);
          mk(GEO.ring, M.barrel, 0, 0, 0, bg);
          const tip = new T.Object3D();
          tip.position.z = 6.45;
          bg.add(tip);
          barrels.push(bg);
          tips.push(tip);
        });
        return { g, rot, gun, barrels, tips, recoil: xs.map(() => 0), sc };
      }

      function placeMain(z: number, yOff: number, sc: number, baseYaw: number, pedestal: number) {
        const tu = makeTurret(3, sc);
        const dy = deckAt(z);
        if (pedestal) mk(new T.CylinderGeometry(2.35, 2.6, pedestal, 28), M.gray2, 0, dy + pedestal / 2, z);
        tu.g.position.set(0, dy + yOff, z);
        ship.add(tu.g);
        (tu as any).base = baseYaw;
        (tu as any).phase = rnd(0, 6);
        (tu as any).main = true;
        anim.turrets.push(tu);
        return tu;
      }

      placeMain(22, 0, 0.95, 0, 0);
      placeMain(14.5, 1.25, 0.95, 0, 1.25);
      placeMain(-22, 0, 0.95, Math.PI, 0);

      [[6, 1], [1, 1], [-4, 1], [6, -1], [1, -1], [-4, -1]].forEach((a) => {
        const tu = makeTurret(2, 0.26);
        tu.g.position.set(a[1] * 3.85, deckAt(a[0]) + 0.02, a[0]);
        ship.add(tu.g);
        (tu as any).base = (a[1] * Math.PI) / 2;
        (tu as any).phase = rnd(0, 6);
        anim.sideMounts.push(tu);
      });

      /* ============================ superstructure ============================ */
      const DK = 2.55;
      house(6.8, 2.5, 12.5, 'cell', 0, DK, 0.5);
      house(5.6, 2.2, 8.6, 'cell', 0, 5.05, 1.5);
      house(5.0, 1.9, 5.0, 'band', 0, 7.25, 2.8);
      mk(new T.BoxGeometry(9.2, 0.22, 1.7), M.gray2, 0, 8.0, 3.3);
      mk(new T.BoxGeometry(5.5, 0.18, 5.5), M.gray2, 0, 9.25, 2.8);
      mk(new T.BoxGeometry(9.2, 0.5, 0.08), M.gray2, 0, 8.35, 4.15);
      for (let i = 0; i < 9; i++) {
        mk(new T.BoxGeometry(rnd(0.3, 0.8), rnd(0.3, 0.6), rnd(0.3, 0.8)), M.dark, rnd(-2.6, 2.6), 5.05 + 0.25, rnd(-4.8, -3.2));
      }
      mk(new T.BoxGeometry(1.4, 0.5, 1.4), M.dark, -1.6, 9.6, 1.0);
      mk(new T.BoxGeometry(1.4, 0.5, 1.4), M.dark, 1.6, 9.6, 1.0);

      /* funnels */
      [[-8.3, 1.0], [-13, 1.0]].forEach((f) => {
        const g = new T.Group();
        g.position.set(0, DK, f[0]);
        g.rotation.x = -0.09;
        ship.add(g);
        const body = mk(new T.CylinderGeometry(1, 1.12, 6.8, 28), M.gray, 0, 3.4, 0, g);
        body.scale.set(1.55, 1, 2.3);
        const band = mk(new T.CylinderGeometry(1.03, 1.03, 0.45, 28), M.red, 0, 5.5, 0, g);
        band.scale.set(1.57, 1, 2.32);
        const cap = mk(new T.CylinderGeometry(1.02, 1, 0.9, 28), M.black, 0, 7.0, 0, g);
        cap.scale.set(1.5, 1, 2.25);
        const grid = mk(new T.TorusGeometry(1, 0.05, 6, 28), M.dark, 0, 7.46, 0, g);
        grid.rotation.x = Math.PI / 2;
        grid.scale.set(1.5, 2.25, 1);
        const top = new T.Object3D();
        top.position.set(0, 7.6, 0);
        g.add(top);
        anim.funnels.push({ g, top });
      });

      /* foremast */
      const bz = 2.0, by = 9.35;
      strut(new V3(0, by, bz), new V3(0, by + 9.2, bz), 0.2, M.gray);
      strut(new V3(1.9, by, bz + 1.5), new V3(0, by + 5.4, bz), 0.11, M.gray);
      strut(new V3(-1.9, by, bz + 1.5), new V3(0, by + 5.4, bz), 0.11, M.gray);
      strut(new V3(0, by, bz - 1.8), new V3(0, by + 5.4, bz), 0.11, M.gray);
      mk(new T.CylinderGeometry(1.25, 1.25, 0.14, 22), M.dark, 0, by + 5.4, bz);
      const r = mk(new T.TorusGeometry(1.25, 0.04, 6, 24), M.rail, 0, by + 5.95, bz);
      r.rotation.x = Math.PI / 2;
      mk(new T.CylinderGeometry(0.07, 0.07, 5, 6).rotateZ(Math.PI / 2), M.gray, 0, by + 7.0, bz);
      mk(new T.SphereGeometry(0.7, 16, 12), M.white, 0, by + 4.2, bz + 0.2).scale.set(1, 0.9, 1);
      strut(new V3(0, by + 9.2, bz), new V3(0, by + 12.2, bz), 0.05, M.rail);
      const radarA = new T.Group();
      radarA.position.set(0, by + 8.3, bz);
      ship.add(radarA);
      mk(new T.CylinderGeometry(0.22, 0.3, 0.5, 10), M.dark, 0, 0, 0, radarA);
      mk(new T.BoxGeometry(3.4, 0.55, 0.16), M.light, 0, 0.5, 0, radarA);
      mk(new T.BoxGeometry(0.2, 0.7, 0.3), M.dark, 1.7, 0.5, 0, radarA);
      anim.radarA = radarA;

      /* aft mast */
      house(3.2, 2.2, 3.0, 'cell', 0, DK, -17.6);
      strut(new V3(0, 4.75, -17.6), new V3(0, 13.6, -17.6), 0.17, M.gray);
      mk(new T.SphereGeometry(0.9, 16, 12), M.white, 0, 10.6, -17.6);
      mk(new T.CylinderGeometry(0.07, 0.07, 4.4, 6).rotateZ(Math.PI / 2), M.gray, 0, 12.2, -17.6);
      const radarB = new T.Group();
      radarB.position.set(0, 13.7, -17.6);
      ship.add(radarB);
      mk(new T.CylinderGeometry(0.18, 0.24, 0.4, 10), M.dark, 0, 0, 0, radarB);
      mk(new T.BoxGeometry(2.8, 0.45, 0.14), M.light, 0, 0.4, 0, radarB);
      strut(new V3(0, 13.6, -17.6), new V3(0, 16.2, -17.6), 0.045, M.rail);
      anim.radarB = radarB;

      /* VLS */
      const vlsZ = 9.5, vlsY = deckAt(vlsZ);
      mk(new T.BoxGeometry(5.5, 0.16, 3.0), M.gray2, 0, vlsY + 0.06, vlsZ);
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          mk(new T.BoxGeometry(0.72, 0.06, 0.72), M.dark, (i - 2.5) * 0.86, vlsY + 0.17, vlsZ + (j - 1) * 0.86);
        }
      }

      /* CIWS */
      [[0, 1.5, -4.1, 5.2], [0, 0, 26.0, 0]].forEach((c, i) => {
        const g = new T.Group();
        const y = i === 0 ? 5.05 + 0.02 : deckAt(c[2]) + 0.02;
        g.position.set(i === 0 ? 1.9 : 0, y, c[2]);
        ship.add(g);
        mk(new T.CylinderGeometry(0.6, 0.72, 0.5, 16), M.gray2, 0, 0.25, 0, g);
        const r = new T.Group();
        r.position.y = 0.5;
        g.add(r);
        mk(new T.SphereGeometry(0.52, 16, 12), M.white, 0, 0.28, 0, r);
        mk(new T.CylinderGeometry(0.07, 0.07, 0.9, 8).rotateX(Math.PI / 2), M.dark, 0, 0.45, 0.6, r);
        mk(new T.BoxGeometry(0.5, 0.35, 0.5), M.white, 0, 0.18, -0.25, r);
        anim.ciws.push({ r, ph: rnd(0, 6) });
      });

      /* anchor gear */
      mk(new T.CylinderGeometry(0.5, 0.55, 0.7, 14), M.dark, 0, deckAt(26.5) + 0.35, 26.5);
      mk(new T.CylinderGeometry(0.12, 0.12, 1.9, 6), M.rail, 0, deckAt(29.2) + 0.95, 29.2);
      [-1, 1].forEach((sg) => {
        const z = 25.5, y = deckAt(z), s = hullSide(z, y - 0.8);
        mk(new T.CylinderGeometry(0.28, 0.28, 0.12, 12).rotateZ(Math.PI / 2), M.black, sg * (s.x + 0.02), y - 0.8, z);
        mk(new T.BoxGeometry(0.5, 0.12, 0.9), M.dark, sg * 2.0, y + 0.07, z + 0.7);
      });

      /* lifeboats */
      [-1, 1].forEach((sg) => {
        const z = -9.6, y = deckAt(z) + 1.0;
        const g = new T.Group();
        g.position.set(sg * 3.65, y, z);
        ship.add(g);
        const b = mk(new T.SphereGeometry(1, 18, 12), M.orange, 0, 0, 0, g);
        b.scale.set(0.85, 0.5, 2.3);
        mk(new T.BoxGeometry(1.0, 0.1, 3.1), M.white, 0, 0.34, 0, g);
        [-1.2, 1.2].forEach((dz) => {
          strut(new V3(0, -0.2, dz), new V3(0, -1.0, dz), 0.05, M.dark, g);
          mk(new T.BoxGeometry(1.3, 0.1, 0.1), M.dark, 0, -1.0, dz, g);
        });
      });

      /* helipad + helicopter */
      const padTex = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#2f363b';
        g.beginPath();
        g.arc(w / 2, h / 2, w / 2, 0, 7);
        g.fill();
        g.strokeStyle = '#e8c33a';
        g.lineWidth = 10;
        g.beginPath();
        g.arc(w / 2, h / 2, w / 2 - 14, 0, 7);
        g.stroke();
        g.fillStyle = '#f2f2f2';
        g.font = 'bold 150px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('H', w / 2, h / 2 + 8);
      });
      const padZ = -27.3;
      const pad = new T.Mesh(new T.CircleGeometry(2.7, 40).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: padTex, roughness: 0.9 }));
      pad.position.set(0, deckAt(padZ) + 0.03, padZ);
      pad.receiveShadow = true;
      ship.add(pad);

      const heli = new T.Group();
      heli.position.set(0, deckAt(padZ) + 0.86, padZ);
      heli.scale.setScalar(0.8);
      ship.add(heli);
      mk(new T.SphereGeometry(1, 18, 14), M.heli, 0, 0, 0, heli).scale.set(0.8, 0.75, 1.7);
      mk(new T.SphereGeometry(1, 16, 12), M.glass, 0, 0.18, 0.95, heli).scale.set(0.62, 0.5, 0.8);
      mk(new T.CylinderGeometry(0.16, 0.1, 2.8, 8).rotateX(Math.PI / 2), M.heli, 0, 0.3, -2.3, heli);
      mk(new T.BoxGeometry(0.07, 0.9, 0.55), M.heli, 0, 0.65, -3.5, heli);
      mk(new T.CylinderGeometry(0.06, 0.06, 0.5, 6), M.dark, 0, 0.95, 0, heli);
      const rotor = new T.Group();
      rotor.position.y = 1.2;
      heli.add(rotor);
      mk(new T.BoxGeometry(5.0, 0.04, 0.24), M.dark, 0, 0, 0, rotor);
      mk(new T.BoxGeometry(0.24, 0.04, 5.0), M.dark, 0, 0, 0, rotor);
      const tailRotor = new T.Group();
      tailRotor.position.set(0.14, 0.75, -3.5);
      heli.add(tailRotor);
      mk(new T.BoxGeometry(0.04, 1.1, 0.1), M.dark, 0, 0, 0, tailRotor);
      [-0.7, 0.7].forEach((x) => {
        mk(new T.CylinderGeometry(0.045, 0.045, 2.4, 6).rotateX(Math.PI / 2), M.dark, x, -0.8, 0.1, heli);
        strut(new V3(x, -0.8, 0.9), new V3(x * 0.6, -0.3, 0.7), 0.04, M.dark, heli);
        strut(new V3(x, -0.8, -0.7), new V3(x * 0.6, -0.3, -0.5), 0.04, M.dark, heli);
      });
      anim.rotor = rotor;
      anim.tailRotor = tailRotor;

      /* flags */
      function makeFlag(w: number, h: number) {
        const tex = canvasTex(256, 150, (g, W, H) => {
          g.fillStyle = '#10295a';
          g.fillRect(0, 0, W, H);
          g.fillStyle = '#f2f2f2';
          g.fillRect(0, H / 2 - 12, W, 24);
          g.fillRect(W * 0.34, 0, 24, H);
          g.fillStyle = '#c8102e';
          g.fillRect(0, H / 2 - 6, W, 12);
          g.fillRect(W * 0.34 + 6, 0, 12, H);
        });
        const geo = new T.PlaneGeometry(w, h, 16, 8);
        geo.translate(w / 2, 0, 0);
        const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, side: T.DoubleSide, roughness: 1 }));
        m.castShadow = true;
        const grp = new T.Group();
        grp.rotation.y = Math.PI / 2;
        grp.add(m);
        (grp as any).userData = {
          orig: (geo.attributes.position.array as Float32Array).slice(),
          mesh: m,
          w,
        };
        return grp;
      }

      const flagA = makeFlag(2.4, 1.4);
      flagA.position.set(0, by + 11.2, bz);
      ship.add(flagA);
      anim.flags.push(flagA);
      strut(new V3(0, by + 10.5, bz), new V3(0, by + 12.0, bz), 0.03, M.rail);

      const flagB = makeFlag(2.0, 1.2);
      flagB.position.set(0, deckAt(-29) + 3.6, -29.4);
      ship.add(flagB);
      anim.flags.push(flagB);
      strut(new V3(0, deckAt(-29), -29.4), new V3(0, deckAt(-29) + 4.2, -29.4), 0.05, M.rail);

      /* lights */
      mk(new T.SphereGeometry(0.14, 10, 8), anim.navMat.red, 4.5, 8.3, 3.3);
      mk(new T.SphereGeometry(0.14, 10, 8), anim.navMat.green, -4.5, 8.3, 3.3);
      mk(new T.SphereGeometry(0.14, 10, 8), anim.navMat.white, 0, by + 12.25, bz);
      mk(new T.SphereGeometry(0.12, 10, 8), anim.navMat.white, 0, 16.3, -17.6);
      mk(new T.SphereGeometry(0.12, 10, 8), anim.navMat.red, 0, by + 9.3, bz);

      /* searchlights */
      [-1.6, 1.6].forEach((x) => {
        mk(new T.CylinderGeometry(0.36, 0.42, 0.7, 16).rotateX(Math.PI / 2), M.dark, x, 9.6, 1.55);
        mk(new T.TorusGeometry(0.38, 0.04, 8, 20), M.gray, x, 9.6, 1.9);
        const lensMat = new T.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff6dd,
          emissiveIntensity: timeOfDay === 'night' ? 3.0 : timeOfDay === 'dusk' ? 0.8 : 0,
          roughness: 0.1
        });
        const lens = new T.Mesh(new T.CircleGeometry(0.36, 20), lensMat);
        lens.position.set(x, 9.6, 1.91);
        ship.add(lens);
      });

      return ship;
    }, []);

    // Frame animations for turrets, radar, rotor, and waving flags
    useFrame((state, delta) => {
      const dt = Math.min(delta, 0.05);
      const time = state.clock.getElapsedTime();
      const anim = animRef.current;

      // Radars
      if (anim.radarA) anim.radarA.rotation.y += dt * 1.6;
      if (anim.radarB) anim.radarB.rotation.y -= dt * 1.1;

      // Helicopter rotors
      if (anim.rotor) anim.rotor.rotation.y += dt * 9.0;
      if (anim.tailRotor) anim.tailRotor.rotation.x += dt * 14.0;

      // CIWS mounts
      anim.ciws.forEach((c) => {
        c.r.rotation.y = Math.sin(time * 0.7 + c.ph) * 1.2;
      });

      // Turrets tracking & recoil kickback
      anim.turrets.forEach((tu) => {
        const yw = tu.base + Math.sin(time * 0.22 + tu.phase) * 0.6;
        tu.rot.rotation.y += (yw - tu.rot.rotation.y) * Math.min(1, dt * 2);
        tu.gun.rotation.x = -(0.2 + Math.sin(time * 0.4 + tu.phase) * 0.02);
        tu.barrels.forEach((b: THREE.Group, i: number) => {
          tu.recoil[i] *= Math.exp(-dt * 5);
          b.position.z = -tu.recoil[i] * 0.8;
        });
      });

      // Side mounts
      anim.sideMounts.forEach((tu) => {
        tu.rot.rotation.y = tu.base + Math.sin(time * 0.5 + tu.phase) * 0.5;
        tu.gun.rotation.x = -(0.2 + Math.sin(time * 0.8 + tu.phase) * 0.08);
      });

      // Waving cloth flags
      anim.flags.forEach((fg) => {
        const m = fg.userData.mesh;
        const pa = m.geometry.attributes.position;
        const o = fg.userData.orig;
        const w = fg.userData.w;
        for (let i = 0; i < pa.count; i++) {
          const x = o[i * 3];
          const nx = x / w;
          pa.array[i * 3 + 2] = Math.sin(x * 3.2 - time * 7) * 0.2 * nx + Math.sin(x * 1.6 - time * 3.3 + o[i * 3 + 1]) * 0.08 * nx;
          pa.array[i * 3 + 1] = o[i * 3 + 1] + Math.sin(x * 2.4 - time * 5) * 0.04 * nx;
        }
        pa.needsUpdate = true;
        m.geometry.computeVertexNormals();
      });

      // Bridge window night emissive
      const em = timeOfDay === 'night' ? 1.8 : timeOfDay === 'dusk' ? 0.6 : 0.0;
      anim.nightMats.forEach((m) => {
        m.emissiveIntensity = em;
      });
    });

    return (
      <group ref={shipGroupRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
        <primitive object={exactShipGroup} />
      </group>
    );
  }
);
