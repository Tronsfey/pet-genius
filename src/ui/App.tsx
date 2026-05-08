import { Show, createSignal, onCleanup } from 'solid-js';
import type { PetState } from '../lib/types';
import { LocalStoragePetStore } from '../pet/local-store';
import { dispatch } from '../world/actions';
import { type AiLoopHandle, startAiLoop } from '../world/ai-loop';
import { type FsmState, createFsm } from '../world/fsm';
import CreatePet from './CreatePet';
import PetCanvas from './PetCanvas';
import StatusBar from './StatusBar';
import ThoughtBubble from './ThoughtBubble';

const STORE = new LocalStoragePetStore();
const PET_ID = 'default';

export default function App() {
  const [state, setState] = createSignal<PetState | null>(null);
  const [fsm, setFsm] = createSignal<FsmState | null>(null);
  const [thought, setThought] = createSignal<{ text: string; ts: number } | null>(null);
  const [bootErr, setBootErr] = createSignal<string | null>(null);

  let loopHandle: AiLoopHandle | null = null;

  const wireUpPet = (pet: PetState) => {
    const f = createFsm(pet.rig, performance.now());
    setState(pet);
    setFsm(f);
    if (loopHandle) loopHandle.stop();
    loopHandle = startAiLoop({
      state: pet,
      fsm: f,
      onThought: (text) => setThought({ text, ts: performance.now() }),
    });
  };

  const boot = async () => {
    try {
      const existing = await STORE.load(PET_ID);
      if (existing) wireUpPet(existing);
    } catch (e) {
      setBootErr(e instanceof Error ? e.message : String(e));
    }
  };
  boot();

  onCleanup(() => {
    if (loopHandle) loopHandle.stop();
  });

  const onCreated = async (pet: PetState) => {
    await STORE.save(PET_ID, pet);
    wireUpPet(pet);
  };

  const onFeed = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'feed' }, s, f, s.rig, performance.now());
    loopHandle?.pokeAfterUserAction();
  };
  const onPet = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'pet' }, s, f, s.rig, performance.now());
    loopHandle?.pokeAfterUserAction();
  };

  const reset = async () => {
    await STORE.delete(PET_ID);
    location.reload();
  };

  return (
    <div class="app">
      <header class="app-header">
        <h1>pet-genius</h1>
        <div class="header-right">
          <Show when={state()}>{(s) => <span class="trait-pill">{s().traits.name}</span>}</Show>
          <Show when={state()}>
            <button type="button" onClick={reset} class="btn-ghost">
              换一只
            </button>
          </Show>
        </div>
      </header>

      <main class="app-main">
        <Show
          when={state() && fsm()}
          fallback={
            bootErr() ? (
              <div class="loading">
                <span class="err">⚠ {bootErr()}</span>
              </div>
            ) : (
              <CreatePet onCreated={onCreated} />
            )
          }
        >
          <section class="stage">
            <div class="stage-canvas-wrap">
              <PetCanvas state={state()!} fsm={fsm()!} />
              <ThoughtBubble thought={thought} />
            </div>
            <StatusBar state={() => state()!} />
            <div class="stage-actions">
              <button type="button" onClick={onPet}>
                pet
              </button>
              <button type="button" onClick={onFeed}>
                feed
              </button>
            </div>
          </section>
        </Show>
      </main>
    </div>
  );
}
