import sharp from 'sharp';
import type { Bone, BoneName, Rig } from '../src/lib/types';
import { defaultClips } from './clips';

// Cell layout matching spritePromptForGeneration (4 cols × 2 rows in a 1024×1024 image).
// gpt-image-1 doesn't accept 1024×512, so cells are 256w × 512h with body part
// centered with padding above/below.
export const CELL_LAYOUT: ReadonlyArray<{
  col: number;
  row: number;
  bone: BoneName;
  parent: BoneName | null;
  z: number;
  defaultAttach: { x: number; y: number };
}> = [
  // Row 0
  { col: 0, row: 0, bone: 'head', parent: 'torso', z: 3, defaultAttach: { x: 0, y: -10 } },
  { col: 1, row: 0, bone: 'torso', parent: null, z: 1, defaultAttach: { x: 0, y: 0 } },
  { col: 2, row: 0, bone: 'legL', parent: 'torso', z: 0, defaultAttach: { x: -8, y: 12 } },
  { col: 3, row: 0, bone: 'tail', parent: 'torso', z: 0, defaultAttach: { x: -22, y: 4 } },
  // Row 1
  { col: 0, row: 1, bone: 'armL', parent: 'torso', z: 2, defaultAttach: { x: -16, y: -4 } },
  { col: 1, row: 1, bone: 'armR', parent: 'torso', z: 2, defaultAttach: { x: 16, y: -4 } },
  { col: 2, row: 1, bone: 'legR', parent: 'torso', z: 0, defaultAttach: { x: 8, y: 12 } },
  { col: 3, row: 1, bone: 'accessory', parent: 'head', z: 4, defaultAttach: { x: 0, y: -8 } },
];

const GRID_COLS = 4;
const GRID_ROWS = 2;
const MIN_NON_TRANSPARENT_RATIO = 0.05;

interface CellResult {
  bone: BoneName;
  parent: BoneName | null;
  z: number;
  defaultAttach: { x: number; y: number };
  pngBuf: Buffer;
  width: number;
  height: number;
  pivot: { x: number; y: number };
}

async function trimAndPivot(
  cellPng: Buffer,
): Promise<(CellResult['pivot'] & { pngBuf: Buffer; width: number; height: number }) | null> {
  // Alpha trim
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

  // Density check on trimmed buffer
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
  if (nonTransparent / totalPx < MIN_NON_TRANSPARENT_RATIO) return null;

  const pivotX = Math.round(sumX / nonTransparent);
  const pivotY = Math.round(sumY / nonTransparent);
  return { x: pivotX, y: pivotY, pngBuf: trimmed, width: info.width, height: info.height };
}

export async function sliceGridImage(
  png: Buffer,
): Promise<{ sprites: Record<string, string>; rig: Rig }> {
  const meta = await sharp(png).metadata();
  const totalW = meta.width ?? 0;
  const totalH = meta.height ?? 0;
  if (totalW < GRID_COLS || totalH < GRID_ROWS) {
    throw new Error(`sliceGridImage: image too small (${totalW}×${totalH})`);
  }
  const cellW = Math.floor(totalW / GRID_COLS);
  const cellH = Math.floor(totalH / GRID_ROWS);

  const bones: Bone[] = [];
  const sprites: Record<string, string> = {};

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

    const trimmed = await trimAndPivot(cellBuf);
    if (!trimmed) continue; // empty / sparse cell — drop

    sprites[slot.bone] = `data:image/png;base64,${trimmed.pngBuf.toString('base64')}`;
    bones.push({
      name: slot.bone,
      parent: slot.parent,
      pivot: { x: trimmed.x, y: trimmed.y },
      attach: slot.defaultAttach,
      spriteId: slot.bone,
      z: slot.z,
    });
  }

  // Validate minimum bones
  const hasTorso = bones.some((b) => b.name === 'torso');
  const hasHead = bones.some((b) => b.name === 'head');
  if (!hasTorso || !hasHead) {
    throw new Error('sliceGridImage: missing required head or torso');
  }

  return {
    sprites,
    rig: { bones, clips: defaultClips },
  };
}
