import FFT from 'fft.js';
import { mod12 } from '../theory/notes';
import { parseChord, type ParsedChord } from '../theory/chords';
import type { ChordEvent } from '../theory/chord-text';
import { estimateKeyFromAudio, type KeyEstimate } from '../theory/key-detect';
import { keyPcs, type MusicKey } from '../theory/keys';

export const ANALYSIS_RATE = 22050;

function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/** Magnitude spectra (bins 0..maxBin) for overlapping frames. */
function* stft(samples: Float32Array, size: number, hop: number, maxBin: number): Generator<Float32Array> {
  const fft = new FFT(size);
  const win = hann(size);
  const frame = new Array<number>(size).fill(0);
  const out = fft.createComplexArray() as number[];
  for (let start = 0; start + size <= samples.length; start += hop) {
    for (let i = 0; i < size; i++) frame[i] = samples[start + i] * win[i];
    fft.realTransform(out, frame);
    const mag = new Float32Array(maxBin + 1);
    for (let k = 0; k <= maxBin; k++) mag[k] = Math.hypot(out[2 * k], out[2 * k + 1]);
    yield mag;
  }
}

interface Peak {
  freq: number;
  amp: number;
}

function spectralPeaks(mag: Float32Array, binHz: number, minBin: number, maxPeaks = 60): Peak[] {
  let max = 0;
  for (let k = minBin; k < mag.length; k++) if (mag[k] > max) max = mag[k];
  if (max <= 1e-9) return [];
  const floor = max * 0.01;
  const peaks: Peak[] = [];
  for (let k = Math.max(minBin, 1); k < mag.length - 1; k++) {
    const m = mag[k];
    if (m < floor || m <= mag[k - 1] || m < mag[k + 1]) continue;
    // Parabolic interpolation on log magnitude for a precise frequency.
    const a = Math.log(mag[k - 1] + 1e-12);
    const b = Math.log(m + 1e-12);
    const c = Math.log(mag[k + 1] + 1e-12);
    const denom = a - 2 * b + c;
    const p = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
    peaks.push({ freq: (k + p) * binHz, amp: Math.exp(b - 0.25 * (a - c) * p) });
  }
  peaks.sort((x, y) => y.amp - x.amp);
  return peaks.slice(0, maxPeaks);
}

export interface Chromagram {
  /** One 12-bin pitch-class vector per frame, C = 0. */
  frames: Float32Array[];
  /** Frame energy (sum of peak amplitudes) for silence detection. */
  energy: number[];
  frameTime: number;
  hopTime: number;
  /** How far the recording's tuning sits from A = 440 Hz, in cents. */
  tuningCents: number;
}

export function computeChromagram(samples: Float32Array, rate = ANALYSIS_RATE, size = 8192, hop = 2048): Chromagram {
  const binHz = rate / size;
  const minFreq = 55;
  const maxFreq = 2000;
  const minBin = Math.floor(minFreq / binHz);
  const maxBin = Math.min(size / 2 - 1, Math.ceil(maxFreq / binHz));
  const allPeaks: Peak[][] = [];
  let sx = 0;
  let sy = 0;
  for (const mag of stft(samples, size, hop, maxBin)) {
    const peaks = spectralPeaks(mag, binHz, minBin);
    allPeaks.push(peaks);
    for (const p of peaks) {
      const midi = 69 + 12 * Math.log2(p.freq / 440);
      const angle = 2 * Math.PI * (midi - Math.round(midi));
      sx += p.amp * Math.cos(angle);
      sy += p.amp * Math.sin(angle);
    }
  }
  const tuningCents = (Math.atan2(sy, sx) / (2 * Math.PI)) * 100;
  const frames: Float32Array[] = [];
  const energy: number[] = [];
  for (const peaks of allPeaks) {
    const v = new Float32Array(12);
    let e = 0;
    for (const p of peaks) {
      const midi = 69 + 12 * Math.log2(p.freq / 440) - tuningCents / 100;
      const nearest = Math.round(midi);
      const d = midi - nearest;
      const w = Math.cos((Math.PI * d) / 1.33) ** 2;
      v[mod12(nearest)] += p.amp * w;
      e += p.amp;
    }
    frames.push(v);
    energy.push(e);
  }
  return { frames, energy, frameTime: size / rate, hopTime: hop / rate, tuningCents };
}

export function normalize(v: ArrayLike<number>): number[] {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const n = Math.sqrt(s) || 1;
  return Array.from(v, (x) => x / n);
}

/** Overall pitch-class profile, louder frames counting more. */
export function globalProfile(chroma: Chromagram): number[] {
  const sum = new Array(12).fill(0);
  chroma.frames.forEach((f, idx) => {
    const n = normalize(f);
    const loud = Math.sqrt(Math.max(0, chroma.energy[idx]));
    for (let i = 0; i < 12; i++) sum[i] += n[i] * loud;
  });
  return sum;
}

export interface Rhythm {
  bpm: number;
  /** 0..1 how clear the pulse is. */
  confidence: number;
  beats: number[];
  /** Onset strength at each beat, 0..1. */
  beatStrength: number[];
}

/** Onset strength: how much new energy appears in each short frame. */
export function onsetEnvelope(samples: Float32Array, rate = ANALYSIS_RATE, size = 1024, hop = 256): { env: Float32Array; hopTime: number } {
  const maxBin = Math.floor((size / 2) * (5000 / (rate / 2)));
  let prev: Float32Array | null = null;
  const values: number[] = [];
  for (const mag of stft(samples, size, hop, maxBin)) {
    const logMag = mag.map((m) => Math.log1p(100 * m));
    let flux = 0;
    if (prev) for (let k = 1; k < logMag.length; k++) flux += Math.max(0, logMag[k] - prev[k]);
    values.push(flux);
    prev = logMag;
  }
  const env = new Float32Array(values.length);
  const half = Math.round(0.25 / (hop / rate));
  for (let i = 0; i < values.length; i++) {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
      s += values[j];
      n++;
    }
    env[i] = Math.max(0, values[i] - s / n);
  }
  let max = 0;
  for (const v of env) if (v > max) max = v;
  if (max > 0) for (let i = 0; i < env.length; i++) env[i] /= max;
  return { env, hopTime: hop / rate };
}

export function estimateTempo(env: Float32Array, hopTime: number): { bpm: number; confidence: number } {
  const minBpm = 50;
  const maxBpm = 210;
  const minLag = Math.floor(60 / maxBpm / hopTime);
  const maxLag = Math.ceil(60 / minBpm / hopTime);
  const ac = new Float64Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let i = lag; i < env.length; i++) s += env[i] * env[i - lag];
    ac[lag] = s / (env.length - lag);
  }
  let best = minLag;
  let bestScore = -Infinity;
  let mean = 0;
  for (let lag = minLag; lag <= maxLag; lag++) mean += ac[lag];
  mean /= maxLag - minLag + 1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = 60 / (lag * hopTime);
    // Most music is felt near 100 BPM; prefer that octave when the pulse is ambiguous.
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 100) / 0.9) ** 2);
    // A real beat also shows up at twice its period.
    const harmonic = lag * 2 <= maxLag + 1 ? 0.5 * ac[lag * 2] : 0;
    const score = (ac[lag] + harmonic) * prior;
    if (score > bestScore) {
      bestScore = score;
      best = lag;
    }
  }
  const a = ac[best - 1] ?? ac[best];
  const b = ac[best];
  const c = ac[best + 1] ?? ac[best];
  const denom = a - 2 * b + c;
  const shift = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
  const lag = best + Math.max(-0.5, Math.min(0.5, shift));
  const confidence = mean > 0 ? Math.max(0, Math.min(1, (b / mean - 1) / 3)) : 0;
  return { bpm: 60 / (lag * hopTime), confidence };
}

/** Dynamic-programming beat tracker (Ellis 2007). */
export function trackBeats(env: Float32Array, hopTime: number, bpm: number, tightness = 100): number[] {
  const period = 60 / bpm / hopTime;
  const n = env.length;
  if (!n) return [];
  const score = new Float64Array(n);
  const back = new Int32Array(n).fill(-1);
  for (let t = 0; t < n; t++) {
    let best = 0;
    let bestIdx = -1;
    const from = Math.max(0, Math.round(t - 2 * period));
    const to = Math.round(t - period / 2);
    for (let tau = from; tau <= to; tau++) {
      const penalty = -tightness * Math.log((t - tau) / period) ** 2;
      const s = score[tau] + penalty;
      if (bestIdx < 0 || s > best) {
        best = s;
        bestIdx = tau;
      }
    }
    score[t] = env[t] + (bestIdx >= 0 ? best : 0);
    back[t] = bestIdx;
  }
  let last = n - 1;
  const tailStart = Math.max(0, Math.floor(n - period));
  for (let t = tailStart; t < n; t++) if (score[t] > score[last]) last = t;
  const beats: number[] = [];
  for (let t = last; t >= 0; t = back[t]) {
    beats.push(t * hopTime);
    if (back[t] < 0) break;
  }
  return beats.reverse();
}

export function analyzeRhythm(samples: Float32Array, rate = ANALYSIS_RATE): Rhythm {
  const { env, hopTime } = onsetEnvelope(samples, rate);
  const { bpm, confidence } = estimateTempo(env, hopTime);
  const beats = trackBeats(env, hopTime, bpm);
  const beatStrength = beats.map((t) => {
    const i = Math.round(t / hopTime);
    let m = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(env.length - 1, i + 2); j++) m = Math.max(m, env[j]);
    return m;
  });
  return { bpm, confidence, beats, beatStrength };
}

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

interface ChordTemplate {
  symbol: string;
  rootPc: number;
  minor: boolean;
  vec: number[];
}

/** Triad templates that include each tone's first overtones, so minor chords are not mistaken for major. */
const TEMPLATES: ChordTemplate[] = (() => {
  const out: ChordTemplate[] = [];
  for (const minor of [false, true]) {
    for (let r = 0; r < 12; r++) {
      const v = new Array(12).fill(0);
      for (const tone of [0, minor ? 3 : 4, 7]) {
        const pc = r + tone;
        v[mod12(pc)] += 1;
        v[mod12(pc + 7)] += 0.6 * 0.6;
        v[mod12(pc + 4)] += 0.6 ** 4 * 0.5;
      }
      out.push({ symbol: `${ROOTS[r]}${minor ? 'm' : ''}`, rootPc: r, minor, vec: normalize(v) });
    }
  }
  return out;
})();

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export interface BeatChroma {
  vectors: number[][];
  starts: number[];
  energy: number[];
}

/** Average the chromagram between beats so each beat gets one pitch-class vector. */
export function beatSyncChroma(chroma: Chromagram, beats: number[], duration: number): BeatChroma {
  const edges = beats.length >= 2 ? [...beats] : Array.from({ length: Math.floor(duration / 0.5) + 1 }, (_, i) => i * 0.5);
  if (edges[edges.length - 1] < duration) edges.push(duration);
  const vectors: number[][] = [];
  const starts: number[] = [];
  const energy: number[] = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    const acc = new Array(12).fill(0);
    let e = 0;
    let count = 0;
    chroma.frames.forEach((f, idx) => {
      const center = idx * chroma.hopTime + chroma.frameTime / 2;
      if (center < a || center >= b) return;
      for (let k = 0; k < 12; k++) acc[k] += f[k];
      e += chroma.energy[idx];
      count++;
    });
    if (!count) {
      // Very short beat: borrow the nearest frame.
      const idx = Math.min(chroma.frames.length - 1, Math.max(0, Math.round((a + b) / 2 / chroma.hopTime - chroma.frameTime / 2 / chroma.hopTime)));
      if (chroma.frames[idx]) for (let k = 0; k < 12; k++) acc[k] = chroma.frames[idx][k];
      e = chroma.energy[idx] ?? 0;
      count = 1;
    }
    vectors.push(acc);
    starts.push(a);
    energy.push(e / count);
  }
  return { vectors, starts, energy };
}

/**
 * Viterbi decoding of the most likely chord per beat. A key, when known,
 * makes chords from that key more likely, the way a listener expects them.
 */
export function recognizeChords(beatChroma: BeatChroma, key?: MusicKey, stay = 0.82, sharpness = 14): string[] {
  const n = beatChroma.vectors.length;
  if (!n) return [];
  const states = TEMPLATES.length + 1; // last state = no chord
  const noChord = TEMPLATES.length;
  const maxEnergy = Math.max(...beatChroma.energy, 1e-9);
  const inKey = key ? new Set(keyPcs(key)) : null;
  const leading = key && key.mode === 'minor' ? mod12(keyPcs(key)[0] + 11) : -1;
  const prior = TEMPLATES.map((t) => {
    if (!inKey) return 0;
    const tones = [t.rootPc, mod12(t.rootPc + (t.minor ? 3 : 4)), mod12(t.rootPc + 7)];
    const fits = tones.every((p) => inKey.has(p) || p === leading);
    return fits ? 0 : -1.2;
  });
  const emit = (i: number): number[] => {
    const v = normalize(beatChroma.vectors[i]);
    const quiet = beatChroma.energy[i] < maxEnergy * 0.04;
    const out = TEMPLATES.map((t, s) => sharpness * dot(v, t.vec) + prior[s]);
    out.push(quiet ? sharpness * 1.2 : sharpness * 0.55);
    return out;
  };
  const logStay = Math.log(stay);
  const logMove = Math.log((1 - stay) / (states - 1));
  let delta = emit(0);
  const back: Int16Array[] = [];
  for (let i = 1; i < n; i++) {
    const e = emit(i);
    let bestPrev = 0;
    for (let s = 1; s < states; s++) if (delta[s] > delta[bestPrev]) bestPrev = s;
    const next = new Array(states);
    const ptr = new Int16Array(states);
    for (let s = 0; s < states; s++) {
      const viaStay = delta[s] + logStay;
      const viaMove = delta[bestPrev] + logMove;
      if (viaStay >= viaMove || bestPrev === s) {
        next[s] = viaStay + e[s];
        ptr[s] = s;
      } else {
        next[s] = viaMove + e[s];
        ptr[s] = bestPrev;
      }
    }
    back.push(ptr);
    delta = next;
  }
  let state = 0;
  for (let s = 1; s < states; s++) if (delta[s] > delta[state]) state = s;
  const path = new Array<number>(n);
  path[n - 1] = state;
  for (let i = n - 1; i > 0; i--) {
    state = back[i - 1][state];
    path[i - 1] = state;
  }
  return path.map((s) => (s === noChord ? 'N' : TEMPLATES[s].symbol));
}

export function labelsToEvents(labels: string[], starts: number[]): ChordEvent[] {
  const events: ChordEvent[] = [];
  labels.forEach((label, i) => {
    if (label === 'N') return;
    const last = events[events.length - 1];
    if (last && last.chord.symbol === label && (i === 0 || labels[i - 1] === label)) {
      last.weight += 1;
      return;
    }
    const chord = parseChord(label) as ParsedChord;
    events.push({ chord, weight: 1, time: starts[i] });
  });
  return events;
}

// Telling 3 from 4 beats per bar was tried and measured: on 24 well-known
// 4/4 songs, chord-change and accent patterns overlapped a clean waltz, so the
// app does not claim a time signature from audio and teaches counting instead.

export interface AudioAnalysis {
  duration: number;
  key: KeyEstimate;
  tuningCents: number;
  bpm: number;
  tempoConfidence: number;
  chords: ChordEvent[];
  /** Overall pitch-class profile (C = 0), normalized to a maximum of 1. */
  profile: number[];
}

export function analyzeSamples(samples: Float32Array, rate = ANALYSIS_RATE): AudioAnalysis {
  const duration = samples.length / rate;
  const peak = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const x = peak < 0.5 ? samples.map((v) => v / peak) : samples;
  const chroma = computeChromagram(x, rate);
  const rhythm = analyzeRhythm(x, rate);
  const bc = beatSyncChroma(chroma, rhythm.beats, duration);
  const profile = globalProfile(chroma);

  const firstPass = labelsToEvents(recognizeChords(bc), bc.starts);
  const key = estimateKeyFromAudio(profile, firstPass);
  const labels = recognizeChords(bc, key.best.key);
  const chords = labelsToEvents(labels, bc.starts);
  const finalKey = estimateKeyFromAudio(profile, chords);
  const maxP = Math.max(...profile, 1e-9);
  return {
    duration,
    key: finalKey,
    tuningCents: chroma.tuningCents,
    bpm: rhythm.bpm,
    tempoConfidence: rhythm.confidence,
    chords,
    profile: profile.map((v) => v / maxP),
  };
}
