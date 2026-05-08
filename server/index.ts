import { existsSync } from 'node:fs';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { actionApp } from './action';
import { env } from './env';
import { spriteApp } from './sprite';

const app = new Hono();

app.get('/healthz', (c) => c.json({ ok: true }));

app.route('/api/action', actionApp);
app.route('/api/sprite', spriteApp);

if (existsSync('dist')) {
  app.use('/*', serveStatic({ root: './dist' }));
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`pet-genius server listening on http://localhost:${info.port}`);
});
