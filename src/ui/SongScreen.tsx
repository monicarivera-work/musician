import { useEffect, useRef, useState, type FormEvent } from 'react';
import { analyzeInBackground } from '../audio/analyze-client';
import { recordFor } from '../audio/capture';
import { setAudioSession, unlockAudio } from '../audio/context';
import { decodeAudio, DecodeError, pcmToAnalysisRate, toAnalysisRate } from '../audio/decode';
import { closeMic, MIC_HELP, MicError, openMic } from '../audio/mic';
import { fetchPreview, searchSongs, SearchError, type SongHit } from '../songs/itunes';
import { fromAudio, fromChordText, songMetaFromHit, type SongAnalysis } from '../songs/song-analysis';
import { keyLabel } from '../theory/keys';
import { useApp } from '../state/store';
import { IconChords, IconClose, IconEar, IconFile, IconSearch } from './icons';
import { SongResult } from './SongResult';
import { effectiveKey } from '../songs/song-analysis';

type InputMode = 'search' | 'chords' | 'listen' | 'file';

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; steps: string[]; step: number; progress?: number; level?: number; cancel?: () => void }
  | { kind: 'error'; title: string; fix: string };

const MODES: { id: InputMode; label: string; Icon: typeof IconSearch }[] = [
  { id: 'search', label: 'Search', Icon: IconSearch },
  { id: 'chords', label: 'Chords', Icon: IconChords },
  { id: 'listen', label: 'Listen', Icon: IconEar },
  { id: 'file', label: 'File', Icon: IconFile },
];

const LISTEN_SECONDS = 20;

export function SongScreen() {
  const { song, setSong, recent, forgetSong } = useApp();
  const [mode, setMode] = useState<InputMode>('search');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const resultRef = useRef<HTMLDivElement>(null);
  const busy = status.kind === 'working';

  const finish = (s: SongAnalysis) => {
    setSong(s);
    setStatus({ kind: 'idle' });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const fail = (err: unknown) => {
    if ((err as DOMException)?.name === 'AbortError') {
      setStatus({ kind: 'idle' });
      return;
    }
    if (err instanceof MicError) setStatus({ kind: 'error', ...MIC_HELP[err.problem] });
    else if (err instanceof SearchError) setStatus({ kind: 'error', title: err.message, fix: 'Check your connection, or type the chords instead.' });
    else if (err instanceof DecodeError) setStatus({ kind: 'error', title: 'That file could not be opened', fix: err.message });
    else setStatus({ kind: 'error', title: 'Something went wrong while listening', fix: 'Try again. If it keeps happening, try a different song or file.' });
  };

  const analyzeHit = async (hit: SongHit) => {
    const ctrl = new AbortController();
    const steps = ['Downloading the 30-second preview', 'Decoding the audio', 'Listening for the key, beat, and chords'];
    try {
      setStatus({ kind: 'working', steps, step: 0, cancel: () => ctrl.abort() });
      const data = await fetchPreview(hit, ctrl.signal);
      setStatus({ kind: 'working', steps, step: 1, cancel: () => ctrl.abort() });
      const buffer = await decodeAudio(data);
      const samples = await toAnalysisRate(buffer);
      if (ctrl.signal.aborted) throw new DOMException('Stopped', 'AbortError');
      setStatus({ kind: 'working', steps, step: 2 });
      const result = await analyzeInBackground(samples);
      finish(fromAudio(result, 'search', songMetaFromHit(hit)));
    } catch (err) {
      fail(err);
    }
  };

  const analyzeFile = async (file: File) => {
    const steps = ['Opening your file', 'Listening for the key, beat, and chords'];
    try {
      setStatus({ kind: 'working', steps, step: 0 });
      const buffer = await decodeAudio(await file.arrayBuffer());
      const samples = await toAnalysisRate(buffer);
      setStatus({ kind: 'working', steps, step: 1 });
      const result = await analyzeInBackground(samples);
      const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Your audio file';
      finish(fromAudio(result, 'file', { title, durationMs: Math.round(buffer.duration * 1000) }));
    } catch (err) {
      fail(err);
    }
  };

  const listen = async () => {
    const ctrl = new AbortController();
    const steps = [`Listening for ${LISTEN_SECONDS} seconds`, 'Finding the key, beat, and chords'];
    let stream: MediaStream | null = null;
    try {
      setAudioSession('play-and-record');
      await unlockAudio('play-and-record');
      stream = await openMic();
      setStatus({ kind: 'working', steps, step: 0, progress: 0, level: 0, cancel: () => ctrl.abort() });
      const rec = await recordFor(
        stream,
        LISTEN_SECONDS,
        (progress, level) => setStatus({ kind: 'working', steps, step: 0, progress, level, cancel: () => ctrl.abort() }),
        ctrl.signal,
      );
      closeMic(stream);
      stream = null;
      setStatus({ kind: 'working', steps, step: 1 });
      const samples = await pcmToAnalysisRate(rec.pcm, rec.sampleRate);
      const result = await analyzeInBackground(samples);
      const when = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      finish(fromAudio(result, 'listen', { title: `Song heard at ${when}` }));
    } catch (err) {
      fail(err);
    } finally {
      closeMic(stream);
      setAudioSession('playback');
    }
  };

  return (
    <div className="screen">
      <section className="intake" aria-labelledby="intake-h">
        <h1 className="h1" id="intake-h">
          Put in a song
        </h1>
        <p className="lede">See its key, its scale, and the chord loops it is built on.</p>

        <div className="seg seg--full intake__modes" role="tablist" aria-label="How to put in a song">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={mode === id}
              aria-controls={`panel-${id}`}
              onClick={() => setMode(id)}
              disabled={busy}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="intake__panel" role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
          {mode === 'search' && <SearchPanel onPick={analyzeHit} disabled={busy} />}
          {mode === 'chords' && <ChordsPanel onDone={finish} disabled={busy} />}
          {mode === 'listen' && (
            <div className="stack">
              <p className="small">
                Play the song out loud and hold your phone near the speaker. The app listens for {LISTEN_SECONDS} seconds; a chorus works best.
              </p>
              <button type="button" className="btn btn--primary btn--big btn--block" onClick={listen} disabled={busy}>
                <IconEar size={20} /> Start listening
              </button>
            </div>
          )}
          {mode === 'file' && (
            <div className="stack">
              <p className="small">
                Pick an MP3, M4A, or WAV file from your phone, such as a voice memo or a downloaded track. Songs inside Apple Music or Spotify are locked
                and cannot be opened.
              </p>
              <label className={`btn btn--primary btn--big btn--block${busy ? ' is-disabled' : ''}`}>
                <IconFile size={20} /> Choose an audio file
                <input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void analyzeFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {status.kind === 'working' && <Working status={status} />}
        {status.kind === 'error' && (
          <div className="notice notice--error" role="alert">
            <div className="grow">
              <p className="notice__title">{status.title}</p>
              <p className="small">{status.fix}</p>
            </div>
            <button type="button" className="btn btn--quiet btn--small" onClick={() => setStatus({ kind: 'idle' })} aria-label="Dismiss">
              <IconClose size={18} />
            </button>
          </div>
        )}
      </section>

      <div ref={resultRef} className="result-anchor">
        <SongResult song={song} />
      </div>

      {recent.length > 0 && (
        <section className="section" aria-labelledby="recent-h">
          <h2 className="h2" id="recent-h">
            Your songs
          </h2>
          <ul className="recent">
            {recent.map((s) => (
              <li key={s.id} className={s.id === song.id ? 'is-current' : ''}>
                <button type="button" className="recent__open" onClick={() => finish(s)}>
                  {s.artwork ? <img src={s.artwork} alt="" width={44} height={44} /> : <span className="recent__blank" aria-hidden="true" />}
                  <span className="grow">
                    <span className="recent__title">{s.title}</span>
                    <span className="fine">{[s.artist, keyLabel(effectiveKey(s))].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
                <button type="button" className="btn btn--quiet btn--small" onClick={() => forgetSong(s.id)} aria-label={`Remove ${s.title}`}>
                  <IconClose size={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Working({ status }: { status: Extract<Status, { kind: 'working' }> }) {
  return (
    <div className="working" role="status" aria-live="polite">
      <ol className="working__steps">
        {status.steps.map((s, i) => (
          <li key={s} className={i < status.step ? 'is-done' : i === status.step ? 'is-now' : ''}>
            {s}
            {i === status.step && status.progress !== undefined && (
              <span className="working__bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${status.progress})` }} />
              </span>
            )}
            {i === status.step && status.level !== undefined && (
              <span className="working__level fine">{status.level > 0.15 ? 'Hearing music' : 'Too quiet: move closer to the speaker'}</span>
            )}
          </li>
        ))}
      </ol>
      {status.cancel && (
        <button type="button" className="btn btn--small" onClick={status.cancel}>
          Stop
        </button>
      )}
    </div>
  );
}

function SearchPanel({ onPick, disabled }: { onPick: (h: SongHit) => void; disabled: boolean }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SongHit[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      return;
    }
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setLoading(true);
      setError('');
      try {
        setHits(await searchSongs(term, c.signal));
      } catch (err) {
        if ((err as DOMException)?.name !== 'AbortError') setError((err as Error).message);
      } finally {
        if (ctrl.current === c) setLoading(false);
      }
    }, 380);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <form className="stack" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor="song-q">
        Song title or artist
      </label>
      <div className="searchfield">
        <IconSearch size={20} />
        <input
          id="song-q"
          className="field"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Song title or artist"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={disabled}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading && !hits && <p className="fine">Searching…</p>}
      {hits && hits.length === 0 && !loading && <p className="small">No songs found for &ldquo;{q.trim()}&rdquo;. Check the spelling or try the artist&rsquo;s name.</p>}
      {hits && hits.length > 0 && (
        <ul className="hits" aria-label="Search results">
          {hits.map((h) => (
            <li key={h.id}>
              <button type="button" className="hit" onClick={() => onPick(h)} disabled={disabled}>
                <img src={h.artwork} alt="" width={48} height={48} loading="lazy" />
                <span className="grow">
                  <span className="hit__title">{h.title}</span>
                  <span className="fine">{[h.artist, h.year].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="hit__go" aria-hidden="true">
                  Analyze
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!hits && !loading && <p className="fine">Song search uses Apple&rsquo;s free iTunes catalog and analyzes the 30-second preview on your phone.</p>}
    </form>
  );
}

const EXAMPLES = ['G D Em C', 'Am F C G', 'C Am F G', 'E A B7 E', 'Dm Bb F C'];

function ChordsPanel({ onDone, disabled }: { onDone: (s: SongAnalysis) => void; disabled: boolean }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const go = () => {
    const s = fromChordText(text, title);
    if (!s) {
      setError('No chords found. Write chord names like G, Em, or F#m7, separated by spaces. Lyric lines are skipped.');
      return;
    }
    setError('');
    onDone(s);
  };
  return (
    <div className="stack">
      <div>
        <label className="label" htmlFor="chords-text">
          Chords, in order
        </label>
        <textarea
          id="chords-text"
          className="field"
          placeholder={'G D Em C\n(or paste a whole chord sheet)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          disabled={disabled}
        />
      </div>
      <div className="chips" aria-label="Examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="chip serif" onClick={() => setText(ex)}>
            {ex}
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="chords-title">
          Song name <span className="fine">(optional)</span>
        </label>
        <input id="chords-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My favorite song" />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="button" className="btn btn--primary btn--big btn--block" onClick={go} disabled={disabled || !text.trim()}>
        Analyze these chords
      </button>
    </div>
  );
}
