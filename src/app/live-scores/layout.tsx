import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Football Scores — KickScan | Real-Time Match Updates",
  description: "Live football scores updated every 10 seconds. Track matches from Premier League, La Liga, Serie A, Bundesliga, Champions League and World Cup 2026.",
};

export default function LiveScoresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
