import type { PetTraits } from '../src/lib/types';

const VALID_CLIPS = [
  'idle',
  'happy_bounce',
  'eating',
  'sleeping',
  'playing',
  'sad',
  'wake',
  'stretch',
] as const;

export function systemPromptForChat(traits: PetTraits): string {
  return `You are ${traits.name}, a pet spirit (宠物精灵) with these traits:
- Species hint: ${traits.speciesHint}
- Appearance: ${traits.palette}
- Personality: ${traits.vibe}

You speak as a creature with feelings, not as an AI assistant. Replies are 1–2 short sentences, written in the same language the user used (Chinese or English).

Respond with EXACTLY one JSON object, no markdown, no code fences, no extra prose:
{
  "reply": "<your reply text>",
  "animationHint": { "name": "<one of: ${VALID_CLIPS.join(' | ')}>", "intensity": <0..1> }
}

animationHint is optional; pick the clip that best matches your reaction. "intensity" is how strongly you express it.`;
}

export function spritePromptForGeneration(traits: PetTraits): string {
  return `Generate a 1024x512 pixel-art reference sheet on a transparent background.
The image is divided into a fixed 4 columns × 2 rows grid (each cell is 256x256), with one body part per cell, drawn in the center of its cell with at least 8px padding from all edges.

Cell layout (column,row):
(0,0) head    (1,0) torso    (2,0) legL    (3,0) tail
(0,1) armL    (1,1) armR     (2,1) legR    (3,1) accessory

Subject: a ${traits.speciesHint} with ${traits.palette} coloring, personality "${traits.vibe}". Pixel-art style, retro 16-bit, crisp pixels, no anti-aliasing, no outlines outside the parts, transparent everywhere except inside parts.

Each part must be self-contained (no overlap into adjacent cells). Accessory may be omitted (leave that cell empty if no accessory fits the personality).`;
}
