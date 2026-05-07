import type { AnimationHint, PetState, Rig } from '../lib/types';
import { type FsmState, transition } from './fsm';

export type Intent =
  | { kind: 'feed' }
  | { kind: 'pet' }
  | { kind: 'talk'; text: string }
  | { kind: 'chat-reply'; reply: string; animationHint?: AnimationHint };

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
      transition(fsm, rig, { mood: 'eating', clip: 'eating' }, now);
      // 'eating' loops; auto-return after a short window so feed feels finite
      setTimeout(() => {
        if (fsm.mood === 'eating') {
          transition(fsm, rig, { mood: 'idle', clip: 'idle' }, performance.now());
        }
      }, 1800);
      break;
    case 'pet':
      state.needs.affection = Math.min(1, state.needs.affection + 0.25);
      transition(fsm, rig, { mood: 'reacting', clip: 'happy_bounce' }, now);
      break;
    case 'talk':
      state.chatLog.push({ role: 'user', text: intent.text, at: now });
      break;
    case 'chat-reply':
      state.chatLog.push({ role: 'pet', text: intent.reply, at: now });
      if (intent.animationHint) {
        transition(fsm, rig, { mood: 'reacting', clip: intent.animationHint.name }, now);
      }
      break;
  }
}
