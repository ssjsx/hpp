export interface PropertyFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

export interface ApiErrorDetail {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  path: string;
  details?: ApiErrorDetail[];
}

export interface MarketFilters {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxDistance?: number;
  minSchoolRating?: number;
  search?: string;
  sortBy?: "price" | "square_footage" | "school_rating" | "year_built";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface MarketPropertyRow extends PropertyFeatures {
  id: number;
  price: number;
}

export interface MarketSummary {
  totalCount: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPricePerSqft: number;
}

export interface MarketSegmentPoint {
  label: string;
  count: number;
  avgPrice: number;
}

export interface MarketOverviewResponse {
  summary: MarketSummary;
  segmentDistribution: MarketSegmentPoint[];
  priceBuckets: MarketSegmentPoint[];
  rows: MarketPropertyRow[];
  totalRows: number;
  generatedAt: string;
}

export interface WhatIfResult {
  prediction: number;
  varianceFromAverage: number;
}
