# CLAUDE.md — pet-genius

Guidance for AI assistants (and humans) working in this repository.

> **Status: pre-scaffold.** Repository contains only this file — no `package.json`, no `src/`, no tests yet. **Stack is decided** (see §2): TypeScript, PixiJS v8 + Solid + Vite + Vitest + Biome + pnpm; AI via OpenAI through a self-hosted Node proxy at `/api/chat` + `/api/sprite`; sprites are AI-generated per user with skeletal animation; persistence is `localStorage` behind a `PetStore` interface. Until the scaffold lands, the workflow commands in §4 won't run, but they are the contract for the scaffolding pass.

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
| AI transport     | **Self-hosted Node** server proxy at `/api/chat`        |
| Sprite pipeline  | **AI-generated per user**, then rigged for skeletal animation |
| Animation        | Skeletal (bone-based); behavior LLM picks clips + parameters |
| Persistence      | `PetStore` interface; first impl `LocalStoragePetStore` |

**Still open** (ask the user before guessing): Node server framework (Hono / Fastify / Express / native `http`), specific OpenAI image model (`gpt-image-1` / DALL-E 3), skeletal-animation runtime (Spine via `@esotericsoftware/spine-pixi-v8` / DragonBones / custom rig), how AI-generated sprites are sliced into riggable parts (controlled-layout prompt / SAM / layered generation), where the production server runs, telemetry, license.

When the scaffold lands, **rewrite this file** against the real tree rather than extending placeholders.

---

## 3. Codebase structure

```
pet-genius/
└── CLAUDE.md           # this file
```

Target shape once the scaffold lands:

```
pet-genius/
├── src/
│   ├── pet/            # PetState type + PetStore interface + LocalStoragePetStore
│   ├── ai/             # openai SDK client, prompt templates, zod schemas for AI replies
│   ├── render/         # PixiJS app, sprite/animation primitives, integer-scale camera
│   ├── world/          # scenes, interactions, ticker loop (drives PetState updates)
│   ├── ui/             # Solid components: menus, dialog overlays, settings
│   └── lib/            # shared utilities, types
├── server/             # self-hosted Node — the ONLY place secrets live
│   ├── index.ts        # entrypoint
│   ├── chat.ts         # /api/chat — proxies to OpenAI chat.completions
│   └── sprite.ts       # /api/sprite — proxies to OpenAI image generation
├── public/
│   └── sprites/        # static / built-in pixel-art PNGs (no smoothing)
├── tests/
└── scripts/
```

Per-directory notes:

- **`src/render/`** — set PixiJS `TextureSource.defaultOptions.scaleMode = 'nearest'` once at boot. Camera zoom must be integer; never CSS-scale the canvas with `image-rendering: auto`. Skeletal animation runtime lives here too (e.g. `@esotericsoftware/spine-pixi-v8` if Spine is chosen).
- **`src/ai/`** — exposes `chat()` and `generateSprite()` that POST to `/api/chat` and `/api/sprite`. **Never** imports an API key. AI replies are parsed with zod before they touch state.
- **`src/pet/`** — call sites depend on the `PetStore` *interface*, not on `localStorage` directly. Swapping to a server backend = a new impl of the same interface.
- **`server/`** — the only place an LLM API key is allowed to exist. Reads from `process.env.OPENAI_API_KEY` and `process.env.OPENAI_BASE_URL`; rejects anything not from a trusted origin. In dev, Vite's `server.proxy` forwards `/api/*` to the Node server.

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

1. **Generate.** On pet creation, server hits OpenAI image generation (model TBD — likely `gpt-image-1`) with a prompt seeded from the pet's traits. Output is a pixel-art PNG.
2. **Slice into rig parts.** The generated sprite is decomposed into bones (head / torso / limbs / tail). Approach not yet chosen — options: a controlled-layout prompt that puts each part in a known cell of the canvas, SAM-based segmentation, or layered/iterative generation. Result is one PNG per bone plus a rig descriptor (bone tree, attachment points).
3. **Persist.** Sprite assets + rig descriptor are stored as part of `PetState`. They are part of the pet's identity — do not regenerate on every load.
4. **Animate at runtime.** The skeletal runtime (Spine / DragonBones / custom — TBD) plays clips. The behavior LLM does *not* output bone-level keyframes; it outputs a high-level command like `{ animation: "happy_bounce", intensity: 0.7 }`, which is zod-validated and dispatched to the runtime.

This split keeps the LLM out of the per-frame hot loop: generation is rare and cached; animation playback is deterministic on the client.

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
- [x] Framework: **Solid**
- [x] Bundler / dev server: **Vite**
- [x] Rendering: **PixiJS v8** (WebGL)
- [x] Package manager: **pnpm**
- [x] AI protocol: **OpenAI-compatible** via the `openai` SDK
- [x] AI provider: **OpenAI** (upstream); `baseURL` configurable via env
- [x] AI key handling: **self-hosted Node** proxy at `/api/chat` + `/api/sprite`; never in client JS
- [x] Secrets: `.env.local` only; gitignored; never committed; never echoed
- [x] Persistence: **`PetStore` interface**, first impl `LocalStoragePetStore`
- [x] Sprite source: **AI-generated, unique per user**, persisted with the pet
- [x] Animation: **skeletal**; LLM picks clips + parameters, not per-frame keyframes
- [x] Test runner: **Vitest**
- [x] Lint + format: **Biome**

**Still open** — ask the user before guessing:

- [ ] Node server framework (Hono / Fastify / Express / native `http`)
- [ ] OpenAI image model (`gpt-image-1` / DALL-E 3) and prompt template for pixel-style output
- [ ] Skeletal-animation runtime (Spine via `@esotericsoftware/spine-pixi-v8` / DragonBones / custom rig)
- [ ] How to slice a generated sprite into rig parts (controlled-layout prompt / SAM / layered generation)
- [ ] OpenAI chat model for behavior/dialogue (`gpt-4o-mini` / `gpt-4.1` / …)
- [ ] Production hosting for the Node server
- [ ] Deployment target for the static client
- [ ] `PetState` schema versioning convention
- [ ] Telemetry / analytics policy
- [ ] License
