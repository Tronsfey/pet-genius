import { z } from 'zod';

export const ArtStyleSchema = z.enum(['pixel', 'flat', 'watercolor', 'storybook']);

export const BoneNameSchema = z.enum([
  'head',
  'torso',
  'armL',
  'armR',
  'legL',
  'legR',
  'tail',
  'accessory',
]);

export const ClipNameSchema = z.enum([
  'idle',
  'happy_bounce',
  'eating',
  'sleeping',
  'playing',
  'sad',
  'wake',
  'stretch',
]);

export const EasingSchema = z.enum(['linear', 'easeInOut', 'easeOutBack']);

export const PetTraitsSchema = z.object({
  name: z.string().min(1).max(40),
  palette: z.string().min(1).max(80),
  vibe: z.string().min(1).max(120),
  speciesHint: z.string().min(1).max(80),
  style: ArtStyleSchema,
});

const Vec2 = z.object({ x: z.number(), y: z.number() });

export const BoneSchema = z.object({
  name: BoneNameSchema,
  parent: BoneNameSchema.nullable(),
  pivot: Vec2,
  attach: Vec2,
  spriteId: z.string().min(1),
  z: z.number(),
});

export const PoseSchema = z.record(
  BoneNameSchema,
  z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    rot: z.number().optional(),
    scale: z.number().optional(),
  }),
);

export const KeyframeSchema = z.object({
  t: z.number().min(0).max(1),
  pose: PoseSchema,
  ease: EasingSchema.optional(),
});

export const AnimationClipSchema = z.object({
  name: ClipNameSchema,
  duration: z.number().positive(),
  loops: z.boolean(),
  keyframes: z.array(KeyframeSchema).min(1),
});

export const RigSchema = z.object({
  bones: z.array(BoneSchema).min(1),
  clips: z.array(AnimationClipSchema).min(1),
});

export const NeedsSchema = z.object({
  hunger: z.number().min(0).max(1),
  energy: z.number().min(0).max(1),
  cleanliness: z.number().min(0).max(1),
  affection: z.number().min(0).max(1),
});

export const MoodStateSchema = z.enum(['idle', 'eating', 'sleeping', 'playing', 'reacting', 'sad']);

export const PetEventKindSchema = z.enum(['fed', 'petted', 'ai-action', 'mood-change']);

export const PetEventSchema = z.object({
  kind: PetEventKindSchema,
  detail: z.string().optional(),
  at: z.number(),
});

export const PetStateSchema = z.object({
  version: z.literal(3),
  id: z.string().min(1),
  createdAt: z.number(),
  traits: PetTraitsSchema,
  rig: RigSchema,
  sprites: z.record(z.string(), z.string()),
  needs: NeedsSchema,
  mood: MoodStateSchema,
  events: z.array(PetEventSchema),
});

export const PetSnapshotSchema = z.object({
  needs: NeedsSchema,
  mood: MoodStateSchema,
  secondsIdle: z.number().min(0),
});

export const ActionRequestSchema = z.object({
  traits: PetTraitsSchema,
  snapshot: PetSnapshotSchema,
  recent: z.array(PetEventSchema),
});

export const ActionResponseSchema = z.object({
  animation: ClipNameSchema,
  intensity: z.number().min(0).max(1),
  thought: z.string().max(80).optional(),
});

export const SpriteResponseSchema = z.object({
  sprites: z.record(z.string(), z.string()),
  rig: RigSchema,
  traits: PetTraitsSchema,
});

export const SpriteRequestSchema = z.object({
  traits: PetTraitsSchema,
});
