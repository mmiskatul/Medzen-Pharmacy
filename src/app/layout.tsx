import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { getSettings } from "@/lib/site-settings.server";
import { publicEnv } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Plus Jakarta Sans carries the headings: its flat-sided geometry reads
// modern-Gulf rather than generic-startup, and it sits cleanly next to
// Inter's neutral UI text.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seo.metaTitle || settings.general.pharmacyName;

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: title,
      template: `%s — ${settings.general.pharmacyName}`,
    },
    description: settings.seo.metaDescription,
    applicationName: settings.general.pharmacyName,
    robots: settings.seo.indexSite
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "en_AE",
      siteName: settings.general.pharmacyName,
      title,
      description: settings.seo.metaDescription,
      url: publicEnv.siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: settings.seo.metaDescription,
    },
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0e5c43",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh bg-canvas antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "!rounded-xl !border !border-line !bg-white !text-ink !shadow-[var(--shadow-lift)]",
          }}
        />
      </body>
    </html>
  );
}
