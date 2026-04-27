/**
 * shared-singleton.ts
 *
 * Shared module-level AudioContext singleton and guitar pluck synthesis,
 * exported for use by both useChordAudio and useScalePatternAudio.
 * Ensures a maximum of ONE AudioContext exists at any time in the tab,
 * which is critical for iOS Safari's concurrent-context limit.
 */

// ─── Guitar string frequencies ───────────────────────────────────────────────
// string 0 = high e (E4), string 5 = low E (E2)
export const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
export const SEMITONE_RATIO = Math.pow(2, 1 / 12);

export function getNoteFrequency(stringIndex: number, fret: number): number {
  return STRING_FREQUENCIES[stringIndex] * Math.pow(SEMITONE_RATIO, fret);
}

// ─── Singleton state ─────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
let _ctxCreatedAt = 0;
const CONTEXT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export function getSingletonContext(): AudioContext | null {
  if (!_ctx) return null;
  if (_ctx.state === 'closed') { _ctx = null; return null; }
  if (Date.now() - _ctxCreatedAt > CONTEXT_MAX_AGE_MS) {
    _ctx.close().catch(() => {});
    _ctx = null;
    return null;
  }
  return _ctx; // may be 'running' or 'suspended'
}

/** Must be called synchronously inside a user gesture on iOS. */
export function createSingletonContext(): AudioContext {
  const old = _ctx;
  _ctx = null;
  if (old && old.state !== 'closed') old.close().catch(() => {});
  const ctx = new AudioContext();
  _ctx = ctx;
  _ctxCreatedAt = Date.now();
  return ctx;
}

export function getOrCreateContext(): AudioContext {
  const existing = getSingletonContext();
  if (existing && existing.state === 'running') return existing;
  return createSingletonContext();
}

export function markContextStaleOnWake(): void {
  if (_ctx && _ctx.state !== 'running') {
    const stale = _ctx;
    _ctx = null;
    _ctxCreatedAt = 0;
    stale.close().catch(() => {});
  }
}

// ─── Guitar pluck synthesis ──────────────────────────────────────────────────

export function createPluck(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  outputNode: AudioNode,
): OscillatorNode[] {
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(frequency, startTime);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, startTime);

  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 0.5, startTime);

  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(volume * 0.45, startTime + 0.008);
  mainGain.gain.exponentialRampToValueAtTime(volume * 0.18, startTime + 0.12);
  mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0, startTime);
  harmonicGain.gain.linearRampToValueAtTime(volume * 0.08, startTime + 0.005);
  harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0, startTime);
  subGain.gain.linearRampToValueAtTime(volume * 0.12, startTime + 0.01);
  subGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 6, 5000), startTime);
  filter.frequency.exponentialRampToValueAtTime(
    Math.min(frequency * 2, 2000),
    startTime + duration * 0.4,
  );
  filter.Q.setValueAtTime(1.2, startTime);

  osc1.connect(mainGain);
  osc2.connect(harmonicGain);
  osc3.connect(subGain);
  mainGain.connect(filter);
  harmonicGain.connect(filter);
  subGain.connect(filter);
  filter.connect(outputNode);

  osc1.start(startTime); osc2.start(startTime); osc3.start(startTime);
  osc1.stop(startTime + duration + 0.05);
  osc2.stop(startTime + duration + 0.05);
  osc3.stop(startTime + duration + 0.05);

  return [osc1, osc2, osc3];
}
