import { describe, expect, it } from 'vitest';
import { CURRENT_VERSION, runMigrations } from '../src/pet/migrations';

describe('migrations', () => {
  it('returns input unchanged when version matches CURRENT_VERSION', () => {
    const cur = { version: CURRENT_VERSION, foo: 'bar' };
    expect(runMigrations(cur)).toBe(cur);
  });

  it('throws when version field is missing', () => {
    expect(() => runMigrations({ foo: 'bar' })).toThrow(/no numeric version/);
  });

  it('throws when no migrator exists for the next version', () => {
    expect(() => runMigrations({ version: 99 })).toThrow(/missing migrator/);
  });

  it('migrates v1 → current: drops chatLog, seeds events, fills traits.style', () => {
    const v1 = {
      version: 1,
      id: 'abc',
      traits: { name: 'a', palette: 'b', vibe: 'c', speciesHint: 'd' },
      chatLog: [{ role: 'user', text: 'hi', at: 1 }],
      mood: 'idle',
    };
    const out = runMigrations(v1) as Record<string, unknown>;
    expect(out.version).toBe(CURRENT_VERSION);
    expect(out.events).toEqual([]);
    expect('chatLog' in out).toBe(false);
    const traits = out.traits as Record<string, unknown>;
    expect(traits.style).toBe('pixel');
    expect(out.id).toBe('abc');
  });

  it('migrates v2 → v3: traits.style defaults to "pixel"', () => {
    const v2 = {
      version: 2,
      id: 'xyz',
      traits: { name: 'a', palette: 'b', vibe: 'c', speciesHint: 'd' },
      events: [],
    };
    const out = runMigrations(v2) as Record<string, unknown>;
    expect(out.version).toBe(3);
    const traits = out.traits as Record<string, unknown>;
    expect(traits.style).toBe('pixel');
    expect(traits.name).toBe('a');
  });
});
