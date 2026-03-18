"use client";

import { useCallback, useEffect, useState } from "react";
import type { EstimateResult } from "@/lib/types";

export function useEstimateHistory(
  initialHistory: EstimateResult[] = [],
  initializedFromServer = false,
) {
  const [history, setHistory] = useState<EstimateResult[]>(initialHistory);
  const [hydrated, setHydrated] = useState(initializedFromServer);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/app1/history", { cache: "no-store" });
    const data = (await res.json()) as {
      success: number;
      history?: EstimateResult[];
      error?: { message?: string };
    };

    if (!res.ok || data.success === 1) {
      throw new Error(data.error?.message ?? "Failed to load history.");
    }

    setHistory(data.history ?? []);
  }, []);

  useEffect(() => {
    if (initializedFromServer) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        await loadHistory();
      } catch {
        if (mounted) {
          setHistory([]);
        }
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initializedFromServer, loadHistory]);

  const addEntry = useCallback(
    async (entry: EstimateResult) => {
      const res = await fetch("/api/app1/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Failed to save history.");
      }

      await loadHistory();
    },
    [loadHistory],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const res = await fetch(
        `/api/app1/history?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const payload = (await res.json()) as { error?: { message?: string } };
        throw new Error(
          payload.error?.message ?? "Failed to delete history item.",
        );
      }

      await loadHistory();
    },
    [loadHistory],
  );

  const clearHistory = useCallback(async () => {
    const res = await fetch("/api/app1/history", {
      method: "DELETE",
    });

    if (!res.ok) {
      const payload = (await res.json()) as { error?: { message?: string } };
      throw new Error(payload.error?.message ?? "Failed to clear history.");
    }

    await loadHistory();
  }, [loadHistory]);

  return {
    history,
    hydrated,
    loadHistory,
    addEntry,
    removeEntry,
    clearHistory,
  };
}
