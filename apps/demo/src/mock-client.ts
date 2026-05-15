import type {
  ActionRequest,
  ActionResponse,
  ApiClientLike,
  ClipName,
  PetTraits,
  SpriteResponse,
} from '@pet-genius/widget';
import staticPet from './static-pet.json';

// Keyless, server-less ApiClient used by the public GitHub Pages demo.
// generateSprite() returns a pre-baked pixel pet (the same one the real
// server emits via USE_TEST_PET); requestAction() returns canned behavior
// so the autonomous loop animates without an LLM.

const CLIPS: ClipName[] = [
  'idle',
  'idle',
  'idle',
  'happy_bounce',
  'playing',
  'stretch',
  'eating',
  'sleeping',
  'sad',
];

const THOUGHTS = ['想出去走走…', 'zzz…', '今天天气不错', '有点饿了', '玩个球！', '看看周围'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export class MockApiClient implements ApiClientLike {
  async generateSprite(traits: PetTraits): Promise<SpriteResponse> {
    // Small latency so the "summoning…" state is visible.
    await new Promise((r) => setTimeout(r, 450));
    return {
      sprites: staticPet.sprites,
      rig: staticPet.rig as SpriteResponse['rig'],
      traits: { ...traits, style: 'pixel' },
    };
  }

  async requestAction(_req: ActionRequest): Promise<ActionResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const animation = pick(CLIPS);
    const res: ActionResponse = {
      animation,
      intensity: 0.4 + Math.random() * 0.5,
    };
    // ~1 in 3 turns the pet mutters something.
    if (Math.random() < 0.34) res.thought = pick(THOUGHTS);
    return res;
  }
}
