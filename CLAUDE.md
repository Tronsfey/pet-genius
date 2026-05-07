# CLAUDE.md — pet-genius

Guidance for AI assistants (and humans) working in this repository.

> **Status: scaffold.** As of the first commit on `claude/add-claude-documentation-KfExb`, this repository contains no application code — only git history and this file. The product direction below is fixed; concrete implementation choices (framework, package manager, etc.) are not yet decided. Anything marked `<!-- TODO -->` is **not** yet grounded in real code; do not treat it as authoritative.

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

- No source files yet.
- **Decided:** TypeScript is the primary implementation language. Target platform is the web.
- **Not yet decided:** framework (React / Solid / Svelte / vanilla), bundler (Vite / Next.js / …), package manager (pnpm / npm / yarn), rendering approach (DOM + CSS / `<canvas>` / WebGL via PixiJS / Phaser / kaboom.js), AI provider (Anthropic Claude API / OpenAI / on-device), state/persistence layer, sprite pipeline.
- No CI, no tests, no lint config yet.

When real code lands, **rewrite this file** against the actual tree rather than extending the placeholders. Re-running `/init` in Claude Code is a fast way to do that.

---

## 3. Codebase structure

```
pet-genius/
└── CLAUDE.md           # this file
```

A reasonable target shape once scaffolding lands (subject to revision based on framework choice):

```
pet-genius/
├── src/
│   ├── pet/            # pet entity: traits, state, persistence
│   ├── ai/             # LLM client, prompt templates, response parsing
│   ├── render/         # pixel-art rendering: sprites, animations, scaling
│   ├── world/          # scenes, interactions, time/tick loop
│   ├── ui/             # chrome around the world (menus, dialogs, settings)
│   └── lib/            # shared utilities, types
├── public/
│   └── sprites/        # source pixel-art assets (PNG, no smoothing)
├── tests/
└── scripts/
```

<!-- TODO: replace with the real tree once `src/` exists. Keep `image-rendering: pixelated` (or equivalent) front-of-mind in the render layer — this is core to the product's look. -->

---

## 4. Development workflow

All commands below are placeholders — none of them work yet because there is no project file.

| Step        | Command                                  |
| ----------- | ---------------------------------------- |
| Install     | <!-- TODO: e.g. `pnpm install` -->       |
| Run dev     | <!-- TODO: e.g. `pnpm dev` -->           |
| Build       | <!-- TODO: e.g. `pnpm build` -->         |
| Test        | <!-- TODO: e.g. `pnpm test` -->          |
| Lint        | <!-- TODO: e.g. `pnpm lint` -->          |
| Typecheck   | <!-- TODO: e.g. `pnpm typecheck` (TS strict mode expected) --> |
| Format      | <!-- TODO: e.g. `pnpm format` -->        |

When the stack is chosen, fill the table in and delete this note. AI assistants should run the relevant check (test / lint / typecheck) before claiming a task is done.

**TypeScript baseline expectations** (apply once `tsconfig.json` exists):

- `strict: true`. No silent `any`s.
- Treat the LLM boundary as untrusted: parse/validate AI responses (e.g. with `zod`) before they touch game state.
- Pet state is the source of truth. Renderer reads from it; AI responses propose changes that are validated and then applied.

---

## 5. Branching & commit conventions

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

## 6. Working with Claude Code in this repo

Lightweight pointers — the global Claude Code system prompt already covers the rest.

- **Prefer editing existing files** over creating new ones. Don't add scaffolding files (`README.md`, docs, etc.) unless explicitly requested.
- **No speculative abstraction.** Build for what's needed now; three similar lines beat a premature helper.
- **No defensive code at internal boundaries.** Validate at system boundaries (HTTP input, external APIs, untrusted files); trust internal callers.
- **Comments** only when the *why* is non-obvious (a hidden constraint, a workaround, a subtle invariant). Never narrate what the code does.
- **Risky / shared-state actions** (force-push, deleting branches, dropping data, sending external messages, opening PRs) require explicit user confirmation each time — prior approval does not generalize.
- **UI changes** must be exercised in a browser before being marked done; type-check + tests verify correctness, not behavior.

---

## 7. Open questions for future contributors

Fill these in as decisions are made; until then, an AI assistant should ask the user rather than guess.

- [x] Language: **TypeScript**
- [x] Platform: **web (browser)**
- [x] Visual style: **pixel art** — preserve crisp pixels, integer scaling, no anti-aliasing
- [ ] Framework (React / Solid / Svelte / Vue / vanilla TS?)
- [ ] Bundler / dev server (Vite / Next.js / Astro / …)
- [ ] Rendering approach (DOM + CSS sprites / `<canvas>` 2D / WebGL via PixiJS / Phaser / kaboom.js / custom)
- [ ] Package manager (pnpm / npm / yarn)
- [ ] AI provider (Anthropic Claude API / OpenAI / on-device WebLLM) and where the API key lives (server proxy vs. user-supplied)
- [ ] Pet state persistence (localStorage / IndexedDB / server-side DB)
- [ ] Sprite pipeline (hand-drawn PNGs / Aseprite source files / AI-generated)
- [ ] Test runner (Vitest / Jest / Playwright for E2E)
- [ ] Linter and formatter (ESLint + Prettier / Biome)
- [ ] Deployment target (Vercel / Cloudflare Pages / Netlify / static)
- [ ] Env-var conventions and `.env` handling
- [ ] Secrets management — **critical:** never ship an LLM API key in client JS; route through a server function
- [ ] Telemetry / analytics policy
- [ ] License
