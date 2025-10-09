import "./globals.css";
import "@/lib/env";
import Providers from "./providers";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Ruach Ministries",
  description: "Transforming lives through truth and creativity."
};

export default function RootLayout({ children }:{ children: React.ReactNode }){
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
