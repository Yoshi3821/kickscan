import { fetchWinnerOdds } from "@/lib/odds";
import PredictionsClient from "./PredictionsClient";

export const revalidate = 7200;

export default async function PredictionsPage() {
  const winnerData = await fetchWinnerOdds();

  return (
    <PredictionsClient
      liveOutrightOdds={winnerData.outrightOdds}
      fetchedAt={winnerData.fetchedAt}
      bookmakerCount={winnerData.bookmakerCount}
    />
  );
}
