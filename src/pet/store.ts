import type { PetState } from '../lib/types';

export interface PetStore {
  load(petId: string): Promise<PetState | null>;
  save(petId: string, state: PetState): Promise<void>;
  list(): Promise<string[]>;
  delete(petId: string): Promise<void>;
}
