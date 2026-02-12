"use client";

import {
  useState,
  useId,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

type Props = {
  source: string;
  url?: string;
};

type Coords = { top: number; left: number; placement: "above" | "below" };

const TOOLTIP_W = 280;
const GAP = 8;

function computeCoords(trigger: HTMLElement): Coords {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement = spaceBelow < 200 ? "above" : "below";

  const top =
    placement === "below" ? rect.bottom + GAP : rect.top - GAP;
  let left = rect.left;

  if (left + TOOLTIP_W > window.innerWidth - 16) {
    left = window.innerWidth - TOOLTIP_W - 16;
  }
  if (left < 16) left = 16;

  return { top, left, placement };
}

function TooltipPortal({
  id,
  source,
  url,
  coords,
}: {
  id: string;
  source: string;
  url?: string;
  coords: Coords;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [finalTop, setFinalTop] = useState(coords.top);

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
      id={id}
      role="tooltip"
      style={{ top: finalTop, left: coords.left, width: TOOLTIP_W }}
      className="fixed z-[9999] p-4 rounded-xl text-left bg-white border border-border shadow-lg animate-[fadeIn_120ms_ease-out]"
    >
      <p className="text-xs text-text-secondary leading-relaxed">{source}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Voir la source
        </a>
      )}
    </div>,
    document.body,
  );
}

export function SourceTooltip({ source, url }: Props) {
  const [open, setOpen] = useState(false);
  const [clickLocked, setClickLocked] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = `source-${useId()}`;

  const recalc = useCallback(() => {
    if (!triggerRef.current) return;
    setCoords(computeCoords(triggerRef.current));
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const tooltip = document.getElementById(tooltipId);
      if (tooltip?.contains(e.target as Node)) return;
      setOpen(false);
      setClickLocked(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, tooltipId]);

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

  return (
    <span className="inline-flex items-center">
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex items-center text-text-muted hover:text-primary transition-colors cursor-pointer ml-1"
        onMouseEnter={() => {
          if (!clickLocked) {
            recalc();
            setOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (!clickLocked) setOpen(false);
        }}
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
            e.stopPropagation();
            recalc();
            setOpen((prev) => !prev);
            setClickLocked((prev) => !prev);
          }
        }}
      >
        <Info size={14} />
      </span>

      {open && coords && (
        <TooltipPortal
          id={tooltipId}
          source={source}
          url={url}
          coords={coords}
        />
      )}
    </span>
  );
}
