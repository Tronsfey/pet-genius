import { type PetState, PetStateSchema } from '@pet-genius/shared';
import { runMigrations } from './migrations';
import type { PetStore } from './store';

const PREFIX = 'pet-genius:pet:';
const INDEX_KEY = 'pet-genius:index';

export class LocalStoragePetStore implements PetStore {
  async load(petId: string): Promise<PetState | null> {
    const raw = localStorage.getItem(PREFIX + petId);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    const migrated = runMigrations(parsed);
    return PetStateSchema.parse(migrated);
  }

  async save(petId: string, state: PetState): Promise<void> {
    PetStateSchema.parse(state);
    localStorage.setItem(PREFIX + petId, JSON.stringify(state));
    const ids = await this.list();
    if (!ids.includes(petId)) {
      localStorage.setItem(INDEX_KEY, JSON.stringify([...ids, petId]));
    }
  }

  async list(): Promise<string[]> {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  }

  async delete(petId: string): Promise<void> {
    localStorage.removeItem(PREFIX + petId);
    const ids = await this.list();
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids.filter((id) => id !== petId)));
  }
}
