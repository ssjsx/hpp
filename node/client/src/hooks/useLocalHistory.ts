"use client";

import { useState, useEffect, useCallback } from "react";
import type { EstimateResult } from "@/lib/types";

const STORAGE_KEY = "app1_estimate_history";
const MAX_ENTRIES = 20;

export function useLocalHistory() {
  const [history, setHistory] = useState<EstimateResult[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored) as EstimateResult[]);
    } catch {
      // Ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  const persist = (entries: EstimateResult[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  };

  const addEntry = useCallback((entry: EstimateResult) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((e) => e.id !== entry.id)].slice(
        0,
        MAX_ENTRIES,
      );
      persist(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { history, hydrated, addEntry, removeEntry, clearHistory };
}
