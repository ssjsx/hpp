"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEstimateHistory } from "@/hooks/useEstimateHistory";
import type { EstimateResult, PropertyFeatures } from "@/lib/types";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const MAX_SELECT = 5;

// Feature normalisation ranges for grouped bar chart
const NORM_RANGES: Record<
  keyof PropertyFeatures,
  { min: number; max: number; label: string }
> = {
  square_footage: { min: 0, max: 5000, label: "Sq Footage" },
  bedrooms: { min: 0, max: 10, label: "Bedrooms" },
  bathrooms: { min: 0, max: 5, label: "Bathrooms" },
  year_built: { min: 1700, max: 2030, label: "Year Built" },
  lot_size: { min: 0, max: 20000, label: "Lot Size" },
  distance_to_city_center: { min: 0, max: 50, label: "Distance" },
  school_rating: { min: 0, max: 10, label: "School Rating" },
};

function normalize(value: number, min: number, max: number) {
  return Math.max(
    0,
    Math.min(100, Math.round(((value - min) / (max - min)) * 100)),
  );
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

interface Props {
  initialHistory: EstimateResult[];
}

export function ComparisonPage({ initialHistory }: Props) {
  const { history, hydrated } = useEstimateHistory(initialHistory, true);
  const [allHistory, setAllHistory] = useState<EstimateResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!hydrated) return;
    setAllHistory(history);
    setSelected(new Set(history.slice(0, 4).map((entry) => entry.id)));
  }, [history, hydrated]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECT) {
        next.add(id);
      }
      return next;
    });
  }

  const entries = allHistory.filter((e) => selected.has(e.id));

  // Normalised chart data: one data point per feature, one bar per property
  const chartData = (
    Object.keys(NORM_RANGES) as (keyof PropertyFeatures)[]
  ).map((key) => ({
    feature: NORM_RANGES[key].label,
    ...Object.fromEntries(
      entries.map((e, i) => [
        `P${i + 1}`,
        normalize(e.inputs[key], NORM_RANGES[key].min, NORM_RANGES[key].max),
      ]),
    ),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <Link
          href="/app1"
          className="mt-1 text-sm text-slate-400 hover:text-blue-600 transition-colors shrink-0"
        >
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Compare Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select up to {MAX_SELECT} estimates from your history to analyse
            side by side.
          </p>
        </div>
      </div>

      {allHistory.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-400 mb-4">
            No history yet. Run some estimates first.
          </p>
          <Link
            href="/app1"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Go to Estimator
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selector chips */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select properties ({selected.size} / {MAX_SELECT})
            </p>
            <div className="flex flex-wrap gap-2">
              {allHistory.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => toggleSelect(entry.id)}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected.has(entry.id)
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300",
                    !selected.has(entry.id) && selected.size >= MAX_SELECT
                      ? "opacity-40 cursor-not-allowed"
                      : "",
                  ].join(" ")}
                >
                  #{i + 1} - {formatPrice(entry.prediction)} -{" "}
                  {formatDate(entry.timestamp)}
                </button>
              ))}
            </div>
          </div>

          {entries.length < 2 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              Select at least 2 properties to see the comparison.
            </div>
          ) : (
            <>
              {/* Price cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {entries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border bg-white p-4 shadow-sm"
                    style={{ borderColor: COLORS[i] + "66" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ color: COLORS[i] }}
                    >
                      Property {i + 1}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatPrice(entry.prediction)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(entry.timestamp)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Feature comparison table */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
                <h2 className="mb-3 text-sm font-semibold text-slate-700">
                  Feature Comparison
                </h2>
                <table className="min-w-full text-sm divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Feature
                      </th>
                      {entries.map((_, i) => (
                        <th
                          key={i}
                          className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider"
                          style={{ color: COLORS[i] }}
                        >
                          Property {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(
                      Object.keys(NORM_RANGES) as (keyof PropertyFeatures)[]
                    ).map((key) => (
                      <tr
                        key={key}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-2 font-medium text-slate-700">
                          {NORM_RANGES[key].label}
                        </td>
                        {entries.map((entry, i) => (
                          <td
                            key={i}
                            className="px-4 py-2 text-right font-mono text-slate-900"
                          >
                            {entry.inputs[key].toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-4 py-2 font-semibold text-slate-700">
                        Est. Value
                      </td>
                      {entries.map((entry, i) => (
                        <td
                          key={i}
                          className="px-4 py-2 text-right font-bold"
                          style={{ color: COLORS[i] }}
                        >
                          {formatPrice(entry.prediction)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Normalised grouped bar chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-slate-700">
                  Feature Chart{" "}
                  <span className="font-normal text-slate-400">
                    (normalised 0-100 per feature)
                  </span>
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="feature"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value}%`,
                        name,
                      ]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
                      }}
                    />
                    <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                    {entries.map((_, i) => (
                      <Bar
                        key={i}
                        dataKey={`P${i + 1}`}
                        name={`Property ${i + 1}`}
                        fill={COLORS[i]}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
