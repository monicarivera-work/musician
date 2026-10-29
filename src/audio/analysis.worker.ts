/// <reference lib="webworker" />
import { analyzeSamples, type AudioAnalysis } from './analysis';

export interface AnalysisRequest {
  id: number;
  samples: Float32Array;
  rate: number;
}

export type AnalysisResponse = { id: number; ok: true; result: AudioAnalysis } | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  const { id, samples, rate } = event.data;
  try {
    const result = analyzeSamples(samples, rate);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, ok: true, result } satisfies AnalysisResponse);
  } catch (err) {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, ok: false, error: String(err) } satisfies AnalysisResponse);
  }
};
