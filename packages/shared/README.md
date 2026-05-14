# @pet-genius/shared

Shared types, zod schemas, art-style config, and default animation clips for **pet-genius**. Zero side-effects, zero opinions about runtime.

Imported by both [`@pet-genius/widget`](../widget) (browser) and [`@pet-genius/server`](../server) (Node), so that the wire format between them is defined exactly once.

## Install

```sh
pnpm add @pet-genius/shared
```

## Exports

```ts
import {
  // — Domain types —
  PetState, PetTraits, Bone, Rig, Pose, AnimationClip, ClipName, BoneName,
  Needs, MoodState, PetEvent, PetEventKind, PetSnapshot,

  // — AI wire shapes —
  ActionRequest, ActionResponse, SpriteResponse, SpriteRequest,

  // — zod schemas matching every type above 1:1 —
  PetStateSchema, ActionRequestSchema, ActionResponseSchema, SpriteResponseSchema,
  // ... and so on

  // — Art style config —
  ArtStyle,         // 'pixel' | 'flat' | 'watercolor' | 'storybook'
  STYLES,           // Record<ArtStyle, StyleConfig>

  // — Default 8-clip animation set: idle / happy_bounce / eating / sleeping /
  //   playing / sad / wake / stretch —
  defaultClips,
} from '@pet-genius/shared';
```

## License

MIT — see repo root.
