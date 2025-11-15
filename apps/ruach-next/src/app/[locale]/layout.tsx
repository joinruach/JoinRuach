import "../globals.css";
import "@/lib/env";
import Providers from "./providers";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LivePreview from "@/components/preview/LivePreview";
import { RuachAssistant } from "@/components/ai/RuachAssistant";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import OfflineIndicator from "@/components/offline/OfflineIndicator";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

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

// Generate static params for all locales (Next.js 15 requires async)
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Allow dynamic params to handle locale routing
// Set to true to allow next-intl middleware to handle locale detection
export const dynamicParams = true;

// Use ISR with revalidation instead of force-dynamic
// This allows route registration while keeping data fresh
export const revalidate = 0; // Revalidate on every request (similar to force-dynamic but allows route metadata generation)

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}){
  // Await params (Next.js 15 requirement)
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const aiAssistantEnabled = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true';

  return (
    <html lang={locale}>
      <head>
        {/* Anti-flash script for theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const resolved = theme === 'system' ? getSystemTheme() : theme;
                  document.documentElement.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />

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
      <body className="bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <Providers>
              <LivePreview />
              <Header />
              <main className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
                {children}
              </main>
              <Footer />
              {aiAssistantEnabled && <RuachAssistant />}
              <InstallPrompt />
              <OfflineIndicator />
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
