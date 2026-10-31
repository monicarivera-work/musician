export type MicProblem = 'insecure' | 'unsupported' | 'denied' | 'missing' | 'busy' | 'unknown';

export class MicError extends Error {
  constructor(
    readonly problem: MicProblem,
    message: string,
  ) {
    super(message);
  }
}

export const MIC_HELP: Record<MicProblem, { title: string; fix: string }> = {
  insecure: {
    title: 'The microphone needs a secure page',
    fix: 'Open the app from its https:// address (the GitHub Pages link), not a plain http:// one.',
  },
  unsupported: {
    title: 'This browser cannot use the microphone',
    fix: 'Open the app in Safari on iPhone or Chrome on Android.',
  },
  denied: {
    title: 'Microphone access is turned off',
    fix: 'Allow the microphone for this site in your browser settings (on iPhone: Settings › Safari › Microphone), then try again.',
  },
  missing: {
    title: 'No microphone found',
    fix: 'Check that a microphone is connected, or unplug headphones without one.',
  },
  busy: {
    title: 'The microphone is busy',
    fix: 'Another app or tab is using it. Close that app, then try again.',
  },
  unknown: {
    title: 'The microphone could not start',
    fix: 'Reload the page and try again.',
  },
};

/** Raw microphone audio: voice processing would distort pitch, so it is switched off. */
export async function openMic(): Promise<MediaStream> {
  if (!window.isSecureContext) throw new MicError('insecure', MIC_HELP.insecure.title);
  if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported', MIC_HELP.unsupported.title);
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (err) {
    const name = (err as DOMException)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('denied', MIC_HELP.denied.title);
    if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new MicError('missing', MIC_HELP.missing.title);
    if (name === 'NotReadableError' || name === 'AbortError') throw new MicError('busy', MIC_HELP.busy.title);
    throw new MicError('unknown', MIC_HELP.unknown.title);
  }
}

export function closeMic(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}
