# CLAUDE.md — pet-genius

Guidance for AI assistants (and humans) working in this repository.

> **Status: scaffolded, AI action loop pivot complete.** End-to-end runnable: customization form → `/api/sprite` (gpt-image-1, real or `USE_TEST_PET=1` stub) → PixiJS skeletal rig → autonomous + reactive `/api/action` calls (gpt-4o-mini) drive the pet's animations + optional floating thoughts. **Not a chat tool**: the model picks behavior, not dialogue. Production hosting and license are the only remaining product decisions.

---

## 1. Project

**pet-genius** — a personalized, AI-driven pet-spirit world rendered in pixel art, delivered as a web app.

Product pillars:

- **Pet spirits / 宠物精灵.** Each user has one or more companion creatures with persistent identity, traits, and state.
- **Customizable identity.** The user fills in a small form (name, palette, vibe, species hint) on first load; that seeds a one-shot AI image generation that becomes the pet's permanent appearance.
- **AI drives behavior, not chat.** Given the pet's current needs / mood / recent events, the model decides what the pet *does* — which animation clip to play, with what intensity, plus an *optional* one-line pet thought that floats briefly above the canvas. This happens both **autonomously** (on a jittered ~10s tick) and **reactively** (after user actions). The product is a pet you watch, not a chatbot you talk to.
- **Pixel art aesthetic.** All visual assets are pixel-style. Rendering needs to preserve crisp pixels (no smoothing) at multiple zoom levels.
- **Web-first.** Runs in a browser. No native app target unless explicitly added later.

<!-- TODO: link to design doc, product spec, or roadmap once one exists. -->

---

## 2. Repository status

No application source yet — `CLAUDE.md`, `.gitignore`, `.env.example` only. Design is finalized in §5; the next step is to scaffold the tree shown in §3.

**Stack (decided):**

| Layer            | Choice                                                  |
| ---------------- | ------------------------------------------------------- |
| Language         | TypeScript (`strict: true`)                             |
| Renderer         | **PixiJS v8** — WebGL, `scaleMode: 'nearest'`           |
| UI framework     | **Solid** — fine-grained reactivity, no VDOM            |
| Bundler / dev    | **Vite**                                                |
| Tests            | **Vitest**                                              |
| Lint + format    | **Biome** (single tool, no ESLint/Prettier)             |
| Package manager  | **pnpm**                                                |
| Validation       | **zod** — for AI responses and persisted state          |
| AI client        | `openai` SDK; protocol is OpenAI-compatible             |
| AI provider      | **OpenAI** (upstream); `baseURL` configurable           |
| Chat model       | **`gpt-4o-mini`** (env-overridable)                     |
| Image model      | **`gpt-image-1`** (transparent-bg pixel sprites)        |
| Server framework | **Hono** on Node 20+                                    |
| AI transport     | Self-hosted Node proxy at `/api/chat` + `/api/sprite`   |
| Static hosting   | Node server also serves Vite `dist/` (one process)      |
| Sprite pipeline  | AI-generated per user via controlled-layout prompt + grid slice |
| Animation        | **Custom skeletal rig** on PixiJS Containers; JSON keyframes |
| Persistence      | `PetStore` interface; first impl `LocalStoragePetStore` |
| Schema versioning| `PetState.version: number` + sequential migration fns   |
| Package layout   | Single `package.json` (client + server in one tree)     |

**Still open** (ask the user before guessing): production hosting for the Node server (Fly.io recommended; any VPS works), license. SAM-based segmentation is an upgrade path if the controlled-layout grid produces low-quality slices in practice.

---

## 3. Codebase structure

```
pet-genius/
└── CLAUDE.md           # this file
```

Target shape once the scaffold lands (single package, no workspaces):

```
pet-genius/
├── src/                  # browser bundle (Vite entry)
│   ├── lib/              # shared types & schemas (used by src/ and server/)
│   │   ├── types.ts
│   │   └── schemas.ts
│   ├── pet/              # PetState identity + persistence
│   │   ├── store.ts          # PetStore interface
│   │   ├── local-store.ts    # LocalStoragePetStore impl
│   │   └── migrations.ts     # version → version migration fns
│   ├── ai/               # client-side
│   │   └── client.ts         # chat() / generateSprite() POST to /api/*
│   ├── render/           # PixiJS app + skeletal rig
│   │   ├── app.ts            # PixiJS Application bootstrap; nearest scaling
│   │   ├── rig.ts            # mountRig(), applyPose() over Containers
│   │   ├── clip.ts           # sampleClipAt(clip, t): Pose
│   │   └── easing.ts         # linear / easeInOut / easeOutBack
│   ├── world/            # the only writer of PetState
│   │   ├── fsm.ts            # MoodState transitions
│   │   ├── tick.ts           # per-frame needs decay + FSM step
│   │   ├── actions.ts        # dispatch(intent): feed / pet / ai-action / record-event
│   │   └── ai-loop.ts        # jittered /api/action poll + post-user-action poke
│   ├── ui/               # Solid components
│   │   ├── App.tsx
│   │   ├── CreatePet.tsx     # first-load trait form, calls /api/sprite, persists pet
│   │   ├── PetCanvas.tsx     # mounts the PixiJS canvas
│   │   ├── StatusBar.tsx     # tiny needs bars (hunger / energy / cleanliness / affection)
│   │   └── ThoughtBubble.tsx # transient floating one-liner above the pet
│   ├── main.tsx
│   └── styles.css
├── server/               # Hono on Node 20+ — the ONLY place secrets live
│   ├── env.ts            # dotenv load + required-var checks
│   ├── openai.ts         # singleton openai SDK client (uses OPENAI_BASE_URL)
│   ├── prompts.ts        # systemPromptForAction(traits), spritePromptForGeneration(traits)
│   ├── action.ts         # POST /api/action → openai.chat.completions (JSON mode)
│   ├── sprite.ts         # POST /api/sprite → openai.images.generate
│   ├── slice.ts          # sharp-based grid slicing
│   └── index.ts          # entrypoint; serves /api/* + Vite dist/* in prod
├── public/               # static-shipped assets (favicon, fallback test pet)
├── tests/                # Vitest specs (migrations, fsm, slicing math)
├── scripts/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
└── biome.json
```

Per-directory notes:

- **`src/render/`** — set `TextureSource.defaultOptions.scaleMode = 'nearest'` once at boot. Camera zoom is integer-only; do not CSS-scale the canvas. Hosts the custom skeletal rig (see §5).
- **`src/ai/`** — exposes `chat()` and `generateSprite()` that POST to `/api/chat` and `/api/sprite`. **Never** imports an API key. AI replies are parsed with zod before they touch state.
- **`src/pet/`** — call sites depend on the `PetStore` *interface*, not on `localStorage` directly. Migrations live here (one fn per version bump).
- **`server/`** — the only place `OPENAI_API_KEY` and `OPENAI_BASE_URL` are read. Hono router. **Dev:** runs on `:3000`; Vite on `:5173` proxies `/api/*` to it. **Prod:** `pnpm build` produces `dist/`; Hono serves `dist/*` via `serveStatic` and `/api/*` from the same process.

---

## 4. Development workflow

These will work once `package.json` exists. Until then, they are the documented contract for the scaffolding pass.

| Step        | Command                          |
| ----------- | -------------------------------- |
| Install     | `pnpm install`                   |
| Run dev     | `pnpm dev` — Vite + Solid + Pixi |
| Build       | `pnpm build`                     |
| Test        | `pnpm test` — Vitest             |
| Typecheck   | `pnpm typecheck` — `tsc --noEmit` |
| Lint        | `pnpm lint` — Biome              |
| Format      | `pnpm format` — Biome (writes)   |

Before claiming a task is done, run **typecheck + test + lint**. UI changes additionally require a manual browser pass (open the dev server, exercise the actual interaction).

**TypeScript baseline:**

- `strict: true`. No silent `any`s.
- The LLM boundary is untrusted — parse AI replies with zod and reject malformed; never feed raw text into state mutations.
- Persisted state read from `localStorage` is also untrusted — same zod treatment.

---

## 5. Architecture & detailed design

Both invariants ("the rules") and the concrete shapes/flows ("the design") live here. Renderer / world / AI / persistence call sites should match this section; if they drift, fix the code or fix this section, but don't let them disagree.

### 5.1 Module dependency graph

```
    ui (Solid) ── intents ──► world (FSM + tick) ──► pet (PetState + PetStore)
         ▲                          │                       │
         │ reactive reads           ▼ pose                  │ load / save
         └───────────────────► render (PixiJS) ◄─── rig assets
                                    ▲
                            ai (client) ──► /api/* ──► server (Hono) ──► OpenAI
```

Read it as: only `world` writes `PetState`. Renderer never writes; AI never writes. UI dispatches intents into `world`, which is the only place needs/mood transitions are applied.

### 5.2 State is the source of truth

`PetState` is a plain TS object. The PixiJS render layer **reads** from it; `world.tick` and `world.dispatch(intent)` are the only **writers**. The AI client *proposes* patches; patches are zod-validated and applied via `world.dispatch` — they never reach `PetState` directly.

```
world tick ─────┐
                ▼
AI patch ──► zod validate ──► world.dispatch ──► PetState ──► PixiJS scene
                                                     ▲
                                                     └── PetStore (load / save)
```

### 5.3 Type contract

Defined in `src/lib/types.ts`. These are the canonical shapes; everything else (zod schemas, FSM, render) must match them.

```ts
// — Identity & traits (fixed at creation) —
export type BoneName = 'head' | 'torso' | 'armL' | 'armR'
                     | 'legL' | 'legR' | 'tail' | 'accessory';

export interface PetTraits {
  name: string;
  palette: string;       // freeform color hint, e.g. "warm orange"
  vibe: string;          // freeform personality hint, e.g. "shy bookworm"
  speciesHint: string;   // e.g. "small fox", "round slime"
}

// — Rig (fixed at creation; part of identity) —
export interface Bone {
  name: BoneName;
  parent: BoneName | null;
  pivot: { x: number; y: number };   // local rotation origin in sprite px
  attach: { x: number; y: number };  // offset relative to parent's pivot
  spriteId: string;                  // key into PetState.sprites
  z: number;                         // draw order; higher = front
}

export type Pose = Partial<Record<BoneName, {
  x?: number; y?: number; rot?: number; scale?: number;
}>>;

export type Easing = 'linear' | 'easeInOut' | 'easeOutBack';

export interface AnimationClip {
  name: ClipName;
  duration: number;       // seconds
  loops: boolean;
  keyframes: { t: number /* 0..1 */; pose: Pose; ease?: Easing }[];
}

export type ClipName =
  | 'idle' | 'happy_bounce' | 'eating' | 'sleeping'
  | 'playing' | 'sad' | 'wake' | 'stretch';

export interface Rig {
  bones: Bone[];
  clips: AnimationClip[];
}

// — Mutable state (changes every tick) —
export type MoodState = 'idle' | 'eating' | 'sleeping' | 'playing' | 'reacting' | 'sad';

export interface Needs {
  hunger: number;       // 0..1, 0 = full, 1 = starving
  energy: number;       // 0..1, 0 = exhausted, 1 = wide awake
  cleanliness: number;  // 0..1, 0 = filthy, 1 = clean
  affection: number;    // 0..1, 0 = lonely, 1 = loved
}

export type PetEventKind = 'fed' | 'petted' | 'ai-action' | 'mood-change';
export interface PetEvent {
  kind: PetEventKind;
  detail?: string;       // e.g. animation name for 'ai-action'
  at: number;            // unix ms
}

export interface PetState {
  version: 2;
  id: string;                     // uuid
  createdAt: number;              // unix ms
  traits: PetTraits;
  rig: Rig;
  sprites: Record<string, string>; // spriteId → data URL
  needs: Needs;
  mood: MoodState;
  // recent events ring (capped at 6) used as context for /api/action.
  events: PetEvent[];
}

// AI action wire shapes
export interface PetSnapshot { needs: Needs; mood: MoodState; secondsIdle: number }
export interface ActionRequest { traits: PetTraits; snapshot: PetSnapshot; recent: PetEvent[] }
export interface ActionResponse { animation: ClipName; intensity: number; thought?: string }
```

### 5.4 Validation schemas

zod schemas in `src/lib/schemas.ts` mirror every type above 1:1. They are the **single source of truth at every untrusted boundary**:

- AI replies (`/api/action` response, `/api/sprite` response)
- `localStorage` reads (post-migration)
- HTTP request bodies arriving at the Hono server

If a schema and a type disagree, the schema wins (cast TS via `z.infer<typeof Schema>`).

### 5.5 State machine — `MoodState`

`MoodState` is **derived** from `PetState`. Only `world/fsm.ts` writes `PetState.mood`; everywhere else it's read-only.

Transitions:

```
              feed                       full
   (any) ─────────────────► eating ──────────────► idle
                                ▲
              pet               │ done
   (any) ─────────────────► reacting ─────────────► idle
                                ▲
                                │ ActionResponse.animation
   (ai-loop tick / poke) ───────┘

         energy < 0.1                    energy > 0.9
   idle ─────────────────► sleeping ──────────────► idle
                                                       ▲
         hunger > 0.9 (and not eating)                 │ all needs met
   idle ─────────────────► sad ──────► idle ──────► playing  (auto every 60s)
```

Trigger sources, in priority order:
1. **User intents** (`feed`, `pet`) — highest; preempt non-locked clips. They run the local clip immediately *and* poke the AI loop.
2. **AI action** from `/api/action` — autonomous (jittered ~10s tick) or reactive (poke shortly after a user intent). Enters `reacting` for the clip's duration.
3. **World tick** — drives `sleeping`, `sad`, idle-time `playing` based on `needs`.
4. **Default** — `idle` clip looped.

Locking: clips with `loops: false` are *locked* until they finish; transitions are queued and applied on completion.

### 5.6 Animation runtime

Lives in `src/render/`. Three small modules:

- `easing.ts` — `linear`, `easeInOut(t) = t<.5 ? 2t² : 1-2(1-t)²`, `easeOutBack(t)` from standard cubic-bezier.
- `clip.ts` — `sampleClipAt(clip, tSec): Pose` finds the surrounding keyframes for `tSec / clip.duration`, eases, returns blended pose. Per-bone fields default to identity (`x=0, y=0, rot=0, scale=1`) when absent.
- `rig.ts` — `mountRig(stage, rig, sprites)` builds the bone hierarchy as nested `Container`s with pivots set; `applyPose(rig, pose)` writes container transforms.

Per-frame loop in PixiJS ticker:
```
elapsed = (now - clipStart) / 1000
t = clip.loops ? (elapsed % clip.duration) : min(elapsed, clip.duration)
pose = sampleClipAt(clip, t)
applyPose(rig, pose)
```

Rules:
- Pause when `document.hidden` (PixiJS ticker `stop()` on `visibilitychange`).
- Pose interpolation budget: **< 0.5ms per frame** (single pet ≤ 8 bones).
- No allocation in the hot path: reuse a single pose object, mutate in place.
- Timeline composition (e.g. `wake → stretch → idle`) is a `Timeline = AnimationClip[]` played head-to-tail by the FSM, not a special construct.

This is the GSAP-style state-machine-driven pattern from Claude Code's mascot — without pulling in GSAP. We only need clip sampling, not a general tween engine.

### 5.7 Pet creation flow

```
[CreatePet form: name + palette + vibe + species]   ◄── shown on first load only
        │  Summon
        ▼
client: generateSprite(traits)
        │  POST /api/sprite { traits }
        ▼
server: openai.images.generate({
          model: 'gpt-image-1',
          size: '1024x1024',
          background: 'transparent',
          prompt: <controlled-layout grid prompt seeded by traits>
        })
        │
        ▼
server: slice 4×2 grid → up to 8 PNGs
        alpha-trim each, derive bbox + pivot (center of mass)
        drop cells with < 5% non-transparent pixels
        │
        ▼
server: respond { sprites: Record<spriteId, dataUrl>, rig: Rig }
        │
        ▼
client: zod validate
        build PetState v2 (version, id=uuid, createdAt, traits, rig, sprites, needs={0.5,0.5,0.5,0.5}, mood='idle', events=[])
        petStore.save(id, state)
        │
        ▼
render: mountRig(stage, rig, sprites); play 'idle'; ai-loop starts
```

### 5.8 Action flow (model-driven behavior)

The pet has no chat surface. The model is invoked for behavior, not dialogue. Two trigger modes share the same endpoint:

**Autonomous tick** — every `8–12s` (jittered) `world/ai-loop.ts` snapshots the pet:
```
{ traits, snapshot: { needs, mood, secondsIdle }, recent: PetEvent[] (last 6) }
   │
   ▼  POST /api/action
server: openai.chat.completions.create({
          model: env.CHAT_MODEL,  // default gpt-4o-mini
          messages: [
            systemPromptForAction(traits),
            { role: 'user', content: userPromptForAction(snapshot, recent) },
          ],
          response_format: { type: 'json_object' },
        })
   │
   ▼  zod validate
{ animation: ClipName, intensity: 0..1, thought?: string }
   │
   ▼
world.dispatch({ kind: 'ai-action', animation, intensity, thought })
   │
   ├── FSM transitions to 'reacting' for the clip's duration
   └── if `thought`, ThoughtBubble shows it for ~3s, then it's gone (never persisted)
```

**Reactive poke** — the user clicks `feed` or `pet`:
1. UI dispatches the *local* intent immediately. The expected clip (`eating`, `happy_bounce`) starts on the next frame; needs adjust; a `PetEvent` is appended to `state.events` (capped at 6).
2. `ai-loop.pokeAfterUserAction(eventKind)` schedules a single `/api/action` call ~600ms later with the user event in `recent`. The model's response shapes what the pet does *after* the local clip finishes.

**Latency policy:** user actions never block on the model. The reactive poke is fire-and-forget; failures are silent.

**`systemPromptForAction(traits)` lives in `server/prompts.ts`.** It pins JSON output, defines the pet's personality from `traits`, lists valid `ClipName` values, and instructs the model to keep `thought` (if present) to a single short phrase in the user's likely language.

### 5.9 Sprite slicing math

- `gpt-image-1` returns a 1024×1024 PNG (the model's only supported sizes are 1024×1024 / 1024×1536 / 1536×1024 / 'auto'). The prompt asks for a 4-column × 2-row layout, so cells are 256w × 512h with the body part centered with vertical padding.
- Cell size used by the slicer: 256 × 512.
- Cell → bone mapping (fixed; baked into the prompt):

  | col | row 0       | row 1     |
  | --- | ----------- | --------- |
  | 0   | head        | armL      |
  | 1   | torso       | armR      |
  | 2   | legL        | legR      |
  | 3   | tail        | accessory |

- Server uses `sharp`:
  1. Crop each 256×256 cell.
  2. Compute alpha histogram; drop if non-transparent pixels < `5%`.
  3. Trim transparent borders → tight bbox.
  4. Pivot = center of mass of non-transparent pixels (or geometric center of bbox if mass calc disagrees by >10px).
- Result per bone: `{ spriteId, png, pivot }`. `Rig` is assembled by attaching parts to defaults: `head` parents `torso` (which is the root); `armL/armR/legL/legR` parent `torso`; `tail` parents `torso`; `accessory` parents `head`.
- Default `attach` offsets are computed from torso bbox edges (e.g. `armL.attach.x = -torso.width/2`, `armL.attach.y = -torso.height/4`).

If quality is bad in practice, swap step 1–4 for SAM2 behind the same `slice(png) → { sprites, rig }` interface.

### 5.10 Server contract (Hono)

| Method | Path          | Body                                                                       | 200 response                                                       |
| ------ | ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| POST   | `/api/action` | `{ traits, snapshot: { needs, mood, secondsIdle }, recent: PetEvent[] }`   | `{ animation: ClipName, intensity: number, thought?: string }`     |
| POST   | `/api/sprite` | `{ traits }`                                                               | `{ sprites: Record<string, string>, rig: Rig }`                    |
| GET    | `/healthz`    | —                                                                          | `{ ok: true }`                                                     |

Cross-cutting:
- **Input validation:** zod parse on entry; reject `400` with `{ error: { code: 'BadRequest', message } }` on failure.
- **Origin check:** allow only same-origin in dev (`http://localhost:5173` and `http://localhost:3000`) and the configured prod origin. `403` otherwise.
- **Error envelope:** never leak upstream error bodies. Map to one of `BadRequest | Upstream | RateLimited | Internal`.
- **Timeouts:** chat 30s, sprite 90s. Abort upstream on client disconnect.
- **No logging of request bodies or upstream key.** Log only `{ route, status, durationMs, traitsHash }`.

### 5.11 Persistence & migrations

`PetStore` interface (`src/pet/store.ts`):
```ts
export interface PetStore {
  load(petId: string): Promise<PetState | null>;
  save(petId: string, state: PetState): Promise<void>;
  list(): Promise<string[]>;
  delete(petId: string): Promise<void>;
}
```

`LocalStoragePetStore` (`src/pet/local-store.ts`):
- Key layout: `pet-genius:pet:<id>` → JSON. Index at `pet-genius:index` → `string[]` of ids.
- `load`:
  1. `JSON.parse` → unknown.
  2. Read `version`. Run `migrations` until version matches current.
  3. Final result zod-validated as `PetState`. Throw on failure (corrupt store).

`migrations.ts`:
```ts
export const CURRENT_VERSION = 2;
export const migrations: Record<number, (s: any) => any> = {
  // 1 → 2: chat surface removed; chatLog dropped, events ring added.
  2: (v1) => {
    const { chatLog: _drop, ...rest } = v1;
    return { ...rest, version: 2, events: [] };
  },
};
```

When bumping the schema:
1. Bump `CURRENT_VERSION` to N+1.
2. Add `migrations[N+1] = (sN) => sN+1`.
3. Update the type / zod schema.
4. Add a Vitest case feeding a fixture of the old shape and asserting the new one.

### 5.12 Pixel rendering rules

- Set `TextureSource.defaultOptions.scaleMode = 'nearest'` once at app boot.
- Zoom levels are integers (1×, 2×, 3×, …). Never use fractional scale.
- The canvas's CSS sizing must not blur it; rely on PixiJS for scaling, not the browser. CSS `image-rendering` defaults to `auto` — explicitly set `pixelated` on the `<canvas>` for safety.
- Source PNGs are exported at 1× and upscaled in the renderer.

### 5.13 Secrets handling — hard rule

- API keys and `baseURL` overrides live **only** in `.env.local` (gitignored). Never in tracked files. Never in commit messages. Never in logs.
- `.gitignore` lists `.env`, `.env.local`, `.env.*.local`. `.env.example` is the only env file that may be committed, and contains placeholder values only.
- When the user shares a key in chat for testing, it goes into `.env.local` and nowhere else. Do not echo it back, do not paste into another file, do not include in a commit. If a key gets staged by mistake, **rotate it**.
- Code that needs a key reads from `process.env.OPENAI_API_KEY`. No hardcoded fallbacks "for convenience."

### 5.14 Dev vs. prod serving

- **Dev:** Vite at `:5173` (HMR), Hono at `:3000`. `vite.config.ts` sets `server.proxy['/api'] → http://localhost:3000`. `pnpm dev` runs both via `concurrently`.
- **Prod:** `pnpm build` writes `dist/`. Hono serves `dist/*` via `@hono/node-server`'s `serveStatic` middleware, plus `/api/*` from the same process. One deploy unit, one URL, no CORS.

### 5.15 Performance budget

| Metric                          | Target                |
| ------------------------------- | --------------------- |
| Client bundle (gz)              | < 300 KB              |
| Per-pet sprite memory           | < 1 MB                |
| Frame time (single pet)         | < 8 ms (sustained 60fps) |
| Pose interpolation per frame    | < 0.5 ms              |
| `/api/chat` p50 latency         | < 1.5 s               |
| `/api/sprite` p50 latency       | < 30 s                |

If these regress in practice, profile before adding mitigations — don't pre-optimize.

---

## 6. Branching & commit conventions

These are **real** conventions in force right now:

- **Branch naming.** Claude-authored work goes on `claude/<short-description>-<id>` branches (e.g. `claude/add-claude-documentation-KfExb`). Develop, commit, and push to that branch only.
- **Never push to `main`** (or any other shared branch) without explicit permission from the user.
- **Create the branch locally** if it doesn't exist yet.
- **Push with upstream**: `git push -u origin <branch-name>`. Retry network failures with exponential backoff (2s, 4s, 8s, 16s); do not retry logical failures.
- **Commits** should be small, descriptive, and focused on the "why". Prefer creating a new commit over amending one that has already been pushed.
- **Never** use `--no-verify`, `--no-gpg-sign`, or other hook/signing bypasses unless the user asks for it.
- **Pull requests** are only opened when the user explicitly asks.

<!-- TODO: add commit-message style (Conventional Commits? plain prose?), changelog policy, and review requirements once the team decides. -->

---

## 7. Working with Claude Code in this repo

Lightweight pointers — the global Claude Code system prompt already covers the rest.

- **Prefer editing existing files** over creating new ones. Don't add scaffolding files (`README.md`, docs, etc.) unless explicitly requested.
- **No speculative abstraction.** Build for what's needed now; three similar lines beat a premature helper.
- **No defensive code at internal boundaries.** Validate at system boundaries (HTTP input, external APIs, untrusted files); trust internal callers.
- **Comments** only when the *why* is non-obvious (a hidden constraint, a workaround, a subtle invariant). Never narrate what the code does.
- **Risky / shared-state actions** (force-push, deleting branches, dropping data, sending external messages, opening PRs) require explicit user confirmation each time — prior approval does not generalize.
- **UI changes** must be exercised in a browser before being marked done; type-check + tests verify correctness, not behavior.

---

## 8. Open questions for future contributors

**Status:** scaffold + AI-driven action loop shipped. The product is **not** a chat tool: the model decides what the pet *does* (animations + optional one-line floating thoughts), never what it *says* in a transcript. Do not reintroduce a chat surface without explicit user direction.

Fill the boxes in as decisions are made; until then, an AI assistant should ask the user rather than guess.

**Decided:**

- [x] Language: **TypeScript** (`strict: true`)
- [x] Platform: **web (browser)**
- [x] Visual style: **pixel art** — `'nearest'` scaling, integer zoom, no anti-aliasing
- [x] UI framework: **Solid**
- [x] Bundler / dev server: **Vite**
- [x] Rendering: **PixiJS v8** (WebGL)
- [x] Package manager: **pnpm**
- [x] Package layout: single `package.json` (no workspaces)
- [x] Server framework: **Hono** on Node 20+
- [x] AI protocol: **OpenAI-compatible** via the `openai` SDK
- [x] AI provider: **OpenAI**; `baseURL` configurable via env
- [x] Chat model: **`gpt-4o-mini`** (env-overridable)
- [x] Image model: **`gpt-image-1`**
- [x] Sprite slicing: controlled-layout grid prompt + arithmetic slice on server (SAM2 as upgrade)
- [x] Skeletal runtime: **custom rig** on PixiJS Containers + JSON keyframes
- [x] AI key handling: self-hosted Node proxy at `/api/action` + `/api/sprite`; never in client JS
- [x] AI surface shape: **action-only** (the model picks animations + optional one-line thoughts); **no chat panel, no transcript**
- [x] Secrets: `.env.local` only; gitignored; never committed; never echoed
- [x] Persistence: `PetStore` interface, first impl `LocalStoragePetStore`
- [x] Schema versioning: `PetState.version: number` + sequential migrations in `src/pet/migrations.ts`
- [x] Dev serving: Vite `:5173` proxies `/api/*` to Hono `:3000`
- [x] Prod serving: Hono serves `dist/*` + `/api/*` from one process
- [x] Test runner: **Vitest**
- [x] Lint + format: **Biome**
- [x] Telemetry: **none for MVP**

**Still open** — ask the user before guessing:

- [ ] Production hosting for the Node server (Fly.io recommended; any VPS works)
- [ ] License
