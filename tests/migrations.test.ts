import { describe, expect, it } from 'vitest';
import { CURRENT_VERSION, runMigrations } from '../src/pet/migrations';

describe('migrations', () => {
  it('returns input unchanged when version matches CURRENT_VERSION', () => {
    const v2 = { version: CURRENT_VERSION, foo: 'bar' };
    expect(runMigrations(v2)).toBe(v2);
  });

  it('throws when version field is missing', () => {
    expect(() => runMigrations({ foo: 'bar' })).toThrow(/no numeric version/);
  });

  it('throws when no migrator exists for the current version', () => {
    expect(() => runMigrations({ version: 99 })).toThrow(/missing migrator/);
  });

  it('migrates v1 → v2: drops chatLog, initializes events: []', () => {
    const v1 = {
      version: 1,
      id: 'abc',
      traits: { name: 'a', palette: 'b', vibe: 'c', speciesHint: 'd' },
      chatLog: [{ role: 'user', text: 'hi', at: 1 }],
      mood: 'idle',
    };
    const out = runMigrations(v1) as Record<string, unknown>;
    expect(out.version).toBe(2);
    expect(out.events).toEqual([]);
    expect('chatLog' in out).toBe(false);
    expect(out.id).toBe('abc');
  });
});
