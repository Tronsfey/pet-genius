// Public API. Internal classes/functions are not exported.

export { summonPet, type SummonPetOptions } from './summon';
export { WidgetController } from './controller';
export { LocalStoragePetStore } from './pet/local-store';
export type { PetStore } from './pet/store';

// Re-export shared types so consumers don't need a separate import.
export type {
  ActionRequest,
  ActionResponse,
  AnimationClip,
  ArtStyle,
  Bone,
  BoneName,
  ClipName,
  MoodState,
  Needs,
  PetEvent,
  PetEventKind,
  PetSnapshot,
  PetState,
  PetTraits,
  Pose,
  Rig,
  SpriteResponse,
} from '@pet-genius/shared';
