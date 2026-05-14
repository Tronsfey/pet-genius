import type { ClipName, PetEvent, PetState } from '@pet-genius/shared';

/**
 * Imperative handle returned by `summonPet`. Methods are wired by the
 * underlying Solid app during mount; before mount they no-op.
 */
export class WidgetController {
  /** @internal */ private feedFn: (() => void) | null = null;
  /** @internal */ private petFn: (() => void) | null = null;
  /** @internal */ private resetFn: (() => Promise<void>) | null = null;
  /** @internal */ private getStateFn: (() => PetState | null) | null = null;
  /** @internal */ private dispose: (() => void) | null = null;

  /** @internal */ private thoughtListeners = new Set<(text: string) => void>();
  /** @internal */ private actionListeners = new Set<(clip: ClipName, intensity: number) => void>();
  /** @internal */ private eventListeners = new Set<(event: PetEvent) => void>();

  /** @internal */ _wire(opts: {
    feed: () => void;
    pet: () => void;
    reset: () => Promise<void>;
    getState: () => PetState | null;
    dispose: () => void;
  }): void {
    this.feedFn = opts.feed;
    this.petFn = opts.pet;
    this.resetFn = opts.reset;
    this.getStateFn = opts.getState;
    this.dispose = opts.dispose;
  }

  /** @internal */ _emitThought(text: string): void {
    for (const cb of this.thoughtListeners) cb(text);
  }
  /** @internal */ _emitAction(clip: ClipName, intensity: number): void {
    for (const cb of this.actionListeners) cb(clip, intensity);
  }
  /** @internal */ _emitEvent(event: PetEvent): void {
    for (const cb of this.eventListeners) cb(event);
  }

  /** Trigger the "feed" intent: drops hunger, plays the eating clip. */
  feed(): void {
    this.feedFn?.();
  }

  /** Trigger the "pet" intent: boosts affection, plays happy_bounce. */
  pet(): void {
    this.petFn?.();
  }

  /** Wipe the saved pet and reload the host so a fresh create-form appears. */
  async reset(): Promise<void> {
    if (this.resetFn) await this.resetFn();
  }

  /** Read the current PetState (null if no pet has been created yet). */
  getState(): PetState | null {
    return this.getStateFn?.() ?? null;
  }

  /** Subscribe to model-emitted thought lines. Returns an unsubscribe fn. */
  onThought(cb: (text: string) => void): () => void {
    this.thoughtListeners.add(cb);
    return () => {
      this.thoughtListeners.delete(cb);
    };
  }

  /** Subscribe to every AI-action the pet plays. Returns an unsubscribe fn. */
  onAction(cb: (clip: ClipName, intensity: number) => void): () => void {
    this.actionListeners.add(cb);
    return () => {
      this.actionListeners.delete(cb);
    };
  }

  /** Subscribe to every PetEvent appended to the events ring. */
  onEvent(cb: (event: PetEvent) => void): () => void {
    this.eventListeners.add(cb);
    return () => {
      this.eventListeners.delete(cb);
    };
  }

  /** Tear down: stop the AI loop, destroy the PixiJS app, unmount the Solid tree. */
  destroy(): void {
    this.dispose?.();
    this.dispose = null;
    this.feedFn = null;
    this.petFn = null;
    this.resetFn = null;
    this.getStateFn = null;
    this.thoughtListeners.clear();
    this.actionListeners.clear();
    this.eventListeners.clear();
  }
}
