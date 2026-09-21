/**
 * Quality tier detection (spec §14). AUTO chooses by device capability.
 */
export type QualityTier = "LOW" | "MEDIUM" | "HIGH";

export interface QualityProfile {
  dpr: [number, number];
  shadows: boolean;
  particleCount: number; // blood cells instanced count
  vesselSegments: number;
  bloom: boolean;
  anisotropy: number;
}

export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  LOW: {
    dpr: [0.5, 0.7],
    shadows: false,
    particleCount: 120,
    vesselSegments: 200,
    bloom: false,
    anisotropy: 1,
  },
  MEDIUM: {
    dpr: [1, 1.5],
    shadows: false,
    particleCount: 320,
    vesselSegments: 360,
    bloom: true,
    anisotropy: 4,
  },
  HIGH: {
    dpr: [1, 2],
    shadows: true,
    particleCount: 520,
    vesselSegments: 520,
    bloom: true,
    anisotropy: 8,
  },
};

export function detectQualityTier(): QualityTier {
  if (typeof navigator === "undefined") return "MEDIUM";
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const smallViewport = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 500;

  // software GL (sandbox / VM) — heavily constrained, force LOW
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : "";
      if (/swiftshader|llvmpipe|softpipe|software/i.test(renderer)) return "LOW";
    }
  } catch {
    /* capability probe best-effort */
  }

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += mem >= 8 ? 2 : mem >= 4 ? 1 : 0;
  if (mobile) score -= 1;
  if (smallViewport) score -= 1;
  if (score >= 3) return "HIGH";
  if (score >= 1) return "MEDIUM";
  return "LOW";
}
