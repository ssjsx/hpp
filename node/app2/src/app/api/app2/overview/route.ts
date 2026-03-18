import { NextRequest, NextResponse } from "next/server";
import type { MarketFilters } from "@/lib/types";
import { buildFallbackOverview } from "@/lib/marketAnalysisFallback";

const JAVA_API_URL = process.env.JAVA_API_URL;

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

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOverviewPayload(payload: unknown) {
  const data = (payload ?? {}) as {
    rows?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };

  const normalizedRows = (data.rows ?? []).map((row) => ({
    id: toNumber(row.id),
    price: toNumber(row.price),
    square_footage: toNumber(row.square_footage ?? row.squareFootage),
    bedrooms: toNumber(row.bedrooms),
    bathrooms: toNumber(row.bathrooms),
    year_built: toNumber(row.year_built ?? row.yearBuilt),
    lot_size: toNumber(row.lot_size ?? row.lotSize),
    distance_to_city_center: toNumber(
      row.distance_to_city_center ?? row.distanceToCityCenter,
    ),
    school_rating: toNumber(row.school_rating ?? row.schoolRating),
  }));

  return {
    ...data,
    rows: normalizedRows,
  };
}

export async function GET(req: NextRequest) {
  const filters = getFilters(req.nextUrl.searchParams);

  if (!JAVA_API_URL) {
    return NextResponse.json(buildFallbackOverview(filters));
  }

  try {
    const upstream = await fetch(
      `${JAVA_API_URL}/api/v1/market/overview?${req.nextUrl.searchParams.toString()}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (upstream.ok) {
      const payload = await upstream.json();
      return NextResponse.json(normalizeOverviewPayload(payload), {
        status: upstream.status,
      });
    }
  } catch {
    // Fall back to local dataset processing if Java backend is unavailable.
  }

  return NextResponse.json(buildFallbackOverview(filters));
}
