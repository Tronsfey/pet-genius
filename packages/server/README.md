# @pet-genius/server

A [Hono](https://hono.dev/) factory that exposes pet-genius's two endpoints — `/api/sprite` (gpt-image-1 → sliced pet rig) and `/api/action` (gpt-4o-mini decides what the pet does next). Drop it into any Node 20+ server.

## Install

```sh
pnpm add @pet-genius/server hono
```

## Usage

```ts
import { serve } from '@hono/node-server';
import { createPetGeniusApp } from '@pet-genius/server';
import { Hono } from 'hono';

const app = new Hono();

app.route(
  '/pet',
  createPetGeniusApp({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    // Optional — defaults shown:
    // openaiBaseURL: 'https://api.openai.com/v1',
    // chatModel: 'gpt-4o-mini',
    // imageModel: 'gpt-image-1',
    // useTestPet: false,
  }),
);

serve({ fetch: app.fetch, port: 3000 });
```

The factory mounts:

| Method | Path           | Body                                                                     | Response                                                   |
| ------ | -------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| GET    | `/healthz`     | —                                                                        | `{ ok: true }`                                             |
| POST   | `/api/sprite`  | `{ traits: PetTraits }`                                                  | `{ sprites: Record<string, string>, rig: Rig, traits }`     |
| POST   | `/api/action`  | `{ traits, snapshot: { needs, mood, secondsIdle }, recent: PetEvent[] }` | `{ animation: ClipName, intensity: number, thought? }`     |

## Options

```ts
interface PetGeniusServerOptions {
  /** OpenAI-compatible API key. REQUIRED. Never log or echo. */
  openaiApiKey: string;
  /** Override the OpenAI baseURL (proxy / alternative provider). */
  openaiBaseURL?: string;
  /** Chat model. Default: `gpt-4o-mini`. */
  chatModel?: string;
  /** Image model. Default: `gpt-image-1`. */
  imageModel?: string;
  /**
   * When true, `/api/sprite` returns a built-in hand-drawn pixel pet instead
   * of calling gpt-image-1. Useful for local dev when the upstream is
   * unreachable or you don't want to spend tokens.
   */
  useTestPet?: boolean;
  /** Mount `GET /healthz`. Default: true. */
  healthz?: boolean;
}
```

## Caching

The sprite endpoint LRU-caches generated pets by `sha256(JSON.stringify(traits)).slice(0, 16)` (32 entries). Same traits → cached PNG bytes, no re-billing.

## Security

- The API key is read from your config object and **never logged**. Upstream error bodies are mapped to `{ error: { code, message } }` so they can't leak prompt or stack info.
- Run this server behind your own auth / origin-check. The factory itself does not enforce origin.

## License

MIT — see repo root.
