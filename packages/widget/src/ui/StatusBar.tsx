import type { PetState } from '@pet-genius/shared';
import { type Accessor, For } from 'solid-js';

interface Props {
  state: Accessor<PetState>;
}

const ROWS: { key: keyof PetState['needs']; label: string; invert?: boolean; hue: string }[] = [
  // hunger: 0 = full → bar shown as 1 - hunger; bigger = better
  { key: 'hunger', label: 'satiety', invert: true, hue: '#ffb46b' },
  { key: 'energy', label: 'energy', hue: '#7ed1ff' },
  { key: 'cleanliness', label: 'clean', hue: '#a8e3a0' },
  { key: 'affection', label: 'love', hue: '#f08e9e' },
];

export default function StatusBar(props: Props) {
  return (
    <div class="status-bar">
      <For each={ROWS}>
        {(row) => {
          const v = () => {
            const raw = props.state().needs[row.key];
            return row.invert ? 1 - raw : raw;
          };
          return (
            <div class="status-row">
              <span class="status-label">{row.label}</span>
              <div class="status-track">
                <div
                  class="status-fill"
                  style={{ width: `${Math.round(v() * 100)}%`, background: row.hue }}
                />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
