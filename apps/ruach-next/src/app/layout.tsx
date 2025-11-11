import "./globals.css";
import "@/lib/env";
import Providers from "./providers";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LivePreview from "@/components/preview/LivePreview";
import { RuachAssistant } from "@/components/ai/RuachAssistant";

export const metadata = {
  title: "Ruach Ministries",
  description: "Transforming lives through truth and creativity."
};

export default function RootLayout({ children }:{ children: React.ReactNode }){
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const aiAssistantEnabled = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true';

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="רוח" />
        <link rel="manifest" href="/site.webmanifest" />
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
        </Providers>
      </body>
    </html>
  );
}
