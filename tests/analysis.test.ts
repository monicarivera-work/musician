import { describe, expect, it } from 'vitest';
import { analyzeSamples, ANALYSIS_RATE, computeChromagram, analyzeRhythm } from '../src/audio/analysis';
import { midiToFreq } from '../src/theory/notes';

const RATE = ANALYSIS_RATE;

/** Harmonic-rich tone, roughly like a plucked or bowed string. */
function addTone(out: Float32Array, midi: number, start: number, dur: number, gain = 0.2, cents = 0) {
  const f = midiToFreq(midi) * Math.pow(2, cents / 1200);
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 1.2);
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * f * h * t) / h ** 1.3;
    out[s0 + i] += gain * env * v;
  }
}

function addClick(out: Float32Array, start: number, gain = 0.6) {
  const s0 = Math.floor(start * RATE);
  for (let i = 0; i < 400 && s0 + i < out.length; i++) {
    out[s0 + i] += gain * Math.exp(-i / 60) * Math.sin((2 * Math.PI * 70 * i) / RATE);
    out[s0 + i] += 0.3 * gain * Math.exp(-i / 25) * (Math.random() * 2 - 1);
  }
}

const TRIADS: Record<string, number[]> = {
  G: [43, 55, 59, 62, 67],
  D: [38, 50, 54, 57, 62],
  Em: [40, 52, 55, 59, 64],
  C: [36, 48, 52, 55, 60],
  Am: [45, 57, 60, 64, 69],
  F: [41, 53, 57, 60, 65],
  E: [40, 52, 56, 59, 64],
  Dm: [38, 50, 53, 57, 62],
};

function song(chords: string[], bpm: number, beatsPerChord = 4, repeats = 3, cents = 0): Float32Array {
  const beat = 60 / bpm;
  const total = chords.length * beatsPerChord * repeats * beat + 1;
  const out = new Float32Array(Math.ceil(total * RATE));
  let t = 0.2;
  for (let r = 0; r < repeats; r++) {
    for (const name of chords) {
      for (let b = 0; b < beatsPerChord; b++) {
        for (const m of TRIADS[name]) addTone(out, m, t + b * beat, beat * 1.1, 0.08, cents);
        addClick(out, t + b * beat, b === 0 ? 0.7 : 0.4);
      }
      t += beatsPerChord * beat;
    }
  }
  return out;
}

describe('audio analysis on synthesized music', () => {
  it('estimates tuning offset', () => {
    const x = song(['G', 'D', 'Em', 'C'], 100, 4, 1, 20);
    const c = computeChromagram(x);
    expect(c.tuningCents).toBeGreaterThan(10);
    expect(c.tuningCents).toBeLessThan(30);
  });

  it('finds the tempo', () => {
    const r = analyzeRhythm(song(['G', 'D', 'Em', 'C'], 96, 4, 2));
    expect(r.bpm).toBeGreaterThan(92);
    expect(r.bpm).toBeLessThan(100);
    expect(r.beats.length).toBeGreaterThan(20);
  });

  it('finds key, chords, and tempo of a pop loop in G', () => {
    const a = analyzeSamples(song(['G', 'D', 'Em', 'C'], 100));
    expect(a.key.best.key).toMatchObject({ tonic: 'G', mode: 'major' });
    const seq = a.chords.map((e) => e.chord.symbol);
    expect(seq.slice(0, 8)).toEqual(['G', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C']);
    expect(Math.abs(a.bpm - 100)).toBeLessThan(4);
  });

  it('finds a minor key', () => {
    const a = analyzeSamples(song(['Am', 'F', 'C', 'E', 'Am', 'Dm', 'E', 'Am'], 110, 4, 2));
    expect(a.key.best.key).toMatchObject({ tonic: 'A', mode: 'minor' });
    const seq = a.chords.map((e) => e.chord.symbol);
    expect(seq).toContain('E');
    expect(seq).toContain('Dm');
  });

  it('handles three beats per bar (a waltz) without losing the key', () => {
    const a = analyzeSamples(song(['C', 'F', 'G', 'C'], 132, 3, 3));
    expect(a.key.best.key).toMatchObject({ tonic: 'C', mode: 'major' });
    expect(a.chords.map((e) => e.chord.symbol)).toEqual(expect.arrayContaining(['C', 'F', 'G']));
  });
});
