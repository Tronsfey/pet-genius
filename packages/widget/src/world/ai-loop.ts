import type { ActionRequest, PetState } from '@pet-genius/shared';
import type { ApiClient } from '../ai/client';
import { dispatch } from './actions';
import type { FsmState } from './fsm';

const AUTO_MIN_MS = 8_000;
const AUTO_MAX_MS = 12_000;
const POKE_DELAY_MS = 600;

export interface AiLoopHandle {
  pokeAfterUserAction(): void;
  stop(): void;
}

export interface AiLoopOptions {
  client: ApiClient;
  state: PetState;
  fsm: FsmState;
  onThought: (text: string) => void;
}

function nextDelay(): number {
  return AUTO_MIN_MS + Math.random() * (AUTO_MAX_MS - AUTO_MIN_MS);
}

function buildRequest(state: PetState, fsm: FsmState): ActionRequest {
  const secondsIdle = Math.max(0, (performance.now() - fsm.startedAt) / 1000);
  return {
    traits: state.traits,
    snapshot: {
      needs: { ...state.needs },
      mood: state.mood,
      secondsIdle,
    },
    recent: state.events.slice(-6),
  };
}

export function startAiLoop({ client, state, fsm, onThought }: AiLoopOptions): AiLoopHandle {
  let stopped = false;
  let autoTimer: ReturnType<typeof setTimeout> | null = null;
  let pokeTimer: ReturnType<typeof setTimeout> | null = null;
  let inflight = false;

  const fire = async () => {
    if (stopped || inflight) return;
    inflight = true;
    try {
      const reply = await client.requestAction(buildRequest(state, fsm));
      if (stopped) return;
      const intent = {
        kind: 'ai-action' as const,
        animation: reply.animation,
        intensity: reply.intensity,
        ...(reply.thought !== undefined ? { thought: reply.thought } : {}),
      };
      dispatch(intent, state, fsm, state.rig, performance.now());
      if (reply.thought) onThought(reply.thought);
    } catch {
      // silent — autonomous loop tolerates upstream failures
    } finally {
      inflight = false;
    }
  };

  const scheduleAuto = () => {
    if (stopped) return;
    autoTimer = setTimeout(async () => {
      await fire();
      scheduleAuto();
    }, nextDelay());
  };

  scheduleAuto();

  return {
    pokeAfterUserAction() {
      if (stopped) return;
      if (pokeTimer) clearTimeout(pokeTimer);
      pokeTimer = setTimeout(() => {
        fire();
      }, POKE_DELAY_MS);
    },
    stop() {
      stopped = true;
      if (autoTimer) clearTimeout(autoTimer);
      if (pokeTimer) clearTimeout(pokeTimer);
    },
  };
}
