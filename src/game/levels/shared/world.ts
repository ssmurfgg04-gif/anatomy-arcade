/**
 * Shared tube-world factory (P7): the heart mission's proven vessel engine,
 * parameterized so the Viral + Brain missions reuse the same mobile-safe
 * flight/collision/guidance math with their own splines, radii and palettes.
 * The heart slice keeps its own modules untouched (priority law #1).
 */
import * as THREE from "three";

export interface TubeZone {
  id: string;
  t0: number;
  t1: number;
}

export interface TubeWorldSpec {
  /** control points for the Catmull-Rom spline (world units) */
  points: THREE.Vector3[];
  /** tube radius at t with state multiplier (cleared = treatment progress 0..1) */
  radiusAt: (t: number, cleared: number) => number;
  baseRadius: number;
  /** wall-damage/inflammation 0..1 at t (drives the shader warning pulse) */
  damageAt?: (t: number) => number;
}

export interface TubeWorld {
  curve: THREE.CatmullRomCurve3;
  length: number;
  baseRadius: number;
  radiusAt: (t: number, cleared: number) => number;
  damageAt: (t: number) => number;
  /** world position offset from centerline in the tube's local frame */
  offsetPoint: (t: number, angle: number, dist: number, cleared?: number, out?: THREE.Vector3) => THREE.Vector3;
}

const UP = new THREE.Vector3(0, 1, 0);

export function createTubeWorld(spec: TubeWorldSpec): TubeWorld {
  const curve = new THREE.CatmullRomCurve3(spec.points, false, "catmullrom", 0.5);
  const length = curve.getLength();
  const damageAt = spec.damageAt ?? (() => 0);

  const _t = new THREE.Vector3();
  const _r = new THREE.Vector3();
  const _u = new THREE.Vector3();

  const offsetPoint = (
    t: number,
    angle: number,
    dist: number,
    cleared = 0,
    out = new THREE.Vector3()
  ): THREE.Vector3 => {
    curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1), out);
    curve.getTangentAt(THREE.MathUtils.clamp(t, 0, 1), _t);
    _r.crossVectors(_t, UP).normalize();
    if (_r.lengthSq() < 0.01) _r.set(1, 0, 0);
    _u.crossVectors(_r, _t).normalize();
    const radius = spec.baseRadius * spec.radiusAt(t, cleared);
    out.addScaledVector(_r, Math.cos(angle) * dist * radius);
    out.addScaledVector(_u, Math.sin(angle) * dist * radius);
    return out;
  };

  return {
    curve,
    length,
    baseRadius: spec.baseRadius,
    radiusAt: spec.radiusAt,
    damageAt,
    offsetPoint,
  };
}

/** Anchor + tangent approximated by lerp across raw control points (sign placement). */
export function anchorAt(points: THREE.Vector3[], t: number, out: THREE.Vector3): THREE.Vector3 {
  const f = t * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f));
  return out.copy(points[i]).lerp(points[i + 1], f - i);
}

export function tangentAt(points: THREE.Vector3[], t: number, out: THREE.Vector3): THREE.Vector3 {
  const f = t * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f));
  return out.subVectors(points[i + 1], points[i]).normalize();
}

/** Branch spline hanging off the main tube at junctionT (dead-end spur). */
export function buildSpur(
  points: THREE.Vector3[],
  junctionT: number,
  sideDir: { right: number; up: number }
): THREE.CatmullRomCurve3 {
  const anchor = anchorAt(points, junctionT, new THREE.Vector3());
  const dir = tangentAt(points, junctionT, new THREE.Vector3());
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, dir).normalize();
  const side = right.clone().multiplyScalar(sideDir.right).add(up.clone().multiplyScalar(sideDir.up)).normalize();
  return new THREE.CatmullRomCurve3(
    [
      anchor.clone().addScaledVector(dir, -1.2),
      anchor.clone().addScaledVector(dir, 0.6).addScaledVector(side, 1.4),
      anchor.clone().addScaledVector(dir, 2.6).addScaledVector(side, 4.2),
      anchor.clone().addScaledVector(dir, 4.6).addScaledVector(side, 7.2),
      anchor.clone().addScaledVector(dir, 6.4).addScaledVector(side, 9.8),
    ],
    false,
    "catmullrom",
    0.5
  );
}

const _ray = new THREE.Raycaster();
_ray.far = 12;
const _vFwd = new THREE.Vector3();
const _vTo = new THREE.Vector3();

/**
 * Scan resolution: exact ray first, then a 20-degree aim-assist cone (nearest
 * angle wins). Flight drift means a perfectly-aimed reticle still wobbles —
 * the assist keeps scanning fair without ever grabbing a target behind the
 * player or outside the cone.
 */
export function resolveScanTarget(
  targets: THREE.Object3D[],
  camera: THREE.Camera
): { organ: string; id: string } | null {
  _ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  for (const target of targets) {
    if (_ray.intersectObject(target, true).length > 0) {
      return { organ: target.userData.organ as string, id: target.userData.anatomyId as string };
    }
  }
  camera.getWorldDirection(_vFwd);
  let bestAng = 0.35;
  let best: THREE.Object3D | null = null;
  for (const target of targets) {
    _vTo.setFromMatrixPosition(target.matrixWorld).sub(camera.position);
    const dist = _vTo.length();
    if (dist < 0.2 || dist > 11) continue;
    _vTo.divideScalar(dist);
    const ang = Math.acos(THREE.MathUtils.clamp(_vTo.dot(_vFwd), -1, 1));
    if (ang < bestAng) {
      bestAng = ang;
      best = target;
    }
  }
  return best ? { organ: best.userData.organ as string, id: best.userData.anatomyId as string } : null;
}
