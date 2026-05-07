import { Assets, Container, Sprite } from 'pixi.js';
import type { Bone, BoneName, Pose, Rig } from '../lib/types';

export interface RigInstance {
  root: Container;
  bones: Map<BoneName, { container: Container; bone: Bone }>;
}

export async function mountRig(rig: Rig, sprites: Record<string, string>): Promise<RigInstance> {
  const containers = new Map<BoneName, { container: Container; bone: Bone }>();

  for (const bone of rig.bones) {
    const c = new Container();
    c.label = bone.name;
    const url = sprites[bone.spriteId];
    if (!url) throw new Error(`mountRig: missing sprite for spriteId=${bone.spriteId}`);
    const tex = await Assets.load(url);
    const sp = new Sprite(tex);
    sp.x = -bone.pivot.x;
    sp.y = -bone.pivot.y;
    c.addChild(sp);
    containers.set(bone.name, { container: c, bone });
  }

  // Sort bones by z so the parent-add order matches draw order.
  const sorted = [...rig.bones].sort((a, b) => a.z - b.z);

  const root = new Container();
  for (const bone of sorted) {
    const entry = containers.get(bone.name)!;
    if (bone.parent === null) {
      entry.container.position.set(bone.attach.x, bone.attach.y);
      root.addChild(entry.container);
    } else {
      const parent = containers.get(bone.parent);
      if (!parent) throw new Error(`mountRig: parent bone not found: ${bone.parent}`);
      entry.container.position.set(bone.attach.x, bone.attach.y);
      parent.container.addChild(entry.container);
    }
  }

  return { root, bones: containers };
}

export function applyPose(instance: RigInstance, pose: Pose): void {
  for (const [name, entry] of instance.bones) {
    const part = pose[name];
    const baseX = entry.bone.attach.x;
    const baseY = entry.bone.attach.y;
    if (!part) {
      entry.container.position.set(baseX, baseY);
      entry.container.rotation = 0;
      entry.container.scale.set(1);
      continue;
    }
    entry.container.position.set(baseX + (part.x ?? 0), baseY + (part.y ?? 0));
    entry.container.rotation = part.rot ?? 0;
    entry.container.scale.set(part.scale ?? 1);
  }
}
