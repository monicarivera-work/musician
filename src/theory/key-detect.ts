import { mod12, pitchClass } from './notes';
import { keyFromPc, MAJOR_STEPS, MINOR_STEPS, type Mode, type MusicKey } from './keys';
import type { ChordEvent } from './chord-text';

export interface KeyCandidate {
  key: MusicKey;
  score: number;
  /** 0..1 share of belief among all 24 keys. */
  probability: number;
}

export interface KeyEstimate {
  best: KeyCandidate;
  /** Top alternatives after the best, most likely first. */
  alternatives: KeyCandidate[];
  /** 0..1 how sure we are of the best key. Relative major/minor share notes, so they are merged here. */
  confidence: number;
}

const ALL_KEYS: MusicKey[] = [];
for (const mode of ['major', 'minor'] as Mode[]) for (let pc = 0; pc < 12; pc++) ALL_KEYS.push(keyFromPc(pc, mode));

function steps(mode: Mode) {
  return mode === 'major' ? MAJOR_STEPS : MINOR_STEPS;
}

function triadPcs(e: ChordEvent): number[] {
  const r = e.chord.rootPc;
  switch (e.chord.quality) {
    case 'major':
      return [r, r + 4, r + 7].map(mod12);
    case 'minor':
      return [r, r + 3, r + 7].map(mod12);
    case 'diminished':
      return [r, r + 3, r + 6].map(mod12);
    case 'augmented':
      return [r, r + 4, r + 8].map(mod12);
    case 'sus2':
      return [r, r + 2, r + 7].map(mod12);
    case 'sus4':
      return [r, r + 5, r + 7].map(mod12);
    default:
      return [r, r + 7].map(mod12);
  }
}

/**
 * Score how well a chord sequence fits each of the 24 keys. `positional`
 * rewards starting and ending on the home chord, which only makes sense for
 * a whole song typed in, not for an excerpt of audio.
 */
export function scoreKeysFromChords(events: ChordEvent[], positional = true): number[] {
  if (!events.length) return ALL_KEYS.map(() => 0);
  const total = events.reduce((s, e) => s + e.weight, 0);
  const avg = total / events.length;
  return ALL_KEYS.map((key, idx) => {
    const t = idx % 12;
    const scale = new Set(steps(key.mode).map((s) => mod12(t + s)));
    const harmonic = new Set(scale);
    if (key.mode === 'minor') harmonic.add(mod12(t + 11));
    let score = 0;
    events.forEach((e, i) => {
      const pcs = triadPcs(e);
      const w = e.weight;
      const fits = pcs.every((p) => scale.has(p));
      const fitsHarmonic = key.mode === 'minor' && pcs.every((p) => harmonic.has(p)) && (e.chord.rootPc === mod12(t + 7) || e.chord.rootPc === mod12(t + 11));
      if (fits) score += w;
      else if (fitsHarmonic) score += 0.9 * w;
      else if (scale.has(e.chord.rootPc)) score += 0.3 * w;
      else score -= 0.6 * w;

      const isTonicChord = e.chord.rootPc === t && (key.mode === 'major' ? e.chord.quality === 'major' : e.chord.quality === 'minor');
      if (isTonicChord) score += 0.6 * w;
      if (e.chord.rootPc === mod12(t + 7) && e.chord.quality === 'major') {
        score += 0.15 * w;
        const next = events[i + 1];
        if (next && next.chord.rootPc === t) score += 0.5 * avg;
      }
      if (positional && i === 0 && isTonicChord) score += 0.8 * avg;
      if (positional && i === events.length - 1 && isTonicChord) score += 1.0 * avg;
    });
    return score / total;
  });
}

// Pitch-class weightings from listening studies: how strongly each note
// "belongs" when a key is heard. Index 0 is the home note.
const PROFILES: { major: number[]; minor: number[] }[] = [
  {
    // Krumhansl & Kessler (1982)
    major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    minor: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  },
  {
    // Temperley (2001), from the Kostka-Payne corpus
    major: [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0],
    minor: [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0],
  },
  {
    // Albrecht & Shanahan (2013)
    major: [0.238, 0.006, 0.111, 0.006, 0.137, 0.094, 0.016, 0.214, 0.009, 0.08, 0.008, 0.081],
    minor: [0.22, 0.006, 0.104, 0.123, 0.019, 0.103, 0.012, 0.214, 0.062, 0.022, 0.061, 0.052],
  },
];

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Correlate a 12-bin pitch-class profile (from audio) with every key, averaged over several key profiles. */
export function scoreKeysFromChroma(chroma: number[]): number[] {
  return ALL_KEYS.map((key, idx) => {
    const t = idx % 12;
    const rotated = Array.from({ length: 12 }, (_, i) => chroma[mod12(i + t)]);
    let s = 0;
    for (const p of PROFILES) s += pearson(rotated, key.mode === 'major' ? p.major : p.minor);
    return s / PROFILES.length;
  });
}

function zscore(xs: number[]): number[] {
  const m = xs.reduce((s, v) => s + v, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length) || 1;
  return xs.map((v) => (v - m) / sd);
}

/** Turn per-key scores into an estimate with alternatives and an honest confidence. */
export function estimateFromScores(scores: number[], sharpness = 2.2): KeyEstimate {
  const z = zscore(scores);
  const exps = z.map((v) => Math.exp(v * sharpness));
  const sum = exps.reduce((s, v) => s + v, 0);
  const cands: KeyCandidate[] = ALL_KEYS.map((key, i) => ({ key, score: scores[i], probability: exps[i] / sum }));
  cands.sort((a, b) => b.probability - a.probability);
  const best = cands[0];
  return {
    best,
    alternatives: cands.slice(1, 4),
    confidence: best.probability,
  };
}

export function estimateKeyFromChords(events: ChordEvent[]): KeyEstimate {
  return estimateFromScores(scoreKeysFromChords(events), 2.6);
}

/** Combine audio pitch evidence with recognized chords. */
export function estimateKeyFromAudio(chroma: number[], events: ChordEvent[], chordWeight = 0.5): KeyEstimate {
  const a = zscore(scoreKeysFromChroma(chroma));
  if (!events.length) return estimateFromScores(a);
  const c = zscore(scoreKeysFromChords(events, false));
  return estimateFromScores(a.map((v, i) => (1 - chordWeight) * v + chordWeight * c[i]));
}

export function keyIndex(key: MusicKey): number {
  return (key.mode === 'major' ? 0 : 12) + pitchClass(key.tonic);
}

export { ALL_KEYS };
