# @pet-genius/widget

Drop-in floating pet companion for any web page. Renders an AI-generated pixel (or watercolor / flat / storybook) creature on a transparent canvas the user can drag anywhere. The pet's behavior is driven by an LLM through an autonomous + reactive loop.

## Install

```sh
pnpm add @pet-genius/widget
```

You'll also need a pet-genius server reachable at some URL — set up [`@pet-genius/server`](../server) somewhere, then point the widget at its origin.

## Three-line usage

```ts
import { summonPet } from '@pet-genius/widget';
import '@pet-genius/widget/styles.css';

const pet = summonPet({
  host: document.getElementById('pet-mount')!,
  apiBase: 'https://my-pet-api.example.com',
});
```

The first call shows a creation form (`name / palette / vibe / species hint / art style`). After submit, the pet is persisted to `localStorage` and the widget appears as a draggable floating element.

## Options

```ts
interface SummonPetOptions {
  /** A DOM element to mount into. Should be sized large enough for the widget. */
  host: HTMLElement;
  /** Base URL of your pet-genius server (no trailing slash). */
  apiBase: string;
  /** Logical ID for the saved pet. Default: `'default'`. */
  petId?: string;
  /** Persistence backend. Default: `new LocalStoragePetStore()`. */
  store?: PetStore;
  /** Starting position (overrides any saved position). */
  defaultPosition?: { x: number; y: number };
}
```

The host should usually fill the area you want the pet to be able to roam in. For a full-page floating pet:

```html
<div id="pet-mount" style="position:fixed;inset:0;pointer-events:none;z-index:9999"></div>
```

Then in CSS, the pet widget itself sets `pointer-events:auto`, so clicks pass through everywhere except the pet.

## Imperative handle

```ts
const pet = summonPet({ /* ... */ });

pet.feed();                 // local intent: hunger ↓, plays eating clip
pet.pet();                  // local intent: affection ↑, plays happy_bounce
await pet.reset();          // delete saved pet, return to create form
pet.getState();             // PetState | null

const off1 = pet.onThought((text) => console.log('mutter:', text));
const off2 = pet.onAction((clip, intensity) => console.log('did:', clip, intensity));
const off3 = pet.onEvent((event) => console.log('event:', event));

off1();                     // unsubscribe individual listeners
pet.destroy();              // tear down everything (Solid tree, PixiJS app, AI loop)
```

## How the AI drives behavior

This is **not a chat tool**. The behavior LLM (default `gpt-4o-mini`) decides what the pet *does*, not what it *says*. Two trigger modes share one endpoint:

- **Autonomous**: every 8–12 s (jittered) the widget POSTs a state snapshot to `/api/action` and dispatches the returned `{ animation, intensity, thought? }`.
- **Reactive**: clicking `feed` / `pet` runs the local clip immediately *and* schedules a single follow-up `/api/action` call ~600 ms later so the pet's mood reflects the recent event.

Failures (network, upstream throttle) are silent — the pet keeps idling.

## License

MIT — see repo root.
