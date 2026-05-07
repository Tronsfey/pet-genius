import crypto from 'node:crypto';
import { Hono } from 'hono';
import { SpriteRequestSchema, SpriteResponseSchema } from '../src/lib/schemas';
import type { PetTraits, Rig } from '../src/lib/types';
import { env } from './env';
import { openai } from './openai';
import { spritePromptForGeneration } from './prompts';
import { sliceGridImage } from './slice';
import { buildTestPet } from './test-pet';

export const spriteApp = new Hono();

interface PetAssets {
  sprites: Record<string, string>;
  rig: Rig;
}

const cache = new Map<string, PetAssets>();
const CACHE_LIMIT = 32;

function traitHash(traits: PetTraits): string {
  return crypto.createHash('sha256').update(JSON.stringify(traits)).digest('hex').slice(0, 16);
}

function cachePut(key: string, value: PetAssets) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

async function generateRealPet(traits: PetTraits): Promise<PetAssets> {
  const prompt = spritePromptForGeneration(traits);
  const startedAt = Date.now();
  const result = await openai.images.generate({
    model: env.IMAGE_MODEL,
    prompt,
    size: '1024x1024',
    n: 1,
    background: 'transparent',
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('image upstream returned no b64_json');
  const buf = Buffer.from(b64, 'base64');
  console.log(`sprite gen: ${env.IMAGE_MODEL} done in ${Date.now() - startedAt}ms`);
  return sliceGridImage(buf);
}

spriteApp.post('/', async (c) => {
  let bodyRaw: unknown;
  try {
    bodyRaw = await c.req.json();
  } catch {
    return c.json({ error: { code: 'BadRequest', message: 'invalid JSON body' } }, 400);
  }

  const parsed = SpriteRequestSchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return c.json({ error: { code: 'BadRequest', message: parsed.error.message } }, 400);
  }
  const { traits } = parsed.data;
  const key = traitHash(traits);

  const cached = cache.get(key);
  if (cached) return c.json(cached);

  // Local-dev escape hatch: skip the upstream when we know it's blocked.
  if (env.USE_TEST_PET) {
    const testPet = await buildTestPet();
    cachePut(key, testPet);
    return c.json(testPet);
  }

  try {
    const pet = await generateRealPet(traits);
    // Pre-validate before caching/returning
    SpriteResponseSchema.parse(pet);
    cachePut(key, pet);
    return c.json(pet);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`sprite upstream error: ${msg}`);
    return c.json({ error: { code: 'Upstream', message: 'sprite generation failed' } }, 502);
  }
});
