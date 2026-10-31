import { analyzeSamples, ANALYSIS_RATE, type AudioAnalysis } from './analysis';
import type { AnalysisRequest, AnalysisResponse } from './analysis.worker';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (a: AudioAnalysis) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<AnalysisResponse>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data.result);
      else p.reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      for (const p of pending.values()) p.reject(new Error('Analysis stopped unexpectedly.'));
      pending.clear();
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

/** Run the heavy analysis off the main thread so the screen stays responsive. */
export function analyzeInBackground(samples: Float32Array, rate = ANALYSIS_RATE): Promise<AudioAnalysis> {
  const w = getWorker();
  if (!w) return Promise.resolve(analyzeSamples(samples, rate));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, samples, rate } satisfies AnalysisRequest, [samples.buffer]);
  });
}
