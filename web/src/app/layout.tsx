import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/qp";
import { SITE_URL } from "@/lib/format";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "QuantumPapers", template: "%s · QuantumPapers" },
  description: "Buscador semántico de papers de ML cuántico",
  openGraph: { siteName: "QuantumPapers", type: "website", locale: "es_ES" },
  twitter: { card: "summary_large_image" },
};

const NAV = [
  { label: "papers", href: "/papers/page/1" },
  { label: "temas", href: "/#temas" },
  { label: "cómo_funciona", href: "/how-it-works" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <div className="qp-page">
          <AppHeader links={NAV} homeHref="/" />
          {children}
          <div className="qp-page__footer">
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
