import type { MarketOverviewResponse } from "@/lib/types";

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://127.0.0.1:8080";

export async function getInitialMarketOverview(): Promise<MarketOverviewResponse | null> {
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
