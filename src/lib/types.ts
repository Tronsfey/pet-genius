import type { ArtStyle } from './style';

export type BoneName = 'head' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR' | 'tail' | 'accessory';

export interface PetTraits {
  name: string;
  palette: string;
  vibe: string;
  speciesHint: string;
  style: ArtStyle;
}

export interface Bone {
  name: BoneName;
  parent: BoneName | null;
  pivot: { x: number; y: number };
  attach: { x: number; y: number };
  spriteId: string;
  z: number;
}

export type Pose = Partial<
  Record<
    BoneName,
    {
      x?: number;
      y?: number;
      rot?: number;
      scale?: number;
    }
  >
>;

export type Easing = 'linear' | 'easeInOut' | 'easeOutBack';

export type ClipName =
  | 'idle'
  | 'happy_bounce'
  | 'eating'
  | 'sleeping'
  | 'playing'
  | 'sad'
  | 'wake'
  | 'stretch';

export interface Keyframe {
  t: number;
  pose: Pose;
  ease?: Easing;
}

export interface AnimationClip {
  name: ClipName;
  duration: number;
  loops: boolean;
  keyframes: Keyframe[];
}

export interface Rig {
  bones: Bone[];
  clips: AnimationClip[];
}

export type MoodState = 'idle' | 'eating' | 'sleeping' | 'playing' | 'reacting' | 'sad';

export interface Needs {
  hunger: number;
  energy: number;
  cleanliness: number;
  affection: number;
}

export type PetEventKind = 'fed' | 'petted' | 'ai-action' | 'mood-change';

export interface PetEvent {
  kind: PetEventKind;
  detail?: string;
  at: number;
}

export interface PetState {
  version: 3;
  id: string;
  createdAt: number;
  traits: PetTraits;
  rig: Rig;
  sprites: Record<string, string>;
  needs: Needs;
  mood: MoodState;
  events: PetEvent[];
}

export interface PetSnapshot {
  needs: Needs;
  mood: MoodState;
  secondsIdle: number;
}

export interface ActionRequest {
  traits: PetTraits;
  snapshot: PetSnapshot;
  recent: PetEvent[];
}

export interface ActionResponse {
  animation: ClipName;
  intensity: number;
  thought?: string;
}

export interface SpriteResponse {
  sprites: Record<string, string>;
  rig: Rig;
  // Echoed back so the client persists the canonical traits the server
  // actually drew with (the test-pet path may force style='pixel' regardless).
  traits: PetTraits;
}
