import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { GLOSSARY, type TermId } from '../theory/glossary';

const TermCtx = createContext<(id: TermId) => void>(() => {});

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<TermId | null>(null);
  const show = useCallback((id: TermId) => setOpen(id), []);
  return (
    <TermCtx.Provider value={show}>
      {children}
      {open && <TermSheet id={open} onClose={() => setOpen(null)} />}
    </TermCtx.Provider>
  );
}

/** A theory word that explains itself in plain English when tapped. */
export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const show = useContext(TermCtx);
  return (
    <button type="button" className="term" onClick={() => show(id)} aria-haspopup="dialog">
      {children ?? GLOSSARY[id].term}
    </button>
  );
}

export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button type="button" className="btn btn--block" style={{ marginTop: 24 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function TermSheet({ id, onClose }: { id: TermId; onClose: () => void }) {
  const t = GLOSSARY[id];
  return (
    <BottomSheet title={t.term} onClose={onClose}>
      <h2 className="h1">{t.term}</h2>
      <p className="lede" style={{ marginTop: 12, color: 'var(--ink)' }}>
        {t.plain}
      </p>
      {'guitar' in t && t.guitar && (
        <p className="term-guitar">
          <span className="term-guitar__label">On guitar</span> {t.guitar}
        </p>
      )}
    </BottomSheet>
  );
}
