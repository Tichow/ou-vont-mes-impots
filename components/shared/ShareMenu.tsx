"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Share2, Link2, Linkedin, Twitter, Check } from "lucide-react";

export function ShareMenu() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showToast = useCallback(() => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast();
    } catch {
      // Fallback: select + copy
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast();
    }
    setOpen(false);
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Je viens de découvrir où vont mes impôts, euro par euro. Et toi ? 👀");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors flex-shrink-0 font-medium"
        >
          <Share2 size={14} />
          <span className="hidden sm:inline">Partager</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-border/80 overflow-hidden z-50"
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text hover:bg-surface-alt transition-colors"
              >
                <Link2 size={16} className="text-text-muted" />
                Copier le lien
              </button>
              <button
                onClick={handleLinkedIn}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text hover:bg-surface-alt transition-colors"
              >
                <Linkedin size={16} className="text-[#0A66C2]" />
                LinkedIn
              </button>
              <button
                onClick={handleTwitter}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text hover:bg-surface-alt transition-colors"
              >
                <Twitter size={16} className="text-text-muted" />
                Twitter / X
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl"
          >
            <Check size={16} className="text-emerald-400" />
            Lien copié !
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
