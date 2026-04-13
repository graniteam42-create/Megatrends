import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trend Compass",
  description: "Strategic Intelligence System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0c10]">{children}</body>
    </html>
  );
}
