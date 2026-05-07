export const CURRENT_VERSION = 1 as const;

type Migrator = (s: unknown) => unknown;

export const migrations: Record<number, Migrator> = {};

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
