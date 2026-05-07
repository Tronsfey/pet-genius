import { ChatReplySchema, SpriteResponseSchema } from '../lib/schemas';
import type { ChatMessage, ChatReply, PetTraits, SpriteResponse } from '../lib/types';

export async function chat(messages: ChatMessage[], traits: PetTraits): Promise<ChatReply> {
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, traits }),
  });
  if (!r.ok) {
    let message = `chat ${r.status}`;
    try {
      const body: unknown = await r.json();
      if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        body.error &&
        typeof body.error === 'object' &&
        'message' in body.error &&
        typeof (body.error as { message: unknown }).message === 'string'
      ) {
        message = (body.error as { message: string }).message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return ChatReplySchema.parse(await r.json());
}

export async function generateSprite(traits: PetTraits): Promise<SpriteResponse> {
  const r = await fetch('/api/sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ traits }),
  });
  if (!r.ok) throw new Error(`sprite ${r.status}`);
  return SpriteResponseSchema.parse(await r.json());
}
