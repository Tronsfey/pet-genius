import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env var: ${name}`);
  return v;
}

function flag(name: string): boolean {
  const v = process.env[name];
  return v === '1' || v === 'true';
}

export const env = {
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  CHAT_MODEL: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
  IMAGE_MODEL: process.env.IMAGE_MODEL ?? 'gpt-image-1',
  PORT: Number.parseInt(process.env.PORT ?? '3000', 10),
  // Local-dev escape hatch: when set, /api/sprite returns the built-in test pet
  // instead of calling gpt-image-1. Useful when the upstream is unreachable
  // (network sandbox, IP allowlist, etc.) so the page still loads.
  USE_TEST_PET: flag('USE_TEST_PET'),
};
