import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KickScan — AI World Cup Intelligence Engine | FIFA 2026 Predictions",
  description:
    "AI-powered FIFA World Cup 2026 predictions, match analysis & betting intelligence. Beat our AI in daily football prediction challenges. Free AI verdicts & live odds.",
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
