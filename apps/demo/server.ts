import { existsSync } from 'node:fs';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createPetGeniusApp } from '@pet-genius/server';
import dotenv from 'dotenv';
import { Hono } from 'hono';

// Load env from repo root (where .env.local lives).
const ENV_LOCAL = '../../.env.local';
const ENV = '../../.env';
if (existsSync(ENV_LOCAL)) dotenv.config({ path: ENV_LOCAL });
else if (existsSync(ENV)) dotenv.config({ path: ENV });

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('demo server: OPENAI_API_KEY is required (put it in .env.local at repo root)');
}

const app = new Hono();

app.route(
  '/',
  createPetGeniusApp({
    openaiApiKey: apiKey,
    ...(process.env.OPENAI_BASE_URL ? { openaiBaseURL: process.env.OPENAI_BASE_URL } : {}),
    ...(process.env.CHAT_MODEL ? { chatModel: process.env.CHAT_MODEL } : {}),
    ...(process.env.IMAGE_MODEL ? { imageModel: process.env.IMAGE_MODEL } : {}),
    useTestPet: process.env.USE_TEST_PET === '1' || process.env.USE_TEST_PET === 'true',
  }),
);

if (existsSync('./dist')) {
  app.use('/*', serveStatic({ root: './dist' }));
}

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`pet-genius demo server: http://localhost:${info.port}`);
});
