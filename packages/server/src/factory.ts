import { Hono } from 'hono';
import OpenAI from 'openai';
import { createActionApp } from './action';
import type { ServerContext } from './context';
import { createSpriteApp } from './sprite';

export interface PetGeniusServerOptions {
  /** OpenAI-compatible API key. REQUIRED. Never log or echo. */
  openaiApiKey: string;
  /** Override the OpenAI baseURL (e.g. for a self-hosted proxy or alternative provider). */
  openaiBaseURL?: string;
  /** Override the chat model name. Default: gpt-4o-mini. */
  chatModel?: string;
  /** Override the image model name. Default: gpt-image-1. */
  imageModel?: string;
  /**
   * When true, `/api/sprite` returns a built-in hand-drawn pixel pet
   * instead of calling gpt-image-1. Useful for local dev when the upstream
   * is unreachable or you don't want to spend tokens.
   */
  useTestPet?: boolean;
  /**
   * Mount a `GET /healthz` returning `{ ok: true }` on the returned app.
   * Default: true.
   */
  healthz?: boolean;
}

/**
 * Build a Hono router exposing pet-genius's two endpoints:
 *   POST /api/sprite  -> generates (or returns cached) sprite + rig for traits
 *   POST /api/action  -> the behavior LLM picks the pet's next animation
 *
 * Mount it under any prefix in your existing Hono / Node server.
 *
 * @example
 *   import { createPetGeniusApp } from '@pet-genius/server';
 *   const pets = createPetGeniusApp({ openaiApiKey: process.env.OPENAI_API_KEY! });
 *   app.route('/pet', pets);
 */
export function createPetGeniusApp(opts: PetGeniusServerOptions): Hono {
  if (!opts.openaiApiKey) {
    throw new Error('createPetGeniusApp: openaiApiKey is required');
  }
  const ctx: ServerContext = {
    openai: new OpenAI({
      apiKey: opts.openaiApiKey,
      ...(opts.openaiBaseURL ? { baseURL: opts.openaiBaseURL } : {}),
    }),
    chatModel: opts.chatModel ?? 'gpt-4o-mini',
    imageModel: opts.imageModel ?? 'gpt-image-1',
    useTestPet: opts.useTestPet ?? false,
  };

  const app = new Hono();
  if (opts.healthz !== false) {
    app.get('/healthz', (c) => c.json({ ok: true }));
  }
  app.route('/api/action', createActionApp(ctx));
  app.route('/api/sprite', createSpriteApp(ctx));
  return app;
}
