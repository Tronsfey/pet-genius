import sharp from 'sharp';
import type { Rig } from '../src/lib/types';
import { defaultClips } from './clips';

interface Px {
  x: number;
  y: number;
  w?: number;
  h?: number;
  fill: string;
}

const O_BASE = '#e88a5c';
const O_LIGHT = '#f4a87a';
const O_DARK = '#c66646';
const O_BELLY = '#fcdcbc';
const INK = '#1c161e';
const PAW = '#3c2832';
const WHITE = '#fcf8ee';
const PINK = '#f08e9e';

async function svgToPng(width: number, height: number, pixels: Px[]): Promise<Buffer> {
  const rects = pixels
    .map(
      (p) =>
        `<rect x="${p.x}" y="${p.y}" width="${p.w ?? 1}" height="${p.h ?? 1}" fill="${p.fill}" shape-rendering="crispEdges"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${rects}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function dataUrl(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function buildHead(): Promise<string> {
  const W = 28;
  const H = 26;
  const px: Px[] = [
    // Body fill
    { x: 1, y: 4, w: 26, h: 20, fill: O_LIGHT },
    { x: 0, y: 6, w: 1, h: 16, fill: O_LIGHT },
    { x: 27, y: 6, w: 1, h: 16, fill: O_LIGHT },
    { x: 2, y: 3, w: 24, h: 1, fill: O_LIGHT },
    { x: 4, y: 23, w: 20, h: 2, fill: O_LIGHT },
    // Ears
    { x: 2, y: 0, w: 4, h: 4, fill: O_BASE },
    { x: 22, y: 0, w: 4, h: 4, fill: O_BASE },
    { x: 3, y: 1, w: 2, h: 2, fill: O_DARK },
    { x: 23, y: 1, w: 2, h: 2, fill: O_DARK },
    // Forehead/snout shading
    { x: 11, y: 6, w: 6, h: 1, fill: O_BASE },
    // Eyes
    { x: 6, y: 11, w: 5, h: 4, fill: WHITE },
    { x: 17, y: 11, w: 5, h: 4, fill: WHITE },
    { x: 8, y: 12, w: 2, h: 3, fill: INK },
    { x: 19, y: 12, w: 2, h: 3, fill: INK },
    { x: 9, y: 12, w: 1, h: 1, fill: WHITE },
    { x: 20, y: 12, w: 1, h: 1, fill: WHITE },
    // Cheeks
    { x: 4, y: 17, w: 3, h: 2, fill: PINK },
    { x: 21, y: 17, w: 3, h: 2, fill: PINK },
    // Snout
    { x: 12, y: 16, w: 4, h: 4, fill: O_BELLY },
    // Nose
    { x: 13, y: 17, w: 2, h: 1, fill: INK },
    // Mouth
    { x: 11, y: 20, w: 2, h: 1, fill: INK },
    { x: 15, y: 20, w: 2, h: 1, fill: INK },
    { x: 13, y: 21, w: 2, h: 1, fill: INK },
  ];
  return dataUrl(await svgToPng(W, H, px));
}

async function buildTorso(): Promise<string> {
  const W = 40;
  const H = 28;
  const px: Px[] = [
    // Body
    { x: 2, y: 2, w: 36, h: 24, fill: O_BASE },
    { x: 1, y: 4, w: 1, h: 20, fill: O_BASE },
    { x: 38, y: 4, w: 1, h: 20, fill: O_BASE },
    { x: 4, y: 1, w: 32, h: 1, fill: O_BASE },
    { x: 6, y: 26, w: 28, h: 1, fill: O_BASE },
    // Top edge shadow
    { x: 4, y: 2, w: 32, h: 1, fill: O_DARK },
    // Belly
    { x: 14, y: 8, w: 12, h: 16, fill: O_LIGHT },
    { x: 16, y: 10, w: 8, h: 12, fill: O_BELLY },
    // Bottom shadow
    { x: 6, y: 25, w: 28, h: 1, fill: O_DARK },
  ];
  return dataUrl(await svgToPng(W, H, px));
}

async function buildLeg(): Promise<string> {
  const W = 10;
  const H = 12;
  const px: Px[] = [
    { x: 1, y: 0, w: 8, h: 9, fill: O_DARK },
    { x: 0, y: 2, w: 1, h: 6, fill: O_DARK },
    { x: 9, y: 2, w: 1, h: 6, fill: O_DARK },
    // Paw
    { x: 0, y: 9, w: 10, h: 3, fill: PAW },
    { x: 2, y: 10, w: 1, h: 2, fill: WHITE },
    { x: 4, y: 10, w: 1, h: 2, fill: WHITE },
    { x: 6, y: 10, w: 1, h: 2, fill: WHITE },
    { x: 8, y: 10, w: 1, h: 2, fill: WHITE },
  ];
  return dataUrl(await svgToPng(W, H, px));
}

async function buildArm(): Promise<string> {
  const W = 10;
  const H = 16;
  const px: Px[] = [
    { x: 1, y: 0, w: 8, h: 13, fill: O_BASE },
    { x: 0, y: 2, w: 1, h: 10, fill: O_BASE },
    { x: 9, y: 2, w: 1, h: 10, fill: O_BASE },
    { x: 1, y: 0, w: 8, h: 1, fill: O_DARK },
    // Paw
    { x: 0, y: 13, w: 10, h: 3, fill: PAW },
    { x: 3, y: 14, w: 1, h: 2, fill: WHITE },
    { x: 5, y: 14, w: 1, h: 2, fill: WHITE },
    { x: 7, y: 14, w: 1, h: 2, fill: WHITE },
  ];
  return dataUrl(await svgToPng(W, H, px));
}

async function buildTail(): Promise<string> {
  const W = 16;
  const H = 10;
  const px: Px[] = [
    // Tail shaft
    { x: 0, y: 4, w: 12, h: 4, fill: O_DARK },
    { x: 2, y: 3, w: 8, h: 1, fill: O_DARK },
    { x: 4, y: 8, w: 6, h: 1, fill: O_DARK },
    // Tip (white)
    { x: 10, y: 1, w: 6, h: 7, fill: WHITE },
    { x: 11, y: 0, w: 4, h: 1, fill: WHITE },
    { x: 12, y: 8, w: 2, h: 1, fill: WHITE },
  ];
  return dataUrl(await svgToPng(W, H, px));
}

export async function buildTestPet(): Promise<{ sprites: Record<string, string>; rig: Rig }> {
  const torso = await buildTorso();
  const head = await buildHead();
  const legL = await buildLeg();
  const legR = await buildLeg();
  const armL = await buildArm();
  const armR = await buildArm();
  const tail = await buildTail();

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
        attach: { x: 0, y: -10 },
        spriteId: 'head',
        z: 3,
      },
      {
        name: 'armL',
        parent: 'torso',
        pivot: { x: 5, y: 2 },
        attach: { x: -16, y: -4 },
        spriteId: 'armL',
        z: 2,
      },
      {
        name: 'armR',
        parent: 'torso',
        pivot: { x: 5, y: 2 },
        attach: { x: 16, y: -4 },
        spriteId: 'armR',
        z: 2,
      },
      {
        name: 'legL',
        parent: 'torso',
        pivot: { x: 5, y: 0 },
        attach: { x: -8, y: 12 },
        spriteId: 'legL',
        z: 0,
      },
      {
        name: 'legR',
        parent: 'torso',
        pivot: { x: 5, y: 0 },
        attach: { x: 8, y: 12 },
        spriteId: 'legR',
        z: 0,
      },
      {
        name: 'tail',
        parent: 'torso',
        pivot: { x: 0, y: 5 },
        attach: { x: -22, y: 4 },
        spriteId: 'tail',
        z: 0,
      },
    ],
    clips: defaultClips,
  };

  return {
    sprites: { torso, head, armL, armR, legL, legR, tail },
    rig,
  };
}
