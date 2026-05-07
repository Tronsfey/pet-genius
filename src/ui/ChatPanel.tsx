import { For, type Setter, createSignal } from 'solid-js';
import { chat } from '../ai/client';
import type { ChatMessage, PetState } from '../lib/types';
import { dispatch } from '../world/actions';
import type { FsmState } from '../world/fsm';

interface Props {
  state: PetState;
  fsm: FsmState;
  messages: () => ChatMessage[];
  setMessages: Setter<ChatMessage[]>;
}

export default function ChatPanel(props: Props) {
  const [text, setText] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [err, setErr] = createSignal<string | null>(null);

  const send = async () => {
    const t = text().trim();
    if (!t || busy()) return;
    setText('');
    setErr(null);
    setBusy(true);
    const now = performance.now();
    dispatch({ kind: 'talk', text: t }, props.state, props.fsm, props.state.rig, now);
    props.setMessages([...props.state.chatLog]);
    try {
      const reply = await chat(props.state.chatLog, props.state.traits);
      const now2 = performance.now();
      dispatch(
        { kind: 'chat-reply', reply: reply.reply, animationHint: reply.animationHint },
        props.state,
        props.fsm,
        props.state.rig,
        now2,
      );
      props.setMessages([...props.state.chatLog]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="chat-panel">
      <div class="chat-log">
        <For each={props.messages()}>
          {(m) => <div class={`bubble bubble-${m.role}`}>{m.text}</div>}
        </For>
        {err() && <div class="bubble bubble-err">⚠ {err()}</div>}
      </div>
      <form
        class="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          placeholder="跟它说点什么…"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          disabled={busy()}
        />
        <button type="submit" disabled={busy() || !text().trim()}>
          {busy() ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
