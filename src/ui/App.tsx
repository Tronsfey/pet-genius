import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { PetState } from '../lib/types';
import { LocalStoragePetStore } from '../pet/local-store';
import { dispatch } from '../world/actions';
import { type AiLoopHandle, startAiLoop } from '../world/ai-loop';
import { type FsmState, createFsm } from '../world/fsm';
import CreatePet from './CreatePet';
import PetCanvas from './PetCanvas';
import StatusBar from './StatusBar';
import ThoughtBubble from './ThoughtBubble';

const STORE = new LocalStoragePetStore();
const PET_ID = 'default';
const POS_KEY = 'pet-genius:widget-pos';

const WIDGET_W = 240;
const WIDGET_H = 240;

interface Pos {
  x: number;
  y: number;
}

function loadPos(): Pos | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as Pos).x === 'number' &&
      typeof (parsed as Pos).y === 'number'
    ) {
      return parsed as Pos;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function defaultPos(): Pos {
  const x = Math.max(20, Math.round(window.innerWidth / 2 - WIDGET_W / 2));
  const y = Math.max(80, Math.round(window.innerHeight / 2 - WIDGET_H / 2));
  return { x, y };
}

function clampToViewport(p: Pos): Pos {
  const maxX = Math.max(0, window.innerWidth - WIDGET_W);
  const maxY = Math.max(0, window.innerHeight - WIDGET_H - 80);
  return {
    x: Math.min(maxX, Math.max(0, p.x)),
    y: Math.min(maxY, Math.max(60, p.y)),
  };
}

export default function App() {
  const [state, setState] = createSignal<PetState | null>(null);
  const [fsm, setFsm] = createSignal<FsmState | null>(null);
  const [thought, setThought] = createSignal<{ text: string; ts: number } | null>(null);
  const [bootErr, setBootErr] = createSignal<string | null>(null);

  const [pos, setPos] = createSignal<Pos>(loadPos() ?? defaultPos());
  const [hovered, setHovered] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  let loopHandle: AiLoopHandle | null = null;

  const wireUpPet = (pet: PetState) => {
    const f = createFsm(pet.rig, performance.now());
    setState(pet);
    setFsm(f);
    if (loopHandle) loopHandle.stop();
    loopHandle = startAiLoop({
      state: pet,
      fsm: f,
      onThought: (text) => setThought({ text, ts: performance.now() }),
    });
  };

  const boot = async () => {
    try {
      const existing = await STORE.load(PET_ID);
      if (existing) wireUpPet(existing);
    } catch (e) {
      setBootErr(e instanceof Error ? e.message : String(e));
    }
  };
  boot();

  // Persist position changes
  createEffect(() => {
    const p = pos();
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  });

  // Reclamp on viewport resize so the widget can't be stranded off-screen
  onMount(() => {
    const onResize = () => setPos((p) => clampToViewport(p));
    window.addEventListener('resize', onResize);
    setPos((p) => clampToViewport(p));
    onCleanup(() => window.removeEventListener('resize', onResize));
  });

  onCleanup(() => {
    if (loopHandle) loopHandle.stop();
  });

  const onCreated = async (pet: PetState) => {
    await STORE.save(PET_ID, pet);
    wireUpPet(pet);
  };

  const onFeed = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'feed' }, s, f, s.rig, performance.now());
    loopHandle?.pokeAfterUserAction();
  };
  const onPet = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'pet' }, s, f, s.rig, performance.now());
    loopHandle?.pokeAfterUserAction();
  };

  const reset = async () => {
    await STORE.delete(PET_ID);
    localStorage.removeItem(POS_KEY);
    location.reload();
  };

  // — Drag —
  const startDrag = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const start = pos();
    const ox = e.clientX;
    const oy = e.clientY;
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      setPos(clampToViewport({ x: start.x + (ev.clientX - ox), y: start.y + (ev.clientY - oy) }));
    };
    const onUp = (ev: PointerEvent) => {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      setDragging(false);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  // Buttons must not start a drag
  const swallow = (e: PointerEvent) => e.stopPropagation();

  return (
    <div class="app">
      <header class="app-header">
        <h1>pet-genius</h1>
        <div class="header-right">
          <Show when={state()}>{(s) => <span class="trait-pill">{s().traits.name}</span>}</Show>
          <Show when={state()}>
            <button type="button" onClick={reset} class="btn-ghost">
              换一只
            </button>
          </Show>
        </div>
      </header>

      <main class="app-main">
        <Show
          when={state() && fsm()}
          fallback={
            bootErr() ? (
              <div class="loading">
                <span class="err">⚠ {bootErr()}</span>
              </div>
            ) : (
              <CreatePet onCreated={onCreated} />
            )
          }
        >
          <div class="page-backdrop">
            <div class="backdrop-hint">把它拖到任何地方 · the pet floats wherever you put it</div>
          </div>

          <div
            class="pet-widget"
            classList={{ hovered: hovered() || dragging(), dragging: dragging() }}
            style={{
              transform: `translate3d(${pos().x}px, ${pos().y}px, 0)`,
              width: `${WIDGET_W}px`,
              height: `${WIDGET_H}px`,
            }}
            onPointerDown={startDrag}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <div class="pet-widget-canvas">
              <PetCanvas state={state()!} fsm={fsm()!} />
              <ThoughtBubble thought={thought} />
            </div>

            <div class="pet-widget-panel">
              <StatusBar state={() => state()!} />
              <div class="pet-widget-actions">
                <button type="button" onClick={onPet} onPointerDown={swallow}>
                  pet
                </button>
                <button type="button" onClick={onFeed} onPointerDown={swallow}>
                  feed
                </button>
              </div>
            </div>
          </div>
        </Show>
      </main>
    </div>
  );
}
