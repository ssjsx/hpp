import type {
  ApiErrorBody,
  MarketFilters,
  MarketOverviewResponse,
  PropertyFeatures,
  WhatIfResult,
} from "./types";

export class RequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: ApiErrorBody["details"],
  ) {
    super(message);
    this.name = "RequestError";
  }
}

function toQueryString(filters: MarketFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export async function fetchMarketOverview(
  filters: MarketFilters,
): Promise<MarketOverviewResponse> {
  try {
    const qs = toQueryString(filters);
    const res = await fetch(`/api/app2/overview${qs ? `?${qs}` : ""}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: ApiErrorBody;
        message?: string;
      };
      const errBody = data.error;
      throw new RequestError(
        errBody?.code ?? "API_ERROR",
        errBody?.message ?? "Failed to load market overview.",
        res.status,
        errBody?.details,
      );
    }

    const data = await res.json();
    if (data?.success === 1) {
      const err: ApiErrorBody = data.error;
      throw new RequestError(err.code, err.message, res.status, err.details);
    }

    return data as MarketOverviewResponse;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }

    throw new RequestError("UNKNOWN_ERROR", "An unexpected error occurred.", 0);
  }
}

export async function runWhatIfAnalysis(
  features: PropertyFeatures,
): Promise<WhatIfResult> {
  try {
    const res = await fetch("/api/app2/what-if", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: ApiErrorBody;
        message?: string;
      };
      const errBody = data.error;
      throw new RequestError(
        errBody?.code ?? "API_ERROR",
        errBody?.message ?? "What-if analysis failed.",
        res.status,
        errBody?.details,
      );
    }

    const data = await res.json();

    if (data?.success === 1) {
      const err: ApiErrorBody = data.error;
      throw new RequestError(err.code, err.message, res.status, err.details);
    }

    return data as WhatIfResult;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }

    throw new RequestError("UNKNOWN_ERROR", "An unexpected error occurred.", 0);
  }
}

export async function downloadMarketExport(
  format: "csv" | "pdf",
  filters: MarketFilters,
): Promise<Blob> {
  const qs = toQueryString(filters);
  const res = await fetch(`/api/app2/export/${format}${qs ? `?${qs}` : ""}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    const data = (await res.json()) as {
      error?: ApiErrorBody;
      message?: string;
    };
    const errBody = data.error;
    throw new RequestError(
      errBody?.code ?? "API_ERROR",
      errBody?.message ?? "Failed to download market export.",
      res.status,
      errBody?.details,
    );
  }

  const data = await res.blob();
  return data as Blob;
}
