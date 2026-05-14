import type { AnimationClip, ClipName, MoodState, Rig } from '@pet-genius/shared';

export interface FsmState {
  mood: MoodState;
  current: AnimationClip;
  startedAt: number;
  locked: boolean;
  queued: { mood: MoodState; clip: ClipName } | null;
}

export function createFsm(rig: Rig, now: number): FsmState {
  const idle = rig.clips.find((c) => c.name === 'idle');
  if (!idle) throw new Error('rig has no idle clip');
  return {
    mood: 'idle',
    current: idle,
    startedAt: now,
    locked: false,
    queued: null,
  };
}

export function transition(
  fsm: FsmState,
  rig: Rig,
  target: { mood: MoodState; clip: ClipName },
  now: number,
): void {
  if (fsm.locked) {
    fsm.queued = target;
    return;
  }
  const clip = rig.clips.find((c) => c.name === target.clip);
  if (!clip) return;
  fsm.mood = target.mood;
  fsm.current = clip;
  fsm.startedAt = now;
  fsm.locked = !clip.loops;
}

export function tickFsm(fsm: FsmState, rig: Rig, now: number): void {
  if (!fsm.locked) return;
  const elapsed = (now - fsm.startedAt) / 1000;
  if (elapsed < fsm.current.duration) return;

  fsm.locked = false;
  const next = fsm.queued ?? { mood: 'idle' as MoodState, clip: 'idle' as ClipName };
  fsm.queued = null;
  transition(fsm, rig, next, now);
}
