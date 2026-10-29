import { Chord, Note } from 'tonal';
import { mod12, pitchClass, pretty, toAscii } from './notes';
import { keyPcs, keyScale, MAJOR_STEPS, MINOR_STEPS, parallelKey, type MusicKey } from './keys';

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4' | 'power';

export interface ParsedChord {
  /** Symbol as the user wrote it, normalized to ASCII accidentals. */
  symbol: string;
  root: string;
  rootPc: number;
  bass?: string;
  quality: TriadQuality;
  /** Extension text after the triad, e.g. "7", "maj7", "add9". */
  extension: string;
  /** Pitch classes of all chord tones (root first). */
  pcs: number[];
  notes: string[];
}

const CHORD_TOKEN = /^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/;

function normalizeQuality(q: string): string {
  let s = q.trim();
  s = s.replace(/^(min|mi)(?!n|aj)/, 'm');
  s = s.replace(/^-(?=\d|$)/, 'm');
  s = s.replace(/^(Maj|MA|Ma|M)(?=7|9|11|13)/, 'maj');
  s = s.replace(/^Δ/, 'maj7');
  s = s.replace(/^°7?/, (m) => (m === '°7' ? 'dim7' : 'dim'));
  s = s.replace(/^ø7?/, 'm7b5');
  s = s.replace(/^\+/, 'aug');
  s = s.replace(/^sus$/, 'sus4');
  s = s.replace(/[()]/g, '');
  return s;
}

/** Parse a chord symbol like "F#m7", "Bb/D", "Gsus4", "C(add9)". Returns null for non-chords. */
export function parseChord(raw: string): ParsedChord | null {
  const token = toAscii(raw.trim()).replace(/[,.;:!?]+$/, '');
  const m = CHORD_TOKEN.exec(token);
  if (!m) return null;
  const [, root, qualityRaw, bass] = m;
  const quality = normalizeQuality(qualityRaw);
  const chord = Chord.get(`${root}${quality}`);
  if (chord.empty || !chord.notes.length) return null;
  const rootPc = pitchClass(root);
  const intervals = chord.intervals;
  const has = (i: string) => intervals.includes(i);
  let triad: TriadQuality;
  if (has('3M')) triad = has('5A') ? 'augmented' : 'major';
  else if (has('3m')) triad = has('5d') ? 'diminished' : 'minor';
  else if (has('4P')) triad = 'sus4';
  else if (has('2M') || has('9M')) triad = 'sus2';
  else triad = 'power';
  const notes = chord.notes;
  return {
    symbol: `${root}${qualityRaw}${bass ? `/${bass}` : ''}`,
    root,
    rootPc,
    bass,
    quality: triad,
    extension: extensionOf(quality, triad),
    pcs: notes.map((n) => pitchClass(n)),
    notes,
  };
}

function extensionOf(quality: string, triad: TriadQuality): string {
  let q = quality;
  if (triad === 'minor') q = q.replace(/^m(?!aj)/, '');
  if (triad === 'diminished') q = q.replace(/^dim/, '');
  if (triad === 'augmented') q = q.replace(/^aug/, '');
  if (triad === 'power') q = q.replace(/^5/, '');
  if (triad === 'sus2' || triad === 'sus4') q = q.replace(/^sus[24]?/, '');
  if (q === 'm7b5' || quality === 'm7b5') return 'm7b5';
  return q;
}

export function chordDisplay(chord: ParsedChord): string {
  return pretty(chord.symbol).replace(/\/([A-G])#/, '/$1♯').replace(/\/([A-G])b/, '/$1♭');
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export interface RomanNumeral {
  /** e.g. "vi", "♭VII", "V7", "vii°" */
  text: string;
  /** 0-based scale step of the root (by letter) */
  degree: number;
  /** Accidental relative to the key's own scale: -1 lowered, +1 raised */
  shift: number;
}

export function romanNumeral(chord: ParsedChord, key: MusicKey): RomanNumeral {
  const tonic = toAscii(key.tonic);
  const degree = (LETTERS.indexOf(chord.root[0]) - LETTERS.indexOf(tonic[0]) + 7) % 7;
  const steps = key.mode === 'major' ? MAJOR_STEPS : MINOR_STEPS;
  let shift = mod12(chord.rootPc - pitchClass(tonic)) - steps[degree];
  if (shift > 6) shift -= 12;
  if (shift < -6) shift += 12;
  const accidental = shift > 0 ? '♯'.repeat(shift) : '♭'.repeat(-shift);
  const base = NUMERALS[degree];
  const lower = chord.quality === 'minor' || chord.quality === 'diminished';
  let text = `${accidental}${lower ? base.toLowerCase() : base}`;
  if (chord.extension === 'm7b5') text += 'ø7';
  else if (chord.quality === 'diminished') text += `°${chord.extension}`;
  else if (chord.quality === 'augmented') text += `+${chord.extension}`;
  else if (chord.quality === 'sus2' || chord.quality === 'sus4') text += chord.quality + chord.extension;
  else if (chord.quality === 'power') text += '5';
  else text += chord.extension;
  return { text, degree, shift };
}

export type ChordRole = 'home' | 'away' | 'tension' | 'borrowed' | 'secondary' | 'outside';

export interface ChordInKey {
  chord: ParsedChord;
  numeral: RomanNumeral;
  role: ChordRole;
  /** One plain-English line about what this chord does in the key. */
  explain: string;
}

const ROLE_BY_DEGREE_MAJOR: ChordRole[] = ['home', 'away', 'home', 'away', 'tension', 'home', 'tension'];
const ROLE_BY_DEGREE_MINOR: ChordRole[] = ['home', 'away', 'home', 'away', 'tension', 'away', 'tension'];

function isSubset(pcs: number[], set: Set<number>): boolean {
  return pcs.every((p) => set.has(p));
}

export function analyzeChordInKey(chord: ParsedChord, key: MusicKey): ChordInKey {
  const numeral = romanNumeral(chord, key);
  const scalePcs = new Set(keyPcs(key));
  const tonicPc = pitchClass(key.tonic);
  const triadPcs = triadPcsOf(chord);

  if (isSubset(triadPcs, scalePcs) && numeral.shift === 0) {
    const role = (key.mode === 'major' ? ROLE_BY_DEGREE_MAJOR : ROLE_BY_DEGREE_MINOR)[numeral.degree];
    return { chord, numeral, role, explain: roleSentence(role, numeral.degree, key) };
  }

  if (key.mode === 'minor' && numeral.degree === 4 && chord.quality === 'major' && numeral.shift === 0) {
    return {
      chord,
      numeral,
      role: 'tension',
      explain: 'Major V: the 7th note of the scale is raised one fret, so this chord pulls strongly back home.',
    };
  }
  if (key.mode === 'minor' && numeral.degree === 6 && chord.quality === 'diminished' && numeral.shift === 1) {
    return { chord, numeral, role: 'tension', explain: 'Built on the raised 7th note; it leans hard into the home chord.' };
  }

  const parallelPcs = new Set(keyPcs(parallelKey(key)));
  if (isSubset(triadPcs, parallelPcs)) {
    const from = key.mode === 'major' ? 'minor' : 'major';
    return {
      chord,
      numeral,
      role: 'borrowed',
      explain: `Borrowed from the ${from} key with the same home note. It adds a ${key.mode === 'major' ? 'darker, bittersweet' : 'brighter, hopeful'} color.`,
    };
  }

  if ((chord.quality === 'major' && (chord.extension === '' || chord.extension === '7')) && chord.rootPc !== mod12(tonicPc + 7)) {
    const targetPc = mod12(chord.rootPc + 5);
    const targetStep = keyPcs(key).indexOf(targetPc);
    if (targetStep > 0) {
      return {
        chord,
        numeral,
        role: 'secondary',
        explain: `A "borrowed tension" chord: it leads into the chord built on note ${targetStep + 1} of the scale, like a mini V to a new home.`,
      };
    }
  }

  return {
    chord,
    numeral,
    role: 'outside',
    explain: 'Uses notes from outside this key, which makes it stand out as a surprise.',
  };
}

function roleSentence(role: ChordRole, degree: number, key: MusicKey): string {
  if (degree === 0) return 'The home chord. Songs feel finished when they land here.';
  if (role === 'tension') return degree === 4 ? 'Builds tension that wants to resolve back to the home chord.' : 'Unstable and tense; it leans toward home.';
  if (role === 'away') return 'Moves away from home: a sense of going somewhere.';
  if (key.mode === 'major' && degree === 5) return 'The sad-sounding cousin of home. It shares two notes with the home chord.';
  return 'Close to home. It shares notes with the home chord, so it can stand in for it.';
}

function triadPcsOf(chord: ParsedChord): number[] {
  const r = chord.rootPc;
  switch (chord.quality) {
    case 'major':
      return [r, mod12(r + 4), mod12(r + 7)];
    case 'minor':
      return [r, mod12(r + 3), mod12(r + 7)];
    case 'diminished':
      return [r, mod12(r + 3), mod12(r + 6)];
    case 'augmented':
      return [r, mod12(r + 4), mod12(r + 8)];
    case 'sus2':
      return [r, mod12(r + 2), mod12(r + 7)];
    case 'sus4':
      return [r, mod12(r + 5), mod12(r + 7)];
    case 'power':
      return [r, mod12(r + 7)];
  }
}

export interface DiatonicChord extends ChordInKey {
  step: number;
}

/** The seven triads that belong to a key, in scale order. */
export function diatonicTriads(key: MusicKey): DiatonicChord[] {
  const scale = keyScale(key);
  const pcs = scale.degrees.map((d) => d.pc);
  return scale.degrees.map((d, i) => {
    const third = pcs[(i + 2) % 7];
    const fifth = pcs[(i + 4) % 7];
    const t = mod12(third - d.pc);
    const f = mod12(fifth - d.pc);
    const suffix = t === 4 ? (f === 8 ? 'aug' : '') : f === 6 ? 'dim' : 'm';
    const parsed = parseChord(`${d.note}${suffix}`);
    if (!parsed) throw new Error(`Bad diatonic chord ${d.note}${suffix}`);
    return { ...analyzeChordInKey(parsed, key), step: i + 1 };
  });
}

/** Simplify enharmonic spelling of a chord root for a key ("A#" in F major -> "Bb"). */
export function respellForKey(chord: ParsedChord, key: MusicKey): ParsedChord {
  const scale = keyScale(key);
  const match = scale.degrees.find((d) => d.pc === chord.rootPc);
  if (!match || match.note === chord.root) return chord;
  const quality = chord.symbol.slice(chord.root.length).split('/')[0];
  const bass = chord.bass ? scale.degrees.find((d) => d.pc === pitchClass(chord.bass!))?.note ?? Note.simplify(chord.bass) : undefined;
  return parseChord(`${match.note}${quality}${bass ? `/${bass}` : ''}`) ?? chord;
}
