"use client";

type Props = {
  variant?: "hero" | "section";
};

export function DecorativeShapes({ variant = "hero" }: Props) {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-primary) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Blob 1 — top right */}
        <div
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          aria-hidden
        >
          <div className="w-full h-full rounded-full bg-primary blur-3xl" />
        </div>

        {/* Blob 2 — bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          aria-hidden
        >
          <div className="w-full h-full rounded-full bg-primary blur-3xl" />
        </div>

        {/* Blob 3 — center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          aria-hidden
        >
          <div className="w-full h-full rounded-full bg-primary blur-3xl" />
        </div>
      </div>
    );
  }

  // Section variant — simpler, single blob
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute -top-20 right-0 w-[300px] h-[300px] rounded-full opacity-[0.04]"
      >
        <div className="w-full h-full rounded-full bg-primary blur-3xl" />
      </div>
    </div>
  );
}
