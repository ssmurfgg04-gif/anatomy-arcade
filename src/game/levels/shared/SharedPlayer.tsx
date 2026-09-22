"use client";
/**
 * Shared nano-robot player rig (P7): parameterized clone of the heart Player.
 * Same frozen feel constants (config.ts), same slide-collision law, but bound
 * to any TubeWorld. Heart slice keeps its own copy untouched.
 */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "@/game/core/state";
import { consumeLook, movementInput, type InputState } from "@/game/controls/input";
import { CAMERA, COMBAT, FEEL, FLIGHT } from "@/game/config";
import type { TubeWorld } from "./world";

export interface SharedPlayerRefs {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  pitch: number;
  t: number;
  speed: number;
  shake: number;
  boosting: boolean;
  fov: number;
}

export function createSharedPlayerRefs(spawnT: number): SharedPlayerRefs {
  return {
    pos: new THREE.Vector3(0, -2, -88),
    vel: new THREE.Vector3(),
    yaw: Math.PI,
    pitch: 0,
    t: spawnT,
    speed: 0,
    shake: 0,
    boosting: false,
    fov: 78,
  };
}

const _dir = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _center = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();

interface Props {
  world: TubeWorld;
  player: SharedPlayerRefs;
  input: React.MutableRefObject<InputState>;
  flowRef: React.MutableRefObject<number>;
  beatRef: React.MutableRefObject<number>;
  hitWallRef: React.MutableRefObject<number>;
  quality: "LOW" | "MEDIUM" | "HIGH";
}

export function SharedPlayer({ world, player, input, flowRef, beatRef, hitWallRef, quality }: Props) {
  const { camera } = useThree();
  const robotRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.SpotLight>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const phase = useRef<string>("");

  const iframes = useRef(0);
  const yawPrev = useRef(player.yaw);
  const rollCur = useRef(0);

  const worldMemo = useMemo(() => world, [world]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, quality === "LOW" ? FEEL.DT_CLAMP_LOW : FEEL.DT_CLAMP);
    const g = useGame.getState();
    const playing =
      !input.current.suspended &&
      (g.phase === "PLAYING" || g.phase === "SCANNING" || g.phase === "INTERACTION");
    if (g.phase !== phase.current) phase.current = g.phase;
    iframes.current = Math.max(0, iframes.current - dt);

    // ---- look ----
    const { dx, dy } = consumeLook(input);
    player.yaw -= dx;
    player.pitch = THREE.MathUtils.clamp(player.pitch - dy, -1.35, 1.35);

    // ---- propulsion ----
    player.boosting = playing && (input.current.boost || input.current.tBoost);
    const accel = playing ? (player.boosting ? FLIGHT.ACCEL_BOOST : FLIGHT.ACCEL) : 0;
    const mi = movementInput(input);
    _dir.set(0, 0, 0);
    if (playing) {
      const cp = Math.cos(player.pitch);
      _dir.set(-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp);
      _right.set(-_dir.z, 0, _dir.x).normalize();
      _up.set(0, 1, 0);
      player.vel.addScaledVector(_dir, mi.forward * accel * dt);
      player.vel.addScaledVector(_right, mi.strafe * accel * dt);
      player.vel.addScaledVector(_up, mi.vertical * accel * dt);
      const t = state.clock.elapsedTime;
      player.vel.x += Math.sin(t * FLIGHT.DRIFT_X_FREQ) * FLIGHT.DRIFT;
      player.vel.y += Math.cos(t * FLIGHT.DRIFT_Y_FREQ) * FLIGHT.DRIFT;
    }

    const drag = player.boosting ? FLIGHT.DRAG_BOOST : FLIGHT.DRAG;
    player.vel.multiplyScalar(1 / (1 + drag * dt));
    if (player.vel.lengthSq() > FLIGHT.MAX_SPEED * FLIGHT.MAX_SPEED) {
      player.vel.setLength(FLIGHT.MAX_SPEED);
    }
    player.pos.addScaledVector(player.vel, dt);
    player.speed = player.vel.length();

    // ---- tube projection + wall collision (slide-don't-stop) ----
    let bestT = player.t;
    let bestD = Infinity;
    for (let k = -6; k <= 6; k++) {
      const t = THREE.MathUtils.clamp(player.t + k * 0.002, 0, 1);
      worldMemo.curve.getPointAt(t, _center);
      const d = _center.distanceToSquared(player.pos);
      if (d < bestD) {
        bestD = d;
        bestT = t;
      }
    }
    player.t = bestT;
    worldMemo.curve.getPointAt(bestT, _center);
    _offset.copy(player.pos).sub(_center);
    const radius = worldMemo.baseRadius * worldMemo.radiusAt(bestT, flowRef.current);
    const lateral = _offset.length();
    const maxLat = radius - COMBAT.WALL_MARGIN;
    if (lateral > maxLat) {
      _offset.normalize();
      player.pos.copy(_center).addScaledVector(_offset, maxLat);
      const outward = player.vel.dot(_offset);
      if (outward > 0) {
        player.vel.addScaledVector(_offset, -outward * COMBAT.BOUNCE);
        if (outward > COMBAT.IMPACT_MIN && iframes.current <= 0) {
          iframes.current = COMBAT.IFRAMES;
          hitWallRef.current = Math.min(1, outward / 6);
          g.damagePlayer(Math.min(COMBAT.IMPACT_CAP, outward * COMBAT.IMPACT_DAMAGE));
          player.shake = Math.min(0.5, player.shake + outward * 0.05);
        }
      }
    }

    // ---- shake decay (motionReduced flattens it — accessibility, P8) ----
    player.shake = Math.max(0, player.shake - dt * CAMERA.SHAKE_DECAY);
    const shakeAmp = g.settings.motionReduced
      ? 0
      : player.shake * CAMERA.SHAKE_AMP + beatRef.current * 0.004;

    // ---- camera ----
    const chase = g.cameraMode === "CHASE";
    const e = new THREE.Euler(player.pitch, player.yaw, 0, "YXZ");
    if (chase) {
      _camPos.set(CAMERA.CHASE_OFFSET.x, CAMERA.CHASE_OFFSET.y, CAMERA.CHASE_OFFSET.z)
        .applyEuler(e)
        .add(player.pos);
      const camOff = _camPos.clone().sub(_center);
      const camLat = camOff.length();
      if (camLat > maxLat) {
        camOff.normalize().multiplyScalar(maxLat);
        _camPos.copy(_center).add(camOff);
      }
      const rate =
        CAMERA.CHASE_RATE_BASE +
        player.speed * CAMERA.CHASE_RATE_SPEED +
        _camPos.distanceTo(camera.position) * 2.0;
      camera.position.lerp(_camPos, 1 - Math.exp(-rate * dt));
      _camTarget.copy(player.pos).addScaledVector(_dir, CAMERA.CHASE_LEAD);
      camera.lookAt(_camTarget);
    } else {
      camera.position.copy(player.pos);
      _camTarget.set(0, 0, -1).applyEuler(e).add(camera.position);
      camera.lookAt(_camTarget);
    }

    const yawVel = (player.yaw - yawPrev.current) / Math.max(dt, 1e-4);
    yawPrev.current = player.yaw;
    if (!g.settings.motionReduced) {
      const rollTarget = THREE.MathUtils.clamp(yawVel * CAMERA.ROLL_RATE, -CAMERA.ROLL_MAX, CAMERA.ROLL_MAX);
      rollCur.current += (rollTarget - rollCur.current) * (1 - Math.exp(-8 * dt));
      camera.rotateZ(rollCur.current);
    }

    camera.position.y += Math.sin(state.clock.elapsedTime * FEEL.BOB_FREQ) * shakeAmp * 2;
    camera.position.x += Math.sin(state.clock.elapsedTime * FEEL.SHAKE_FREQ) * shakeAmp;

    const targetFov =
      CAMERA.FOV_BASE +
      Math.min(CAMERA.FOV_SPEED_MAX, player.speed * CAMERA.FOV_SPEED) +
      (player.boosting && playing ? CAMERA.FOV_BOOST : 0);
    player.fov += (targetFov - player.fov) * (1 - Math.exp(-CAMERA.FOV_RATE * dt));
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - player.fov) > 0.05) {
      cam.fov = player.fov;
      cam.updateProjectionMatrix();
    }

    if (robotRef.current) {
      robotRef.current.visible = chase;
      robotRef.current.position.copy(player.pos);
      robotRef.current.quaternion.setFromEuler(e);
      const ring = robotRef.current.children[1] as THREE.Mesh;
      if (ring) ring.rotation.z += dt * 6;
    }

    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
      lightRef.current.target.position.copy(_camTarget);
      lightRef.current.target.updateMatrixWorld();
    }

    if (scanRingRef.current) {
      scanRingRef.current.visible = g.phase === "PLAYING";
      const s = 0.045 + (Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5) * 0.012;
      scanRingRef.current.scale.setScalar(s);
      scanRingRef.current.position.copy(camera.position);
      scanRingRef.current.quaternion.copy(camera.quaternion);
      scanRingRef.current.translateZ(-0.3);
    }
  });

  return (
    <>
      <spotLight
        ref={lightRef}
        angle={0.62}
        penumbra={0.75}
        distance={26}
        intensity={quality === "LOW" ? 72 : 58}
        color="#bfe8ef"
        position={[0, 0, 0]}
      />
      <mesh ref={scanRingRef} visible={false}>
        <ringGeometry args={[0.9, 1.0, 48]} />
        <meshBasicMaterial color="#2DD9E8" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <group ref={robotRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#dfe7ea" roughness={0.35} metalness={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.02, 8, 28]} />
          <meshStandardMaterial color="#2DD9E8" emissive="#2DD9E8" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0, -0.14]}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <meshStandardMaterial color="#2DD9E8" emissive="#2DD9E8" emissiveIntensity={2.2} />
        </mesh>
      </group>
    </>
  );
}
