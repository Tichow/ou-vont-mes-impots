import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Méthodologie & sources",
  description:
    "Sources officielles, méthodologie de calcul et données ouvertes utilisées par Où Vont Mes Impôts. Barème 2026, LFI 2026, LFSS 2026, données OCDE.",
};

export default function AProposLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
