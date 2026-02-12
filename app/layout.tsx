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

const BASE_URL = "https://ou-vont-mes-impots.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Où Vont Mes Impôts — Suivez vos euros, centime par centime",
    template: "%s | Où Vont Mes Impôts",
  },
  description:
    "Simulateur fiscal 2026 : entrez votre salaire et visualisez où vont vos impôts euro par euro. Impôt sur le revenu, cotisations sociales, budget de l'État et Sécurité sociale. Données officielles, 100% open source.",
  keywords: [
    "impôts",
    "taxes",
    "France",
    "budget",
    "simulateur fiscal",
    "2026",
    "impôt sur le revenu",
    "cotisations sociales",
    "CSG",
    "CRDS",
    "salaire net",
    "salaire brut",
    "où vont mes impôts",
    "budget de l'État",
    "Sécurité sociale",
    "visualisation",
  ],
  authors: [{ name: "Matteo Quintaneiro" }],
  creator: "Matteo Quintaneiro",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "Où Vont Mes Impôts",
    title: "Où Vont Mes Impôts — Suivez vos euros, centime par centime",
    description:
      "Simulateur fiscal 2026 : entrez votre salaire et visualisez la répartition de chaque euro d'impôts. Données officielles, 100% open source.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Où Vont Mes Impôts — Simulateur fiscal 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Où Vont Mes Impôts — Suivez vos euros, centime par centime",
    description:
      "Simulateur fiscal 2026 : entrez votre salaire et visualisez la répartition de chaque euro d'impôts.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Où Vont Mes Impôts",
  url: BASE_URL,
  description:
    "Simulateur fiscal 2026 : visualisez où vont vos impôts euro par euro.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  author: {
    "@type": "Person",
    name: "Matteo Quintaneiro",
  },
  inLanguage: "fr",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body className="min-h-screen bg-surface antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <AnalyticsProvider />
        <SpeedInsights />
      </body>
    </html>
  );
}
