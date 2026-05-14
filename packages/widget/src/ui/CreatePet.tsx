import { type ArtStyle, type PetState, type PetTraits, STYLES } from '@pet-genius/shared';
import { For, createSignal } from 'solid-js';
import type { ApiClient } from '../ai/client';

interface Props {
  client: ApiClient;
  onCreated: (pet: PetState) => void;
}

const PRESETS: { label: string; traits: PetTraits }[] = [
  {
    label: '橙小狐',
    traits: {
      name: 'Mango',
      palette: 'warm orange and cream',
      vibe: 'shy bookworm, curious',
      speciesHint: 'small fox cub',
      style: 'pixel',
    },
  },
  {
    label: '青年小龙',
    traits: {
      name: '小翠',
      palette: 'mint green with pale belly',
      vibe: 'mischievous troublemaker',
      speciesHint: 'baby dragon',
      style: 'flat',
    },
  },
  {
    label: '云朵团子',
    traits: {
      name: '团团',
      palette: 'soft cloud-white with pink cheeks',
      vibe: 'sleepy and gentle',
      speciesHint: 'round slime cat',
      style: 'watercolor',
    },
  },
];

const STYLE_ORDER: ArtStyle[] = ['pixel', 'flat', 'watercolor', 'storybook'];

function newPetId(): string {
  return crypto.randomUUID();
}

export default function CreatePet(props: Props) {
  const [name, setName] = createSignal('Mango');
  const [palette, setPalette] = createSignal('warm orange and cream');
  const [vibe, setVibe] = createSignal('shy bookworm, curious');
  const [species, setSpecies] = createSignal('small fox cub');
  const [style, setStyle] = createSignal<ArtStyle>('pixel');
  const [busy, setBusy] = createSignal(false);
  const [err, setErr] = createSignal<string | null>(null);

  const applyPreset = (t: PetTraits) => {
    setName(t.name);
    setPalette(t.palette);
    setVibe(t.vibe);
    setSpecies(t.speciesHint);
    setStyle(t.style);
  };

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (busy()) return;
    setErr(null);
    setBusy(true);
    try {
      const requested: PetTraits = {
        name: name().trim(),
        palette: palette().trim(),
        vibe: vibe().trim(),
        speciesHint: species().trim(),
        style: style(),
      };
      const { sprites, rig, traits: actual } = await props.client.generateSprite(requested);
      const fresh: PetState = {
        version: 3,
        id: newPetId(),
        createdAt: Date.now(),
        traits: actual,
        rig,
        sprites,
        needs: { hunger: 0.4, energy: 0.7, cleanliness: 0.7, affection: 0.5 },
        mood: 'idle',
        events: [],
      };
      props.onCreated(fresh);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
      setBusy(false);
    }
  };

  return (
    <div class="create-pet">
      <form class="create-pet-card" onSubmit={submit}>
        <h2>召唤一只属于你的宠物精灵</h2>
        <p class="hint">这些特征会喂给图像模型，决定它的样子和性格。生成完之后不可修改。</p>

        <div class="presets">
          <For each={PRESETS}>
            {(p) => (
              <button
                type="button"
                class="preset"
                onClick={() => applyPreset(p.traits)}
                disabled={busy()}
              >
                {p.label}
              </button>
            )}
          </For>
        </div>

        <label>
          <span>名字</span>
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            disabled={busy()}
            maxLength={40}
            required
          />
        </label>

        <label>
          <span>外观 / 配色</span>
          <input
            type="text"
            value={palette()}
            onInput={(e) => setPalette(e.currentTarget.value)}
            disabled={busy()}
            maxLength={80}
            placeholder="warm orange / soft pink / icy blue …"
            required
          />
        </label>

        <label>
          <span>性格</span>
          <input
            type="text"
            value={vibe()}
            onInput={(e) => setVibe(e.currentTarget.value)}
            disabled={busy()}
            maxLength={120}
            placeholder="shy bookworm / mischievous / sleepy …"
            required
          />
        </label>

        <label>
          <span>物种线索</span>
          <input
            type="text"
            value={species()}
            onInput={(e) => setSpecies(e.currentTarget.value)}
            disabled={busy()}
            maxLength={80}
            placeholder="small fox cub / baby dragon / round slime …"
            required
          />
        </label>

        <div class="field">
          <span class="field-label">画风</span>
          <div class="style-picker">
            <For each={STYLE_ORDER}>
              {(s) => (
                <button
                  type="button"
                  class="style-chip"
                  classList={{ active: style() === s }}
                  onClick={() => setStyle(s)}
                  disabled={busy()}
                >
                  {STYLES[s].label}
                </button>
              )}
            </For>
          </div>
        </div>

        {err() && <div class="form-err">⚠ {err()}</div>}

        <button type="submit" class="summon" disabled={busy()}>
          {busy() ? '正在召唤…' : '召唤'}
        </button>
      </form>
    </div>
  );
}
