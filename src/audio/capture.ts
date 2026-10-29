import { audioContext } from './context';

export interface Recording {
  pcm: Float32Array;
  sampleRate: number;
}

/**
 * Record raw microphone audio for a fixed time. Reports progress (0..1) and
 * loudness (0..1) so the screen can show that it is hearing something.
 */
export async function recordFor(
  stream: MediaStream,
  seconds: number,
  onTick: (progress: number, level: number) => void,
  signal?: AbortSignal,
): Promise<Recording> {
  const ctx = audioContext();
  const source = ctx.createMediaStreamSource(stream);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  const chunks: Float32Array[] = [];
  let collected = 0;
  const target = Math.floor(seconds * ctx.sampleRate);
  let cleanup: (() => void) | null = null;

  const done = new Promise<void>((resolve, reject) => {
    const push = (block: Float32Array) => {
      chunks.push(block);
      collected += block.length;
      let s = 0;
      for (let i = 0; i < block.length; i++) s += block[i] * block[i];
      const db = 20 * Math.log10(Math.sqrt(s / block.length) + 1e-9);
      onTick(Math.min(1, collected / target), Math.max(0, Math.min(1, (db + 60) / 50)));
      if (collected >= target) resolve();
    };
    signal?.addEventListener('abort', () => reject(new DOMException('Stopped', 'AbortError')));

    const startScriptProcessor = () => {
      const sp = ctx.createScriptProcessor(4096, 1, 1);
      sp.onaudioprocess = (e) => push(e.inputBuffer.getChannelData(0).slice());
      source.connect(sp).connect(mute).connect(ctx.destination);
      cleanup = () => {
        sp.onaudioprocess = null;
        sp.disconnect();
      };
    };

    if (!ctx.audioWorklet) {
      startScriptProcessor();
      return;
    }
    ctx.audioWorklet
      .addModule(`${import.meta.env.BASE_URL}capture-worklet.js`)
      .then(() => {
        const node = new AudioWorkletNode(ctx, 'capture-processor');
        node.port.onmessage = (e: MessageEvent<Float32Array>) => push(e.data);
        source.connect(node).connect(mute).connect(ctx.destination);
        cleanup = () => {
          node.port.onmessage = null;
          node.disconnect();
        };
      })
      .catch(startScriptProcessor);
  });

  try {
    await done;
  } finally {
    (cleanup as (() => void) | null)?.();
    source.disconnect();
    mute.disconnect();
  }
  const pcm = new Float32Array(collected);
  let offset = 0;
  for (const c of chunks) {
    pcm.set(c, offset);
    offset += c.length;
  }
  return { pcm, sampleRate: ctx.sampleRate };
}
