export const CURRENT_VERSION = 3 as const;

type Migrator = (s: unknown) => unknown;

export const migrations: Record<number, Migrator> = {
  // 1 → 2: chat surface removed; chatLog dropped, events ring added.
  2: (v1: unknown) => {
    const obj = v1 as Record<string, unknown>;
    const { chatLog: _drop, ...rest } = obj;
    return { ...rest, version: 2, events: [] };
  },
  // 2 → 3: art style abstracted; traits.style defaults to 'pixel' (the
  // historical default) for any pet generated before the multi-style pivot.
  3: (v2: unknown) => {
    const obj = v2 as Record<string, unknown>;
    const traits = (obj.traits as Record<string, unknown>) ?? {};
    return {
      ...obj,
      version: 3,
      traits: { ...traits, style: 'pixel' },
    };
  },
};

export function runMigrations(raw: unknown): unknown {
  let state = raw;
  let safety = 16;
  while (safety-- > 0) {
    const v = (state as { version?: number } | null)?.version;
    if (v === CURRENT_VERSION) return state;
    if (typeof v !== 'number') {
      throw new Error('migrations: stored state has no numeric version field');
    }
    const next = migrations[v + 1];
    if (!next) {
      throw new Error(`migrations: missing migrator from v${v} to v${v + 1}`);
    }
    state = next(state);
  }
  throw new Error('migrations: exceeded migration depth');
}
