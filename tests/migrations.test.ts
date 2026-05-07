import { describe, expect, it } from 'vitest';
import { CURRENT_VERSION, runMigrations } from '../src/pet/migrations';

describe('migrations', () => {
  it('returns input unchanged when version matches CURRENT_VERSION', () => {
    const v1 = { version: CURRENT_VERSION, foo: 'bar' };
    expect(runMigrations(v1)).toBe(v1);
  });

  it('throws when version field is missing', () => {
    expect(() => runMigrations({ foo: 'bar' })).toThrow(/no numeric version/);
  });

  it('throws when no migrator exists for the current version', () => {
    expect(() => runMigrations({ version: 99 })).toThrow(/missing migrator/);
  });
});
