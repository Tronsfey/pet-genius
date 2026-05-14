import {
  type ActionRequest,
  type ActionResponse,
  ActionResponseSchema,
  type PetTraits,
  type SpriteResponse,
  SpriteResponseSchema,
} from '@pet-genius/shared';

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

function trimTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

export class ApiClient {
  private readonly base: string;

  constructor(apiBase: string) {
    this.base = trimTrailingSlash(apiBase);
  }

  async requestAction(req: ActionRequest): Promise<ActionResponse> {
    const r = await fetch(`${this.base}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!r.ok) {
      throw new Error(await readErrorMessage(r, `action ${r.status}`));
    }
    return ActionResponseSchema.parse(await r.json());
  }

  async generateSprite(traits: PetTraits): Promise<SpriteResponse> {
    const r = await fetch(`${this.base}/api/sprite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traits }),
    });
    if (!r.ok) {
      throw new Error(await readErrorMessage(r, `sprite ${r.status}`));
    }
    return SpriteResponseSchema.parse(await r.json());
  }
}
