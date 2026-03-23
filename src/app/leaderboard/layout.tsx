import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — KickScan | Top Football Predictors",
  description: "See who's on top! Global leaderboard for KickScan's football prediction game. Compete against other fans and our AI across World Cup 2026 and major leagues.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
