import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Où Vont Mes Impôts — Suis tes euros, centime par centime",
  description:
    "Découvre exactement où vont tes impôts. Entre ton salaire et visualise la répartition de chaque euro. Données officielles, 100% open source.",
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
