"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  RequestError,
  downloadMarketExport,
  fetchMarketOverview,
  runWhatIfAnalysis,
} from "@/lib/client";
import type {
  MarketFilters,
  MarketOverviewResponse,
  PropertyFeatures,
  WhatIfResult,
} from "@/lib/types";
import { useMarketFilters } from "@/hooks/useMarketFilters";
import { MarketTable } from "@/components/app2/MarketTable";
import { WhatIfPanel } from "@/components/app2/WhatIfPanel";

const PIE_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f97316",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  initialOverview: MarketOverviewResponse | null;
}

export function App2Client({ initialOverview }: Props) {
  const { filters, patchFilters, resetFilters, hasActiveFilters } =
    useMarketFilters();
  const [overview, setOverview] = useState<MarketOverviewResponse | null>(
    initialOverview,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMarketOverview(filters);
        if (active) {
          setOverview(data);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof RequestError
            ? err.message
            : "Failed to load market overview.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filters]);

  async function handleWhatIfSubmit(features: PropertyFeatures) {
    setWhatIfLoading(true);
    setWhatIfError(null);
    try {
      const result = await runWhatIfAnalysis(features);
      setWhatIfResult(result);
    } catch (err) {
      setWhatIfError(
        err instanceof RequestError
          ? err.message
          : "Unable to run what-if analysis.",
      );
    } finally {
      setWhatIfLoading(false);
    }
  }

  async function handleExport(format: "csv" | "pdf") {
    try {
      const blob = await downloadMarketExport(format, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `market-analysis.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof RequestError
          ? err.message
          : `Failed to export ${format.toUpperCase()}.`,
      );
    }
  }

  function onSortChange(
    sortBy: "price" | "square_footage" | "school_rating" | "year_built",
  ) {
    patchFilters({
      sortBy,
      sortOrder:
        filters.sortBy === sortBy && filters.sortOrder === "desc"
          ? "asc"
          : "desc",
    });
  }

  const generatedLabel = useMemo(() => {
    if (!overview?.generatedAt) return "";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(overview.generatedAt));
  }, [overview?.generatedAt]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Property Market Analysis
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Explore market segments, test scenarios, and export insight-ready
              reports.
            </p>
            {generatedLabel && (
              <p className="mt-2 text-xs text-slate-400">
                Last updated: {generatedLabel}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("csv")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export PDF
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Reset
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-slate-600">
            Min Price
            <input
              type="number"
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                patchFilters({ minPrice: Number(e.target.value) || undefined })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Max Price
            <input
              type="number"
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                patchFilters({ maxPrice: Number(e.target.value) || undefined })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Min Bedrooms
            <input
              type="number"
              value={filters.minBedrooms ?? ""}
              onChange={(e) =>
                patchFilters({
                  minBedrooms: Number(e.target.value) || undefined,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Max Distance (mi)
            <input
              type="number"
              value={filters.maxDistance ?? ""}
              onChange={(e) =>
                patchFilters({
                  maxDistance: Number(e.target.value) || undefined,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Min School Rating
            <input
              type="number"
              step="0.1"
              value={filters.minSchoolRating ?? ""}
              onChange={(e) =>
                patchFilters({
                  minSchoolRating: Number(e.target.value) || undefined,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Search
            <input
              type="text"
              value={filters.search ?? ""}
              onChange={(e) =>
                patchFilters({ search: e.target.value || undefined })
              }
              placeholder="e.g. 2005"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading market overview...
        </div>
      )}

      {overview && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Market Average
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(overview.summary.avgPrice)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Median Price
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(overview.summary.medianPrice)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Range
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatCurrency(overview.summary.minPrice)} to{" "}
                {formatCurrency(overview.summary.maxPrice)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Avg Price / Sq Ft
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(overview.summary.avgPricePerSqft)}
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Price Distribution
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={overview.priceBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Segment Share
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={overview.segmentDistribution}
                    dataKey="count"
                    nameKey="label"
                    outerRadius={86}
                    label
                  >
                    {overview.segmentDistribution.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <WhatIfPanel
            isLoading={whatIfLoading}
            result={whatIfResult}
            error={whatIfError}
            onSubmit={handleWhatIfSubmit}
          />

          <MarketTable
            rows={overview.rows}
            totalRows={overview.totalRows}
            filters={filters as MarketFilters}
            onSortChange={onSortChange}
          />
        </>
      )}
    </div>
  );
}
