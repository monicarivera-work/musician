import type { AudioAnalysis } from '../audio/analysis';
import { analyzeChordInKey, chordDisplay, diatonicTriads, respellForKey, type ChordInKey } from '../theory/chords';
import { collapseRepeats, extractChords, type ChordEvent } from '../theory/chord-text';
import { estimateKeyFromChords, type KeyEstimate } from '../theory/key-detect';
import { capoOptions, keyScale, keySignature, normalizeKey, parallelKey, relativeKey, type MusicKey } from '../theory/keys';
import { findCadences, findProgressions } from '../theory/progressions';
import type { SongHit } from './itunes';

export type SongSource = 'search' | 'chords' | 'listen' | 'file' | 'example';

export interface SongAnalysis {
  id: string;
  source: SongSource;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  year?: number | null;
  genre?: string;
  durationMs?: number | null;
  storeUrl?: string;
  /** Seconds of audio that were analyzed. */
  analyzedSeconds?: number;
  key: KeyEstimate;
  /** Set when she corrects the detected key. */
  keyOverride?: MusicKey;
  chords: ChordEvent[];
  chordText?: string;
  bpm?: number;
  tempoConfidence?: number;
  tuningCents?: number;
  createdAt: string;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function fromChordText(text: string, title?: string, base?: Partial<SongAnalysis>): SongAnalysis | null {
  const chords = extractChords(text);
  if (!chords.length) return null;
  return {
    ...base,
    id: base?.id ?? newId(),
    source: base?.source ?? 'chords',
    title: title?.trim() || base?.title || 'Your chords',
    key: estimateKeyFromChords(chords),
    keyOverride: undefined,
    chords,
    chordText: text,
    createdAt: new Date().toISOString(),
  };
}

export function fromAudio(result: AudioAnalysis, source: SongSource, meta: Partial<SongAnalysis> & { title: string }): SongAnalysis {
  return {
    ...meta,
    id: newId(),
    source,
    analyzedSeconds: result.duration,
    key: result.key,
    chords: result.chords,
    bpm: result.bpm,
    tempoConfidence: result.tempoConfidence,
    tuningCents: result.tuningCents,
    createdAt: new Date().toISOString(),
  };
}

export function songMetaFromHit(hit: SongHit): Partial<SongAnalysis> & { title: string } {
  return {
    title: hit.title,
    artist: hit.artist,
    album: hit.album,
    artwork: hit.artworkLarge || hit.artwork,
    year: hit.year,
    genre: hit.genre,
    durationMs: hit.durationMs,
    storeUrl: hit.storeUrl,
  };
}

export function effectiveKey(song: SongAnalysis): MusicKey {
  return normalizeKey(song.keyOverride ?? song.key.best.key);
}

export interface ChordUse extends ChordInKey {
  /** Share of the song's chord time, 0..1. */
  share: number;
  count: number;
}

/** Everything the result screen shows, derived from the song and its (possibly corrected) key. */
export function describeSong(song: SongAnalysis) {
  const key = effectiveKey(song);
  const chords = song.chords.map((e) => ({ ...e, chord: respellForKey(e.chord, key) }));
  const totals = new Map<string, { event: ChordEvent; weight: number; count: number }>();
  const total = chords.reduce((s, e) => s + e.weight, 0) || 1;
  for (const e of collapseRepeats(chords)) {
    const t = totals.get(e.chord.symbol) ?? { event: e, weight: 0, count: 0 };
    t.weight += e.weight;
    t.count += 1;
    totals.set(e.chord.symbol, t);
  }
  const uses: ChordUse[] = [...totals.values()]
    .map((t) => ({ ...analyzeChordInKey(t.event.chord, key), share: t.weight / total, count: t.count }))
    .sort((a, b) => b.share - a.share);
  return {
    key,
    scale: keyScale(key),
    relative: relativeKey(key),
    parallel: parallelKey(key),
    signature: keySignature(key),
    capo: capoOptions(key).filter((c) => c.capo > 0).slice(0, 3),
    playsOpen: capoOptions(key).some((c) => c.capo === 0),
    progressions: findProgressions(chords, key),
    cadences: findCadences(chords, key),
    uses,
    diatonic: diatonicTriads(key),
    sequence: collapseRepeats(chords).map((e) => chordDisplay(e.chord)),
  };
}

export type SongDescription = ReturnType<typeof describeSong>;

export function tempoWords(bpm: number): string {
  if (bpm < 70) return 'Slow, like a ballad';
  if (bpm < 95) return 'Relaxed, like an easy walk';
  if (bpm < 120) return 'Medium, like a brisk walk';
  if (bpm < 145) return 'Upbeat, good for dancing';
  return 'Fast and driving';
}

export function confidenceWords(p: number): string {
  if (p >= 0.75) return 'Very likely';
  if (p >= 0.5) return 'Likely';
  if (p >= 0.3) return 'Possible';
  return 'Unsure';
}

export const EXAMPLE_CHORDS = 'G D Em C\nG D Em C\nC D G Em\nC D G';

export function exampleSong(): SongAnalysis {
  const s = fromChordText(EXAMPLE_CHORDS, 'Example: G, D, Em, C', { source: 'example' });
  if (!s) throw new Error('Example chords failed to parse');
  return s;
}
