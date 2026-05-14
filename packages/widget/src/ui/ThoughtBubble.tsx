import { type Accessor, Show, createEffect, createSignal, onCleanup } from 'solid-js';

interface Props {
  // Latest thought + a monotonic timestamp; setting both with a new ts triggers display.
  thought: Accessor<{ text: string; ts: number } | null>;
}

const SHOW_MS = 3200;

export default function ThoughtBubble(props: Props) {
  const [visible, setVisible] = createSignal(false);
  const [text, setText] = createSignal('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const t = props.thought();
    if (!t) return;
    setText(t.text);
    setVisible(true);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setVisible(false), SHOW_MS);
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });

  return (
    <Show when={visible()}>
      <div class="thought-bubble">{text()}</div>
    </Show>
  );
}
