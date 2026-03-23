import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Predict & Compete — KickScan | Football Prediction Game",
  description: "Predict football match results, earn odds-based points, and compete against AI. Free prediction game for World Cup 2026 and major European leagues.",
};

export default function PredictLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
