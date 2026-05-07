# CLAUDE.md — pet-genius

Guidance for AI assistants (and humans) working in this repository.

> **Status: pre-scaffold.** Repository contains only this file — no `package.json`, no `src/`, no tests yet. **Stack is decided** (see §2): TypeScript, PixiJS v8, Solid, Vite, Vitest, Biome, pnpm, OpenAI-compatible AI client through a `/api/chat` proxy, `PetStore` interface backed by `localStorage`. Until the scaffold lands, the workflow commands in §4 won't run, but they are the contract for the scaffolding pass.

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
| AI client        | `openai` SDK with custom `baseURL` (OpenAI-compatible)  |
| AI transport     | Server proxy at `/api/chat`; key never in client JS     |
| Persistence      | `PetStore` interface; first impl `LocalStoragePetStore` |

**Still open** (ask the user before guessing): deployment target, where the `/api/chat` proxy runs (Cloudflare Worker / edge function / Node), sprite pipeline (hand-drawn / Aseprite / AI-generated), env-var layout, telemetry, license.

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
├── server/
│   └── chat.ts         # /api/chat proxy — holds the LLM key, forwards to upstream
├── public/
│   └── sprites/        # source pixel-art PNGs (no smoothing)
├── tests/
└── scripts/
```

Per-directory notes:

- **`src/render/`** — set PixiJS `TextureSource.defaultOptions.scaleMode = 'nearest'` once at boot. Camera zoom must be integer; never CSS-scale the canvas with `image-rendering: auto`.
- **`src/ai/`** — exposes a single `chat()` that POSTs to `/api/chat`. **Never** imports an API key. AI replies are parsed with zod before they touch state.
- **`src/pet/`** — call sites depend on the `PetStore` *interface*, not on `localStorage` directly. Swapping to a server backend = a new impl of the same interface.
- **`server/`** — the only place an LLM API key is allowed to exist. Reads from `process.env`; rejects anything not from a trusted origin.

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
- Use the `openai` npm SDK with a configured `baseURL` so the same code talks to any OpenAI-compatible endpoint (Claude via gateway, DeepSeek, Ollama, 智谱, …).
- The client bundle **must not** contain an API key. All calls go to a same-origin `/api/chat` proxy that injects the key server-side.
- Every AI reply that affects state is parsed with a zod schema. Reject malformed; do not "best-effort" patch.

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
- [x] AI protocol: **OpenAI-compatible** via the `openai` SDK with custom `baseURL`
- [x] AI key handling: server-side proxy at `/api/chat`; never in client JS
- [x] Persistence: **`PetStore` interface**, first impl `LocalStoragePetStore`
- [x] Test runner: **Vitest**
- [x] Lint + format: **Biome**

**Still open** — ask the user before guessing:

- [ ] Specific AI provider (DeepSeek / OpenAI / 智谱 / Claude-via-gateway / Ollama / …) and which model
- [ ] Where the `/api/chat` proxy runs (Cloudflare Worker / Vercel edge / Node server / …)
- [ ] Deployment target for the static client (Cloudflare Pages / Vercel / Netlify / …)
- [ ] Sprite pipeline (hand-drawn PNGs / Aseprite source files / AI-generated)
- [ ] `PetState` schema versioning convention
- [ ] Env-var layout (`.env`, `.env.local`, secret vs. public prefix)
- [ ] Telemetry / analytics policy
- [ ] License
