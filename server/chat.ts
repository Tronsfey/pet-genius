import { Hono } from 'hono';
import { ChatReplySchema, ChatRequestSchema } from '../src/lib/schemas';
import { env } from './env';
import { openai } from './openai';
import { systemPromptForChat } from './prompts';

export const chatApp = new Hono();

chatApp.post('/', async (c) => {
  let bodyRaw: unknown;
  try {
    bodyRaw = await c.req.json();
  } catch {
    return c.json({ error: { code: 'BadRequest', message: 'invalid JSON body' } }, 400);
  }

  const parsed = ChatRequestSchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return c.json({ error: { code: 'BadRequest', message: parsed.error.message } }, 400);
  }
  const { messages, traits } = parsed.data;

  const upstreamMessages = [
    { role: 'system' as const, content: systemPromptForChat(traits) },
    ...messages.map((m) => ({
      role: (m.role === 'pet' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    })),
  ];

  const startedAt = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: env.CHAT_MODEL,
      response_format: { type: 'json_object' },
      messages: upstreamMessages,
    });
    const content = completion.choices[0]?.message?.content ?? '';
    let asJson: unknown;
    try {
      asJson = JSON.parse(content);
    } catch {
      console.warn(
        `chat upstream returned non-JSON in ${Date.now() - startedAt}ms; first 80 chars: ${content.slice(0, 80)}`,
      );
      return c.json({ error: { code: 'Upstream', message: 'model returned non-JSON' } }, 502);
    }
    const replyParsed = ChatReplySchema.safeParse(asJson);
    if (!replyParsed.success) {
      return c.json(
        { error: { code: 'Upstream', message: 'model reply failed schema validation' } },
        502,
      );
    }
    return c.json(replyParsed.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`chat upstream error in ${Date.now() - startedAt}ms: ${msg}`);
    return c.json({ error: { code: 'Upstream', message: 'upstream call failed' } }, 502);
  }
});
