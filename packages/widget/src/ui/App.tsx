import type { PetState } from '@pet-genius/shared';
import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { ApiClientLike } from '../ai/client';
import type { WidgetController } from '../controller';
import type { PetStore } from '../pet/store';
import { dispatch } from '../world/actions';
import { type AiLoopHandle, startAiLoop } from '../world/ai-loop';
import { type FsmState, createFsm } from '../world/fsm';
import CreatePet from './CreatePet';
import PetCanvas from './PetCanvas';
import StatusBar from './StatusBar';
import ThoughtBubble from './ThoughtBubble';

export interface WidgetConfig {
  client: ApiClientLike;
  store: PetStore;
  petId: string;
  posStorageKey: string;
  defaultPosition?: { x: number; y: number };
  controller: WidgetController;
}

const WIDGET_W = 240;
const WIDGET_H = 240;

interface Pos {
  x: number;
  y: number;
}

function loadPos(key: string): Pos | null {
  try {
    const raw = localStorage.getItem(key);
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

function centerPos(): Pos {
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

export default function App(props: { config: WidgetConfig }) {
  const cfg = props.config;

  const [state, setState] = createSignal<PetState | null>(null);
  const [fsm, setFsm] = createSignal<FsmState | null>(null);
  const [thought, setThought] = createSignal<{ text: string; ts: number } | null>(null);
  const [bootErr, setBootErr] = createSignal<string | null>(null);

  const [pos, setPos] = createSignal<Pos>(
    loadPos(cfg.posStorageKey) ?? cfg.defaultPosition ?? centerPos(),
  );
  const [hovered, setHovered] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  let loopHandle: AiLoopHandle | null = null;

  const wireUpPet = (pet: PetState) => {
    const f = createFsm(pet.rig, performance.now());
    setState(pet);
    setFsm(f);
    if (loopHandle) loopHandle.stop();
    loopHandle = startAiLoop({
      client: cfg.client,
      state: pet,
      fsm: f,
      onThought: (text) => {
        setThought({ text, ts: performance.now() });
        cfg.controller._emitThought(text);
      },
    });
  };

  const boot = async () => {
    try {
      const existing = await cfg.store.load(cfg.petId);
      if (existing) wireUpPet(existing);
    } catch (e) {
      setBootErr(e instanceof Error ? e.message : String(e));
    }
  };
  boot();

  createEffect(() => {
    const p = pos();
    try {
      localStorage.setItem(cfg.posStorageKey, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  });

  onMount(() => {
    const onResize = () => setPos((p) => clampToViewport(p));
    window.addEventListener('resize', onResize);
    setPos((p) => clampToViewport(p));
    onCleanup(() => window.removeEventListener('resize', onResize));
  });

  const onCreated = async (pet: PetState) => {
    await cfg.store.save(cfg.petId, pet);
    wireUpPet(pet);
  };

  const doFeed = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'feed' }, s, f, s.rig, performance.now());
    loopHandle?.pokeAfterUserAction();
    cfg.controller._emitEvent({ kind: 'fed', at: Date.now() });
  };
  const doPet = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'pet' }, s, f, s.rig, performance.now());
    loopHandle?.pokeAfterUserAction();
    cfg.controller._emitEvent({ kind: 'petted', at: Date.now() });
  };
  const doReset = async () => {
    await cfg.store.delete(cfg.petId);
    try {
      localStorage.removeItem(cfg.posStorageKey);
    } catch {
      /* ignore */
    }
    setState(null);
    setFsm(null);
    if (loopHandle) {
      loopHandle.stop();
      loopHandle = null;
    }
  };

  cfg.controller._wire({
    feed: doFeed,
    pet: doPet,
    reset: doReset,
    getState: () => state(),
    dispose: () => {
      if (loopHandle) {
        loopHandle.stop();
        loopHandle = null;
      }
    },
  });

  onCleanup(() => {
    if (loopHandle) loopHandle.stop();
  });

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

  const swallow = (e: PointerEvent) => e.stopPropagation();

  return (
    <div class="pet-genius-root">
      <Show
        when={state() && fsm()}
        fallback={
          bootErr() ? (
            <div class="pet-genius-loading">
              <span class="pet-genius-err">⚠ {bootErr()}</span>
            </div>
          ) : (
            <CreatePet client={cfg.client} onCreated={onCreated} />
          )
        }
      >
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
              <button type="button" onClick={doPet} onPointerDown={swallow}>
                pet
              </button>
              <button type="button" onClick={doFeed} onPointerDown={swallow}>
                feed
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
