import type { ClipName, PetEvent, PetEventKind, PetState, Rig } from '@pet-genius/shared';
import { type FsmState, transition } from './fsm';

const EVENTS_CAP = 6;

export type Intent =
  | { kind: 'feed' }
  | { kind: 'pet' }
  | {
      kind: 'ai-action';
      animation: ClipName;
      intensity: number;
      thought?: string;
    };

function pushEvent(state: PetState, kind: PetEventKind, detail: string | undefined, at: number) {
  const evt: PetEvent = detail !== undefined ? { kind, detail, at } : { kind, at };
  state.events.push(evt);
  if (state.events.length > EVENTS_CAP) {
    state.events.splice(0, state.events.length - EVENTS_CAP);
  }
}

export function dispatch(
  intent: Intent,
  state: PetState,
  fsm: FsmState,
  rig: Rig,
  now: number,
): void {
  switch (intent.kind) {
    case 'feed':
      state.needs.hunger = Math.max(0, state.needs.hunger - 0.4);
      state.needs.affection = Math.min(1, state.needs.affection + 0.05);
      pushEvent(state, 'fed', undefined, Date.now());
      transition(fsm, rig, { mood: 'eating', clip: 'eating' }, now);
      // 'eating' loops; auto-return so feed feels finite
      setTimeout(() => {
        if (fsm.mood === 'eating') {
          transition(fsm, rig, { mood: 'idle', clip: 'idle' }, performance.now());
        }
      }, 1800);
      break;
    case 'pet':
      state.needs.affection = Math.min(1, state.needs.affection + 0.25);
      pushEvent(state, 'petted', undefined, Date.now());
      transition(fsm, rig, { mood: 'reacting', clip: 'happy_bounce' }, now);
      break;
    case 'ai-action':
      pushEvent(state, 'ai-action', intent.animation, Date.now());
      transition(fsm, rig, { mood: 'reacting', clip: intent.animation }, now);
      break;
  }
}
