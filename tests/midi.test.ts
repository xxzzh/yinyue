import test from 'node:test';
import assert from 'node:assert/strict';
import { createMidiConnection } from '../src/midi.ts';
import type { MidiConnectionState } from '../src/midi.ts';

class TrackedTarget extends EventTarget {
  added = 0;
  removed = 0;
  override addEventListener(...args: Parameters<EventTarget['addEventListener']>) {
    this.added++;
    super.addEventListener(...args);
  }
  override removeEventListener(...args: Parameters<EventTarget['removeEventListener']>) {
    this.removed++;
    super.removeEventListener(...args);
  }
}
class Input extends TrackedTarget {
  state = 'connected';
  send(...data: number[]) {
    this.dispatchEvent(Object.assign(new Event('midimessage'), { data: new Uint8Array(data) }));
  }
}
class Access extends TrackedTarget {
  inputs = new Map<string, Input>();
  change() {
    this.dispatchEvent(new Event('statechange'));
  }
}
const asAccess = (access: Access) => access as unknown as MIDIAccess;

test('one pending MIDI permission request is shared and cannot attach listeners after disposal', async () => {
  const access = new Access();
  const input = new Input();
  access.inputs.set('keyboard', input);
  let grant!: (access: MIDIAccess) => void;
  let requests = 0;
  const states: MidiConnectionState[] = [];
  const notes: number[] = [];
  const connection = createMidiConnection(
    () => {
      requests++;
      return new Promise(resolve => (grant = resolve));
    },
    note => notes.push(note),
    state => states.push(state),
  );
  const pending = connection.toggle();
  await connection.toggle();
  assert.equal(requests, 1);
  connection.dispose();
  grant(asAccess(access));
  await pending;
  input.send(0x90, 60, 100);
  assert.deepEqual(states, [{ phase: 'connecting', inputCount: 0 }]);
  assert.deepEqual(notes, []);
  assert.equal(access.added, 0);
  assert.equal(input.added, 0);
});

test('MIDI hotplug detaches removed ports, counts connected ports and preserves other listeners', async () => {
  const access = new Access();
  const first = new Input();
  const second = new Input();
  access.inputs.set('first', first);
  const notes: number[] = [];
  const states: MidiConnectionState[] = [];
  let otherMessages = 0;
  first.addEventListener('midimessage', () => otherMessages++);
  const connection = createMidiConnection(
    async () => asAccess(access),
    note => notes.push(note),
    state => states.push(state),
  );
  await connection.toggle();
  first.send(0x90, 60, 100);
  access.inputs.delete('first');
  access.inputs.set('second', second);
  access.change();
  first.send(0x90, 61, 100);
  second.send(0x90, 62, 100);
  assert.deepEqual(notes, [60, 62]);
  assert.equal(first.removed, 1);
  second.state = 'disconnected';
  access.change();
  assert.deepEqual(states.at(-1), { phase: 'connected', inputCount: 0 });
  second.send(0x90, 63, 100);
  assert.deepEqual(notes, [60, 62]);
  second.state = 'connected';
  access.change();
  access.change();
  second.send(0x90, 64, 100);
  assert.deepEqual(notes, [60, 62, 64]);
  connection.dispose();
  first.send(0x90, 65, 100);
  second.send(0x90, 66, 100);
  access.change();
  assert.equal(otherMessages, 3);
  assert.deepEqual(notes, [60, 62, 64]);
  assert.equal(second.added, second.removed);
  assert.equal(access.added, access.removed);
});

test('MIDI accepts repeated note-ons on every channel and ignores release, control and malformed messages', async () => {
  const access = new Access();
  const input = new Input();
  access.inputs.set('keyboard', input);
  const notes: number[] = [];
  const connection = createMidiConnection(
    async () => asAccess(access),
    note => notes.push(note),
    () => {},
  );
  await connection.toggle();
  for (let channel = 0; channel < 16; channel++) input.send(0x90 + channel, 60, 100);
  assert.deepEqual(notes, Array(16).fill(60));
  for (const data of [[], [0x90], [0x90, 60], [0x90, 60, 0], [0x80, 60, 80], [0xb0, 64, 127], [0x90, 128, 80]])
    input.send(...data);
  assert.equal(notes.length, 16);
  await connection.toggle();
  input.send(0x90, 60, 100);
  assert.equal(notes.length, 16);
  await connection.toggle();
  input.send(0x90, 60, 100);
  assert.equal(notes.length, 17);
  connection.dispose();
});

test('denied MIDI access can be retried, and rejection after disposal does not update the old page', async () => {
  const access = new Access();
  let requests = 0;
  const states: MidiConnectionState[] = [];
  const connection = createMidiConnection(
    async () => {
      if (++requests === 1) throw new Error('Permission denied');
      return asAccess(access);
    },
    () => {},
    state => states.push(state),
  );
  await connection.toggle();
  assert.deepEqual(states.at(-1), { phase: 'denied', inputCount: 0 });
  await connection.toggle();
  assert.deepEqual(states.at(-1), { phase: 'connected', inputCount: 0 });
  connection.dispose();
  let reject!: (error: Error) => void;
  const lateStates: MidiConnectionState[] = [];
  const late = createMidiConnection(
    () => new Promise((_resolve, rejectRequest) => (reject = rejectRequest)),
    () => {},
    state => lateStates.push(state),
  );
  const pending = late.toggle();
  late.dispose();
  reject(new Error('Permission denied'));
  await pending;
  assert.deepEqual(lateStates, [{ phase: 'connecting', inputCount: 0 }]);
});
