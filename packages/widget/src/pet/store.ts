import type { PetState } from '@pet-genius/shared';

export interface PetStore {
  load(petId: string): Promise<PetState | null>;
  save(petId: string, state: PetState): Promise<void>;
  list(): Promise<string[]>;
  delete(petId: string): Promise<void>;
}
