import { PitchDetector } from 'pitchy';
import { freqToMidi } from '../theory/notes';

export interface PitchReading {
  /** Sung pitch as a fractional MIDI number, or null when no clear note is heard. */
  midi: number | null;
  /** 0..1 loudness for a level meter. */
  level: number;
  clarity: number;
}

const MIN_HZ = 60;
const MAX_HZ = 1400;

/** Median of recent readings: smooths jitter and drops one-frame octave glitches. */
export class PitchSmoother {
  private history: number[] = [];

  constructor(readonly size = 5) {}

  push(midi: number | null): number | null {
    if (midi === null) {
      this.history = [];
      return null;
    }
    const sorted = [...this.history].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : midi;
    // A real jump to a new note: start fresh so the display follows quickly.
    if (this.history.length >= 3 && Math.abs(midi - median) > 1.5) {
      const recent = this.history.slice(-2);
      if (recent.every((m) => Math.abs(m - midi) < 1)) this.history = [...recent];
    }
    this.history.push(midi);
    if (this.history.length > this.size) this.history.shift();
    const s = [...this.history].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  reset(): void {
    this.history = [];
  }
}

export class PitchTracker {
  private readonly analyser: AnalyserNode;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly buffer: Float32Array<ArrayBuffer>;
  private readonly detector: PitchDetector<Float32Array>;
  private readonly smoother = new PitchSmoother(5);

  constructor(
    private readonly ctx: AudioContext,
    stream: MediaStream,
    size = 2048,
  ) {
    this.source = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = size;
    this.source.connect(this.analyser);
    this.buffer = new Float32Array(size);
    this.detector = PitchDetector.forFloat32Array(size);
    this.detector.minVolumeDecibels = -48;
  }

  read(): PitchReading {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) sum += this.buffer[i] * this.buffer[i];
    const rms = Math.sqrt(sum / this.buffer.length);
    const db = 20 * Math.log10(rms + 1e-9);
    const level = Math.max(0, Math.min(1, (db + 60) / 50));
    const [hz, clarity] = this.detector.findPitch(this.buffer, this.ctx.sampleRate);
    const voiced = clarity >= 0.88 && hz >= MIN_HZ && hz <= MAX_HZ && db > -50;
    const midi = this.smoother.push(voiced ? freqToMidi(hz) : null);
    return { midi, level, clarity };
  }

  dispose(): void {
    this.source.disconnect();
    this.analyser.disconnect();
  }
}
