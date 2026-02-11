import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Où Vont Mes Impôts — Suivez vos euros, centime par centime",
  description:
    "Découvrez exactement où vont vos impôts. Entrez votre salaire et visualisez la répartition de chaque euro. Données officielles, 100% open source.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={figtree.variable}>
      <body className="min-h-screen bg-surface antialiased">{children}</body>
    </html>
  );
}
