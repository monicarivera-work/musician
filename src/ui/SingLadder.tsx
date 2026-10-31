import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { mod12 } from '../theory/notes';
import type { BuiltScale } from '../theory/scales';
import { NoteName } from './NoteName';

export interface SingFrame {
  now: number;
  voice: number | null;
  inTune: boolean;
  target: number | null;
  hold: number;
}

export interface SingLadderHandle {
  push(frame: SingFrame): void;
  clear(): void;
}

interface Props {
  scale: BuiltScale;
  low: number;
  high: number;
  target: number | null;
  /** Times already earned on rungs, keyed by MIDI number. */
  landed?: Record<number, string>;
  height: number;
}

const TRAIL_MS = 3200;
const LABEL_W = 70;

function cssVar(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/** The ladder during singing: your voice draws a line across the rungs in real time. */
export const SingLadder = forwardRef<SingLadderHandle, Props>(function SingLadder({ scale, low, high, target, landed, height }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<SingFrame[]>([]);
  const geom = useRef({ w: 0, h: height, dpr: 1 });
  const pad = 26;
  const semi = (height - pad * 2) / Math.max(1, high - low);
  const yOf = (m: number) => pad + (high - m) * semi;

  const rungs: { midi: number; note: string; solfa: string; home: boolean }[] = [];
  for (let m = Math.ceil(low); m <= Math.floor(high); m++) {
    const d = scale.degrees.find((x) => x.pc === mod12(m));
    if (d) rungs.push({ midi: m, note: d.note, solfa: d.solfa, home: d.step === 1 });
  }

  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    const resize = () => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      c.width = Math.round(w * dpr);
      c.height = Math.round(height * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${height}px`;
      geom.current = { w, h: height, dpr };
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    return () => ro.disconnect();
  }, [height]);

  function draw() {
    const c = canvas.current;
    const el = wrap.current;
    if (!c || !el) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = geom.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pointer = cssVar(el, '--pointer', '#ffc53d');
    const ink = '#131a2e';
    const list = frames.current;
    const last = list[list.length - 1];
    if (!last) return;
    const x0 = LABEL_W;
    const xNow = w - 30;
    const pxPerMs = (xNow - x0) / TRAIL_MS;

    if (last.target !== null && last.hold > 0) {
      const y = yOf(last.target);
      ctx.fillStyle = pointer;
      ctx.fillRect(x0, y - 5, (w - x0) * last.hold, 10);
    }

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1];
      const b = list[i];
      if (a.voice === null || b.voice === null || Math.abs(a.voice - b.voice) > 1.2) continue;
      const xa = xNow - (last.now - a.now) * pxPerMs;
      const xb = xNow - (last.now - b.now) * pxPerMs;
      if (xb < x0) continue;
      ctx.strokeStyle = b.inTune ? pointer : 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(Math.max(x0, xa), yOf(clamp(a.voice)));
      ctx.lineTo(xb, yOf(clamp(b.voice)));
      ctx.stroke();
    }

    if (last.voice !== null) {
      const v = last.voice;
      const y = yOf(clamp(v));
      const off = v < low - 0.5 ? 'below' : v > high + 0.5 ? 'above' : null;
      ctx.fillStyle = last.inTune ? pointer : '#ffffff';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (off) {
        const dir = off === 'above' ? -1 : 1;
        ctx.moveTo(xNow, y + dir * 14);
        ctx.lineTo(xNow - 11, y - dir * 4);
        ctx.lineTo(xNow + 11, y - dir * 4);
        ctx.closePath();
      } else {
        ctx.arc(xNow, y, 10, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
    }
  }

  function clamp(m: number) {
    return Math.max(low - 0.6, Math.min(high + 0.6, m));
  }

  useImperativeHandle(ref, () => ({
    push(frame: SingFrame) {
      frames.current.push(frame);
      const cutoff = frame.now - TRAIL_MS - 200;
      while (frames.current.length && frames.current[0].now < cutoff) frames.current.shift();
      draw();
    },
    clear() {
      frames.current = [];
      draw();
    },
  }));

  return (
    <div className="singladder" ref={wrap} style={{ height, '--label-w': `${LABEL_W}px` } as CSSProperties}>
      <div className="singladder__field" aria-hidden="true">
        {Array.from({ length: Math.floor(high) - Math.ceil(low) + 1 }, (_, i) => Math.ceil(low) + i)
          .filter((m) => !rungs.some((r) => r.midi === m))
          .map((m) => (
            <span key={m} className="singladder__tick" style={{ top: yOf(m) }} />
          ))}
        {rungs.map((r) => (
          <span
            key={r.midi}
            className={`singladder__rung${r.home ? ' is-home' : ''}${r.midi === target ? ' is-target' : ''}${landed?.[r.midi] ? ' is-landed' : ''}`}
            style={{ top: yOf(r.midi) }}
          >
            {landed?.[r.midi] && <span className="singladder__time num">{landed[r.midi]}</span>}
          </span>
        ))}
      </div>
      {rungs.map((r) => (
        <span key={r.midi} className={`singladder__label${r.midi === target ? ' is-target' : ''}`} style={{ top: yOf(r.midi) }} aria-hidden="true">
          <span className="serif">
            <NoteName name={r.note} />
          </span>
          <span className="solfa">{r.solfa}</span>
        </span>
      ))}
      {target !== null && (
        <svg className="singladder__pointer" style={{ top: yOf(target) }} width="20" height="22" viewBox="0 0 20 22" aria-hidden="true">
          <path d="M1.5 1.5 18.5 11 1.5 20.5z" />
        </svg>
      )}
      <canvas ref={canvas} className="singladder__canvas" aria-hidden="true" />
    </div>
  );
});
