import { Metadata } from "next";
import PlayerProfile from "./PlayerProfile";
import { allPlayers, getPlayerBySlug } from "@/data/players";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPlayers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = getPlayerBySlug(slug);
  if (!player) {
    return { title: "Player Not Found | KickScan" };
  }
  return {
    title: `${player.name} at World Cup 2026 — Profile, Stats & Prediction | KickScan`,
    description: `${player.name} World Cup 2026 profile. ${player.tagline}. AI predictions, match schedule, and analysis for ${player.country} at the FIFA World Cup 2026.`,
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { slug } = await params;
  return <PlayerProfile slug={slug} />;
}
