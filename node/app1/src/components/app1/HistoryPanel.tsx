"use client";

import Link from "next/link";
import type { EstimateResult } from "@/lib/types";

interface Props {
  history: EstimateResult[];
  onRemove: (id: string) => Promise<void> | void;
  onClear: () => Promise<void> | void;
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

export function HistoryPanel({ history, onRemove, onClear }: Props) {
  return (
    <section
      aria-labelledby="history-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          id="history-heading"
          className="text-sm font-semibold uppercase tracking-wider text-slate-500"
        >
          History
        </h2>
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button
              onClick={() => {
                void onClear();
              }}
              aria-label="Clear all estimate history"
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
          {history.length >= 2 && (
            <Link
              href="/comparison"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Compare
            </Link>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="py-8 text-center text-sm text-slate-400"
        >
          No estimates yet - fill in the form to get started.
        </p>
      ) : (
        <ul className="space-y-2.5" aria-describedby="history-heading">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="group rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-blue-700">
                    {formatPrice(entry.prediction)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.inputs.square_footage.toLocaleString()} sq ft
                    &middot; {entry.inputs.bedrooms} bed &middot;{" "}
                    {entry.inputs.bathrooms} bath
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(entry.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    void onRemove(entry.id);
                  }}
                  aria-label={`Remove estimate from ${formatDate(entry.timestamp)}`}
                  className="mt-0.5 text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
