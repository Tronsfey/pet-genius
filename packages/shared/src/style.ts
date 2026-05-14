// One source of truth for art style. Drives:
//  - the image-gen prompt (server/prompts.ts)
//  - the slicer's empty-cell threshold (server/slice.ts)
//  - the PixiJS scaleMode + integer-zoom rule + canvas image-rendering (src/render/app.ts)
//  - the per-frame pose offset multiplier (src/render/rig.ts), so animations
//    look proportional regardless of native sprite size.
//
// All four touch-points read this map, never hard-code per-style values.

export type ArtStyle = 'pixel' | 'flat' | 'watercolor' | 'storybook';

export interface StyleConfig {
  label: string;
  promptStyle: string;
  scaleMode: 'nearest' | 'linear';
  pixelated: boolean;
  baseScale: number;
  clipScaleFactor: number;
  minNonTransparentRatio: number;
}

export const STYLES: Record<ArtStyle, StyleConfig> = {
  pixel: {
    label: '像素风',
    promptStyle:
      'Pixel-art style, retro 16-bit, crisp clearly-defined pixels, no anti-aliasing, hard color edges',
    scaleMode: 'nearest',
    pixelated: true,
    baseScale: 4,
    clipScaleFactor: 1,
    minNonTransparentRatio: 0.05,
  },
  flat: {
    label: '扁平矢量',
    promptStyle:
      'Flat vector illustration style, clean rounded shapes, soft pastel palette, simple cell shading, gentle outlines',
    scaleMode: 'linear',
    pixelated: false,
    baseScale: 1,
    clipScaleFactor: 4,
    minNonTransparentRatio: 0.04,
  },
  watercolor: {
    label: '水彩',
    promptStyle:
      'Soft watercolor painting style, painterly washes, gentle gradients, slightly textured edges, warm cozy palette',
    scaleMode: 'linear',
    pixelated: false,
    baseScale: 1,
    clipScaleFactor: 4,
    minNonTransparentRatio: 0.02,
  },
  storybook: {
    label: '童话绘本',
    promptStyle:
      'Storybook illustration, hand-drawn ink lines, gouache fills, cozy warm palette, slight paper texture',
    scaleMode: 'linear',
    pixelated: false,
    baseScale: 1,
    clipScaleFactor: 4,
    minNonTransparentRatio: 0.03,
  },
};
