"use client";

import { useState } from "react";
import { estimatePropertyValue, RequestError } from "@/lib/api";
import { useEstimateHistory } from "@/hooks/useEstimateHistory";
import type { EstimateResult, PropertyFeatures } from "@/lib/types";
import { PropertyForm } from "@/components/app1/PropertyForm";
import { ResultPanel } from "@/components/app1/ResultPanel";
import { HistoryPanel } from "@/components/app1/HistoryPanel";

interface Props {
  initialHistory: EstimateResult[];
}

function createEntryId(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function App1Client({ initialHistory }: Props) {
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { history, hydrated, addEntry, removeEntry, clearHistory } =
    useEstimateHistory(initialHistory, true);

  async function handleSubmit(features: PropertyFeatures) {
    setIsLoading(true);
    setError(null);
    try {
      const prediction = await estimatePropertyValue(features);
      const entry: EstimateResult = {
        id: createEntryId(),
        timestamp: Date.now(),
        inputs: features,
        prediction,
      };
      setResult(entry);
      await addEntry(entry);
    } catch (err) {
      setError(
        err instanceof RequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Property Value Estimator
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter property details below to receive an estimated market value from
          our regression model.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: form + results */}
        <div className="lg:col-span-2 space-y-5">
          <PropertyForm onSubmit={handleSubmit} isLoading={isLoading} />

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {result && !isLoading && <ResultPanel result={result} />}
        </div>

        {/* Right: history */}
        <div>
          <HistoryPanel
            history={hydrated ? history : []}
            onRemove={removeEntry}
            onClear={clearHistory}
          />
        </div>
      </div>
    </div>
  );
}
