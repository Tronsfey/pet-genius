import crypto from 'node:crypto';
import {
  type PetTraits,
  type Rig,
  SpriteRequestSchema,
  SpriteResponseSchema,
} from '@pet-genius/shared';
import { Hono } from 'hono';
import type { ServerContext } from './context';
import { spritePromptForGeneration } from './prompts';
import { sliceGridImage } from './slice';
import { buildTestPet } from './test-pet';

interface PetAssets {
  sprites: Record<string, string>;
  rig: Rig;
  traits: PetTraits;
}

const CACHE_LIMIT = 32;

function traitHash(traits: PetTraits): string {
  return crypto.createHash('sha256').update(JSON.stringify(traits)).digest('hex').slice(0, 16);
}

export function createSpriteApp(ctx: ServerContext): Hono {
  const app = new Hono();
  const cache = new Map<string, PetAssets>();

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
    const result = await ctx.openai.images.generate({
      model: ctx.imageModel,
      prompt,
      size: '1024x1024',
      n: 1,
      background: 'transparent',
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('image upstream returned no b64_json');
    const buf = Buffer.from(b64, 'base64');
    console.log(`sprite gen: ${ctx.imageModel} done in ${Date.now() - startedAt}ms`);
    const { sprites, rig } = await sliceGridImage(buf, traits.style);
    return { sprites, rig, traits };
  }

  app.post('/', async (c) => {
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

    if (ctx.useTestPet) {
      const { sprites, rig } = await buildTestPet();
      const echoedTraits: PetTraits = { ...traits, style: 'pixel' };
      const pet: PetAssets = { sprites, rig, traits: echoedTraits };
      cachePut(key, pet);
      return c.json(pet);
    }

    try {
      const pet = await generateRealPet(traits);
      SpriteResponseSchema.parse(pet);
      cachePut(key, pet);
      return c.json(pet);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      console.error(`sprite upstream error: ${msg}`);
      return c.json({ error: { code: 'Upstream', message: 'sprite generation failed' } }, 502);
    }
  });

  return app;
}
