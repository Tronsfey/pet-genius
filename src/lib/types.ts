export type BoneName = 'head' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR' | 'tail' | 'accessory';

export interface PetTraits {
  name: string;
  palette: string;
  vibe: string;
  speciesHint: string;
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

export interface ChatMessage {
  role: 'user' | 'pet';
  text: string;
  at: number;
}

export interface PetState {
  version: 1;
  id: string;
  createdAt: number;
  traits: PetTraits;
  rig: Rig;
  sprites: Record<string, string>;
  needs: Needs;
  mood: MoodState;
  chatLog: ChatMessage[];
}

export interface AnimationHint {
  name: ClipName;
  intensity: number;
}

export interface ChatReply {
  reply: string;
  animationHint?: AnimationHint;
}

export interface SpriteResponse {
  sprites: Record<string, string>;
  rig: Rig;
}
