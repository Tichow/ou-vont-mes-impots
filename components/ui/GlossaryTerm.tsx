"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { getGlossaryEntry } from "@/lib/glossary";

type Props = {
  termId: string;
  children: ReactNode;
};

type Coords = { top: number; left: number; placement: "above" | "below" };

const TOOLTIP_W = 288; // w-72 = 18rem = 288px
const GAP = 8;

function computeCoords(trigger: HTMLElement): Coords {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement = spaceBelow < 220 ? "above" : "below";

  let top =
    placement === "below" ? rect.bottom + GAP : rect.top - GAP; // adjusted later for "above"
  let left = rect.left;

  // Keep tooltip inside the viewport horizontally
  if (left + TOOLTIP_W > window.innerWidth - 16) {
    left = window.innerWidth - TOOLTIP_W - 16;
  }
  if (left < 16) left = 16;

  return { top, left, placement };
}

function Tooltip({
  termId,
  entry,
  coords,
}: {
  termId: string;
  entry: { term: string; definition: string; source: { label: string; url: string } };
  coords: Coords;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [finalTop, setFinalTop] = useState(coords.top);

  // For "above" placement, we need the tooltip height to position it
  useEffect(() => {
    if (coords.placement === "above" && ref.current) {
      setFinalTop(coords.top - ref.current.offsetHeight);
    } else {
      setFinalTop(coords.top);
    }
  }, [coords]);

  return createPortal(
    <div
      ref={ref}
      id={`glossary-${termId}`}
      role="tooltip"
      style={{ top: finalTop, left: coords.left, width: TOOLTIP_W }}
      className="fixed z-[9999] p-3.5 rounded-xl text-left
        bg-white border border-border shadow-xl shadow-black/8
        animate-[fadeIn_120ms_ease-out]"
    >
      <p className="text-[13px] font-semibold text-text mb-1">{entry.term}</p>
      <p className="text-xs text-text-muted leading-relaxed">
        {entry.definition}
      </p>
      <a
        href={entry.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        Source&nbsp;: {entry.source.label}
      </a>
    </div>,
    document.body,
  );
}

export function GlossaryTerm({ termId, children }: Props) {
  const entry = getGlossaryEntry(termId);
  const [open, setOpen] = useState(false);
  const [clickLocked, setClickLocked] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const recalc = useCallback(() => {
    if (!wrapperRef.current) return;
    setCoords(computeCoords(wrapperRef.current));
  }, []);

  // Close on outside pointer
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      // Also check if click is inside the portal tooltip
      const tooltip = document.getElementById(`glossary-${termId}`);
      if (tooltip?.contains(e.target as Node)) return;
      setOpen(false);
      setClickLocked(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, termId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setClickLocked(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!entry) return <>{children}</>;

  return (
    <span
      ref={wrapperRef}
      className="glossary-term inline-flex items-baseline gap-0.5 group"
      onMouseEnter={() => {
        if (!clickLocked) {
          recalc();
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (!clickLocked) setOpen(false);
      }}
    >
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? `glossary-${termId}` : undefined}
        className="decoration-text-muted/40 decoration-dotted underline underline-offset-2 cursor-help"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          recalc();
          if (clickLocked && open) {
            setOpen(false);
            setClickLocked(false);
          } else {
            setOpen(true);
            setClickLocked(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            recalc();
            setOpen((prev) => !prev);
            setClickLocked((prev) => !prev);
          }
        }}
      >
        {children}
      </span>
      <Info
        size={11}
        className="inline-block flex-shrink-0 text-text-muted/40 group-hover:text-primary transition-colors relative -top-px"
      />

      {open && coords && (
        <Tooltip termId={termId} entry={entry} coords={coords} />
      )}
    </span>
  );
}
