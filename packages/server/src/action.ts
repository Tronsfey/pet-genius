import { ActionRequestSchema, ActionResponseSchema } from '@pet-genius/shared';
import { Hono } from 'hono';
import type { ServerContext } from './context';
import { systemPromptForAction, userPromptForAction } from './prompts';

export function createActionApp(ctx: ServerContext): Hono {
  const app = new Hono();

  app.post('/', async (c) => {
    let bodyRaw: unknown;
    try {
      bodyRaw = await c.req.json();
    } catch {
      return c.json({ error: { code: 'BadRequest', message: 'invalid JSON body' } }, 400);
    }

    const parsed = ActionRequestSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return c.json({ error: { code: 'BadRequest', message: parsed.error.message } }, 400);
    }
    const { traits, snapshot, recent } = parsed.data;

    const startedAt = Date.now();
    try {
      const completion = await ctx.openai.chat.completions.create({
        model: ctx.chatModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPromptForAction(traits) },
          { role: 'user', content: userPromptForAction(snapshot, recent) },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? '';
      let asJson: unknown;
      try {
        asJson = JSON.parse(content);
      } catch {
        console.warn(
          `action upstream returned non-JSON in ${Date.now() - startedAt}ms; first 80 chars: ${content.slice(0, 80)}`,
        );
        return c.json({ error: { code: 'Upstream', message: 'model returned non-JSON' } }, 502);
      }
      const replyParsed = ActionResponseSchema.safeParse(asJson);
      if (!replyParsed.success) {
        return c.json(
          { error: { code: 'Upstream', message: 'model reply failed schema validation' } },
          502,
        );
      }
      return c.json(replyParsed.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      console.error(`action upstream error in ${Date.now() - startedAt}ms: ${msg}`);
      return c.json({ error: { code: 'Upstream', message: 'upstream call failed' } }, 502);
    }
  });

  return app;
}
