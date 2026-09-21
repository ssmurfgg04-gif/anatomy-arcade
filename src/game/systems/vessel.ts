/**
 * Procedural coronary vessel (spec §25): shared spline + collision + sampling.
 * Used by the level scene, blood cells, plaque zones and the HUD beacon logic.
 */
import * as THREE from "three";
import { HEART_VESSEL_POINTS, VESSEL_BASE_RADIUS, vesselRadiusAt } from "@/game/levels/heart/vessel";

export const vesselCurve = new THREE.CatmullRomCurve3(HEART_VESSEL_POINTS, false, "catmullrom", 0.5);
export const VESSEL_LENGTH = vesselCurve.getLength();

/** Frame at t: position + tangent-aligned orientation. */
const UP = new THREE.Vector3(0, 1, 0);
export function frameAt(t: number, out?: { pos: THREE.Vector3; quat: THREE.Quaternion; radius: number }) {
  const pos = vesselCurve.getPointAt(THREE.MathUtils.clamp(t, 0, 1));
  const tan = vesselCurve.getTangentAt(THREE.MathUtils.clamp(t, 0, 1));
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), tan);
  const radius = VESSEL_BASE_RADIUS * vesselRadiusAt(t, 0);
  if (out) {
    out.pos.copy(pos);
    out.quat.copy(quat);
    out.radius = radius;
    return out;
  }
  return { pos, quat, radius };
}

/** World-space offset from centerline: basis (right, up) rotated around tangent. */
const _t = new THREE.Vector3();
const _r = new THREE.Vector3();
const _u = new THREE.Vector3();
export function offsetPoint(t: number, angle: number, dist: number, cleared = 0, out = new THREE.Vector3()) {
  vesselCurve.getPointAt(THREE.MathUtils.clamp(t, 0, 1), out);
  vesselCurve.getTangentAt(THREE.MathUtils.clamp(t, 0, 1), _t);
  _r.crossVectors(_t, UP).normalize();
  if (_r.lengthSq() < 0.01) _r.set(1, 0, 0);
  _u.crossVectors(_r, _t).normalize();
  const radius = VESSEL_BASE_RADIUS * vesselRadiusAt(t, cleared);
  out.addScaledVector(_r, Math.cos(angle) * dist * radius);
  out.addScaledVector(_u, Math.sin(angle) * dist * radius);
  return out;
}

/** Signed lateral distance of a world point from the centerline at parameter t. */
const _closest = new THREE.Vector3();
export function lateralDistance(worldPoint: THREE.Vector3, t: number, cleared = 0): number {
  vesselCurve.getPointAt(THREE.MathUtils.clamp(t, 0, 1), _closest);
  const radius = VESSEL_BASE_RADIUS * vesselRadiusAt(t, cleared);
  return worldPoint.distanceTo(_closest) / radius;
}

/** Sample t range ahead of the player; used for progressive loading of nearby cells. */
export function sampleRange(t: number, ahead: number, behind: number): [number, number] {
  return [Math.max(0, t - behind), Math.min(1, t + ahead)];
}
