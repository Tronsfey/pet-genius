import sharp from 'sharp';
import { type ArtStyle, STYLES } from '../src/lib/style';
import type { Bone, BoneName, Rig } from '../src/lib/types';
import { defaultClips } from './clips';

// Cell layout matching spritePromptForGeneration. The 4×2 grid covers a
// 1024×1024 image (gpt-image-1's only supported square size); each cell is
// 256w × 512h with the body part centered with vertical padding.
export const CELL_LAYOUT: ReadonlyArray<{
  col: number;
  row: number;
  bone: BoneName;
  parent: BoneName | null;
  z: number;
}> = [
  { col: 0, row: 0, bone: 'head', parent: 'torso', z: 3 },
  { col: 1, row: 0, bone: 'torso', parent: null, z: 1 },
  { col: 2, row: 0, bone: 'legL', parent: 'torso', z: 0 },
  { col: 3, row: 0, bone: 'tail', parent: 'torso', z: 0 },
  { col: 0, row: 1, bone: 'armL', parent: 'torso', z: 2 },
  { col: 1, row: 1, bone: 'armR', parent: 'torso', z: 2 },
  { col: 2, row: 1, bone: 'legR', parent: 'torso', z: 0 },
  { col: 3, row: 1, bone: 'accessory', parent: 'head', z: 4 },
];

const GRID_COLS = 4;
const GRID_ROWS = 2;

interface TrimmedCell {
  pngBuf: Buffer;
  width: number;
  height: number;
  pivot: { x: number; y: number };
}

async function trimAndPivot(
  cellPng: Buffer,
  minNonTransparentRatio: number,
): Promise<TrimmedCell | null> {
  let trimmed: Buffer;
  let meta: sharp.Metadata;
  try {
    trimmed = await sharp(cellPng).trim().png().toBuffer();
    meta = await sharp(trimmed).metadata();
  } catch {
    return null;
  }
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 4 || h < 4) return null;

  const { data, info } = await sharp(trimmed)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const totalPx = info.width * info.height;
  let nonTransparent = 0;
  let sumX = 0;
  let sumY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * info.channels + 3]!;
      if (a > 16) {
        nonTransparent++;
        sumX += x;
        sumY += y;
      }
    }
  }
  if (nonTransparent / totalPx < minNonTransparentRatio) return null;

  return {
    pngBuf: trimmed,
    width: info.width,
    height: info.height,
    pivot: { x: Math.round(sumX / nonTransparent), y: Math.round(sumY / nonTransparent) },
  };
}

// Default attach offsets are computed proportionally to the parent's bbox so
// they scale correctly across art styles (a watercolor torso may be 4× bigger
// than a pixel one but the same proportions still anchor the limbs).
function attachFor(bone: BoneName, trimmed: Map<BoneName, TrimmedCell>): { x: number; y: number } {
  const torso = trimmed.get('torso');
  const head = trimmed.get('head');
  const tw = torso?.width ?? 40;
  const th = torso?.height ?? 28;
  const hh = head?.height ?? 26;
  switch (bone) {
    case 'torso':
      return { x: 0, y: 0 };
    case 'head':
      return { x: 0, y: -th * 0.36 };
    case 'armL':
      return { x: -tw * 0.4, y: -th * 0.15 };
    case 'armR':
      return { x: tw * 0.4, y: -th * 0.15 };
    case 'legL':
      return { x: -tw * 0.2, y: th * 0.45 };
    case 'legR':
      return { x: tw * 0.2, y: th * 0.45 };
    case 'tail':
      return { x: -tw * 0.55, y: th * 0.1 };
    case 'accessory':
      return { x: 0, y: -hh * 0.4 };
  }
}

export async function sliceGridImage(
  png: Buffer,
  style: ArtStyle,
): Promise<{ sprites: Record<string, string>; rig: Rig }> {
  const meta = await sharp(png).metadata();
  const totalW = meta.width ?? 0;
  const totalH = meta.height ?? 0;
  if (totalW < GRID_COLS || totalH < GRID_ROWS) {
    throw new Error(`sliceGridImage: image too small (${totalW}×${totalH})`);
  }
  const cellW = Math.floor(totalW / GRID_COLS);
  const cellH = Math.floor(totalH / GRID_ROWS);
  const minRatio = STYLES[style].minNonTransparentRatio;

  // First pass: trim every cell, collect metadata.
  const trimmed = new Map<BoneName, TrimmedCell>();
  for (const slot of CELL_LAYOUT) {
    const cellBuf = await sharp(png)
      .extract({
        left: slot.col * cellW,
        top: slot.row * cellH,
        width: cellW,
        height: cellH,
      })
      .png()
      .toBuffer();
    const t = await trimAndPivot(cellBuf, minRatio);
    if (t) trimmed.set(slot.bone, t);
  }

  if (!trimmed.has('torso') || !trimmed.has('head')) {
    throw new Error('sliceGridImage: missing required head or torso');
  }

  // Second pass: assemble bones using proportional attach offsets.
  const bones: Bone[] = [];
  const sprites: Record<string, string> = {};
  for (const slot of CELL_LAYOUT) {
    const t = trimmed.get(slot.bone);
    if (!t) continue;
    sprites[slot.bone] = `data:image/png;base64,${t.pngBuf.toString('base64')}`;
    bones.push({
      name: slot.bone,
      parent: slot.parent,
      pivot: t.pivot,
      attach: attachFor(slot.bone, trimmed),
      spriteId: slot.bone,
      z: slot.z,
    });
  }

  return {
    sprites,
    rig: { bones, clips: defaultClips },
  };
}
