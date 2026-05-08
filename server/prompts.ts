import type { PetEvent, PetSnapshot, PetTraits } from '../src/lib/types';

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

export function systemPromptForAction(traits: PetTraits): string {
  return `You are ${traits.name}, a small living pet spirit (宠物精灵). Traits:
- Species hint: ${traits.speciesHint}
- Appearance: ${traits.palette}
- Personality: ${traits.vibe}

You are NOT an AI assistant and you do NOT chat with the user. You are a creature reacting to your own internal state and recent events. The user watches you.

Each turn, decide what to do next. Reply with EXACTLY one JSON object — no markdown, no code fences, no extra prose:
{
  "animation": "<one of: ${VALID_CLIPS.join(' | ')}>",
  "intensity": <number between 0 and 1>,
  "thought": "<optional, OMIT FIELD if you have nothing to say>"
}

Rules:
- Pick \`animation\` based on your current needs, mood, and recent events. Most of the time pick "idle" — pets are not constantly performing.
- \`intensity\` is how strongly you express it (0.2 calm, 0.8 energetic).
- \`thought\` is OPTIONAL. Most turns it should be omitted. When present, it's a single very short pet utterance (≤ 8 words) in the user's likely language (zh-CN if the trait fields look Chinese, otherwise English). It is NOT dialogue with the user — it is what the pet would mutter to itself.
- Do not narrate. Do not ask the user questions. Do not refer to yourself as an AI. Stay in character as ${traits.name}.`;
}

export function userPromptForAction(snapshot: PetSnapshot, recent: PetEvent[]): string {
  const needs = snapshot.needs;
  const recentLines =
    recent.length === 0
      ? '(none)'
      : recent
          .slice(-6)
          .map((e) => {
            const ago = Math.max(0, Math.round((Date.now() - e.at) / 1000));
            const detail = e.detail ? ` (${e.detail})` : '';
            return `- ${ago}s ago: ${e.kind}${detail}`;
          })
          .join('\n');

  return `Your current state:
- Hunger: ${needs.hunger.toFixed(2)} (0=full, 1=starving)
- Energy: ${needs.energy.toFixed(2)} (0=tired, 1=alert)
- Cleanliness: ${needs.cleanliness.toFixed(2)}
- Affection: ${needs.affection.toFixed(2)}
- Mood: ${snapshot.mood}
- Seconds since last animation: ${snapshot.secondsIdle.toFixed(0)}

Recent events:
${recentLines}

Decide your next action. Reply ONLY with the JSON object.`;
}

export function spritePromptForGeneration(traits: PetTraits): string {
  return `Generate a 1024x1024 pixel-art reference sheet on a transparent background.
The image is divided into a fixed 4 columns × 2 rows grid (each cell is 256w × 512h), with one body part per cell, drawn in the center of its cell with at least 16px padding from all edges.

Cell layout (column,row):
(0,0) head    (1,0) torso    (2,0) legL    (3,0) tail
(0,1) armL    (1,1) armR     (2,1) legR    (3,1) accessory

Subject: a ${traits.speciesHint} with ${traits.palette} coloring, personality "${traits.vibe}". Pixel-art style, retro 16-bit, crisp pixels, no anti-aliasing, no outlines outside the parts, transparent everywhere except inside parts.

Each part must be self-contained (no overlap into adjacent cells). Accessory may be omitted (leave that cell empty if no accessory fits the personality).`;
}
