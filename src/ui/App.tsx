import { Show, createSignal } from 'solid-js';
import { generateSprite } from '../ai/client';
import type { ChatMessage, PetState } from '../lib/types';
import { LocalStoragePetStore } from '../pet/local-store';
import { dispatch } from '../world/actions';
import { type FsmState, createFsm } from '../world/fsm';
import ChatPanel from './ChatPanel';
import PetCanvas from './PetCanvas';

const DEFAULT_TRAITS = {
  name: 'Mango',
  palette: 'warm orange',
  vibe: 'shy bookworm',
  speciesHint: 'small fox',
};

const STORE = new LocalStoragePetStore();
const PET_ID = 'default';

function newPetId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [state, setState] = createSignal<PetState | null>(null);
  const [fsm, setFsm] = createSignal<FsmState | null>(null);
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  const [bootErr, setBootErr] = createSignal<string | null>(null);

  const boot = async () => {
    try {
      const existing = await STORE.load(PET_ID);
      if (existing) {
        setState(existing);
        setFsm(createFsm(existing.rig, performance.now()));
        setMessages(existing.chatLog);
        return;
      }
      const { sprites, rig } = await generateSprite(DEFAULT_TRAITS);
      const fresh: PetState = {
        version: 1,
        id: newPetId(),
        createdAt: Date.now(),
        traits: DEFAULT_TRAITS,
        rig,
        sprites,
        needs: { hunger: 0.4, energy: 0.7, cleanliness: 0.7, affection: 0.5 },
        mood: 'idle',
        chatLog: [],
      };
      await STORE.save(PET_ID, fresh);
      setState(fresh);
      setFsm(createFsm(fresh.rig, performance.now()));
      setMessages([]);
    } catch (e) {
      setBootErr(e instanceof Error ? e.message : String(e));
    }
  };

  boot();

  const onFeed = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'feed' }, s, f, s.rig, performance.now());
  };
  const onPet = () => {
    const s = state();
    const f = fsm();
    if (!s || !f) return;
    dispatch({ kind: 'pet' }, s, f, s.rig, performance.now());
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
          <button type="button" onClick={reset} class="btn-ghost">
            reset
          </button>
        </div>
      </header>

      <main class="app-main">
        <Show
          when={state() && fsm()}
          fallback={
            <div class="loading">
              {bootErr() ? <span class="err">⚠ {bootErr()}</span> : 'summoning your pet…'}
            </div>
          }
        >
          <section class="stage">
            <PetCanvas state={state()!} fsm={fsm()!} />
            <div class="stage-actions">
              <button type="button" onClick={onPet}>
                pet
              </button>
              <button type="button" onClick={onFeed}>
                feed
              </button>
            </div>
          </section>
          <aside class="side">
            <ChatPanel
              state={state()!}
              fsm={fsm()!}
              messages={messages}
              setMessages={setMessages}
            />
          </aside>
        </Show>
      </main>
    </div>
  );
}
