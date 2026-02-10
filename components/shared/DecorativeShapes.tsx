"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type Props = {
  variant?: "hero" | "section";
};

export function DecorativeShapes({ variant = "hero" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -50]);

  if (variant === "hero") {
    return (
      <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-primary) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Blob 1 — top right */}
        <motion.div
          style={{ y: y1 }}
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          aria-hidden
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent blur-3xl" />
        </motion.div>

        {/* Blob 2 — bottom left */}
        <motion.div
          style={{ y: y2 }}
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          aria-hidden
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-accent to-primary blur-3xl" />
        </motion.div>

        {/* Blob 3 — center accent */}
        <motion.div
          style={{ y: y3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          aria-hidden
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary blur-3xl" />
        </motion.div>
      </div>
    );
  }

  // Section variant — simpler, single blob
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-20 right-0 w-[300px] h-[300px] rounded-full opacity-[0.04]"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent blur-3xl" />
      </motion.div>
    </div>
  );
}
