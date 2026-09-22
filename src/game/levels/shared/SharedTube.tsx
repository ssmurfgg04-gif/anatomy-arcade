"use client";
/**
 * Shared tube renderer (P7): parameterized clone of the heart vessel shader.
 * Geometry + colors come from the world spec + theme so Viral (airway mucosa)
 * and Brain (cerebral vessel) get distinct looks on the proven mobile-safe
 * shader (LOW tier fast path included).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { TubeWorld, TubeZone } from "./world";

export const TUBE_SEGMENTS = 360;
export const TUBE_RADIAL = 26;

/** Per-mission visual identity for the tube shader. */
export interface TubeTheme {
  /** base mucosa/wall color (healthy) */
  healthy: [number, number, number];
  /** wall color where damaged/inflamed/weak */
  damaged: [number, number, number];
  /** capillary/lining streak color low-flow -> high-flow */
  veinLow: [number, number, number];
  veinHigh: [number, number, number];
  /** fresnel sheen tint */
  fresnel: [number, number, number];
  /** damage warning pulse tint */
  warn: [number, number, number];
  /** streak frequency along the tube (uv.y multiplier) */
  veinFreq: number;
}

export const HEART_TUBE_THEME: TubeTheme = {
  healthy: [0.3, 0.06, 0.085],
  damaged: [0.11, 0.025, 0.042],
  veinLow: [0.5, 0.1, 0.16],
  veinHigh: [0.7, 0.24, 0.26],
  fresnel: [0.2, 0.3, 0.34],
  warn: [0.3, 0.02, 0.05],
  veinFreq: 84,
};

export const VIRAL_TUBE_THEME: TubeTheme = {
  healthy: [0.4, 0.175, 0.15],
  damaged: [0.52, 0.16, 0.115],
  veinLow: [0.62, 0.28, 0.24],
  veinHigh: [0.85, 0.5, 0.42],
  fresnel: [0.3, 0.36, 0.42],
  warn: [0.55, 0.1, 0.05],
  veinFreq: 64,
};

export const BRAIN_TUBE_THEME: TubeTheme = {
  healthy: [0.1, 0.085, 0.2],
  damaged: [0.16, 0.035, 0.09],
  veinLow: [0.24, 0.2, 0.5],
  veinHigh: [0.35, 0.42, 0.85],
  fresnel: [0.28, 0.34, 0.52],
  warn: [0.4, 0.03, 0.09],
  veinFreq: 96,
};

function buildTubeGeometry(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  baseRadius: number,
  radiusMulAt: (t: number) => number,
  damageFn: (t: number) => number,
  radial = TUBE_RADIAL
): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * radial * 3);
  const normals = new Float32Array((segments + 1) * radial * 3);
  const uvs = new Float32Array((segments + 1) * radial * 2);
  const damage = new Float32Array((segments + 1) * radial);

  const tan = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const center = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const noise = (x: number, y: number) => (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

  let ptr = 0;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, center);
    curve.getTangentAt(t, tan);
    right.crossVectors(tan, UP);
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
    right.normalize();
    up.crossVectors(right, tan).normalize();

    const baseR = baseRadius * radiusMulAt(t);
    const dmg = damageFn(t);

    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n =
        1 +
        0.06 * Math.sin(a * 3 + t * 40) +
        0.04 * Math.sin(a * 7 - t * 90) +
        0.1 * dmg * (0.6 + 0.4 * Math.sin(a * 9 + t * 130));
      const r = baseR * n * (1 + 0.015 * noise(i * 0.7, j));
      const x = center.x + right.x * Math.cos(a) * r + up.x * Math.sin(a) * r;
      const y = center.y + right.y * Math.cos(a) * r + up.y * Math.sin(a) * r;
      const z = center.z + right.z * Math.cos(a) * r + up.z * Math.sin(a) * r;
      positions[ptr * 3] = x;
      positions[ptr * 3 + 1] = y;
      positions[ptr * 3 + 2] = z;
      normals[ptr * 3] = -Math.cos(a) * right.x - Math.sin(a) * up.x;
      normals[ptr * 3 + 1] = -Math.cos(a) * right.y - Math.sin(a) * up.y;
      normals[ptr * 3 + 2] = -Math.cos(a) * right.z - Math.sin(a) * up.z;
      uvs[ptr * 2] = t * 8;
      uvs[ptr * 2 + 1] = j / radial;
      damage[ptr] = dmg;
      ptr++;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      indices.push(a, b, d, a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute("aDamage", new THREE.BufferAttribute(damage, 1));
  geo.setIndex(indices);
  return geo;
}

const VERT = /* glsl */ `
  attribute float aDamage;
  varying float vDamage;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vDamage = aDamage;
    vUv = uv;
    vNormalW = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = (c: TubeTheme) => /* glsl */ `
  uniform float uTime;
  uniform float uBeat;
  uniform float uFlow;
  uniform float uDamagePulse;
  varying float vDamage;
  varying vec2 vUv;
  varying vec3 vNormalW;

  #ifdef LOW_TIER
  void main() {
    vec3 healthy = vec3(${c.healthy.join(",")});
    vec3 damaged = vec3(${c.damaged.join(",")});
    vec3 base = mix(healthy, damaged, vDamage);
    float lamb = 0.45 + 0.75 * max(0.0, dot(normalize(vNormalW), normalize(vec3(0.25, 0.45, -0.55))));
    base *= lamb;
    float vein = smoothstep(0.465, 0.5, sin(vUv.y * ${c.veinFreq.toFixed(1)}0) * 0.5 + 0.5);
    base += vec3(${c.veinHigh.join(",")}) * vein * (0.4 + 0.5 * uFlow) * (0.7 + 0.5 * uBeat);
    float warn = vDamage * uDamagePulse * (0.5 + 0.5 * sin(uTime * 6.0));
    base += vec3(${c.warn.join(",")}) * warn;
    gl_FragColor = vec4(base * (0.9 + 0.3 * vUv.x), 1.0);
  }
  #else
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec3 healthy = vec3(${c.healthy.join(",")});
    vec3 damaged = vec3(${c.damaged.join(",")});

    float n = vnoise(vUv * vec2(26.0, 7.0)) * 0.6 + vnoise(vUv * vec2(60.0, 16.0)) * 0.4;
    vec3 base = mix(healthy, damaged, vDamage);
    base *= 0.9 + 0.35 * n;

    float vein = smoothstep(0.465, 0.5, sin(vUv.y * ${c.veinFreq.toFixed(1)}0) * 0.5 + 0.5) *
                 smoothstep(0.35, 0.9, vnoise(vUv * vec2(9.0, 2.5)));
    vec3 veinColor = mix(vec3(${c.veinLow.join(",")}), vec3(${c.veinHigh.join(",")}), uFlow);
    base += veinColor * vein * (0.35 + 0.5 * uFlow) * (0.7 + 0.5 * uBeat);

    float fres = pow(1.0 - abs(dot(vNormalW, vec3(0.0, 0.0, 1.0))), 2.0);
    base += vec3(${c.fresnel.join(",")}) * fres * 0.25;

    float warn = vDamage * uDamagePulse * (0.5 + 0.5 * sin(uTime * 6.0));
    base += vec3(${c.warn.join(",")}) * warn;

    base *= 0.88 + 0.3 * vUv.x;

    gl_FragColor = vec4(base, 1.0);
  }
  #endif
`;

export { VERT as TUBE_VERT };
export { TUBE_FRAG_TEMPLATE };

const TUBE_FRAG_TEMPLATE = FRAG;

interface Props {
  world: TubeWorld;
  zones: TubeZone[];
  theme: TubeTheme;
  segments: number;
  beatRef: React.MutableRefObject<number>;
  flowRef: React.MutableRefObject<number>;
  lowTier?: boolean;
}

export function SharedTube({ world, zones, theme, segments, beatRef, flowRef, lowTier }: Props) {
  const geo = useMemo(
    () =>
      buildTubeGeometry(
        world.curve,
        segments,
        world.baseRadius,
        (t) => world.radiusAt(t, 0),
        (t) => {
          for (const z of zones) {
            if (t >= z.t0 && t <= z.t1) {
              const local = (t - z.t0) / (z.t1 - z.t0);
              const bell = Math.sin(local * Math.PI);
              if (z.id === "narrowing") return 0.35 * bell;
              if (z.id === "damaged") return 0.75 * bell;
              if (z.id === "threat") return 0.9 * bell;
            }
          }
          return 0;
        }
      ),
    [world, zones, segments]
  );
  const frag = useMemo(() => FRAG(theme), [theme]);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBeat: { value: 0 },
      uFlow: { value: 0 },
      uDamagePulse: { value: 1 },
    }),
    []
  );

  useFrame((_, dt) => {
    const u = uniforms;
    u.uTime.value += dt;
    u.uBeat.value += (beatRef.current - u.uBeat.value) * Math.min(1, dt * 14);
    u.uFlow.value += (flowRef.current - u.uFlow.value) * Math.min(1, dt * 2);
    u.uDamagePulse.value = 1 - flowRef.current * 0.7;
    if (matRef.current) matRef.current.needsUpdate = false;
  });

  return (
    <mesh geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={frag}
        uniforms={uniforms}
        defines={lowTier ? { LOW_TIER: "" } : undefined}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

export { buildTubeGeometry };
