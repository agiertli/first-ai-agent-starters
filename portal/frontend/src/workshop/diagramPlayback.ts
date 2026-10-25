export const DIAGRAM_EVENT_TYPES = new Set([
  'thinking', 'tool', 'tool_executing', 'result', 'tool_denied',
  'context_updated', 'answer', 'error', 'stopped',
]);

export interface PlaybackState { index: number; playing: boolean }
export interface PlaybackAction {
  type: 'tick' | 'previous' | 'next' | 'play' | 'pause' | 'replay' | 'select';
  count: number;
  index?: number;
}
export const initialPlayback: PlaybackState = { index: 0, playing: true };

/** Advance through received events one at a time, even when SSE batches them. */
export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  const last = Math.max(0, action.count - 1);
  switch (action.type) {
    case 'tick':
      return state.playing && state.index < last ? { ...state, index: state.index + 1 } : state;
    case 'previous':
      return { index: Math.max(0, state.index - 1), playing: false };
    case 'next':
      return { index: Math.min(last, state.index + 1), playing: false };
    case 'play':
      return { ...state, playing: true };
    case 'pause':
      return { ...state, playing: false };
    case 'select':
      return { index: Math.max(0, Math.min(last, action.index ?? 0)), playing: false };
    case 'replay':
      return initialPlayback;
  }
}
