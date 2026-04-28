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

/**
 * Karplus-Strong physical string model.
 *
 * Algorithm:
 *   1. Fill a 1-period buffer with white noise  → the "pick" transient
 *   2. Feed into a DelayNode (delay = 1/freq)   → sets the fundamental pitch
 *   3. Low-pass BiquadFilter + feedback GainNode → each cycle absorbs highs,
 *      creating the bright-to-warm decay of a real guitar string
 *   4. Output GainNode shapes the overall amplitude envelope
 *
 * Only called from useScalePatternAudio — createPluck (chord audio) is untouched.
 *
 * @returns AudioBufferSourceNode[] — compatible with existing activeOscsRef cleanup
 */
export function createKarplusPluck(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  outputNode: AudioNode,
): AudioBufferSourceNode[] {
  const sampleRate = ctx.sampleRate;

  // ── 1. Noise excitation buffer (one period of white noise) ───────────────
  // Length = one period at the target frequency so the delay loop reinforces
  // the fundamental without aliasing artefacts.
  const periodSamples = Math.max(2, Math.round(sampleRate / frequency));
  const noiseBuffer = ctx.createBuffer(1, periodSamples, sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < periodSamples; i++) {
    data[i] = (Math.random() * 2 - 1); // white noise [-1, 1]
  }

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = false; // fire once — the delay loop sustains the tone

  // ── 2. Delay line — sets fundamental pitch ───────────────────────────────
  const delayTime = 1 / frequency;
  const delay = ctx.createDelay(2); // max 2 s covers all guitar frequencies
  delay.delayTime.setValueAtTime(delayTime, startTime);

  // ── 3. Lowpass filter in the feedback path ───────────────────────────────
  // Each trip through the loop, the filter shaves high-frequency energy,
  // causing the tone to warm (brighten → mellow) like a real plucked string.
  // Cutoff is frequency-scaled: higher strings stay brighter longer.
  const feedFilter = ctx.createBiquadFilter();
  feedFilter.type = 'lowpass';
  // Higher cutoff = brighter attack; decays naturally via feedback loop damping
  const filterFreq = Math.min(frequency * 14, sampleRate * 0.45);
  feedFilter.frequency.setValueAtTime(filterFreq, startTime);
  feedFilter.Q.setValueAtTime(0.5, startTime);

  // Feedback gain < 1 controls decay rate.
  // 0.98 ≈ ~1.5 s sustain; lower values = shorter, more percussive decay.
  const feedGain = ctx.createGain();
  feedGain.gain.setValueAtTime(0.98, startTime);

  // ── 4. Output amplitude envelope ─────────────────────────────────────────
  const outGain = ctx.createGain();
  outGain.gain.setValueAtTime(0, startTime);
  // Fast attack — the noise burst gives the pick transient; we just unmute it
  outGain.gain.linearRampToValueAtTime(volume * 0.9, startTime + 0.004);
  // Let the Karplus loop handle the natural decay; fade only at note end
  outGain.gain.setValueAtTime(volume * 0.9, startTime + duration * 0.85);
  outGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.06);

  // ── 5. Wiring ─────────────────────────────────────────────────────────────
  // Signal path:  noiseSrc → delay → feedFilter → feedGain → delay (loop)
  //                                             ↓
  //                                          outGain → outputNode
  noiseSrc.connect(delay);
  delay.connect(feedFilter);
  feedFilter.connect(feedGain);
  feedGain.connect(delay);      // feedback loop closes here
  feedFilter.connect(outGain);  // tap after filter, before feedback gain
  outGain.connect(outputNode);

  // Fire the noise burst at startTime
  noiseSrc.start(startTime);
  noiseSrc.stop(startTime + duration + 0.1);

  return [noiseSrc];
}

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
