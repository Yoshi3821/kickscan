import { NextResponse } from "next/server";
import { fetchMatchOdds, fetchWinnerOdds } from "@/lib/odds";

export const revalidate = 7200; // 2 hours ISR

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "match";

  try {
    if (type === "winner") {
      const data = await fetchWinnerOdds();
      return NextResponse.json(data);
    } else {
      const data = await fetchMatchOdds();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
