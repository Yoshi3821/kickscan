import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KickScan — AI World Cup Intelligence Engine | Match Verdicts & Live Odds",
  description:
    "AI-powered match verdicts and live odds for FIFA World Cup 2026. Smart betting intelligence, league analysis, and live scores for all 104 matches.",
  keywords: [
    "World Cup 2026 odds",
    "World Cup betting",
    "AI match verdicts",
    "football betting intelligence",
    "live scores",
    "World Cup 2026 predictions",
    "FIFA World Cup 2026",
    "football leagues",
    "match analysis",
  ],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#06060f] text-white`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
