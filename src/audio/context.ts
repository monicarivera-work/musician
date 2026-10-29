let ctx: AudioContext | null = null;

type SessionType = 'auto' | 'playback' | 'play-and-record';

/** One shared AudioContext; browsers allow only a handful per page. */
export function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext({ latencyHint: 'interactive' });
  return ctx;
}

/** Must be called from a tap or click: phones keep audio locked until a user gesture. */
export async function unlockAudio(session: SessionType = 'playback'): Promise<AudioContext> {
  setAudioSession(session);
  const c = audioContext();
  if (c.state !== 'running') await c.resume();
  return c;
}

/** iOS: "playback" keeps sound on when the ring switch is silent; recording needs "play-and-record". */
export function setAudioSession(type: SessionType): void {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (!nav.audioSession) return;
  try {
    nav.audioSession.type = type;
  } catch {
    // Older Safari versions expose the object but reject some values.
  }
}
