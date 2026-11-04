export interface MidiConnectionState {
  phase: 'connecting' | 'connected' | 'disconnected' | 'denied';
  inputCount: number;
}

function watchInputs(access: MIDIAccess, onNote: (note: number) => void, onCount: (count: number) => void) {
  const bound = new Set<MIDIInput>();
  let active = true;
  const onMessage = (event: MIDIMessageEvent) => {
    if (!active || !bound.has(event.target as MIDIInput)) return;
    const data = event.data;
    if (data && data.length >= 3 && (data[0] & 0xf0) === 0x90 && data[1] < 128 && data[2] > 0 && data[2] < 128)
      onNote(data[1]);
  };
  const sync = () => {
    if (!active) return;
    const connected = new Set([...access.inputs.values()].filter(input => input.state === 'connected'));
    for (const input of bound) {
      if (!connected.has(input)) {
        input.removeEventListener('midimessage', onMessage);
        bound.delete(input);
      }
    }
    for (const input of connected) {
      if (!bound.has(input)) {
        bound.add(input);
        input.addEventListener('midimessage', onMessage);
      }
    }
    onCount(bound.size);
  };
  const stop = () => {
    active = false;
    access.removeEventListener('statechange', sync);
    bound.forEach(input => input.removeEventListener('midimessage', onMessage));
    bound.clear();
  };
  access.addEventListener('statechange', sync);
  try {
    sync();
  } catch (error) {
    stop();
    throw error;
  }
  return stop;
}

// A disposed page must never attach listeners when an outstanding permission request resolves.
export function createMidiConnection(
  requestAccess: () => Promise<MIDIAccess>,
  onNote: (note: number) => void,
  onState: (state: MidiConnectionState) => void,
) {
  let disposed = false;
  let requesting = false;
  let stop: (() => void) | undefined;
  return {
    async toggle() {
      if (disposed || requesting) return;
      if (stop) {
        stop();
        stop = undefined;
        onState({ phase: 'disconnected', inputCount: 0 });
        return;
      }
      requesting = true;
      onState({ phase: 'connecting', inputCount: 0 });
      try {
        const access = await requestAccess();
        if (disposed) return;
        stop = watchInputs(access, onNote, inputCount => onState({ phase: 'connected', inputCount }));
      } catch {
        if (!disposed) onState({ phase: 'denied', inputCount: 0 });
      } finally {
        requesting = false;
      }
    },
    dispose() {
      disposed = true;
      stop?.();
      stop = undefined;
    },
  };
}
