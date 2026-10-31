import { Note, Scale } from 'tonal';
import { mod12, pitchClass, pretty, toAscii } from './notes';

export type ScaleId =
  | 'major'
  | 'minor'
  | 'harmonic-minor'
  | 'melodic-minor'
  | 'major-pentatonic'
  | 'minor-pentatonic'
  | 'blues'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'locrian'
  | 'chromatic';

export interface ScaleType {
  id: ScaleId;
  name: string;
  /** Name understood by tonal's Scale.get */
  tonalName: string;
  /** Interval (as tonal string) from the scale's home note up to "do", used for solfège. */
  doInterval: string;
  /** One plain-English line on how the scale sounds and where you hear it. */
  plain: string;
  family: 'everyday' | 'five-note' | 'mode' | 'color';
}

export const SCALE_TYPES: readonly ScaleType[] = [
  {
    id: 'major',
    name: 'Major',
    tonalName: 'major',
    doInterval: '1P',
    plain: 'The bright, settled do-re-mi scale most pop, folk, and country songs are built from.',
    family: 'everyday',
  },
  {
    id: 'minor',
    name: 'Minor',
    tonalName: 'minor',
    doInterval: '3m',
    plain: 'The darker, sadder-sounding scale. Same notes as a major scale, but home is a different note.',
    family: 'everyday',
  },
  {
    id: 'major-pentatonic',
    name: 'Major pentatonic',
    tonalName: 'major pentatonic',
    doInterval: '1P',
    plain: 'Five notes with no clashing ones. The easiest scale to sing and to improvise with.',
    family: 'five-note',
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor pentatonic',
    tonalName: 'minor pentatonic',
    doInterval: '3m',
    plain: 'The five-note box shape behind most rock and blues guitar solos.',
    family: 'five-note',
  },
  {
    id: 'blues',
    name: 'Blues',
    tonalName: 'minor blues',
    doInterval: '3m',
    plain: 'Minor pentatonic plus one gritty in-between note, the "blue note".',
    family: 'five-note',
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic minor',
    tonalName: 'harmonic minor',
    doInterval: '3m',
    plain: 'Minor with the 7th note raised one fret, which pulls hard back home. Sounds dramatic and classical.',
    family: 'color',
  },
  {
    id: 'melodic-minor',
    name: 'Melodic minor',
    tonalName: 'melodic minor',
    doInterval: '3m',
    plain: 'Minor at the bottom, major at the top. Smooth to sing upward; common in jazz.',
    family: 'color',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    tonalName: 'dorian',
    doInterval: '-2M',
    plain: 'A minor sound with one brighter note (the 6th). Funky, soulful, and hopeful-sad.',
    family: 'mode',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    tonalName: 'mixolydian',
    doInterval: '-5P',
    plain: 'Major with the 7th lowered one fret. The sound of a lot of classic rock riffs.',
    family: 'mode',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    tonalName: 'lydian',
    doInterval: '-4P',
    plain: 'Major with the 4th raised one fret. Dreamy and floating, like film music.',
    family: 'mode',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    tonalName: 'phrygian',
    doInterval: '-3M',
    plain: 'Minor with the 2nd lowered one fret. Tense; heard in flamenco and metal.',
    family: 'mode',
  },
  {
    id: 'locrian',
    name: 'Locrian',
    tonalName: 'locrian',
    doInterval: '2m',
    plain: 'The most unstable scale. Its home chord is diminished, so it rarely feels at rest.',
    family: 'mode',
  },
  {
    id: 'chromatic',
    name: 'Chromatic',
    tonalName: 'chromatic',
    doInterval: '1P',
    plain: 'Every note, one fret at a time. A good workout for singing small steps.',
    family: 'color',
  },
];

export function scaleType(id: ScaleId): ScaleType {
  const t = SCALE_TYPES.find((s) => s.id === id);
  if (!t) throw new Error(`Unknown scale ${id}`);
  return t;
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const SOLFA = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
const RAISED: Record<string, string> = { do: 'di', re: 'ri', fa: 'fi', sol: 'si', la: 'li' };
const LOWERED: Record<string, string> = { re: 'ra', mi: 'me', sol: 'se', la: 'le', ti: 'te' };

/** Movable-do syllable for a spelled note, given the spelled "do" note. */
export function solfaFor(note: string, doNote: string): string {
  const step = (LETTERS.indexOf(note[0]) - LETTERS.indexOf(doNote[0]) + 7) % 7;
  const base = SOLFA[step];
  let diff = mod12(pitchClass(note) - pitchClass(doNote)) - MAJOR_STEPS[step];
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  if (diff === 1) return RAISED[base] ?? `${base}♯`;
  if (diff === -1) return LOWERED[base] ?? `${base}♭`;
  return base;
}

export interface ScaleDegree {
  /** Spelled note name without octave, ASCII accidentals ("F#"). */
  note: string;
  /** Display name with glyphs ("F♯"). */
  label: string;
  pc: number;
  /** Semitones above the home note (0..11). */
  semitones: number;
  /** 1-based position in the scale. */
  step: number;
  solfa: string;
  /** Semitones up to the next note of the scale (wrapping to the octave). */
  gapUp: number;
}

export interface BuiltScale {
  type: ScaleType;
  tonic: string;
  title: string;
  degrees: ScaleDegree[];
}

export function buildScale(tonic: string, id: ScaleId): BuiltScale {
  const type = scaleType(id);
  const t = toAscii(tonic);
  const scale = Scale.get(`${t} ${type.tonalName}`);
  if (scale.empty) throw new Error(`Cannot build ${tonic} ${type.name}`);
  const tonicPc = pitchClass(t);
  const doNote = Note.transpose(t, type.doInterval) || t;
  const notes = id === 'chromatic' ? chromaticSpelling(t) : scale.notes;
  const semis = notes.map((n) => mod12(pitchClass(n) - tonicPc));
  const degrees = notes.map((n, i) => ({
    note: n,
    label: pretty(n),
    pc: pitchClass(n),
    semitones: semis[i],
    step: i + 1,
    solfa: solfaFor(n, doNote),
    gapUp: (i + 1 < semis.length ? semis[i + 1] : 12) - semis[i],
  }));
  return { type, tonic: t, title: `${pretty(t)} ${type.name.toLowerCase()}`, degrees };
}

function chromaticSpelling(tonic: string): string[] {
  const preferFlats = tonic.includes('b') || tonic === 'F';
  const sharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const names = preferFlats ? flat : sharp;
  const start = pitchClass(tonic);
  return Array.from({ length: 12 }, (_, i) => (i === 0 ? tonic : names[mod12(start + i)]));
}

/** Plain-English name of a gap between neighboring notes, with its guitar equivalent. */
export function describeGap(semitones: number): string {
  switch (semitones) {
    case 1:
      return 'half step (1 fret)';
    case 2:
      return 'whole step (2 frets)';
    case 3:
      return 'step and a half (3 frets)';
    default:
      return `${semitones} frets`;
  }
}

/** Every MIDI note of a scale between two MIDI bounds, inclusive. */
export function scaleMidisInRange(scale: BuiltScale, low: number, high: number): number[] {
  const pcs = new Set(scale.degrees.map((d) => d.pc));
  const out: number[] = [];
  for (let m = Math.ceil(low); m <= Math.floor(high); m++) if (pcs.has(mod12(m))) out.push(m);
  return out;
}

/** One octave run from a home-note MIDI number: home up to the octave above. */
export function oneOctaveRun(scale: BuiltScale, homeMidi: number): number[] {
  return [...scale.degrees.map((d) => homeMidi + d.semitones), homeMidi + 12];
}
