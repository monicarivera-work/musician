import { useEffect, useRef, useState } from 'react';
import { setAudioSession, unlockAudio } from '../audio/context';
import { closeMic, MIC_HELP, MicError, openMic, type MicProblem } from '../audio/mic';
import { PitchTracker, type PitchReading } from '../audio/pitch';

export type LiveState = { status: 'off' } | { status: 'starting' } | { status: 'live' } | { status: 'error'; problem: MicProblem; title: string; fix: string };

type WakeLockSentinelLike = { release: () => Promise<void> };

/**
 * While active: opens the microphone, reads the sung pitch every animation
 * frame, and keeps the screen awake (handy with the phone on a music stand).
 */
export function useLiveVoice(active: boolean, onFrame: (reading: PitchReading, now: number) => void): LiveState {
  const [state, setState] = useState<LiveState>({ status: 'off' });
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    if (!active) {
      setState({ status: 'off' });
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;
    let tracker: PitchTracker | null = null;
    let raf = 0;
    let wake: WakeLockSentinelLike | null = null;

    (async () => {
      setState({ status: 'starting' });
      try {
        setAudioSession('play-and-record');
        const ctx = await unlockAudio('play-and-record');
        stream = await openMic();
        if (cancelled) return;
        tracker = new PitchTracker(ctx, stream, ctx.sampleRate > 50000 ? 4096 : 2048);
        try {
          const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } };
          wake = (await nav.wakeLock?.request('screen')) ?? null;
        } catch {
          // Wake lock is a nicety; ignore refusals.
        }
        setState({ status: 'live' });
        const loop = () => {
          if (cancelled || !tracker) return;
          cb.current(tracker.read(), performance.now());
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (err) {
        if (cancelled) return;
        const problem: MicProblem = err instanceof MicError ? err.problem : 'unknown';
        setState({ status: 'error', problem, ...MIC_HELP[problem] });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      tracker?.dispose();
      closeMic(stream);
      void wake?.release().catch(() => {});
      setAudioSession('playback');
    };
  }, [active]);

  return state;
}
