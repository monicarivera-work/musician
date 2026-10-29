---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/ui/SongScreen.tsx","src/ui/ScalesScreen.tsx","src/ui/SingScreen.tsx","src/ui/ProgressScreen.tsx"]
---

## Scope and mode

The whole app shell and its four screens (Song, Scales, Sing, Progress). Mode: Operate. The visitor completes tasks: analyze a song, study a scale, sing a timed run, review best times.

## Task and content

- Song: four inputs (search with 30-second preview analysis, typed chords, listen, file). Result: key at display size with "How sure" and alternatives, the scale ladder with chord tags, facts margin, chord loops as bar-lined chord charts with repeat signs, chord boxes, cadences, the key's seven chords, a chord editor.
- Scales: home note and scale pickers, the Modulator with neighbor-key columns, fretboard, staff, chords of the key, step list.
- Sing: setup (start note, direction, strictness, reference notes, range finder), the live run (timer, target, cue words, singing ladder), results with coaching.
- Progress: tally, best times with trend bars, clear history.

## Direction and memorable moment

The Tonic Sol-fa Modulator (seed e22fdcb7). Memorable moment: the voice trail climbing the cobalt ladder, turning pointer-yellow when in tune while the target rung fills, then the rung keeping its time.

## Constraints

- Every theory term is tappable for a plain-English explanation.
- Audio-derived results always show certainty and can be corrected; no time-signature claim from audio.
- Primary action per screen in pointer yellow; it docks at thumb height on the Song result on phones.

## Unresolved

- Product name (placeholder "Musician", from the repository name).
