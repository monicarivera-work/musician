import { parseChord, type ParsedChord } from './chords';

export interface ChordEvent {
  chord: ParsedChord;
  /** Relative length: beats when known from audio, otherwise 1 per written chord. */
  weight: number;
  /** Start time in seconds, when the chord came from audio. */
  time?: number;
}

const SEPARATORS = /[|,]+|\s+-\s+|\s+/;
const IGNORED = /^(n\.?c\.?|x\d+|\(?x\d+\)?|%|\/|-|:\|\|?|\|\|?:|\d+x)$/i;

/**
 * Pull the chords out of anything a person might paste: "G D Em C",
 * "| Am | F | C | G |", a chord sheet with lyric lines, or ChordPro "[G]lyrics".
 */
export function extractChords(text: string): ChordEvent[] {
  // ChordPro puts chords in brackets; section labels like [Verse] are not chords.
  const bracketed = [...text.matchAll(/\[([^\]\s]+)\]/g)].map((m) => parseChord(m[1])).filter((c): c is ParsedChord => !!c);
  if (bracketed.length) return bracketed.map((chord) => ({ chord, weight: 1 }));
  const events: ChordEvent[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\[[^\]]*\]\s*$/.test(line)) continue;
    const tokens = line
      .trim()
      .split(SEPARATORS)
      .map((t) => t.trim())
      .filter((t) => t && !IGNORED.test(t));
    if (!tokens.length) continue;
    const parsed = tokens.map(parseChord);
    const hits = parsed.filter(Boolean).length;
    // A lyric line may contain "A" or "Am"; only treat mostly-chord lines as chords.
    if (hits / tokens.length < 0.6) continue;
    for (const c of parsed) if (c) events.push({ chord: c, weight: 1 });
  }
  return events;
}

/** Merge immediate repeats ("G G D" -> "G D"), adding their weights. */
export function collapseRepeats(events: ChordEvent[]): ChordEvent[] {
  const out: ChordEvent[] = [];
  for (const e of events) {
    const last = out[out.length - 1];
    if (last && last.chord.symbol === e.chord.symbol) last.weight += e.weight;
    else out.push({ ...e });
  }
  return out;
}
