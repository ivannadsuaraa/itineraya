// Escena 3D del hero de la landing — cargada SOLO en cliente y SOLO cuando el
// wrapper (HeroAtmosphere) decide montarla (desktop, sin reduced-motion). Todo
// el peso de three/@react-three vive en este chunk lazy: nunca entra al bundle
// principal ni penaliza el resto de la app.
//
// Composición cinematográfica, toda basada en malla (no gl_Points, que topan
// con límites de GPU y florecen mal con bloom):
//   • Planeta con superficie punteada procedural (mismo lenguaje que el globo
//     cobe del dashboard) + rim de fresnel.
//   • Atmósfera: cáscara aditiva con fresnel (halo del planeta).
//   • Balizas de destino: esferas emisivas que laten → el bloom las hace faros.
//   • Arcos de vuelo: tubos con un pulso de luz recorriéndolos.
//   • Bokeh flotante y campo de estrellas para profundidad.
// Paleta de marca (sky / #1E6B9A / ámbar sobre navy #050b16). Bloom + viñeta
// lo unifican.

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── Paleta de marca ─────────────────────────────────────────────────────────
const NAVY = new THREE.Color("#050b16");
const SKY_DOT = new THREE.Color("#6cb6e0");
const SKY_GLOW = new THREE.Color("#7dd3fc");
const ACCENT = new THREE.Color("#1E6B9A");
const AMBER = new THREE.Color("#fcd34d");

const GLOBE_RADIUS = 2.3;

// Destinos reales (lat, lon) — coinciden con los de la app.
const CITIES: Array<[number, number]> = [
  [-8.34, 115.09], // Bali
  [35.68, 139.65], // Tokio
  [48.86, 2.35], // París
  [40.71, -74.0], // Nueva York
  [51.5, -0.13], // Londres
  [-33.87, 151.2], // Sídney
  [31.63, -7.99], // Marrakech
  [-22.9, -43.17], // Río
  [25.2, 55.27], // Dubái
];

// Pares origen→destino para los arcos de vuelo (índices en CITIES).
const ROUTES: Array<[number, number]> = [
  [2, 0], // París → Bali
  [3, 1], // NY → Tokio
  [4, 3], // Londres → NY
  [5, 1], // Sídney → Tokio
];

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// ── Planeta punteado (una malla, superficie procedural) ─────────────────────
function DottedGlobe() {
  const uniforms = useMemo(
    () => ({
      uDot: { value: SKY_DOT.clone() },
      uBase: { value: new THREE.Color("#0d2338") },
      uRim: { value: SKY_GLOW.clone() },
      uTime: { value: 0 },
      uFreq: { value: 34.0 },
    }),
    [],
  );
  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={
          /* glsl */ `
          varying vec3 vLocal;
          varying vec3 vNormalV;
          varying vec3 vViewV;
          void main() {
            vLocal = normalize(position);
            vNormalV = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          uniform vec3 uDot; uniform vec3 uBase; uniform vec3 uRim;
          uniform float uTime; uniform float uFreq;
          varying vec3 vLocal;
          varying vec3 vNormalV;
          varying vec3 vViewV;
          void main() {
            // Coordenadas esféricas → rejilla de puntos.
            float lat = asin(clamp(vLocal.y, -1.0, 1.0));
            float lon = atan(vLocal.z, vLocal.x);
            // Compensa la convergencia de meridianos cerca de los polos para que
            // los puntos no se estiren: menos columnas según la latitud.
            float lonScale = uFreq * max(0.18, cos(lat));
            vec2 cell = vec2(floor(lon / 6.2831853 * lonScale), floor((lat + 1.5707963) / 3.1415926 * uFreq));
            vec2 g = vec2(fract(lon / 6.2831853 * lonScale), fract((lat + 1.5707963) / 3.1415926 * uFreq)) - 0.5;
            float d = length(g);
            float dotMask = smoothstep(0.40, 0.24, d);
            // Guiño sutil por celda.
            float tw = 0.72 + 0.28 * sin(uTime * 1.4 + cell.x * 1.3 + cell.y * 0.7);
            vec3 col = mix(uBase, uDot * tw * 1.5, dotMask);
            // Rim de fresnel: borde del planeta iluminado.
            float fres = pow(1.0 - abs(dot(vNormalV, vViewV)), 2.4);
            col += uRim * fres * 1.4;
            gl_FragColor = vec4(col, 1.0);
          }
        `
        }
      />
    </mesh>
  );
}

// ── Atmósfera: cáscara con fresnel aditivo ──────────────────────────────────
function Atmosphere() {
  const uniforms = useMemo(
    () => ({
      uColor: { value: SKY_GLOW.clone() },
      uPower: { value: 2.8 },
      uIntensity: { value: 2.1 },
    }),
    [],
  );
  return (
    <mesh scale={1.16}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={
          /* glsl */ `
          varying vec3 vNormal; varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          uniform vec3 uColor; uniform float uPower; uniform float uIntensity;
          varying vec3 vNormal; varying vec3 vView;
          void main() {
            float fres = pow(1.0 - abs(dot(vNormal, vView)), uPower);
            gl_FragColor = vec4(uColor * fres * uIntensity, fres);
          }
        `
        }
      />
    </mesh>
  );
}

// Material de halo aditivo reutilizable: orbe que brilla desde el centro
// (falso bloom, sin passes de postprocessado → 60fps también en móvil).
function makeGlowMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color.clone() } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(max(dot(vN, vV), 0.0), 2.2);
        gl_FragColor = vec4(uColor, f * 0.85);
      }
    `,
  });
}

// ── Balizas de destino: núcleo emisivo + halo aditivo, laten como faros ─────
function Beacons() {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const glowMat = useMemo(() => makeGlowMaterial(AMBER), []);
  const data = useMemo(
    () =>
      CITIES.map(([lat, lon], i) => ({
        pos: latLonToVec3(lat, lon, GLOBE_RADIUS * 1.012).toArray() as [number, number, number],
        phase: i * 0.9,
      })),
    [],
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const pulse = 0.55 + 0.45 * Math.sin(t * 2.0 + data[i].phase);
      g.scale.setScalar(0.7 + pulse * 0.7);
    });
  });
  return (
    <group>
      {data.map((d, i) => (
        <group
          key={i}
          position={d.pos}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          {/* Núcleo brillante */}
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={AMBER} toneMapped={false} />
          </mesh>
          {/* Halo de brillo (falso bloom) */}
          <mesh material={glowMat} scale={3.4}>
            <sphereGeometry args={[0.045, 20, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Arcos de vuelo: tubos con un pulso de luz recorriéndolos ────────────────
function FlightArcs() {
  const geometries = useMemo(() => {
    return ROUTES.map(([a, b]) => {
      const start = latLonToVec3(CITIES[a][0], CITIES[a][1], GLOBE_RADIUS * 1.015);
      const end = latLonToVec3(CITIES[b][0], CITIES[b][1], GLOBE_RADIUS * 1.015);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const lift = GLOBE_RADIUS * 0.32 + start.distanceTo(end) * 0.16;
      mid.normalize().multiplyScalar(GLOBE_RADIUS + lift);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return new THREE.TubeGeometry(curve, 80, 0.012, 8, false);
    });
  }, []);

  const mats = useMemo(
    () =>
      ROUTES.map(
        (_, i) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
              uTime: { value: 0 },
              uOffset: { value: i * 0.29 },
              uBase: { value: ACCENT.clone() },
              uHead: { value: SKY_GLOW.clone() },
            },
            vertexShader: /* glsl */ `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: /* glsl */ `
              uniform float uTime; uniform float uOffset;
              uniform vec3 uBase; uniform vec3 uHead;
              varying vec2 vUv;
              void main() {
                float head = fract(uTime * 0.16 + uOffset);
                float dist = abs(vUv.x - head);
                dist = min(dist, 1.0 - dist);
                float pulse = smoothstep(0.13, 0.0, dist);
                vec3 col = mix(uBase, uHead, pulse);
                float alpha = 0.16 + pulse * 0.9;
                gl_FragColor = vec4(col, alpha);
              }
            `,
          }),
      ),
    [],
  );
  useFrame((s) => {
    mats.forEach((m) => (m.uniforms.uTime.value = s.clock.elapsedTime));
  });

  return (
    <group>
      {geometries.map((geo, i) => (
        <mesh key={i} geometry={geo} material={mats[i]} />
      ))}
    </group>
  );
}

// ── Bokeh flotante: discos aditivos suaves que ascienden ────────────────────
function Bokeh({ count = 26 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
        z: -1 - Math.random() * 5,
        s: 0.15 + Math.random() * 0.5,
        seed: Math.random(),
      })),
    [count],
  );
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: SKY_GLOW.clone() }, uOpacity: { value: 1 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
          void main(){
            float d = length(vUv - 0.5);
            float a = smoothstep(0.5, 0.0, d) * 0.28 * uOpacity;
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }),
    [],
  );
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const sd = seeds[i];
      m.position.y = sd.y + ((t * (0.15 + sd.seed * 0.2) + sd.seed * 8) % 9) - 4.5;
      m.position.x = sd.x + Math.sin(t * 0.3 + sd.seed * 6.28) * 0.5;
    });
  });
  return (
    <group ref={group}>
      {seeds.map((sd, i) => (
        <mesh
          key={i}
          position={[sd.x, sd.y, sd.z]}
          scale={sd.s}
          material={mat}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Campo de estrellas de fondo ─────────────────────────────────────────────
function Starfield({ count = 700 }: { count?: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 18 + Math.random() * 18;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = -10 - Math.random() * 16;
    }
    return pos;
  }, [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={0.08}
        sizeAttenuation
        color={SKY_GLOW}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

// ── Rig: rota el planeta y aplica parallax suave de ratón a la cámara ───────
function World({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const spin = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0.6, -0.15, 0));

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.055;
    const px = pointer.current.x * 0.45;
    const py = pointer.current.y * 0.3;
    const lerp = Math.min(1, delta * 2.2);
    camera.position.x += (px - camera.position.x) * lerp;
    camera.position.y += (0.3 + py - camera.position.y) * lerp;
    camera.lookAt(target.current);
  });

  return (
    <group position={[0.6, -0.35, 0]}>
      <Atmosphere />
      <group ref={spin}>
        <DottedGlobe />
        <Beacons />
        <FlightArcs />
      </group>
    </group>
  );
}

type Props = {
  maxDpr?: number;
};

export default function HeroAtmosphereScene({ maxDpr = 2 }: Props) {
  const pointer = useRef({ x: 0, y: 0 });

  return (
    <Canvas
      dpr={[1, maxDpr]}
      camera={{ position: [0, 0.3, 7], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      onPointerMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
    >
      <color attach="background" args={[NAVY.r, NAVY.g, NAVY.b]} />
      <fog attach="fog" args={["#050b16", 10, 30]} />
      <Starfield />
      <Bokeh />
      <World pointer={pointer} />
    </Canvas>
  );
}
