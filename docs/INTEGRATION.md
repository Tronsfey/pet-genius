# Integrating pet-genius

End-to-end guide for adding a pet-genius pet to your own app. Roughly 15 minutes of work if you already have Node 20+ and pnpm.

## Architecture

```
┌──────────────────────────┐         POST /api/sprite        ┌──────────────────────────┐
│   browser                │  ─────────────────────────────► │  your Node server        │
│   ┌────────────────────┐ │         POST /api/action        │  ┌────────────────────┐  │
│   │ @pet-genius/widget │ │  ─────────────────────────────► │  │ @pet-genius/server │  │
│   │   summonPet({...}) │ │                                 │  │ createPetGeniusApp │  │
│   └────────────────────┘ │                                 │  └─────────┬──────────┘  │
└──────────────────────────┘                                 └────────────┼─────────────┘
                                                                          │
                                                              ┌───────────▼───────────┐
                                                              │  OpenAI (or any       │
                                                              │  OpenAI-compatible    │
                                                              │  endpoint)            │
                                                              └───────────────────────┘
```

Two packages. Two endpoints. Your server holds the API key — it never reaches the browser.

## 1. Server

Install:

```sh
pnpm add @pet-genius/server hono @hono/node-server dotenv
```

Create `server.ts`:

```ts
import { serve } from '@hono/node-server';
import { createPetGeniusApp } from '@pet-genius/server';
import 'dotenv/config';
import { Hono } from 'hono';

const app = new Hono();

// Mount the pet-genius routes wherever you want. Here, under /pet.
app.route(
  '/pet',
  createPetGeniusApp({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    // openaiBaseURL: 'https://aihubmix.com/v1', // or any OpenAI-compatible URL
  }),
);

serve({ fetch: app.fetch, port: 3000 });
```

Put your secrets in `.env.local`:

```sh
OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://...  # only if not using api.openai.com
```

Add `.env.local` to `.gitignore`. **Never commit a real key.** If a key ever lands in a tracked file, rotate it.

## 2. Client

Install:

```sh
pnpm add @pet-genius/widget
```

In your HTML, add a host element:

```html
<div id="pet-mount" style="position:fixed;inset:0;pointer-events:none;z-index:9999"></div>
```

In your JS / TS entry:

```ts
import { summonPet } from '@pet-genius/widget';
import '@pet-genius/widget/styles.css';

const pet = summonPet({
  host: document.getElementById('pet-mount')!,
  apiBase: 'https://your-server.example.com/pet',
});
```

First visit shows a creation form. After the user fills it in, the pet is persisted to `localStorage` and the floating widget appears.

## 3. Test pet for local dev

If your upstream is unreachable (network sandbox, blocked region, IP allowlist), pass `useTestPet: true` to the server factory and the sprite endpoint returns a built-in hand-drawn pixel pet without calling gpt-image-1:

```ts
createPetGeniusApp({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  useTestPet: process.env.NODE_ENV !== 'production',
});
```

The chat endpoint (`/api/action`) still calls the upstream. If that also fails, the autonomous loop silently swallows the error and the pet keeps idling.

## 4. Observe the pet

```ts
pet.onThought((text) => console.log('pet thought:', text));
pet.onAction((clip, intensity) => console.log('pet did:', clip, intensity));
pet.onEvent((event) => console.log('event:', event));
```

You can also drive the pet imperatively:

```ts
pet.feed();
pet.pet();
await pet.reset();   // wipe + return to create form
pet.destroy();       // tear down
```

## 5. Pick an art style

The creation form lets the user pick `pixel / flat / watercolor / storybook`. The choice is captured in `traits.style` and threaded through:

- the image-generation prompt → controls what the model draws
- the renderer → `'nearest'` vs `'linear'` scaling, integer vs fractional zoom
- the canvas CSS → `image-rendering: pixelated` only for the `pixel` style
- the animation runtime → `clipScaleFactor` multiplies clip offsets so a non-pixel sprite (which is naturally larger) gets proportionally bigger motion

Add new styles in [`packages/shared/src/style.ts`](../packages/shared/src/style.ts) — one entry in the `STYLES` map is all it takes.

## 6. Persistence options

By default the widget stores pets in `localStorage` under `pet-genius:pet:<id>` and the widget position under `pet-genius:widget-pos:<id>`.

To persist to your own backend, implement [`PetStore`](../packages/widget/src/pet/store.ts):

```ts
import { summonPet, type PetStore, type PetState } from '@pet-genius/widget';

class RemotePetStore implements PetStore {
  async load(id: string): Promise<PetState | null> { /* fetch */ }
  async save(id: string, state: PetState): Promise<void> { /* fetch */ }
  async list(): Promise<string[]> { /* fetch */ }
  async delete(id: string): Promise<void> { /* fetch */ }
}

summonPet({ host, apiBase, store: new RemotePetStore() });
```

Pet state is versioned (`PetState.version`) and migrated forward on every load — old serialized pets won't break clients running newer code.

## 7. Deploy notes

- **Server**: Node 20+. Sharp needs a Linux/macOS/Windows binary; pnpm should install the right prebuilt. Any Hono-compatible host (Fly.io, Railway, your own VPS) works.
- **Static client**: any CDN; the widget is ~100 KB gzipped including PixiJS.
- **CORS**: if widget and server are on different origins, allow your widget origin on the server.
