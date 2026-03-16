"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { EstimateResult, PropertyFeatures } from "@/lib/types";

// Typical ranges used to normalise each feature to 0–100 for the radar chart
const FEATURE_META: Record<
  keyof PropertyFeatures,
  { label: string; min: number; max: number; format?: (v: number) => string }
> = {
  square_footage: {
    label: "Sq Footage",
    min: 0,
    max: 5000,
    format: (v) => `${v.toLocaleString()} sq ft`,
  },
  bedrooms: { label: "Bedrooms", min: 0, max: 10 },
  bathrooms: { label: "Bathrooms", min: 0, max: 5 },
  year_built: { label: "Year Built", min: 1700, max: 2030 },
  lot_size: {
    label: "Lot Size",
    min: 0,
    max: 20000,
    format: (v) => `${v.toLocaleString()} sq ft`,
  },
  distance_to_city_center: {
    label: "Distance",
    min: 0,
    max: 50,
    format: (v) => `${v} mi`,
  },
  school_rating: {
    label: "School Rating",
    min: 0,
    max: 10,
    format: (v) => `${v} / 10`,
  },
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

interface Props {
  result: EstimateResult;
}

export function ResultPanel({ result }: Props) {
  const tableRows = (
    Object.keys(result.inputs) as (keyof PropertyFeatures)[]
  ).map((key) => ({
    label: FEATURE_META[key].label,
    value: FEATURE_META[key].format
      ? FEATURE_META[key].format!(result.inputs[key])
      : result.inputs[key].toLocaleString(),
  }));

  const radarData = (
    Object.keys(result.inputs) as (keyof PropertyFeatures)[]
  ).map((key) => ({
    feature: FEATURE_META[key].label,
    value: normalize(
      result.inputs[key],
      FEATURE_META[key].min,
      FEATURE_META[key].max,
    ),
    raw: result.inputs[key],
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Predicted price */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-center">
        <p className="text-sm font-medium text-blue-600 mb-1">
          Estimated Property Value
        </p>
        <p className="text-4xl font-bold text-blue-700">
          {formatPrice(result.prediction)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Feature table */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Input Summary
          </h3>
          <div className="overflow-hidden rounded-lg border border-slate-200 text-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableRows.map((row) => (
                  <tr
                    key={row.label}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2 text-slate-600">{row.label}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-900">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar chart */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Feature Profile{" "}
            <span className="font-normal text-slate-400">
              (normalised 0–100)
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart
              data={radarData}
              margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
            >
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="feature"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="value"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(
                  value: number,
                  _name: unknown,
                  props: { payload?: { raw: number; feature: string } },
                ) => [
                  `${props.payload?.raw ?? ""} (${value}%)`,
                  props.payload?.feature ?? "",
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 4px rgba(0,0,0,.08)",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
