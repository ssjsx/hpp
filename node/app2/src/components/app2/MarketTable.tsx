"use client";

import type { MarketFilters, MarketPropertyRow } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toLocaleString();
}

type SortableColumn =
  | "price"
  | "square_footage"
  | "school_rating"
  | "year_built";

interface Props {
  rows: MarketPropertyRow[];
  totalRows: number;
  filters: MarketFilters;
  onSortChange: (sortBy: SortableColumn) => void;
}

export function MarketTable({ rows, totalRows, filters, onSortChange }: Props) {
  function sortSymbol(column: SortableColumn) {
    if (filters.sortBy !== column) return "";
    return filters.sortOrder === "asc" ? " ↑" : " ↓";
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Market Data
        </h2>
        <p className="text-xs text-slate-400">{totalRows} rows</p>
      </div>

      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              ID
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <button
                className="hover:text-blue-600"
                onClick={() => onSortChange("price")}
              >
                Price{sortSymbol("price")}
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <button
                className="hover:text-blue-600"
                onClick={() => onSortChange("square_footage")}
              >
                Sq Ft{sortSymbol("square_footage")}
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bedrooms
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bathrooms
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <button
                className="hover:text-blue-600"
                onClick={() => onSortChange("year_built")}
              >
                Year Built{sortSymbol("year_built")}
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <button
                className="hover:text-blue-600"
                onClick={() => onSortChange("school_rating")}
              >
                School Rating{sortSymbol("school_rating")}
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Distance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 text-slate-500">{row.id}</td>
              <td className="px-3 py-2 font-medium text-slate-900">
                {formatCurrency(row.price)}
              </td>
              <td className="px-3 py-2 text-slate-700">
                {formatNumber(row.square_footage)}
              </td>
              <td className="px-3 py-2 text-slate-700">{row.bedrooms}</td>
              <td className="px-3 py-2 text-slate-700">{row.bathrooms}</td>
              <td className="px-3 py-2 text-slate-700">{row.year_built}</td>
              <td className="px-3 py-2 text-slate-700">{row.school_rating}</td>
              <td className="px-3 py-2 text-slate-700">
                {row.distance_to_city_center} mi
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-12 text-center text-slate-400">
                No properties match the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
