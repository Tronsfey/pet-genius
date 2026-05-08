import { onCleanup, onMount } from 'solid-js';
import type { PetState } from '../lib/types';
import { createPetApp } from '../render/app';
import { sampleClipAt } from '../render/clip';
import { applyPose } from '../render/rig';
import type { FsmState } from '../world/fsm';
import { tickWorld } from '../world/tick';

interface Props {
  state: PetState;
  fsm: FsmState;
}

export default function PetCanvas(props: Props) {
  let host!: HTMLDivElement;

  onMount(async () => {
    const pet = await createPetApp(
      host,
      props.state.rig,
      props.state.sprites,
      props.state.traits.style,
    );
    let last = performance.now();
    const ticker = (now: number) => {
      const dtMs = now - last;
      last = now;
      tickWorld(props.state, props.fsm, props.state.rig, dtMs, now);
      const tSec = (now - props.fsm.startedAt) / 1000;
      const pose = sampleClipAt(props.fsm.current, tSec);
      applyPose(pet.rig, pose);
    };
    pet.app.ticker.add(() => ticker(performance.now()));

    const onVisibility = () => {
      if (document.hidden) pet.app.ticker.stop();
      else pet.app.ticker.start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    onCleanup(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      pet.app.destroy(true, { children: true });
    });
  });

  return <div class="pet-canvas-host" ref={host} />;
}
