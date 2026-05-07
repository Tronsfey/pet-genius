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

export const env = {
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  CHAT_MODEL: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
  IMAGE_MODEL: process.env.IMAGE_MODEL ?? 'gpt-image-1',
  PORT: Number.parseInt(process.env.PORT ?? '3000', 10),
};
