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
import LoggedInDock from "@/components/navigation/LoggedInDock";
import { GlobalMediaPlayer } from "@/components/media/GlobalMediaPlayer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
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
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
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

  // Let next-intl know which locale is active before we read messages
  setRequestLocale(locale as Locale);

  // Get messages for the locale (log if we ever fail so deployments are debuggable)
  let messages;
  try {
    messages = await getMessages();
  } catch (error) {
    console.error("Failed to load locale messages", locale, error);
    throw error;
  }
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const aiAssistantEnabled = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true';

  return (
    <html lang={locale}>
      <head>
        {/* Anti-flash script for theme */}
        <Script id="theme-init" strategy="afterInteractive">
          {`
            (function() {
              try {
            const theme = localStorage.getItem('theme') || 'dark';
                const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolved = theme === 'system' ? getSystemTheme() : theme;
                document.documentElement.classList.add(resolved);
              } catch (e) {}
            })();
          `}
        </Script>

        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
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
      <body className="isolate bg-background text-foreground antialiased dark:bg-neutral-950 dark:text-neutral-100">
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
              <div className="relative isolate mx-auto max-w-6xl px-4">
                <div
                  id="page-atmosphere-root"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[85vh] bg-transparent dark:bg-transparent [mask-image:linear-gradient(to_bottom,transparent_0px,black_140px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,black_140px)]"
                  style={{ pointerEvents: "none" }}
                />
                <main className="relative z-10 pb-16 pt-24 lg:pt-28">
                  {children}
                </main>
              </div>
              <Footer />
              {aiAssistantEnabled && <RuachAssistant />}
              <InstallPrompt />
              <OfflineIndicator />
              <GlobalMediaPlayer />
              <LoggedInDock />
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
