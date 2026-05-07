# CLAUDE.md — pet-genius

Guidance for AI assistants (and humans) working in this repository.

> **Status: pre-scaffold.** Repository contains only `CLAUDE.md`, `.gitignore`, `.env.example` — no `package.json`, no `src/`, no tests yet. **Stack is fully chosen** (see §2): TS + PixiJS v8 + Solid + Vite + Vitest + Biome + pnpm in a single package; Hono on Node 20+ for `/api/chat` + `/api/sprite` against OpenAI (`gpt-4o-mini` chat, `gpt-image-1` image); per-user AI-generated sprites driven by a custom skeletal rig; `localStorage` behind a `PetStore` interface with versioned `PetState` migrations. Production hosting and license are the only remaining open decisions.

---

## 1. Project

**pet-genius** — a personalized, AI-driven pet-spirit world rendered in pixel art, delivered as a web app.

Product pillars:

- **Pet spirits / 宠物精灵.** Each user has one or more companion creatures with persistent identity, traits, and state.
- **Personalization.** The creature's appearance, personality, and behavior should feel uniquely the user's — not a generic NPC.
- **AI-driven.** Behavior, dialogue, and possibly creature design are powered by an LLM / generative model; the world reacts rather than being scripted.
- **Pixel art aesthetic.** All visual assets are pixel-style. Rendering needs to preserve crisp pixels (no smoothing) at multiple zoom levels.
- **Web-first.** Runs in a browser. No native app target unless explicitly added later.

<!-- TODO: link to design doc, product spec, or roadmap once one exists. -->

---

## 2. Repository status

No source files yet — only this file. The stack is decided; scaffolding (`package.json`, `tsconfig.json`, `src/`) is still to come.

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

**Still open** (ask the user before guessing): production hosting for the Node server (Fly.io recommended; any VPS works), license, telemetry policy. SAM-based segmentation is an upgrade path if the controlled-layout grid produces low-quality slices in practice.

When the scaffold lands, **rewrite this file** against the real tree rather than extending placeholders.

---

## 3. Codebase structure

```
pet-genius/
└── CLAUDE.md           # this file
```

Target shape once the scaffold lands (single package, no workspaces):

```
pet-genius/
├── src/                # browser bundle (Vite entry)
│   ├── pet/            # PetState type + PetStore interface + LocalStoragePetStore + migrations
│   ├── ai/             # client-side chat()/generateSprite() that POST to /api/*
│   ├── render/         # PixiJS app, custom skeletal rig, integer-scale camera
│   ├── world/          # scenes, interactions, ticker loop (drives PetState updates)
│   ├── ui/             # Solid components: menus, dialog overlays, settings
│   └── lib/            # shared types & utilities (used by both src/ and server/)
├── server/             # Hono on Node — the ONLY place secrets live
│   ├── index.ts        # entrypoint; serves /api/* + Vite dist/* in prod
│   ├── chat.ts         # POST /api/chat → openai.chat.completions
│   └── sprite.ts       # POST /api/sprite → openai.images.generate
├── public/             # static-shipped assets (favicon, fallback sprites)
├── tests/
└── scripts/
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

## 5. Architecture conventions

Keep these invariants. They are the reason the stack was chosen.

**State is the source of truth.**
`PetState` is a plain TS object. The PixiJS render layer reads from it; the world tick mutates it; the AI client *proposes* patches that are zod-validated and only then applied. Renderer never mutates state directly; AI responses never mutate state without validation.

```
world tick ─────┐
                ▼
AI patch ──► validate (zod) ──► apply ──► PetState ──► PixiJS scene
                                              ▲
                                              └── PetStore (load/save)
```

**Pixel rendering rules.**
- Set `TextureSource.defaultOptions.scaleMode = 'nearest'` once at app boot.
- Zoom levels are integers (1×, 2×, 3×, …). Never use fractional scale.
- The canvas's CSS sizing must not blur it; rely on PixiJS for scaling, not the browser.
- Source PNGs are exported at 1× and upscaled in the renderer.

**AI boundary.**
- Use the `openai` npm SDK on the Node server with `OPENAI_API_KEY` + `OPENAI_BASE_URL` from `process.env`.
- The client bundle **must not** contain an API key. All calls go to same-origin `/api/chat` and `/api/sprite` proxies that inject the key server-side.
- Every AI reply that affects state (chat replies, generated sprite metadata, animation commands) is parsed with a zod schema. Reject malformed; do not "best-effort" patch.

**Secrets handling — hard rule.**
- API keys and `baseURL` overrides live **only** in `.env.local` (gitignored). Never in tracked files. Never in commit messages. Never in logs.
- `.gitignore` must list `.env`, `.env.local`, `.env.*.local`. `.env.example` is the only env file that may be committed, and it contains placeholder values only.
- When the user shares a key in chat for testing, it is for `.env.local` only. Do not echo it back, do not paste it into any other file, do not include it in a commit. If a key ends up staged by mistake, rotate it.
- AI assistants: if you ever generate code that reads a key, it reads from `process.env.OPENAI_API_KEY`. No hardcoded fallbacks "for convenience."

**Sprite & animation pipeline.**
Each pet is visually unique and AI-generated. The pipeline:

1. **Generate.** On pet creation, the server calls `openai.images.generate({ model: 'gpt-image-1', ... })` with a prompt that asks for a **fixed grid layout** (e.g. 4×2 cells, transparent background, one body part per cell labeled head/torso/armL/armR/legL/legR/tail/extra). Prompt is seeded from the pet's traits.
2. **Slice on the server.** Server slices the returned PNG by grid coordinates, drops empty cells, returns one PNG per bone + a `Rig` descriptor. Slicing is purely arithmetic — no extra ML in the MVP. (If quality is poor in practice, swap in SAM2 segmentation behind the same interface.)
3. **Persist.** Sliced PNGs (as data-URLs or asset IDs) and the `Rig` descriptor are stored as part of `PetState`. They are the pet's identity — never regenerated on load.
4. **Animate at runtime.** A custom rig runs entirely in PixiJS:

   ```ts
   type Bone = {
     name: string;
     parent: string | null;
     pivot: { x: number; y: number };  // local rotation origin
     spriteId: string;                 // ref to a sliced PNG
   };
   type Pose = Record<string, { x?: number; y?: number; rot?: number; scale?: number }>;
   type AnimationClip = {
     name: string;                     // "idle", "happy_bounce", "sleep", ...
     duration: number;                 // seconds
     loops: boolean;
     keyframes: { t: number; pose: Pose; ease?: 'linear' | 'easeInOut' }[];
   };
   type Rig = { bones: Bone[]; clips: AnimationClip[] };
   ```

   Each bone is a PixiJS `Container`; sprites are children. The behavior LLM emits `{ animation: "happy_bounce", intensity: number }`, zod-validated. The renderer interpolates between keyframes locally.

This split keeps the LLM out of the per-frame hot loop: generation is rare and cached, the rig is small JSON, and animation playback is deterministic on the client.

**State versioning & migrations.**
- `PetState` carries a `version: number` field starting at `1`.
- When the shape changes, bump the number and add a `migrate{N}To{N+1}(old): new` in `src/pet/migrations.ts`.
- `LocalStoragePetStore.load()` runs migrations in sequence until the version matches the current code. Never silently coerce; throw if a migration is missing.

**Dev vs. prod serving.**
- **Dev:** Vite at `:5173` (HMR), Hono at `:3000`. `vite.config.ts` sets `server.proxy['/api']` → `http://localhost:3000`. Run them in two terminals or one `concurrently` script.
- **Prod:** `pnpm build` writes `dist/`. The Hono server serves `dist/*` via `serveStatic` and `/api/*` from the same process. One deploy unit, one URL, no CORS.

**Persistence boundary.**
- All call sites depend on the `PetStore` interface:
  ```ts
  interface PetStore {
    load(petId: string): Promise<PetState | null>;
    save(petId: string, state: PetState): Promise<void>;
    list(): Promise<string[]>;
  }
  ```
- First implementation is `LocalStoragePetStore`. A `RemotePetStore` can drop in later without touching renderer / world / AI code.
- Migrations: when `PetState` shape changes, add a version field and a migration function in `src/pet/`. Do not silently coerce.

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

Fill these in as decisions are made; until then, an AI assistant should ask the user rather than guess.

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
- [x] AI key handling: self-hosted Node proxy at `/api/chat` + `/api/sprite`; never in client JS
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
