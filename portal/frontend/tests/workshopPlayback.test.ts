import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIAGRAM_EVENT_TYPES, initialPlayback, playbackReducer } from '../src/workshop/diagramPlayback.ts';

test('one SSE batch still displays execution and result before the final answer', () => {
  const batch = ['started', 'thinking', 'tool', 'tool_executing', 'result', 'context_updated', 'thinking', 'answer', 'done'];
  const trace = batch.filter(type => DIAGRAM_EVENT_TYPES.has(type));
  let state = initialPlayback;
  const displayed = [trace[state.index]];
  for (let i = 1; i < trace.length; i++) {
    state = playbackReducer(state, { type: 'tick', count: trace.length });
    displayed.push(trace[state.index]);
  }
  assert.deepEqual(displayed, ['thinking', 'tool', 'tool_executing', 'result', 'context_updated', 'thinking', 'answer']);
  assert.equal(playbackReducer(state, { type: 'tick', count: trace.length }), state);
});

test('waiting for later events never advances into an invented step', () => {
  let state = playbackReducer(initialPlayback, { type: 'tick', count: 0 });
  state = playbackReducer(state, { type: 'tick', count: 1 });
  assert.equal(state.index, 0);
  state = playbackReducer(state, { type: 'tick', count: 4 });
  assert.equal(state.index, 1);
});

test('manual review stays on the selected event as new events arrive; replay restarts', () => {
  let state = playbackReducer({index: 3, playing: true}, {type: 'previous', count: 4});
  state = playbackReducer(state, {type: 'tick', count: 7});
  assert.deepEqual(state, {index: 2, playing: false});
  state = playbackReducer(state, {type: 'play', count: 7});
  state = playbackReducer(state, {type: 'tick', count: 7});
  assert.equal(state.index, 3);
  assert.deepEqual(playbackReducer(state, {type: 'replay', count: 7}), initialPlayback);
});

test('denied tool requests remain denials; playback adds no execution or result', () => {
  const trace = ['thinking', 'tool', 'tool_denied', 'context_updated', 'answer'].filter(type => DIAGRAM_EVENT_TYPES.has(type));
  let state = initialPlayback;
  const displayed = [trace[state.index]];
  for (let i = 1; i < trace.length; i++) {
    state = playbackReducer(state, {type: 'tick', count: trace.length});
    displayed.push(trace[state.index]);
  }
  assert.deepEqual(displayed, trace);
  assert.ok(!displayed.includes('tool_executing'));
  assert.ok(!displayed.includes('result'));
});

test('pause freezes the displayed event even when the answer arrives; selecting a step keeps it paused', () => {
  let state = playbackReducer({index: 2, playing: true}, {type: 'pause', count: 3});
  state = playbackReducer(state, {type: 'tick', count: 7});
  assert.deepEqual(state, {index: 2, playing: false});
  state = playbackReducer(state, {type: 'select', index: 3, count: 7});
  assert.deepEqual(state, {index: 3, playing: false});
  assert.deepEqual(playbackReducer(state, {type: 'select', index: 99, count: 7}), {index: 6, playing: false});
  assert.deepEqual(playbackReducer(state, {type: 'replay', count: 0}), initialPlayback);
});
