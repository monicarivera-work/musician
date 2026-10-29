import { describe, expect, it } from 'vitest';
import { PitchDetector } from 'pitchy';
import { renderPluck } from '../src/audio/synth';
import { PitchSmoother } from '../src/audio/pitch';
import { freqToMidi } from '../src/theory/notes';

describe('plucked-string synth', () => {
  it.each([40, 52, 64, 76, 88])('is in tune to within 3 cents at MIDI %i', (midi) => {
    const rate = 48000;
    const data = renderPluck(rate, midi, 1.0);
    const size = 4096;
    const detector = PitchDetector.forFloat32Array(size);
    const [hz, clarity] = detector.findPitch(data.subarray(4800, 4800 + size), rate);
    expect(clarity).toBeGreaterThan(0.9);
    expect(Math.abs(freqToMidi(hz) - midi) * 100).toBeLessThan(3);
  });
});

describe('pitch smoother', () => {
  it('drops a one-frame octave glitch', () => {
    const s = new PitchSmoother(5);
    const out = [60, 60.1, 72, 60, 60.05].map((m) => s.push(m));
    expect(out[2]).toBeCloseTo(60.1, 1);
  });

  it('follows a real jump to a new note quickly', () => {
    const s = new PitchSmoother(5);
    [60, 60, 60, 60].forEach((m) => s.push(m));
    const out = [64, 64, 64].map((m) => s.push(m));
    expect(out[2]).toBe(64);
  });
});
