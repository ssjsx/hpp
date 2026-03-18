"use client";

import { useMemo, useState } from "react";
import type { MarketFilters } from "@/lib/types";

const DEFAULT_FILTERS: MarketFilters = {
  minPrice: undefined,
  maxPrice: undefined,
  minBedrooms: undefined,
  maxDistance: undefined,
  minSchoolRating: undefined,
  search: "",
  sortBy: "price",
  sortOrder: "desc",
  page: 1,
  pageSize: 20,
};

export function useMarketFilters() {
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);

  function patchFilters(patch: Partial<MarketFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.minPrice ||
        filters.maxPrice ||
        filters.minBedrooms ||
        filters.maxDistance ||
        filters.minSchoolRating ||
        filters.search,
      ),
    [filters],
  );

  return {
    filters,
    patchFilters,
    resetFilters,
    hasActiveFilters,
  };
}
