import { ANALYSIS_RATE } from './analysis';
import { audioContext } from './context';

export class DecodeError extends Error {}

/** Decode any audio file the browser understands (MP3, M4A/AAC, WAV...). */
export async function decodeAudio(data: ArrayBuffer): Promise<AudioBuffer> {
  try {
    return await audioContext().decodeAudioData(data.slice(0));
  } catch {
    throw new DecodeError('This file could not be read as audio. Try an MP3, M4A, or WAV file.');
  }
}

/** Mix to mono and resample for analysis; long files are trimmed to keep phones responsive. */
export async function toAnalysisRate(buffer: AudioBuffer, maxSeconds = 300): Promise<Float32Array> {
  const seconds = Math.min(buffer.duration, maxSeconds);
  const length = Math.max(1, Math.ceil(seconds * ANALYSIS_RATE));
  const offline = new OfflineAudioContext(1, length, ANALYSIS_RATE);
  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

export async function pcmToAnalysisRate(pcm: Float32Array, sampleRate: number): Promise<Float32Array> {
  const buffer = new AudioBuffer({ length: Math.max(1, pcm.length), numberOfChannels: 1, sampleRate });
  buffer.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
  return toAnalysisRate(buffer);
}
