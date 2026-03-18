import { NextRequest, NextResponse } from "next/server";
import type { MarketFilters } from "@/lib/types";
import { buildFallbackCsv } from "@/lib/marketAnalysisFallback";

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
  };
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();

  try {
    const upstream = await fetch(
      `${JAVA_API_URL}/api/v1/market/export/csv?${qs}`,
    );
    if (upstream.ok) {
      const content = await upstream.arrayBuffer();
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="market-analysis.csv"',
        },
      });
    }
  } catch {
    // Fall through to local fallback export
  }

  const csv = buildFallbackCsv(getFilters(req.nextUrl.searchParams));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="market-analysis.csv"',
    },
  });
}
