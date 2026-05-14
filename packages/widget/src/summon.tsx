import { render } from 'solid-js/web';
import { ApiClient } from './ai/client';
import { WidgetController } from './controller';
import { LocalStoragePetStore } from './pet/local-store';
import type { PetStore } from './pet/store';
import App from './ui/App';

export interface SummonPetOptions {
  /** A DOM element to mount into. Should be sized large enough to hold the widget (default: viewport). */
  host: HTMLElement;
  /** Base URL for the pet-genius server (without trailing slash). e.g. `https://my-pet.fly.dev`. */
  apiBase: string;
  /** Logical ID for the saved pet within the store. Default: `'default'`. */
  petId?: string;
  /** Persistence backend. Default: `new LocalStoragePetStore()`. */
  store?: PetStore;
  /** Starting position for the widget (overrides any saved position). */
  defaultPosition?: { x: number; y: number };
}

/**
 * Mount a pet-genius widget into `host` and return an imperative handle for
 * controlling and observing it. Call `.destroy()` when you're done.
 *
 * @example
 *   const pet = summonPet({
 *     host: document.getElementById('pet-mount')!,
 *     apiBase: 'https://my-pet-api.fly.dev',
 *   });
 *   pet.onThought((text) => console.log('pet said:', text));
 */
export function summonPet(opts: SummonPetOptions): WidgetController {
  if (!opts.host) {
    throw new Error('summonPet: host element is required');
  }
  if (!opts.apiBase) {
    throw new Error('summonPet: apiBase is required');
  }

  const controller = new WidgetController();
  const client = new ApiClient(opts.apiBase);
  const store = opts.store ?? new LocalStoragePetStore();
  const petId = opts.petId ?? 'default';
  const posStorageKey = `pet-genius:widget-pos:${petId}`;

  const dispose = render(
    () => (
      <App
        config={{
          client,
          store,
          petId,
          posStorageKey,
          ...(opts.defaultPosition ? { defaultPosition: opts.defaultPosition } : {}),
          controller,
        }}
      />
    ),
    opts.host,
  );

  // Decorate destroy: tear down Solid render in addition to the controller's own.
  const innerDestroy = controller.destroy.bind(controller);
  controller.destroy = () => {
    innerDestroy();
    dispose();
  };

  return controller;
}
