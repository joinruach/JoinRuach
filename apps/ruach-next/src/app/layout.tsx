import "./globals.css";
import "@/lib/env";
import Providers from "./providers";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LivePreview from "@/components/preview/LivePreview";
import { RuachAssistant } from "@/components/ai/RuachAssistant";
import InstallPrompt from "@/components/pwa/InstallPrompt";

export const metadata = {
  title: "Ruach Ministries",
  description: "Transforming lives through truth and creativity.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ruach",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }:{ children: React.ReactNode }){
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const aiAssistantEnabled = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true';

  return (
    <html lang="en">
      <head>
        {/* Favicons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ruach" />
        <meta name="theme-color" content="#fbbf24" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
        <Providers>
          <LivePreview />
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
            {children}
          </main>
          <Footer />
          {aiAssistantEnabled && <RuachAssistant />}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
