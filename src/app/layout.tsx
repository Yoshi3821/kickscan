import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KickScan.io — AI-Powered World Cup 2026 Betting Intelligence",
  description:
    "Live odds comparison, AI match analysis, and arbitrage alerts for FIFA World Cup 2026. Compare bookmaker odds across Bet365, 1xBet, Betway, and more.",
  keywords: [
    "World Cup 2026 odds",
    "World Cup betting",
    "odds comparison",
    "football betting",
    "arbitrage betting",
    "AI predictions",
    "FIFA World Cup 2026",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
