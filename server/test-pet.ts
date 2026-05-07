import sharp from 'sharp';
import type { Rig } from '../src/lib/types';

async function rect(w: number, h: number, r: number, g: number, b: number): Promise<string> {
  const buf = await sharp({
    create: { width: w, height: h, channels: 4, background: { r, g, b, alpha: 1 } },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

export async function buildTestPet(): Promise<{ sprites: Record<string, string>; rig: Rig }> {
  const torso = await rect(40, 28, 232, 138, 92);
  const head = await rect(28, 26, 244, 158, 112);
  const legL = await rect(10, 12, 198, 102, 70);
  const legR = await rect(10, 12, 198, 102, 70);
  const armL = await rect(10, 16, 220, 118, 78);
  const armR = await rect(10, 16, 220, 118, 78);
  const tail = await rect(14, 8, 210, 110, 78);

  const rig: Rig = {
    bones: [
      {
        name: 'torso',
        parent: null,
        pivot: { x: 20, y: 14 },
        attach: { x: 0, y: 0 },
        spriteId: 'torso',
        z: 1,
      },
      {
        name: 'head',
        parent: 'torso',
        pivot: { x: 14, y: 22 },
        attach: { x: 0, y: -14 },
        spriteId: 'head',
        z: 3,
      },
      {
        name: 'armL',
        parent: 'torso',
        pivot: { x: 5, y: 2 },
        attach: { x: -18, y: -8 },
        spriteId: 'armL',
        z: 2,
      },
      {
        name: 'armR',
        parent: 'torso',
        pivot: { x: 5, y: 2 },
        attach: { x: 18, y: -8 },
        spriteId: 'armR',
        z: 2,
      },
      {
        name: 'legL',
        parent: 'torso',
        pivot: { x: 5, y: 0 },
        attach: { x: -10, y: 14 },
        spriteId: 'legL',
        z: 0,
      },
      {
        name: 'legR',
        parent: 'torso',
        pivot: { x: 5, y: 0 },
        attach: { x: 10, y: 14 },
        spriteId: 'legR',
        z: 0,
      },
      {
        name: 'tail',
        parent: 'torso',
        pivot: { x: 0, y: 4 },
        attach: { x: -22, y: 0 },
        spriteId: 'tail',
        z: 0,
      },
    ],
    clips: [
      {
        name: 'idle',
        duration: 2.4,
        loops: true,
        keyframes: [
          { t: 0, pose: { torso: { y: 0 } }, ease: 'easeInOut' },
          { t: 0.5, pose: { torso: { y: -1.5 } }, ease: 'easeInOut' },
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
            pose: { torso: { y: -10 }, head: { rot: 0.12 } },
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
          { t: 0, pose: { head: { y: 3, rot: -0.1 } } },
          { t: 1, pose: { head: { y: 4, rot: -0.1 } } },
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
    ],
  };

  return {
    sprites: { torso, head, armL, armR, legL, legR, tail },
    rig,
  };
}
