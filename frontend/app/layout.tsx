// app/layout.tsx – Root layout with global fonts, metadata, providers.

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://aipulsedaily.news"),
  title: {
    default: "AIPulse Daily — AI News for Engineers & PMs",
    template: "%s | AIPulse Daily",
  },
  description:
    "Curated AI research and news with Grok-powered summaries, implementation guides, and business impact analysis.",
  keywords: ["AI news", "machine learning", "LLM", "AI research", "product management"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "AIPulse Daily",
    title: "AIPulse Daily — AI News for Engineers & PMs",
    description: "Curated AI news with Grok-powered summaries and implementation guides.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIPulse Daily",
    description: "Curated AI news with Grok-powered summaries.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen`}
      >
        <QueryProvider>{children}</QueryProvider>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6671856937433037"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
