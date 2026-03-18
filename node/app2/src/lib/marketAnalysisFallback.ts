import fs from "node:fs";
import path from "node:path";
import type {
  MarketFilters,
  MarketOverviewResponse,
  MarketPropertyRow,
  PropertyFeatures,
  WhatIfResult,
} from "@/lib/types";

let cache: MarketPropertyRow[] | null = null;

function num(value: string): number {
  return Number(value);
}

function getDatasetRows(): MarketPropertyRow[] {
  if (cache) {
    return cache;
  }

  const datasetPath =
    process.env.HOUSE_DATASET_PATH ??
    path.resolve(
      process.cwd(),
      "../../python/predict_server/dataset/House Price Dataset.csv",
    );

  const raw = fs.readFileSync(datasetPath, "utf-8");
  const lines = raw.trim().split(/\r?\n/);
  const [, ...rows] = lines;

  cache = rows.map((line) => {
    const [
      id,
      square_footage,
      bedrooms,
      bathrooms,
      year_built,
      lot_size,
      distance_to_city_center,
      school_rating,
      price,
    ] = line.split(",");

    return {
      id: num(id),
      square_footage: num(square_footage),
      bedrooms: num(bedrooms),
      bathrooms: num(bathrooms),
      year_built: num(year_built),
      lot_size: num(lot_size),
      distance_to_city_center: num(distance_to_city_center),
      school_rating: num(school_rating),
      price: num(price),
    };
  });

  return cache;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function buildPriceBuckets(rows: MarketPropertyRow[]) {
  const ranges = [
    { min: 0, max: 200000, label: "<200k" },
    { min: 200000, max: 250000, label: "200k-250k" },
    { min: 250000, max: 300000, label: "250k-300k" },
    { min: 300000, max: 350000, label: "300k-350k" },
    { min: 350000, max: Number.POSITIVE_INFINITY, label: ">350k" },
  ];

  return ranges.map((range) => {
    const bucketRows = rows.filter(
      (row) => row.price >= range.min && row.price < range.max,
    );

    return {
      label: range.label,
      count: bucketRows.length,
      avgPrice:
        bucketRows.length > 0
          ? bucketRows.reduce((sum, row) => sum + row.price, 0) /
            bucketRows.length
          : 0,
    };
  });
}

function buildSegments(rows: MarketPropertyRow[]) {
  const byBedrooms = new Map<string, MarketPropertyRow[]>();

  rows.forEach((row) => {
    const label = `${Math.round(row.bedrooms)} bed`;
    const prev = byBedrooms.get(label) ?? [];
    prev.push(row);
    byBedrooms.set(label, prev);
  });

  return Array.from(byBedrooms.entries())
    .map(([label, segmentRows]) => ({
      label,
      count: segmentRows.length,
      avgPrice:
        segmentRows.reduce((sum, row) => sum + row.price, 0) /
        segmentRows.length,
    }))
    .sort((a, b) => b.count - a.count);
}

function applyFilters(
  rows: MarketPropertyRow[],
  filters: MarketFilters,
): MarketPropertyRow[] {
  const filtered = rows.filter((row) => {
    if (filters.minPrice !== undefined && row.price < filters.minPrice)
      return false;
    if (filters.maxPrice !== undefined && row.price > filters.maxPrice)
      return false;
    if (filters.minBedrooms !== undefined && row.bedrooms < filters.minBedrooms)
      return false;
    if (
      filters.maxDistance !== undefined &&
      row.distance_to_city_center > filters.maxDistance
    )
      return false;
    if (
      filters.minSchoolRating !== undefined &&
      row.school_rating < filters.minSchoolRating
    )
      return false;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const searchable = [
        row.id,
        row.year_built,
        row.bedrooms,
        row.bathrooms,
        row.price,
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  const sortBy = filters.sortBy ?? "price";
  const sortOrder = filters.sortOrder ?? "desc";

  filtered.sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    if (left === right) return 0;
    const sign = left > right ? 1 : -1;
    return sortOrder === "asc" ? sign : -sign;
  });

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return filtered.slice(start, end);
}

export function buildFallbackOverview(
  filters: MarketFilters,
): MarketOverviewResponse {
  const allRows = getDatasetRows();
  const filteredRows = applyFilters(allRows, {
    ...filters,
    page: 1,
    pageSize: allRows.length,
  });
  const rows = applyFilters(allRows, filters);

  const prices = filteredRows.map((row) => row.price);
  const totalPrice = prices.reduce((sum, value) => sum + value, 0);
  const totalSqft = filteredRows.reduce(
    (sum, row) => sum + row.square_footage,
    0,
  );

  return {
    summary: {
      totalCount: filteredRows.length,
      avgPrice: filteredRows.length ? totalPrice / filteredRows.length : 0,
      medianPrice: median(prices),
      minPrice: filteredRows.length ? Math.min(...prices) : 0,
      maxPrice: filteredRows.length ? Math.max(...prices) : 0,
      avgPricePerSqft: totalSqft > 0 ? totalPrice / totalSqft : 0,
    },
    segmentDistribution: buildSegments(filteredRows),
    priceBuckets: buildPriceBuckets(filteredRows),
    rows,
    totalRows: filteredRows.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function buildFallbackWhatIf(
  features: PropertyFeatures,
): Promise<WhatIfResult> {
  const mlUrl = process.env.PREDICT_API_URL;
  let prediction = 0;

  if (mlUrl) {
    try {
      const response = await fetch(`${mlUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      });

      if (response.ok) {
        const data = (await response.json()) as { prediction?: number };
        if (typeof data.prediction === "number") {
          prediction = data.prediction;
        }
      }
    } catch {
      prediction = 0;
    }
  }

  // If predict server is not reachable, return a deterministic estimate from the local dataset baseline.
  if (!prediction) {
    prediction =
      features.square_footage * 140 +
      features.bedrooms * 8000 +
      features.bathrooms * 12000 +
      features.school_rating * 7000 -
      features.distance_to_city_center * 1500;
  }

  const avgPrice = buildFallbackOverview({}).summary.avgPrice;
  const varianceFromAverage = avgPrice
    ? ((prediction - avgPrice) / avgPrice) * 100
    : 0;

  return {
    prediction,
    varianceFromAverage,
  };
}

export function buildFallbackCsv(filters: MarketFilters): string {
  const overview = buildFallbackOverview({
    ...filters,
    page: 1,
    pageSize: 100000,
  });
  const header = [
    "id",
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
    "price",
  ];

  const body = overview.rows.map((row) =>
    [
      row.id,
      row.square_footage,
      row.bedrooms,
      row.bathrooms,
      row.year_built,
      row.lot_size,
      row.distance_to_city_center,
      row.school_rating,
      row.price,
    ].join(","),
  );

  return [header.join(","), ...body].join("\n");
}
