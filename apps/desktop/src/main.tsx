import { summonPet } from '@pet-genius/widget';
import '@pet-genius/widget/styles.css';

// The Tauri shell window is transparent + always-on-top + frameless (see
// src-tauri/tauri.conf.json). We mount the pet into a host that fills the
// whole window so the user can drag it anywhere on screen.

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

root.style.position = 'fixed';
root.style.inset = '0';
root.style.pointerEvents = 'none';

const host = document.createElement('div');
host.id = 'pet-mount';
host.style.position = 'absolute';
host.style.inset = '0';
root.appendChild(host);

const pet = summonPet({
  host,
  // Tauri rewrites localhost:3000 via the Vite proxy in dev; in a packaged
  // build, the user runs the demo server (or any pet-genius server) on the
  // same machine.
  apiBase: 'http://localhost:3000',
});

pet.onThought((text) => console.log('[pet] thought:', text));
