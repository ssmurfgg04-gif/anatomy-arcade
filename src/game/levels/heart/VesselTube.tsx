"use client";
/**
 * Procedural vessel tube (spec §25/§26): organic inner-wall geometry with
 * per-vertex damage attribute + pulsing shader. Rendered from inside (BackSide).
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vesselCurve } from "@/game/systems/vessel";
import { HEART_VESSEL_ZONES, VESSEL_BASE_RADIUS, vesselRadiusAt } from "./vessel";

const SEGMENTS = 360; // along t
const RADIAL = 26; // around

function damageAt(t: number): number {
  for (const z of HEART_VESSEL_ZONES) {
    if (t >= z.t0 && t <= z.t1) {
      const local = (t - z.t0) / (z.t1 - z.t0);
      const bell = Math.sin(local * Math.PI);
      if (z.id === "narrowing") return 0.35 * bell;
      if (z.id === "plaque") return 0.75 * bell;
      if (z.id === "clot") return 0.9 * bell;
    }
  }
  return 0;
}

function buildVesselGeometry(segments: number): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * RADIAL * 3);
  const normals = new Float32Array((segments + 1) * RADIAL * 3);
  const uvs = new Float32Array((segments + 1) * RADIAL * 2);
  const damage = new Float32Array((segments + 1) * RADIAL);

  const tan = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const center = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const noise = (x: number, y: number) =>
    Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;

  let ptr = 0;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    vesselCurve.getPointAt(t, center);
    vesselCurve.getTangentAt(t, tan);
    right.crossVectors(tan, UP);
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
    right.normalize();
    up.crossVectors(right, tan).normalize();

    const baseR = VESSEL_BASE_RADIUS * vesselRadiusAt(t, 0);
    const dmg = damageAt(t);

    for (let j = 0; j < RADIAL; j++) {
      const a = (j / RADIAL) * Math.PI * 2;
      // organic wall unevenness — stronger where damaged
      const n =
        1 +
        0.06 * Math.sin(a * 3 + t * 40) +
        0.04 * Math.sin(a * 7 - t * 90) +
        0.10 * dmg * (0.6 + 0.4 * Math.sin(a * 9 + t * 130));
      const r = baseR * n * (1 + 0.015 * noise(i * 0.7, j));
      const x = center.x + right.x * Math.cos(a) * r + up.x * Math.sin(a) * r;
      const y = center.y + right.y * Math.cos(a) * r + up.y * Math.sin(a) * r;
      const z = center.z + right.z * Math.cos(a) * r + up.z * Math.sin(a) * r;
      positions[ptr * 3] = x;
      positions[ptr * 3 + 1] = y;
      positions[ptr * 3 + 2] = z;
      // normal points inward (toward centerline)
      normals[ptr * 3] = -Math.cos(a) * right.x - Math.sin(a) * up.x;
      normals[ptr * 3 + 1] = -Math.cos(a) * right.y - Math.sin(a) * up.y;
      normals[ptr * 3 + 2] = -Math.cos(a) * right.z - Math.sin(a) * up.z;
      uvs[ptr * 2] = t * 8;
      uvs[ptr * 2 + 1] = j / RADIAL;
      damage[ptr] = dmg;
      ptr++;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const a = i * RADIAL + j;
      const b = i * RADIAL + ((j + 1) % RADIAL);
      const c = (i + 1) * RADIAL + j;
      const d = (i + 1) * RADIAL + ((j + 1) % RADIAL);
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

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uBeat;      // 0..1 heartbeat pulse
  uniform float uFlow;      // 0..1 flow health
  uniform float uDamagePulse; // warning pulse at danger
  varying float vDamage;
  varying vec2 vUv;
  varying vec3 vNormalW;

  #ifdef LOW_TIER
  void main() {
    vec3 healthy = vec3(0.34, 0.075, 0.10);
    vec3 damaged = vec3(0.13, 0.03, 0.05);
    vec3 base = mix(healthy, damaged, vDamage);
    float lamb = 0.45 + 0.75 * max(0.0, dot(normalize(vNormalW), normalize(vec3(0.25, 0.45, -0.55))));
    base *= lamb;
    float vein = smoothstep(0.465, 0.5, sin(vUv.y * 84.0) * 0.5 + 0.5);
    base += vec3(0.55, 0.18, 0.20) * vein * (0.4 + 0.5 * uFlow) * (0.7 + 0.5 * uBeat);
    float warn = vDamage * uDamagePulse * (0.5 + 0.5 * sin(uTime * 6.0));
    base += vec3(0.30, 0.02, 0.05) * warn;
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
    // base tissue: deep desaturated crimson
    vec3 healthy = vec3(0.30, 0.060, 0.085);
    vec3 damaged = vec3(0.11, 0.025, 0.042);

    float n = vnoise(vUv * vec2(26.0, 7.0)) * 0.6 + vnoise(vUv * vec2(60.0, 16.0)) * 0.4;
    vec3 base = mix(healthy, damaged, vDamage);
    base *= 0.9 + 0.35 * n;

    // capillaries: thin bright lines that fade in with flow health
    float vein = smoothstep(0.465, 0.5, sin(vUv.y * 84.0) * 0.5 + 0.5) *
                 smoothstep(0.35, 0.9, vnoise(vUv * vec2(9.0, 2.5)));
    vec3 veinColor = mix(vec3(0.5, 0.10, 0.16), vec3(0.7, 0.24, 0.26), uFlow);
    base += veinColor * vein * (0.35 + 0.5 * uFlow) * (0.7 + 0.5 * uBeat);

    // subtle fresnel sheen (wet endothelium)
    float fres = pow(1.0 - abs(dot(vNormalW, vec3(0.0, 0.0, 1.0))), 2.0);
    base += vec3(0.20, 0.30, 0.34) * fres * 0.25;

    // damage warning pulse
    float warn = vDamage * uDamagePulse * (0.5 + 0.5 * sin(uTime * 6.0));
    base += vec3(0.30, 0.02, 0.05) * warn;

    // ambient depth darkening toward far t (warm toward heart)
    base *= 0.88 + 0.3 * vUv.x;

    gl_FragColor = vec4(base, 1.0);
  }
  #endif
`;

interface Props {
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  segments: number;
  lowTier?: boolean;
}

export function VesselTube({ flowRef, beatRef, segments, lowTier }: Props) {
  const geo = useMemo(() => buildVesselGeometry(segments), [segments]);
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
        fragmentShader={FRAG}
        uniforms={uniforms}
        defines={lowTier ? { LOW_TIER: "" } : undefined}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
