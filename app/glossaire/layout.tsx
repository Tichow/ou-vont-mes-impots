import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glossaire fiscal",
  description:
    "Tous les termes fiscaux, sociaux et budgétaires expliqués simplement : CSG, CRDS, quotient familial, PASS, cotisations, budget de l'État et Sécurité sociale.",
};

export default function GlossaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
