import { type SummonPetOptions, summonPet } from '@pet-genius/widget';
import '@pet-genius/widget/styles.css';
import './demo.css';
import { MockApiClient } from './mock-client';

// VITE_PET_MODE=static → keyless client-side mock (GitHub Pages build).
// Otherwise talk to the demo server on the same origin.
const STATIC = import.meta.env.VITE_PET_MODE === 'static';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

root.innerHTML = `
  <header class="demo-header">
    <h1>pet-genius</h1>
    <div class="demo-header-actions">
      ${STATIC ? '<span class="demo-badge">live demo · mock AI</span>' : ''}
      <button id="demo-reset" class="demo-ghost" type="button">换一只</button>
    </div>
  </header>
  <div class="demo-backdrop">
    <div class="demo-hint">把它拖到任何地方 · the pet floats wherever you put it</div>
  </div>
  <div id="pet-mount" class="demo-mount"></div>
`;

const opts: SummonPetOptions = STATIC
  ? { host: document.getElementById('pet-mount')!, apiClient: new MockApiClient() }
  : { host: document.getElementById('pet-mount')!, apiBase: window.location.origin };

const pet = summonPet(opts);

document.getElementById('demo-reset')!.addEventListener('click', async () => {
  await pet.reset();
  location.reload();
});

pet.onThought((text) => console.log('[pet] thought:', text));
pet.onAction((clip, intensity) => console.log('[pet] action:', clip, intensity));
