import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Trend Compass",
    template: "%s · Trend Compass",
  },
  description: "Strategic intelligence system for tracking macro megatrends, positions, and allocations.",
  applicationName: "Trend Compass",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Trend Compass",
    title: "Trend Compass",
    description: "Strategic intelligence system for tracking macro megatrends.",
    images: [{ url: "/compass-banner.svg", width: 1200, height: 630, alt: "Trend Compass" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trend Compass",
    description: "Strategic intelligence system for tracking macro megatrends.",
    images: ["/compass-banner.svg"],
  },
  alternates: { canonical: SITE_URL },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0c10]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#00e5ff] focus:text-[#0a0c10] focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
