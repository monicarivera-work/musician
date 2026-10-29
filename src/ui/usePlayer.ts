import { useCallback } from 'react';
import { unlockAudio } from '../audio/context';
import { hum, playSequence, pluck, stopAll, strum } from '../audio/synth';
import type { ParsedChord } from '../theory/chords';
import { chordShape, shapeMidis, voiceChord } from '../theory/guitar';

export function chordMidis(chord: ParsedChord): number[] {
  const shape = chordShape(chord);
  return shape ? shapeMidis(shape) : voiceChord(chord);
}

/** Sound helpers that first unlock audio, since phones require a tap before any sound. */
export function usePlayer() {
  const note = useCallback(async (midi: number) => {
    await unlockAudio();
    pluck(midi, 0, 0.6);
  }, []);
  const chord = useCallback(async (c: ParsedChord) => {
    await unlockAudio();
    strum(chordMidis(c));
  }, []);
  const scale = useCallback(async (midis: number[]) => {
    await unlockAudio();
    stopAll();
    playSequence(midis);
  }, []);
  const loop = useCallback(async (chords: ParsedChord[], secondsPerChord = 1.1) => {
    const ctx = await unlockAudio();
    stopAll();
    const t0 = ctx.currentTime + 0.05;
    chords.forEach((c, i) => strum(chordMidis(c), t0 + i * secondsPerChord));
  }, []);
  const reference = useCallback(async (midi: number) => {
    await unlockAudio();
    return hum(midi);
  }, []);
  return { note, chord, scale, loop, reference, stop: stopAll };
}
