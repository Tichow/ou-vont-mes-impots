import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsProvider } from "@/components/shared/AnalyticsProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Où Vont Mes Impôts : suivez vos euros, centime par centime",
  description:
    "Découvrez exactement où vont vos impôts. Entrez votre salaire et visualisez la répartition de chaque euro. Données officielles, 100% open source.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body className="min-h-screen bg-surface antialiased">
        {children}
        <AnalyticsProvider />
        <SpeedInsights />
      </body>
    </html>
  );
}
