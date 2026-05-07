import type { PetState } from '../lib/types';
import { type FsmState, tickFsm, transition } from './fsm';

const HUNGER_PER_SEC = 1 / (60 * 5);
const ENERGY_PER_SEC = 1 / (60 * 8);
const CLEAN_PER_SEC = 1 / (60 * 10);
const AFFECTION_PER_SEC = 1 / (60 * 12);

export function tickWorld(
  state: PetState,
  fsm: FsmState,
  rig: PetState['rig'],
  dtMs: number,
  now: number,
): void {
  const dt = dtMs / 1000;
  state.needs.hunger = Math.min(1, state.needs.hunger + HUNGER_PER_SEC * dt);
  state.needs.energy = Math.max(0, state.needs.energy - ENERGY_PER_SEC * dt);
  state.needs.cleanliness = Math.max(0, state.needs.cleanliness - CLEAN_PER_SEC * dt);
  state.needs.affection = Math.max(0, state.needs.affection - AFFECTION_PER_SEC * dt);

  if (!fsm.locked && fsm.mood === 'idle') {
    if (state.needs.energy < 0.1) {
      transition(fsm, rig, { mood: 'sleeping', clip: 'sleeping' }, now);
    } else if (state.needs.hunger > 0.9) {
      transition(fsm, rig, { mood: 'sad', clip: 'sad' }, now);
    }
  }

  if (fsm.mood === 'sleeping' && state.needs.energy > 0.9) {
    transition(fsm, rig, { mood: 'idle', clip: 'wake' }, now);
  }
  if (fsm.mood === 'sad' && state.needs.hunger < 0.5) {
    transition(fsm, rig, { mood: 'idle', clip: 'idle' }, now);
  }

  state.mood = fsm.mood;
  tickFsm(fsm, rig, now);
}
