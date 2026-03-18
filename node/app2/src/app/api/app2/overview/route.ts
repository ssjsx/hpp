import { NextRequest, NextResponse } from "next/server";
import type { MarketFilters } from "@/lib/types";
import { buildFallbackOverview } from "@/lib/marketAnalysisFallback";

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://127.0.0.1:8080";

function getFilters(searchParams: URLSearchParams): MarketFilters {
  return {
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    minBedrooms: searchParams.get("minBedrooms")
      ? Number(searchParams.get("minBedrooms"))
      : undefined,
    maxDistance: searchParams.get("maxDistance")
      ? Number(searchParams.get("maxDistance"))
      : undefined,
    minSchoolRating: searchParams.get("minSchoolRating")
      ? Number(searchParams.get("minSchoolRating"))
      : undefined,
    search: searchParams.get("search") ?? undefined,
    sortBy:
      (searchParams.get("sortBy") as MarketFilters["sortBy"]) ?? undefined,
    sortOrder:
      (searchParams.get("sortOrder") as MarketFilters["sortOrder"]) ??
      undefined,
    page: searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined,
    pageSize: searchParams.get("pageSize")
      ? Number(searchParams.get("pageSize"))
      : undefined,
  };
}

export async function GET(req: NextRequest) {
  const filters = getFilters(req.nextUrl.searchParams);

  try {
    const upstream = await fetch(
      `${JAVA_API_URL}/api/v1/market/overview?${req.nextUrl.searchParams.toString()}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (upstream.ok) {
      return NextResponse.json(await upstream.json(), {
        status: upstream.status,
      });
    }
  } catch {
    // Fall back to local dataset processing if Java backend is unavailable.
  }

  return NextResponse.json(buildFallbackOverview(filters));
}
