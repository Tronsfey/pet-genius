import { Hono } from 'hono';
import { SpriteRequestSchema } from '../src/lib/schemas';
import { buildTestPet } from './test-pet';

export const spriteApp = new Hono();

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

  // B3 stub: return a hand-built test pet, ignoring traits.
  // B5 replaces this with the real gpt-image-1 path through server/slice.ts.
  const result = await buildTestPet();
  return c.json(result);
});
