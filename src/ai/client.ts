import { ActionResponseSchema, SpriteResponseSchema } from '../lib/schemas';
import type { ActionRequest, ActionResponse, PetTraits, SpriteResponse } from '../lib/types';

async function readErrorMessage(r: Response, fallback: string): Promise<string> {
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
      return (body.error as { message: string }).message;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function requestAction(req: ActionRequest): Promise<ActionResponse> {
  const r = await fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    throw new Error(await readErrorMessage(r, `action ${r.status}`));
  }
  return ActionResponseSchema.parse(await r.json());
}

export async function generateSprite(traits: PetTraits): Promise<SpriteResponse> {
  const r = await fetch('/api/sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ traits }),
  });
  if (!r.ok) {
    throw new Error(await readErrorMessage(r, `sprite ${r.status}`));
  }
  return SpriteResponseSchema.parse(await r.json());
}
