import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vos résultats",
  description:
    "Visualisez la répartition de vos impôts euro par euro : impôt sur le revenu, cotisations sociales, et l'affectation de chaque euro dans le budget de l'État et de la Sécurité sociale.",
};

export default function ResultatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
