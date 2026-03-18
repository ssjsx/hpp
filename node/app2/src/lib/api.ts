import axios from "axios";
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
    const res = await axios.get(`/api/app2/overview${qs ? `?${qs}` : ""}`);

    if (res.data?.success === 1) {
      const err: ApiErrorBody = res.data.error;
      throw new RequestError(err.code, err.message, res.status, err.details);
    }

    return res.data as MarketOverviewResponse;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new RequestError(
          "NETWORK_ERROR",
          "Network error while loading market data.",
          0,
        );
      }
      const data = error.response.data as {
        error?: ApiErrorBody;
        message?: string;
      };
      const apiError = data?.error;

      if (apiError?.code && apiError?.message) {
        throw new RequestError(
          apiError.code,
          apiError.message,
          error.response.status,
          apiError.details,
        );
      }

      throw new RequestError(
        "REQUEST_FAILED",
        data?.message ?? "Failed to load market data.",
        error.response.status,
      );
    }
    throw new RequestError("UNKNOWN_ERROR", "An unexpected error occurred.", 0);
  }
}

export async function runWhatIfAnalysis(
  features: PropertyFeatures,
): Promise<WhatIfResult> {
  try {
    const res = await axios.post("/api/app2/what-if", features, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.data?.success === 1) {
      const err: ApiErrorBody = res.data.error;
      throw new RequestError(err.code, err.message, res.status, err.details);
    }

    return res.data as WhatIfResult;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new RequestError(
          "NETWORK_ERROR",
          "Network error while running what-if analysis.",
          0,
        );
      }
      const data = error.response.data as {
        error?: ApiErrorBody;
        message?: string;
      };
      const apiError = data?.error;

      if (apiError?.code && apiError?.message) {
        throw new RequestError(
          apiError.code,
          apiError.message,
          error.response.status,
          apiError.details,
        );
      }

      throw new RequestError(
        "REQUEST_FAILED",
        data?.message ?? "What-if analysis failed.",
        error.response.status,
      );
    }
    throw new RequestError("UNKNOWN_ERROR", "An unexpected error occurred.", 0);
  }
}

export async function downloadMarketExport(
  format: "csv" | "pdf",
  filters: MarketFilters,
): Promise<Blob> {
  const qs = toQueryString(filters);
  const res = await axios.get(
    `/api/app2/export/${format}${qs ? `?${qs}` : ""}`,
    {
      responseType: "blob",
    },
  );
  return res.data as Blob;
}
