import { describe, expect, it } from 'vitest';
import { centsFrom, freqToMidi, midiName, midiToFreq, pretty, spellMidiInScale } from '../src/theory/notes';
import { buildScale, describeGap, oneOctaveRun, solfaFor } from '../src/theory/scales';
import { capoOptions, keyLabel, keySignature, relativeKey, parallelKey, type MusicKey } from '../src/theory/keys';
import { analyzeChordInKey, diatonicTriads, parseChord, romanNumeral } from '../src/theory/chords';
import { extractChords } from '../src/theory/chord-text';
import { estimateKeyFromChords, scoreKeysFromChroma, ALL_KEYS } from '../src/theory/key-detect';
import { findCadences, findProgressions, triadNumeral } from '../src/theory/progressions';

describe('notes', () => {
  it('converts between frequency and MIDI', () => {
    expect(midiToFreq(69)).toBeCloseTo(440);
    expect(freqToMidi(261.6256)).toBeCloseTo(60, 3);
    expect(midiName(61)).toBe('C#4');
    expect(midiName(61, true)).toBe('Db4');
    expect(centsFrom(446, 69)).toBeCloseTo(23.45, 1);
  });

  it('prints accidentals as glyphs', () => {
    expect(pretty('F#')).toBe('F♯');
    expect(pretty('Bb')).toBe('B♭');
    expect(pretty('C')).toBe('C');
  });

  it('spells MIDI notes using the scale letters, octave included', () => {
    const fSharpMajor = buildScale('F#', 'major').degrees.map((d) => d.note);
    expect(spellMidiInScale(65, fSharpMajor)).toBe('E#4');
    const gFlatMajor = buildScale('Gb', 'major').degrees.map((d) => d.note);
    expect(spellMidiInScale(59, gFlatMajor)).toBe('Cb4');
  });
});

describe('scales', () => {
  it('builds correctly spelled scales with step gaps', () => {
    const g = buildScale('G', 'major');
    expect(g.degrees.map((d) => d.note)).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
    expect(g.degrees.map((d) => d.gapUp)).toEqual([2, 2, 1, 2, 2, 2, 1]);
    expect(g.degrees.map((d) => d.solfa)).toEqual(['do', 're', 'mi', 'fa', 'sol', 'la', 'ti']);
  });

  it('uses la-based syllables for minor and modes, with altered syllables', () => {
    expect(buildScale('A', 'minor').degrees.map((d) => d.solfa)).toEqual(['la', 'ti', 'do', 're', 'mi', 'fa', 'sol']);
    expect(buildScale('A', 'harmonic-minor').degrees.map((d) => d.solfa)).toEqual(['la', 'ti', 'do', 're', 'mi', 'fa', 'si']);
    expect(buildScale('D', 'dorian').degrees[0].solfa).toBe('re');
    expect(buildScale('A', 'blues').degrees.map((d) => d.solfa)).toEqual(['la', 'do', 're', 'me', 'mi', 'sol']);
    expect(solfaFor('Bb', 'C')).toBe('te');
  });

  it('builds pentatonic and chromatic scales', () => {
    expect(buildScale('E', 'minor-pentatonic').degrees.map((d) => d.note)).toEqual(['E', 'G', 'A', 'B', 'D']);
    expect(buildScale('C', 'chromatic').degrees).toHaveLength(12);
    expect(buildScale('E', 'minor-pentatonic').degrees.map((d) => d.gapUp)).toEqual([3, 2, 2, 3, 2]);
  });

  it('describes gaps in guitar terms', () => {
    expect(describeGap(1)).toBe('half step (1 fret)');
    expect(describeGap(2)).toBe('whole step (2 frets)');
  });

  it('runs one octave from a home note', () => {
    expect(oneOctaveRun(buildScale('C', 'major'), 60)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });
});

describe('keys', () => {
  it('knows relatives, parallels, and signatures', () => {
    expect(keyLabel(relativeKey({ tonic: 'G', mode: 'major' }))).toBe('E minor');
    expect(keyLabel(relativeKey({ tonic: 'C#', mode: 'minor' }))).toBe('E major');
    expect(keyLabel(parallelKey({ tonic: 'A', mode: 'major' }))).toBe('A minor');
    expect(keySignature({ tonic: 'D', mode: 'major' })).toMatchObject({ count: 2, kind: 'sharps', notes: ['F#', 'C#'] });
    expect(keySignature({ tonic: 'D', mode: 'minor' })).toMatchObject({ count: 1, kind: 'flats', notes: ['Bb'] });
    expect(keySignature({ tonic: 'A', mode: 'minor' }).kind).toBe('none');
  });

  it('suggests capo positions with easy shapes', () => {
    const opts = capoOptions({ tonic: 'Bb', mode: 'major' });
    expect(opts[0]).toMatchObject({ capo: 1, shapesKey: { tonic: 'A' } });
    expect(opts.map((o) => `${o.capo}:${o.shapesKey.tonic}`)).toContain('3:G');
    expect(capoOptions({ tonic: 'F#', mode: 'minor' })[0]).toMatchObject({ capo: 2, shapesKey: { tonic: 'E' } });
  });
});

describe('chords', () => {
  it('parses common symbols', () => {
    expect(parseChord('F#m7')).toMatchObject({ root: 'F#', quality: 'minor', extension: '7' });
    expect(parseChord('Bb/D')).toMatchObject({ root: 'Bb', bass: 'D', quality: 'major' });
    expect(parseChord('Gsus4')?.quality).toBe('sus4');
    expect(parseChord('Cmaj7')?.extension).toBe('maj7');
    expect(parseChord('Bdim')?.quality).toBe('diminished');
    expect(parseChord('E5')?.quality).toBe('power');
    expect(parseChord('Am7b5')?.extension).toBe('m7b5');
    expect(parseChord('C(add9)')?.quality).toBe('major');
    expect(parseChord('E♭')?.root).toBe('Eb');
    expect(parseChord('Amin')?.quality).toBe('minor');
    expect(parseChord('hello')).toBeNull();
    expect(parseChord('the')).toBeNull();
  });

  it('names chords with Roman numerals relative to the key', () => {
    const G: MusicKey = { tonic: 'G', mode: 'major' };
    const rn = (s: string, k: MusicKey = G) => romanNumeral(parseChord(s)!, k).text;
    expect(rn('G')).toBe('I');
    expect(rn('Em')).toBe('vi');
    expect(rn('D7')).toBe('V7');
    expect(rn('F#dim')).toBe('vii°');
    expect(rn('F')).toBe('♭VII');
    const Am = { tonic: 'A', mode: 'minor' as const };
    expect(rn('F', Am)).toBe('VI');
    expect(rn('E7', Am)).toBe('V7');
    expect(rn('G', Am)).toBe('VII');
  });

  it('lists the seven chords of a key with roles', () => {
    const d = diatonicTriads({ tonic: 'D', mode: 'major' });
    expect(d.map((c) => c.chord.symbol)).toEqual(['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim']);
    expect(d.map((c) => c.numeral.text)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(d.map((c) => c.role)).toEqual(['home', 'away', 'home', 'away', 'tension', 'home', 'tension']);
    const e = diatonicTriads({ tonic: 'E', mode: 'minor' });
    expect(e.map((c) => c.chord.symbol)).toEqual(['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D']);
  });

  it('explains chords from outside the key', () => {
    const C = { tonic: 'C', mode: 'major' as const };
    expect(analyzeChordInKey(parseChord('Bb')!, C).role).toBe('borrowed');
    expect(analyzeChordInKey(parseChord('Fm')!, C).role).toBe('borrowed');
    expect(analyzeChordInKey(parseChord('D')!, C).role).toBe('secondary');
    expect(analyzeChordInKey(parseChord('E')!, C).role).toBe('secondary');
    expect(analyzeChordInKey(parseChord('E')!, { tonic: 'A', mode: 'minor' }).role).toBe('tension');
  });
});

describe('chord text', () => {
  it('reads plain chord lists and bar notation', () => {
    expect(extractChords('G D Em C').map((e) => e.chord.symbol)).toEqual(['G', 'D', 'Em', 'C']);
    expect(extractChords('| Am | F | C | G |').map((e) => e.chord.symbol)).toEqual(['Am', 'F', 'C', 'G']);
    expect(extractChords('G - D - Em - C').map((e) => e.chord.symbol)).toEqual(['G', 'D', 'Em', 'C']);
  });

  it('skips lyric lines in a chord sheet', () => {
    const sheet = `[Verse]\nG          D\nA day in the life of a song\nEm        C\nAnd I sing along`;
    expect(extractChords(sheet).map((e) => e.chord.symbol)).toEqual(['G', 'D', 'Em', 'C']);
  });

  it('reads ChordPro brackets', () => {
    expect(extractChords('[C]Here comes the [G]sun, [Am]doo [F]doo').map((e) => e.chord.symbol)).toEqual(['C', 'G', 'Am', 'F']);
  });
});

describe('key detection', () => {
  const keyOf = (text: string) => {
    const est = estimateKeyFromChords(extractChords(text));
    return `${est.best.key.tonic} ${est.best.key.mode}`;
  };

  it('finds the key of common progressions', () => {
    expect(keyOf('G D Em C G D Em C')).toBe('G major');
    expect(keyOf('C G Am F C G Am F C')).toBe('C major');
    expect(keyOf('Am F C G Am F C G Am')).toBe('A minor');
    expect(keyOf('E A B7 E')).toBe('E major');
    expect(keyOf('Dm Bb C Dm')).toBe('D minor');
    expect(keyOf('A F#m D E A')).toBe('A major');
    expect(keyOf('Em C G D Em')).toBe('E minor');
    expect(keyOf('F Bb C F')).toBe('F major');
    expect(keyOf('Bm G D A Bm')).toBe('B minor');
    expect(keyOf('Am G F E Am')).toBe('A minor');
  });

  it('gives a confidence between 0 and 1 and alternatives', () => {
    const est = estimateKeyFromChords(extractChords('G D Em C'));
    expect(est.confidence).toBeGreaterThan(0);
    expect(est.confidence).toBeLessThanOrEqual(1);
    expect(est.alternatives).toHaveLength(3);
  });

  it('matches a pure major-scale pitch profile to its key', () => {
    const chroma = new Array(12).fill(0);
    // D major scale with the home note and fifth emphasized.
    [2, 4, 6, 7, 9, 11, 1].forEach((pc) => (chroma[pc] = 1));
    chroma[2] = 2.2;
    chroma[9] = 1.6;
    const scores = scoreKeysFromChroma(chroma);
    const best = scores.indexOf(Math.max(...scores));
    expect(ALL_KEYS[best]).toMatchObject({ tonic: 'D', mode: 'major' });
  });
});

describe('progressions', () => {
  const G = { tonic: 'G', mode: 'major' as const };

  it('reduces numerals to triads', () => {
    expect(triadNumeral('V7')).toBe('V');
    expect(triadNumeral('♭VII')).toBe('bVII');
    expect(triadNumeral('iiø7')).toBe('ii°');
    expect(triadNumeral('Isus4')).toBe('I');
  });

  it('names a typed four-chord loop', () => {
    const p = findProgressions(extractChords('G D Em C'), G);
    expect(p[0].numerals).toEqual(['I', 'V', 'vi', 'IV']);
    expect(p[0].named?.name).toBe('The pop progression');
  });

  it('finds the repeating loop in a longer song', () => {
    const verse = 'G D Em C '.repeat(4);
    const chorus = 'C D G Em '.repeat(2);
    const p = findProgressions(extractChords(verse + chorus + verse), G);
    expect(p[0].chords).toEqual(['G', 'D', 'Em', 'C']);
    expect(p[0].count).toBeGreaterThanOrEqual(6);
  });

  it('spots a minor-key loop and rotations', () => {
    const Am = { tonic: 'A', mode: 'minor' as const };
    expect(findProgressions(extractChords('Am F C G'), Am)[0].named?.name).toBe('The minor pop loop');
    expect(findProgressions(extractChords('Em C G D'), G)[0].named?.name).toBe('The sad pop loop');
    expect(findProgressions(extractChords('D Em C G'), G)[0].named?.rotated).toBe(true);
  });

  it('detects cadences', () => {
    const c = findCadences(extractChords('G C D G Em C D Em C G'), G);
    expect(c.map((x) => x.kind)).toEqual(expect.arrayContaining(['authentic', 'deceptive', 'plagal']));
  });
});
