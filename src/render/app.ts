import { Application, Container, TextureSource } from 'pixi.js';
import type { Rig } from '../lib/types';
import { type RigInstance, mountRig } from './rig';

export interface PetApp {
  app: Application;
  stage: Container;
  petStage: Container;
  rig: RigInstance;
}

const PET_SCALE = 4;

export async function createPetApp(
  parent: HTMLElement,
  rig: Rig,
  sprites: Record<string, string>,
): Promise<PetApp> {
  TextureSource.defaultOptions.scaleMode = 'nearest';

  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    resizeTo: parent,
  });
  app.canvas.style.imageRendering = 'pixelated';
  parent.appendChild(app.canvas);

  const petStage = new Container();
  petStage.scale.set(PET_SCALE);
  app.stage.addChild(petStage);

  const center = () => {
    petStage.x = app.screen.width / 2;
    petStage.y = app.screen.height * 0.7;
  };
  center();
  app.renderer.on('resize', center);

  const instance = await mountRig(rig, sprites);
  petStage.addChild(instance.root);

  return { app, stage: app.stage, petStage, rig: instance };
}
