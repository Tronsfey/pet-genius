import type { AnimationClip } from './types';

// Default clip set used by all generated rigs. The behavior LLM
// (chat) emits ClipName-keyed animation hints; whatever rig is
// loaded must expose this exact vocabulary.
export const defaultClips: AnimationClip[] = [
  {
    name: 'idle',
    duration: 2.4,
    loops: true,
    keyframes: [
      { t: 0, pose: { torso: { y: 0 } }, ease: 'easeInOut' },
      { t: 0.5, pose: { torso: { y: -1.5 }, tail: { rot: 0.15 } }, ease: 'easeInOut' },
      { t: 1, pose: { torso: { y: 0 } } },
    ],
  },
  {
    name: 'happy_bounce',
    duration: 0.7,
    loops: false,
    keyframes: [
      { t: 0, pose: {} },
      {
        t: 0.35,
        pose: {
          torso: { y: -10 },
          head: { rot: 0.12 },
          armL: { rot: -0.3 },
          armR: { rot: 0.3 },
          tail: { rot: 0.4 },
        },
        ease: 'easeOutBack',
      },
      { t: 1, pose: {} },
    ],
  },
  {
    name: 'eating',
    duration: 0.6,
    loops: true,
    keyframes: [
      { t: 0, pose: { head: { rot: 0 } } },
      { t: 0.5, pose: { head: { rot: 0.2 } }, ease: 'easeInOut' },
      { t: 1, pose: { head: { rot: 0 } }, ease: 'easeInOut' },
    ],
  },
  {
    name: 'sleeping',
    duration: 3,
    loops: true,
    keyframes: [
      { t: 0, pose: { head: { rot: 0.35, y: 4 } } },
      { t: 0.5, pose: { head: { rot: 0.4, y: 6 } }, ease: 'easeInOut' },
      { t: 1, pose: { head: { rot: 0.35, y: 4 } } },
    ],
  },
  {
    name: 'playing',
    duration: 0.8,
    loops: true,
    keyframes: [
      { t: 0, pose: {} },
      { t: 0.5, pose: { torso: { rot: 0.12 }, tail: { rot: -0.4 } }, ease: 'easeInOut' },
      { t: 1, pose: {} },
    ],
  },
  {
    name: 'sad',
    duration: 1.2,
    loops: true,
    keyframes: [
      { t: 0, pose: { head: { y: 3, rot: -0.1 }, tail: { rot: -0.3 } } },
      { t: 1, pose: { head: { y: 4, rot: -0.1 }, tail: { rot: -0.3 } } },
    ],
  },
  {
    name: 'wake',
    duration: 0.5,
    loops: false,
    keyframes: [
      { t: 0, pose: { head: { rot: 0.35, y: 4 } } },
      { t: 1, pose: {}, ease: 'easeOutBack' },
    ],
  },
  {
    name: 'stretch',
    duration: 0.9,
    loops: false,
    keyframes: [
      { t: 0, pose: {} },
      { t: 0.5, pose: { torso: { scale: 1.08 } }, ease: 'easeInOut' },
      { t: 1, pose: {} },
    ],
  },
];
