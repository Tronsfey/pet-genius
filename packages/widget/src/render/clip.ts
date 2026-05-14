import type { AnimationClip, BoneName, Pose } from '@pet-genius/shared';
import { ease } from './easing';

const BONE_NAMES: BoneName[] = [
  'head',
  'torso',
  'armL',
  'armR',
  'legL',
  'legR',
  'tail',
  'accessory',
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function bonePart(p: Pose | undefined, name: BoneName) {
  if (!p) return undefined;
  return p[name];
}

// Sample the clip at time `tSec`. Returns a fresh Pose; allocations
// here are kept per-frame minimal but not zero — fine for B4 scale.
export function sampleClipAt(clip: AnimationClip, tSec: number): Pose {
  const tNorm = clip.loops
    ? ((tSec % clip.duration) / clip.duration + 1) % 1
    : Math.max(0, Math.min(1, tSec / clip.duration));

  // Find bracketing keyframes by t
  let prev = clip.keyframes[0]!;
  let next = clip.keyframes[clip.keyframes.length - 1]!;
  for (let i = 0; i < clip.keyframes.length - 1; i++) {
    const k = clip.keyframes[i]!;
    const k2 = clip.keyframes[i + 1]!;
    if (tNorm >= k.t && tNorm <= k2.t) {
      prev = k;
      next = k2;
      break;
    }
  }

  const span = next.t - prev.t;
  const localT = span === 0 ? 0 : (tNorm - prev.t) / span;
  const eased = ease(next.ease, localT);

  const out: Pose = {};
  for (const name of BONE_NAMES) {
    const a = bonePart(prev.pose, name);
    const b = bonePart(next.pose, name);
    if (!a && !b) continue;
    const aa = a ?? {};
    const bb = b ?? {};
    out[name] = {
      x: lerp(aa.x ?? 0, bb.x ?? 0, eased),
      y: lerp(aa.y ?? 0, bb.y ?? 0, eased),
      rot: lerp(aa.rot ?? 0, bb.rot ?? 0, eased),
      scale: lerp(aa.scale ?? 1, bb.scale ?? 1, eased),
    };
  }
  return out;
}
