import { midiToFreq } from '../theory/notes';
import { audioContext } from './context';

const pluckCache = new Map<string, AudioBuffer>();

/**
 * A plucked-string tone (Karplus-Strong). The delay line uses a fractional
 * length so every note stays in tune to within a cent, high notes included.
 */
export function renderPluck(sampleRate: number, midi: number, seconds = 2.4, brightness = 0.5): Float32Array<ArrayBuffer> {
  const freq = midiToFreq(midi);
  const n = Math.floor(seconds * sampleRate);
  const out = new Float32Array(n);
  // The two-point average adds half a sample of delay.
  const delay = sampleRate / freq - 0.5;
  const whole = Math.floor(delay);
  const frac = delay - whole;
  const size = whole + 2;
  const line = new Float32Array(size);
  let seed = midi * 9301 + 49297;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let prev = 0;
  for (let i = 0; i < size; i++) {
    // Low-passed noise burst: a softer, rounder pick attack.
    const white = rand() * 2 - 1;
    prev = prev + brightness * (white - prev);
    line[i] = prev;
  }
  let mean = 0;
  for (let i = 0; i < size; i++) mean += line[i];
  mean /= size;
  for (let i = 0; i < size; i++) line[i] -= mean;
  const decay = Math.pow(0.5, 1 / (freq * Math.max(0.6, 2.2 - (midi - 40) / 40)));
  let w = 0;
  let last = 0;
  // DC blocker: the averaging loop keeps any offset forever, which causes clicks.
  let xPrev = 0;
  let yPrev = 0;
  for (let i = 0; i < n; i++) {
    const r1 = (w - whole + size) % size;
    const r2 = (r1 - 1 + size) % size;
    const delayed = line[r1] * (1 - frac) + line[r2] * frac;
    const y = 0.5 * (delayed + last) * decay;
    last = delayed;
    line[w] = y;
    yPrev = y - xPrev + 0.995 * yPrev;
    xPrev = y;
    out[i] = yPrev;
    w = (w + 1) % size;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < n; i++) out[i] /= peak;
  return out;
}

function pluckBuffer(ctx: BaseAudioContext, midi: number): AudioBuffer {
  const key = `${ctx.sampleRate}:${midi}`;
  let buf = pluckCache.get(key);
  if (!buf) {
    const data = renderPluck(ctx.sampleRate, midi);
    buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buf.copyToChannel(data, 0);
    pluckCache.set(key, buf);
  }
  return buf;
}

let master: GainNode | null = null;
const live = new Set<AudioScheduledSourceNode>();

function out(ctx: AudioContext): GainNode {
  if (!master || master.context !== ctx) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
  }
  return master;
}

function track(node: AudioScheduledSourceNode) {
  live.add(node);
  node.onended = () => live.delete(node);
}

export function pluck(midi: number, when = 0, gain = 0.5, length = 2.2): void {
  const ctx = audioContext();
  const src = ctx.createBufferSource();
  src.buffer = pluckBuffer(ctx, midi);
  const g = ctx.createGain();
  const t = Math.max(ctx.currentTime, when || ctx.currentTime);
  g.gain.setValueAtTime(gain, t);
  g.gain.setTargetAtTime(0, t + length, 0.08);
  src.connect(g).connect(out(ctx));
  src.start(t);
  src.stop(t + length + 0.5);
  track(src);
}

/** Strum a chord low string to high, like a guitar downstroke. */
export function strum(midis: number[], when = 0, spread = 0.028, gain = 0.32): number {
  const ctx = audioContext();
  const t0 = Math.max(ctx.currentTime + 0.02, when);
  [...midis].sort((a, b) => a - b).forEach((m, i) => pluck(m, t0 + i * spread, gain));
  return t0;
}

/** Play notes one after another; returns the time the last note starts. */
export function playSequence(midis: number[], step = 0.42, when = 0): number {
  const ctx = audioContext();
  const t0 = Math.max(ctx.currentTime + 0.03, when);
  midis.forEach((m, i) => pluck(m, t0 + i * step, 0.55, step * 2.5));
  return t0 + (midis.length - 1) * step;
}

/**
 * A steady, soft reference tone to sing against: pure enough to match,
 * with a little warmth so it is pleasant to hear repeatedly.
 */
export function hum(midi: number, seconds = 0.9, when = 0, gain = 0.28): { start: number; end: number } {
  const ctx = audioContext();
  const t = Math.max(ctx.currentTime + 0.02, when);
  const f = midiToFreq(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.04);
  g.gain.setValueAtTime(gain, t + seconds - 0.15);
  g.gain.linearRampToValueAtTime(0, t + seconds);
  g.connect(out(ctx));
  const partials: [number, number][] = [
    [1, 1],
    [2, 0.28],
    [3, 0.1],
  ];
  for (const [h, a] of partials) {
    const osc = ctx.createOscillator();
    osc.frequency.value = f * h;
    const pg = ctx.createGain();
    pg.gain.value = a;
    osc.connect(pg).connect(g);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
    track(osc);
  }
  return { start: t, end: t + seconds };
}

export function stopAll(): void {
  for (const n of live) {
    try {
      n.stop();
    } catch {
      // Already stopped.
    }
  }
  live.clear();
}
