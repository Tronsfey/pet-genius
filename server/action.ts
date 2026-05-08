import { Hono } from 'hono';
import { ActionRequestSchema, ActionResponseSchema } from '../src/lib/schemas';
import { env } from './env';
import { openai } from './openai';
import { systemPromptForAction, userPromptForAction } from './prompts';

export const actionApp = new Hono();

actionApp.post('/', async (c) => {
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
    const completion = await openai.chat.completions.create({
      model: env.CHAT_MODEL,
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
