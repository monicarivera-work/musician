import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MusicKey } from '../theory/keys';
import type { ScaleId } from '../theory/scales';
import type { Direction, Tolerance } from '../practice/run';
import type { VocalRange } from '../practice/range';
import { exampleSong, type SongAnalysis } from '../songs/song-analysis';
import { load, save } from './persist';

export interface ScaleChoice {
  tonic: string;
  scaleId: ScaleId;
}

export interface SingSettings {
  direction: Direction;
  tolerance: Tolerance;
  helper: boolean;
  /** Octave shift applied on top of the automatic octave choice. */
  octaveShift: number;
}

interface AppState {
  scale: ScaleChoice;
  setScale: (s: ScaleChoice) => void;
  adoptKey: (k: MusicKey) => void;
  song: SongAnalysis;
  setSong: (s: SongAnalysis) => void;
  recent: SongAnalysis[];
  forgetSong: (id: string) => void;
  sing: SingSettings;
  setSing: (s: Partial<SingSettings>) => void;
  range: VocalRange | null;
  setRange: (r: VocalRange | null) => void;
}

const Ctx = createContext<AppState | null>(null);

const DEFAULT_SING: SingSettings = { direction: 'up', tolerance: 'normal', helper: true, octaveShift: 0 };

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<ScaleChoice>(() => load('scale', { tonic: 'G', scaleId: 'major' }));
  const [recent, setRecent] = useState<SongAnalysis[]>(() => load('songs', []));
  const [song, setSongState] = useState<SongAnalysis>(() => recent[0] ?? exampleSong());
  const [sing, setSingState] = useState<SingSettings>(() => ({ ...DEFAULT_SING, ...load('sing', {}) }));
  const [range, setRangeState] = useState<VocalRange | null>(() => load('range', null));

  useEffect(() => save('scale', scale), [scale]);
  useEffect(() => save('songs', recent), [recent]);
  useEffect(() => save('sing', sing), [sing]);
  useEffect(() => save('range', range), [range]);

  const setScale = useCallback((s: ScaleChoice) => setScaleState(s), []);
  const adoptKey = useCallback((k: MusicKey) => setScaleState({ tonic: k.tonic, scaleId: k.mode === 'major' ? 'major' : 'minor' }), []);

  const setSong = useCallback((s: SongAnalysis) => {
    setSongState(s);
    if (s.source !== 'example') setRecent((list) => [s, ...list.filter((x) => x.id !== s.id)].slice(0, 20));
  }, []);

  const forgetSong = useCallback(
    (id: string) => {
      setRecent((list) => list.filter((x) => x.id !== id));
      setSongState((cur) => (cur.id === id ? exampleSong() : cur));
    },
    [],
  );

  const setSing = useCallback((s: Partial<SingSettings>) => setSingState((cur) => ({ ...cur, ...s })), []);
  const setRange = useCallback((r: VocalRange | null) => setRangeState(r), []);

  const value = useMemo(
    () => ({ scale, setScale, adoptKey, song, setSong, recent, forgetSong, sing, setSing, range, setRange }),
    [scale, setScale, adoptKey, song, setSong, recent, forgetSong, sing, setSing, range, setRange],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppStateProvider');
  return v;
}
