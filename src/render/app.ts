import { Application, Container, TextureSource } from 'pixi.js';
import { type ArtStyle, STYLES } from '../lib/style';
import type { Rig } from '../lib/types';
import { type RigInstance, mountRig } from './rig';

export interface PetApp {
  app: Application;
  stage: Container;
  petStage: Container;
  rig: RigInstance;
}

export async function createPetApp(
  parent: HTMLElement,
  rig: Rig,
  sprites: Record<string, string>,
  style: ArtStyle,
): Promise<PetApp> {
  const cfg = STYLES[style];
  TextureSource.defaultOptions.scaleMode = cfg.scaleMode;

  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: !cfg.pixelated,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    resizeTo: parent,
  });
  app.canvas.style.imageRendering = cfg.pixelated ? 'pixelated' : 'auto';
  parent.appendChild(app.canvas);

  const petStage = new Container();
  petStage.scale.set(cfg.baseScale);
  app.stage.addChild(petStage);

  const center = () => {
    petStage.x = app.screen.width / 2;
    petStage.y = app.screen.height * 0.7;
  };
  center();
  app.renderer.on('resize', center);

  const instance = await mountRig(rig, sprites, cfg.clipScaleFactor);
  petStage.addChild(instance.root);

  return { app, stage: app.stage, petStage, rig: instance };
}
