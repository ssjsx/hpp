import type { MarketOverviewResponse } from "@/lib/types";

const JAVA_API_URL = process.env.JAVA_API_URL;

export async function getInitialMarketOverview(): Promise<MarketOverviewResponse | null> {
  if (!JAVA_API_URL) {
    return null;
  }

  try {
    const res = await fetch(`${JAVA_API_URL}/api/v1/market/overview`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as MarketOverviewResponse;
  } catch {
    return null;
  }
}
