---
name: Musician
description: A Tonic Sol-fa wall chart rebuilt as a phone instrument, where every scale is a ladder you climb with your voice.
colors:
  paper: "#f6f7f9"
  paper-sunk: "#eceef3"
  paper-raised: "#ffffff"
  rule: "#d3d8e3"
  rule-strong: "#aab1c3"
  ink: "#131a2e"
  ink-2: "#454c63"
  ink-3: "#626982"
  cobalt: "#2b4bd8"
  cobalt-press: "#2140bf"
  cobalt-ink: "#1f37a8"
  cobalt-wash: "#e4e9fc"
  on-cobalt: "#ffffff"
  rung: "rgba(255, 255, 255, 0.92)"
  rung-faint: "rgba(255, 255, 255, 0.28)"
  pointer: "#ffc53d"
  pointer-press: "#f2b21c"
  pointer-wash: "#fff3cf"
  on-pointer: "#131a2e"
  home: "#2b4bd8"
  away: "#1f7a5c"
  away-ink: "#1a6a50"
  tension: "#c63a22"
  tension-ink: "#a93019"
  outside: "#626982"
  tape: "#131a2e"
  on-tape: "#f6f7f9"
  on-tape-dim: "rgba(246, 247, 249, 0.72)"
  paper-dark: "#0e1322"
  paper-sunk-dark: "#151b30"
  paper-raised-dark: "#1a2139"
  rule-dark: "#283050"
  rule-strong-dark: "#3c4670"
  ink-dark: "#eceff7"
  ink-2-dark: "#b6bcd0"
  ink-3-dark: "#8d94ab"
  cobalt-dark: "#3355e8"
  cobalt-press-dark: "#2a49d1"
  cobalt-ink-dark: "#a5b6ff"
  cobalt-wash-dark: "#1b2552"
  pointer-wash-dark: "#3a3218"
  home-dark: "#4d6cf0"
  away-dark: "#2b9a74"
  away-ink-dark: "#63d3a8"
  tension-dark: "#d9482e"
  tension-ink-dark: "#ff8f74"
  outside-dark: "#8d94ab"
  tape-dark: "#05080f"
typography:
  display:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(3rem, 13vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.875rem"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
  subhead:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.35
  lede:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  fine:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 650
    lineHeight: 1
  note:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1
  noteList:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 750
    lineHeight: 1
  chordName:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.5rem"
    fontWeight: 750
    lineHeight: 1
  timeSmall:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
  chord:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.625rem"
    fontWeight: 750
    lineHeight: 1
  fact:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  solfa:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontWeight: 500
  numeral:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontWeight: 400
  timer:
    fontFamily: "'Besley Variable', Georgia, 'Times New Roman', serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1, 'lnum' 1"
rounded:
  square: "0px"
  tag: "2px"
  chord-tag: "3px"
  control: "4px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-hover:
    backgroundColor: "{colors.paper-sunk}"
  button-go:
    backgroundColor: "{colors.pointer}"
    textColor: "{colors.on-pointer}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "60px"
  button-go-hover:
    backgroundColor: "{colors.pointer-press}"
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-press}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.cobalt-wash}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.tension-ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "48px"
  button-big:
    height: "60px"
  button-small:
    padding: "0 12px"
    height: "40px"
  segmented:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  chip:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  chip-note:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
    width: "48px"
  field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "52px"
  notice:
    backgroundColor: "{colors.pointer-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px"
  notice-error:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px"
  band-top:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.on-tape}"
    height: "56px"
  nav-tab:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.on-tape-dim}"
    height: "64px"
  nav-tab-active:
    textColor: "{colors.on-tape}"
  keychip:
    backgroundColor: "transparent"
    textColor: "{colors.on-tape}"
    rounded: "{rounded.control}"
    padding: "0 12px 0 10px"
    height: "40px"
  bottom-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "24px"
    width: "560px"
  ladder-column:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.square}"
    width: "74px"
  ladder-neighbor-column:
    backgroundColor: "{colors.cobalt-wash}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.square}"
    width: "34px"
  ladder-changed-tag:
    backgroundColor: "{colors.pointer}"
    textColor: "{colors.on-pointer}"
    rounded: "{rounded.tag}"
    height: "18px"
  chord-mark-home:
    backgroundColor: "{colors.home}"
    textColor: "{colors.on-cobalt}"
    rounded: "3px"
    padding: "0 6px"
    height: "22px"
  chord-mark-away:
    backgroundColor: "{colors.away}"
    textColor: "{colors.on-cobalt}"
    rounded: "3px"
    padding: "0 6px"
    height: "22px"
  chord-mark-tension:
    backgroundColor: "{colors.tension}"
    textColor: "{colors.on-cobalt}"
    rounded: "3px"
    padding: "0 6px"
    height: "22px"
  chord-mark-outside:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "3px"
    padding: "0 6px"
    height: "22px"
  role-label-home:
    textColor: "{colors.cobalt-ink}"
  role-label-away:
    textColor: "{colors.away-ink}"
  role-label-tension:
    textColor: "{colors.tension-ink}"
  role-label-outside:
    textColor: "{colors.ink-2}"
  landed-time-tag:
    backgroundColor: "{colors.on-cobalt}"
    textColor: "{colors.on-pointer}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  best-time-stamp:
    backgroundColor: "{colors.pointer}"
    textColor: "{colors.on-pointer}"
    rounded: "{rounded.square}"
    padding: "4px 10px"
  fretboard-dot:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    size: "23px"
  fretboard-dot-home:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    size: "23px"
  range-panel:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.control}"
    padding: "24px"
---

# Design System: Musician

## Overview

**Creative North Star: "The Modulator"**

The Modulator was the Tonic Sol-fa classroom wall chart: a tall column of syllables, with the neighboring keys in columns beside it, that a teacher pointed at while the class sang. Musician rebuilds it as a phone instrument. Song analysis, scale study, and singing all hang from the same vertical pitch ladder, a cobalt column whose white rungs are spaced by real half steps, so the distance between two notes is visible before it is sung. Pitch is always height. The system refuses the category's grid of cards and its round tuner dial.

The surface is a printed chart, not an app skin. A cool chart-white sheet carries navy-black ink; ink binding-tape bands close the top and bottom of the screen; sections open with ruled ink lines instead of boxes. Besley, a Clarendon slab, letters everything musical at poster weight (keys, notes, chords, numerals, syllables, times) while the phone's own sans runs the controls. Color is spent only as meaning: cobalt is the ladder and home, pointer yellow is "here, now, you", and green and vermilion are the away and tension jobs of chords. Density is calm and one-handed: one column on the phone, 48px targets, the go button within reach of the thumb.

Light and dark both ship, following the system color scheme. The light chart is the native printed object; the dark chart deepens the sheet to night navy and keeps every ink's role. Motion is one authored moment, the ladder unrolling downward like a pull-down chart, plus the pointer stepping from rung to rung with the sound; reduced motion collapses all of it.

**Key Characteristics:**
- One vertical pitch ladder anchors every musical screen; rung spacing is the real interval.
- Flat chart-white sheet, navy ink, ink binding-tape bands top and bottom, ruled sections instead of boxes.
- Besley (Clarendon slab) letters the music and the headings; the system sans runs the interface.
- Color is meaning: cobalt is the ladder and home, pointer yellow is here/now/you, green is away, vermilion is tension.
- Square chart edges: 4px on controls and inline panels; bands, ladders, bars, and sheets stay square.
- Light and dark both ship; the light chart is the native object.

## Colors

A printed chart's palette: one cool paper, one navy ink, and four working inks that each mean exactly one thing.

Every token has a light value (the native printed chart) and, where it changes, a `-dark` sibling applied under `prefers-color-scheme: dark`. White, pointer yellow, and the ink lettered on them never change between schemes.

### Primary
- **Modulator Cobalt** (#2b4bd8; dark #3355e8): The ladder itself: the Modulator column, the singing field, the range-finding panel, and the 6px band across the top of every bottom sheet. Also the fill of buttons that commit an input (start listening, upload a file, analyze typed chords, update the breakdown), switched-on toggles, filled confidence squares, finished analysis steps, progress bars, and the bars of past runs. Presses to **Pressed Cobalt** (#2140bf; dark #2a49d1).
- **Cobalt Ink** (#1f37a8; dark #a5b6ff): Cobalt at text strength: home note labels, half-step gap words, quiet buttons, inline links, source tags, neighbor-key lettering.
- **Cobalt Wash** (#e4e9fc; dark #1b2552): The pale neighbor-key columns beside the ladder and the hover fill of quiet buttons.
- **Rung White** (#ffffff), drawn as **Rung** (white at 92%) and **Half-Step Tick** (white at 28%): Rungs, and all lettering on cobalt and on chord-job fills. The home rung is solid white.

### Secondary
- **Pointer Yellow** (#ffc53d): The teacher's pointer, governed by the Pointer Rule below. Presses to **Pressed Pointer** (#f2b21c).
- **Pointer Wash** (#fff3cf; dark #3a3218): The pale ground of coaching notices, such as the slowest-note tip after a run.
- **Fixed Ink** (#131a2e): Ink that never flips. All lettering and outlines on pointer yellow and on white tags use it in both schemes: the go button's label, the pointer's outline, the changed-note tag, the best-time stamp, landed-time tags, the skip link.

### Tertiary
- **Home Cobalt** (#2b4bd8; dark #4d6cf0): The home chord job. It is the ladder's own ink, so home reads as the rung the scale rests on.
- **Away Green** (#1f7a5c; dark #2b9a74), lettered in **Away Green Ink** (#1a6a50; dark #63d3a8): The away chord job. Green is the third job color so that the three chord jobs stay distinguishable at a glance, and it never appears without its label.
- **Tension Vermilion** (#c63a22; dark #d9482e), lettered in **Vermilion Ink** (#a93019; dark #ff8f74): The tension chord job. Away from chords, vermilion marks only errors and the one destructive action: error-notice outlines, error text, and the outline of the button that clears saved progress.
- **Outside Gray** (#626982; dark #8d94ab): Borrowed, leading, and outside chords. A dashed outline on tags and swatches and a gray underbar in the loop bars; never a fill.

### Neutral
- **Chart White** (#f6f7f9; dark Night Chart #0e1322): The sheet behind everything, including bottom sheets and the backing of ladder labels.
- **Chart Trough** (#eceef3; dark #151b30): Hover fill for outline buttons, rows, and songbook entries; the empty track of progress bars.
- **Label White** (#ffffff; dark #1a2139): Pasted-on surfaces that take input or hold a drawn instrument: fields, chips, the analysis panel, error notices, the fretboard and its note dots, outside chord tags.
- **Chart Ink** (#131a2e; dark #eceff7): Primary text, the 1.5px outline of every control, the 1.5px rules that open sections, selected segments and chips (ink fill, Chart White lettering), strings, nut, chord-box dots, staff lines.
- **Second Ink** (#454c63; dark #b6bcd0): Ledes, small print, Roman numerals, coaching cues.
- **Third Ink** (#626982; dark #8d94ab): Fine print, placeholders, field outlines, fret wires, rung step words, octave numbers.
- **Faint Rule** (#d3d8e3; dark #283050): 1px separators between list rows and facts; ladder lead lines.
- **Strong Rule** (#aab1c3; dark #3c4670): Chip outlines, fretboard inlays, pending analysis steps, the off state of the switch.
- **Binding Tape** (#131a2e; dark #05080f), lettered in **Tape Lettering** (#f6f7f9) and **Dim Tape Lettering** (Tape Lettering at 72%): The top band and the bottom nav, and the installed app's theme color.

### Named Rules
**The Pointer Rule.** Pointer yellow means "here, now, you": the note to sing, her voice while it is in tune, the rung the pointer is on, the hold bar filling as she lands a note, and her best time. It is lent only to the one go button in view, focus rings, the active-nav bar, and pointer-shaped marks (the brand mark, the analysis step in progress, the changed note on a neighbor-key column). It never fills headings or panels, never marks a chord job, and never marks home.

**The Home Is Cobalt Rule.** Home is always cobalt: the heaviest rung on the cobalt column with its label in Cobalt Ink at weight 850, the home dots on the fretboard, the home chord job. Yellow is where she is; cobalt is where the scale rests.

**The Three Jobs Rule.** Chords have exactly three colored jobs (home cobalt, away green, tension vermilion), and a job color never speaks alone: every colored tag is lettered with its chord name, and every list that explains jobs prints the job word (Home, Away, Tension, Borrowed, Leading, Outside) beside a 10px square swatch. Borrowed, leading, and outside chords take a dashed gray outline, never a fill. Lettering on a job fill must reach 4.5:1, so tags use dedicated deep fills (Home Fill #2b4bd8, Away Fill #1f7a5c, Tension Fill #c63a22) in both schemes, keeping white lettering at 5.2:1 to 6.8:1 even on the dark chart; the brighter dark-scheme job colors are for swatches and text, never behind white lettering.

## Typography

**Display Font:** Besley Variable (with Georgia, 'Times New Roman', serif), self-hosted, upright and italic, weights 500 to 850
**Body Font:** the system UI sans (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)
**Music Glyphs:** Bravura outlines drawn as inline SVG (accidentals, clef, noteheads)

**Character:** A heavy Clarendon slab letters the music the way a printed chart does, big, black, and sure of itself, while the phone's own sans stays out of the way and runs the machinery.

### Hierarchy
- **Display** (Besley 800, clamp(3rem, 13vw, 5.5rem), line-height 0.95, -0.02em): The one big line per screen: a song's key (clamp(3.25rem, 15vw, 5.75rem)), a scale's name, the sing-setup title, a finished run's time (clamp(4rem, 22vw, 6rem)). Balanced wrapping.
- **Headline** (Besley 750, 1.875rem, 1.1, -0.01em): Bottom-sheet titles and full-screen step titles.
- **Title** (Besley 700, 1.375rem, 1.2): Section heads and the song title (1.25rem on phones).
- **Subhead** (sans 650, 1rem, 1.35): Headings inside sheets and switch labels.
- **Lede** (sans 400, 1.0625rem, 1.5, Second Ink, max 62ch): The plain-words line under a display line or section head.
- **Body** (sans 400, 1rem, 1.5): Default interface text.
- **Small** (sans 400, 0.875rem, 1.45, Second Ink) and **Fine** (sans 400, 0.8125rem, 1.4, Third Ink): Explanations, ladder captions (max 46ch), source and privacy notes. Labels at these sizes (job words, tally heads, source tags) step up to 600 or 650.
- **Label** (sans 650, 0.9375rem): Form labels and fact names.
- **Caption** (sans 650, 0.75rem): Rung step words ("home", "note 3"), nav labels (at 600), time tags (at 700).
- **Micro** (sans 650, 0.6875rem, 1): The smallest working labels: fret-gap words in the ladder gutter, the "Practice" label on the key chip (700, uppercase, 0.06em), the word labels under the intake mode icons, and fret numbers. Never used for sentences.
- **Note** (Besley 700, 1.375rem, 1): Note names on the ladder. Note and chord names in lists run at 750 between 1.25rem and 1.375rem.
- **Chord** (Besley 750, 1.625rem, 1): Chords in the loop bars; songbook chord names at 1.5rem.
- **Fact** (Besley 700, 1.125rem, 1.25): Fact values in the margin and note labels on the singing ladder.
- **Solfa** (Besley italic 500, size inherited): The syllables do, re, mi in labels and running text. Inside the cobalt column they stand upright in white at 650 (850 at home).
- **Numeral** (Besley italic 400, Second Ink): Roman numerals under chords.
- **Timer** (Besley 800, 2.75rem, 1, -0.01em, tabular lining figures): The run clock; best times at 1.75rem. Times read m:ss.s.

### Named Rules
**The Two Voices Rule.** Besley letters the music and the chart's headings: every note, key, chord, numeral, syllable, and time, and every display, headline, and title line. The system sans runs everything that operates the app: button labels, tabs, form labels, explanations, step words. A note name never appears in the sans; when a button's label is a note, key, or chord, that label is Besley.

**The Engraved Accidental Rule.** Sharps and flats beside a note or chord name in type are engraved Bravura glyphs at 0.82em, and screen readers hear "F sharp". Tiny SVG labels and plain-words sentences use the ♯ and ♭ characters. Never a typed "#" or "b". Octave numbers drop to 0.55em sans in Third Ink.

## Layout

A single phone column hung between two tape bands: a sticky 56px band at the top and a fixed 64px nav at the bottom, both clearing the device's safe areas. The sheet between them is at most 1180px wide, with 24px above and 16px at the sides; its bottom padding clears the nav plus 48px. Blocks stack 24px apart. Each major section opens with a 1.5px ink rule with 32px above it and 24px to 32px below, the way a printed chart is ruled into divisions; inside a section, rows are separated by 1px faint rules and 12px of padding rather than boxes.

The ladder is the page's left margin. Where a screen shows a scale, its ladder stands at the left and the facts and explanations sit to its right as margin notes: 340px to 420px of ladder on the song view and 360px to 440px on the scale view, a 48px gutter, and the scale text sticky beside it. On phones the ladder comes first and the facts follow below it; on the song view the go button docks at thumb height just above the bottom nav, with the sheet fading up behind it (Chart White from 62% to transparent). Rungs sit 30px apart per half step (29px on the wide song view, 20px on the song view on phones).

Spacing follows a 4px scale (s1 to s8: 4, 8, 12, 16, 24, 32, 48, 64). Targets are sized for one thumb: 48px buttons (60px big, 40px small), 44px segments, 40px chips, 52px fields, 64px nav tabs. Measures stay short: 62ch for ledes, 46ch for ladder captions.

**Breakpoints.** Below 720px is the phone layout. At 720px chips wrap instead of scrolling sideways, the key block gains a 260px to 340px side column that carries the go button (the docked button retires), the key grid widens from 6 to 12 across, and bottom sheets center on the screen. At 900px sing setup splits into two columns. At 960px the bottom nav moves into the top band, and the song and scale views split into ladder and margin.

### Named Rules
**The Ladder-Left Rule.** When a screen shows a scale, its ladder is the leftmost column and everything else is margin notes beside or below it. The ladder never sits in a card, a carousel, or a right-hand column.

## Elevation & Depth

Flat and printed. Everything lies on one plane and separates by tone and ink: Chart White for the sheet, Label White for pasted-on fields and panels, Chart Trough for hover; 1.5px ink outlines on controls, 1.5px ink rules opening sections, 1px faint rules between rows, and the tape bands at the edges. Two things cast shadows, and both are physical: a tab standing off the chart, and a sheet pulled over it.

### Shadow Vocabulary
- **Ledge** (`box-shadow: 0 2px 0 var(--ink), 0 6px 14px -8px rgba(19, 26, 46, 0.45)`; dark `0 2px 0 #05080f, 0 8px 18px -8px rgba(0, 0, 0, 0.7)`): Under the go button: a hard 2px ink ledge with a short, soft fall. Pressing drops the button 2px onto the ledge and the shadow collapses. The song's artwork thumbnail sits on the same ledge at 1px.
- **Sheet** (`box-shadow: var(--shadow-sheet)` = `0 -10px 30px -10px rgba(19, 26, 46, 0.35)` over a `rgba(8, 11, 20, 0.45)` backdrop): The bottom sheet rising over the chart, its fall tinted with Chart Ink like the ledge.

### Named Rules
**The Printed Plane Rule.** Panels, lists, notices, and ladders never float: no drop shadows, blur, or glass on them. Depth is tone and ink; the ledge and the sheet are the whole shadow vocabulary.

## Shapes

Square chart edges. Controls and inline panels (buttons, segmented controls, chips, fields, the key chip, notices, the analysis panel, the range-finding panel) turn a 4px corner. Small lettered tags and artwork thumbnails turn 2px; chord tags turn 3px. Everything structural is dead square: the tape bands and their 4px pointer bars, the ladder columns and rungs, the singing field, progress and level bars, confidence squares, run-history bars, and the bottom sheet, which is square with a 6px cobalt band across its top edge. Outlines are 1.5px ink, rules 1px, the home rung 5px.

Round forms belong to notation: fretboard note dots and inlays, chord-box dots, open-string rings and barres, the voice dot on the singing ladder. The pointer is a right-facing triangle with a 1.5px ink outline and rounded joins. Icons sit on a 24px grid in 1.9px strokes with square caps and mitered joins; the brand mark is a cobalt column with white rungs and a yellow pointer at one rung. The single on/off switch follows the square chart too: a 4px-cornered track with a square 2px-cornered knob outlined in ink, no shadow.

### Named Rules
**The Square Chart Rule.** Never round a button, chip, field, tag, panel, or sheet past 4px; sheets that slide over the chart stay square. Notation's own circles and capsules are exempt.

## Components

### Buttons
Printed tabs: ink-outlined, decisive, pressing 1px into the page.
- **Shape:** 4px corner, 1.5px ink outline, 48px tall with 18px sides (big: 60px at 1.125rem; small: 40px with 12px sides at 0.9375rem), sans 650 at 1rem, 16px to 18px icons with an 8px gap.
- **Outline (default):** Transparent on the sheet with Chart Ink lettering and outline. Hover fills Chart Trough; press drops 1px (120ms); disabled at 45% opacity.
- **Go:** Pointer Yellow with an ink outline, Fixed Ink lettering, and the Ledge. Hover Pressed Pointer; press drops 2px and the ledge collapses. Its focus ring is cobalt, since yellow cannot ring yellow. Always big (60px).
- **Primary:** Modulator Cobalt fill and outline with white lettering; hover Pressed Cobalt. Commits an input: start listening, upload a file, analyze typed chords, update the breakdown.
- **Quiet:** No outline, Cobalt Ink lettering, 10px sides; hover Cobalt Wash. Secondary actions such as "Play the scale" and "Cancel".
- **Danger:** The outline button in vermilion (outline and Vermilion Ink lettering), for confirming that saved progress should be cleared.
- **Inline link:** Cobalt Ink at 600 with a 1.5px underline offset 3px ("Change key", "Find my range").

**The One Go Rule.** At most one go button is visible at a time, and it always carries the step from reading to singing: "Sing this scale", "Start timed run".

### Segmented Controls
- **Style:** One 1.5px ink frame with a 4px corner and 1.5px ink dividers; 44px segments (48px in the compact song-input row), 14px sides, sans 600 at 0.9375rem; full width on phones.
- **State:** The selected segment fills Chart Ink with Chart White lettering. Carries the four ways to put in a song (Search, Chords, Listen, File, each with its icon), sing direction, in-tune tolerance, and major or minor.

### Chips
- **Style:** Label White with a 1.5px Strong Rule outline, 4px corner, 40px tall, 14px sides, sans 600 at 0.9375rem. On phones a single row scrolls sideways with snap points; from 720px chips wrap. Scale families are introduced by a fine label behind a 1px rule.
- **State:** Pressed chips fill Chart Ink with Chart White lettering. **Note chips** letter the note in Besley 700 at 1.0625rem and are at least 48px wide; the key grid sets them 6 across (12 from 720px).

### Inputs / Fields
- **Style:** Label White, 1.5px Third Ink outline, 4px corner, 52px tall, 12px by 14px padding, 1.0625rem, Third Ink placeholder. The search field carries its icon 14px in, with text starting at 44px. The chord-entry box is Besley 600 at 1.125rem and at least 132px tall.
- **Focus:** The outline turns cobalt and a 3px pointer-yellow halo surrounds the field.
- **Error:** A plain line below in Vermilion Ink, 600 at 0.9375rem.
- **Switch:** The one on/off switch (sing setup) is a 46px by 28px track in Strong Rule with a 4px corner that turns cobalt when on, with a white square knob (2px corner, 1.5px ink outline, no shadow) sliding 18px (180ms).

### Notices and Panels
- **Coaching notice:** 16px padding, 1.5px ink outline, 4px corner, on Pointer Wash.
- **Error notice:** Label White with a vermilion outline; a 700 title over a small line saying how to fix it.
- **Analysis panel:** Label White, 1.5px ink outline, 4px corner, 16px padding, holding the step list (see Progress Marks).

### Facts in the Margin
- A two-column list of name and value, each row opened by a 1px faint rule with 12px of padding. Names in sans 650 at 0.9375rem; values in Besley 700 at 1.125rem with a small plain-words line beneath.

### Glossary Words and Bottom Sheets
- **Term:** Every theory word is tappable, marked by a 2px dotted cobalt underline offset 3px, and opens a sheet explaining it in plain words.
- **Bottom sheet:** Chart White, square, with a 6px cobalt band across the top; at most 560px wide and 85% of the screen tall; 24px padding plus the safe area. It rises 24px and fades in (260ms) over a 45% ink backdrop (160ms fade), and centers on the screen from 720px. A headline, an ink-colored lede, and a full-width outline Close button at the foot. The guitar tie-in sits below a 1px rule behind a small Chart Ink "On guitar" tag (0.75rem 700, 2px corner).

### Navigation
- **Top band:** Sticky Binding Tape, 56px plus the safe area. At left, the 26px brand mark and the wordmark in Besley 700 at 1.125rem, all small caps, 0.04em tracking. At right, the practice-scale key chip: 40px, 4px corner, transparent with a 1.5px outline of Tape Lettering at 28% (60% on hover), a tiny uppercase "Practice" label (0.6875rem 700, 0.06em, Dim Tape Lettering), the key in Besley 700, and a 10px by 22px cobalt swatch with a yellow foot.
- **Bottom nav:** Fixed Binding Tape, 64px plus the safe area, four equal tabs (Song, Scales, Sing, Progress) at most 560px wide: a 24px icon over a sans 600 label at 0.75rem in Dim Tape Lettering. The current tab lights to full Tape Lettering with a 4px pointer-yellow bar across its top edge, inset 28% from each side. Focus rings sit 4px inside the tab.
- **Wide screens (960px and up):** The tabs move into the top band as an 18px icon beside a 0.9375rem label with 12px sides; the current tab's 4px yellow bar sits on the band's bottom edge.

### Focus
- A 3px pointer-yellow outline 2px outside every focused control (cobalt on the go button); fields use their cobalt outline and yellow halo instead. On the light chart the ring's yellow measures about 1.5:1 against Chart White, so it depends on its full 3px weight and on the ink edge of the control it rings; never thin it. A skip link appears in yellow at the top left on first focus.

### The Modulator (signature)
The scale as a ladder whose rung spacing is the real distance between notes.
- **Column:** A 74px cobalt column with 22px of headroom above and below. Scale notes are 2px rungs in white at 92%; home is a 5px solid white rung. Half steps the scale skips are 9px faint ticks on the column's right edge.
- **Lettering:** Each rung's syllable sits inside the column in upright white Besley 650 at 1.0625rem (850 at home). To the right, a 1px faint lead line runs out to the note name (Besley 700 at 1.375rem; home at 850 in Cobalt Ink) and its step word ("home", "note 3"), backed in Chart White so the line stops at the type.
- **Gaps:** A 50px gutter at the left names each gap in frets ("1 fret", "2 frets"), right-aligned in sans 600 at 0.6875rem, Third Ink; half steps in Cobalt Ink at 750.
- **Chord marks:** Chords the song uses hang at the right end of their root's rung as 22px tags: 3px corner, 6px sides, Besley 700 at 0.8125rem, white on the job color. Borrowed, leading, and outside chords are Label White with a 1.5px dashed Outside Gray outline.
- **Neighbor keys:** The two closest keys stand as 34px Cobalt Wash columns 4px either side of the ladder, their rungs in cobalt at 55% (home 3.5px at 90%). Each letters its home "do" in Cobalt Ink (Besley 750, 11px) and its one changed note in a yellow tag (Fixed Ink, Besley 800 at 12px, 2px corner, thin ink outline). The key name above each column is an underlined Besley link that moves the chart to that key.
- **Pointer:** A tapped rung sounds and lights for 700ms: a 6px yellow bar across the column with a yellow triangle (ink outline) at its left edge. "Play the scale" walks the pointer up the rungs with the notes, 420ms per note. The tap target is the column's full width and 30px tall: white at 12% on hover, yellow at 45% on press.
- **Unroll:** Each time the key or scale changes, the chart unrolls downward like a pull-down classroom chart: a clip-path reveal over 720ms on the system's one ease-out (cubic-bezier(0.16, 1, 0.3, 1)), ending at a negative inset so labels above and beside the chart are never clipped.

**The One Moment Rule.** The unroll is the system's only authored animation, and the pointer stepping with the sound is its only traveling mark. Utility motion stays short on the same ease-out (presses 120ms, color 160ms, sheets 260ms), and reduced motion collapses every animation and transition to 1ms: the chart arrives unrolled, sheets appear in place, and the pointer simply marks each sounding rung.

### The Singing Ladder (signature)
The ladder during a run: her voice draws a line across the rungs in real time.
- **Field:** A cobalt field to the right of a 70px label gutter. Rungs are 2px in white at 92% (home 4px); skipped half steps are 10px faint ticks at the field's left edge. Gutter labels pair the note (Besley 700, 1.125rem) with its syllable (italic, 0.8125rem, Third Ink); the target note grows to 850 at 1.3125rem.
- **Target:** The rung to sing is a 2px dashed yellow line with a 20px by 22px yellow pointer (ink outline) at the gutter's edge. While she holds it, a 10px yellow bar fills across the rung. A landed rung turns solid white and carries the time it took in a white tag (Fixed Ink, 700 at 0.75rem, 2px corner).
- **Voice:** A 3.5px round-capped trace of the last 3.2 seconds, yellow while in tune and white while off. The live voice is a 20px dot (yellow in tune, white off) with a 2.5px Fixed Ink outline; it becomes an arrowhead at the top or bottom edge when she is off the ladder.
- **Coaching:** Under the target, a cue line in Second Ink (Cobalt Ink once she is on the note) names the fix in words with an up or down arrow, and the target holds until she lands it.

### Chord Job Labels and Loop Bars
- **Job labels:** In lists, every chord carries its job word (sans 650, 0.8125rem) in its job's ink after a 10px square swatch of the job color; borrowed, leading, and outside chords take a 2px dashed gray swatch.
- **Loop bars:** A chord loop is a row of bars between 1.5px ink lines and repeat signs, each bar opened by a 1.5px ink bar line. The chord (Besley 750, 1.625rem) stands on a 4px underbar in its job color (gray for chords outside the three jobs), with its Roman numeral below in Besley italic, Second Ink.
- **Songbook and key chords:** Unboxed entries on the sheet: Besley chord names (1.5rem in the songbook, 1.375rem for the key's chords) over a chord box, a job label, and a fine explanation. Hover fills Chart Trough or turns the name Cobalt Ink.

### Fretboard
Drawn in the chart's own grammar: ink frets and strings on chart-white, not wood.
- A Label White board with a 1.5px ink outline; Third Ink fret wires (1.5px); a 5px ink nut; ink strings graded from 0.9px (high E) to 2.5px (low E), high E on top like tab; Strong Rule inlays at frets 3, 5, 7, 9, 12 (double), and 15; fret numbers in sans 650 at 11px, Third Ink.
- Scale notes are 23px Label White dots with ink outlines, lettered in Besley 700; home dots fill cobalt with white letters. Hover thickens the outline to 2.5px, and a tap sounds the note. The neck scrolls sideways edge to edge on phones.

### Chord Boxes and Staff
- **Chord box:** A 78px by 100px songbook diagram in ink: Second Ink strings, Third Ink frets, a 4px ink nut, solid ink dots and barres, open-string rings, an × for muted strings, and a base-fret number when the shape sits up the neck.
- **Staff:** Bravura glyphs in ink on 1px ink lines; the sounding note turns cobalt. Note names line up beneath in Besley.

### Progress Marks
- **Confidence meter:** Five 14px squares with 1.5px ink outlines, filled cobalt up to the confidence.
- **Analysis steps:** Pending steps carry a 12px by 2px Strong Rule dash in Third Ink; finished steps a 12px by 4px cobalt bar; the step in progress a yellow pointer triangle that nudges 4px back and forth (900ms). A 6px cobalt bar on a Chart Trough track fills with progress.
- **Range finding:** A cobalt panel (4px corner, 24px padding) with the sung note in white Besley 800 at 4.5rem and an 8px level bar that fills yellow while she holds the note.
- **Best times:** Times in Besley 800 (1.75rem in lists). Run history is a row of 18px cobalt bars on a 1.5px ink baseline with the best bar yellow and ink-inset; a new best is stamped in a square yellow block (Fixed Ink, 700 at 1.25rem, 4px by 10px padding).

## Do's and Don'ts

### Do:
- **Do** hang every scale on the Modulator: a cobalt column, white rungs spaced by real half steps (30px per half step; 20px in the song view on phones), syllables on the rungs, note names in the margin.
- **Do** keep pointer yellow for here, now, and you (the note to sing, the in-tune voice, the active rung, the best time) plus the one go button, focus rings, and the active-nav bar.
- **Do** make home cobalt wherever it appears: the heavy home rung, Cobalt Ink home labels, cobalt fretboard dots, the home chord job.
- **Do** pair every job color with a chord name or a job word, and give borrowed, leading, and outside chords a dashed gray outline.
- **Do** letter notes, keys, chords, numerals, syllables, times, and headings in Besley with engraved accidentals; run controls and explanations in the system sans.
- **Do** divide the sheet with ink: 1.5px rules to open sections, 1px faint rules between rows, tape bands at the top and bottom.
- **Do** put Fixed Ink (#131a2e) on yellow and on white tags in both schemes.
- **Do** ship light and dark together, keep every role in both, and hold lettering on job fills to 4.5:1 in both.
- **Do** collapse every animation and transition under reduced motion.

### Don't:
- **Don't** show pitch as a round tuner dial, needle, or gauge; pitch is height on the ladder.
- **Don't** box sections or list items as cards (raised, shadowed, or tiled); the only outlined panels are notices and the analysis panel.
- **Don't** use pointer yellow for headings, panel fills, or decoration, for any chord job, or for home; the pale Pointer Wash behind coaching notices is its only tint.
- **Don't** let a job color carry meaning alone, or fill a borrowed, leading, or outside chord.
- **Don't** round a button, chip, field, tag, panel, or sheet past 4px; notation's circles and capsules are exempt.
- **Don't** draw the fretboard as wood or texture; it is ink frets and strings on Label White.
- **Don't** add drop shadows, blur, or glass to panels, lists, notices, or ladders.
- **Don't** add a second authored animation; the unroll and the pointer are the motion.
- **Don't** type "#" or "b" for an accidental.
