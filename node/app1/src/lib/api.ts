import axios from "axios";
import type { ApiErrorBody, PropertyFeatures } from "./types";

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

export async function estimatePropertyValue(
  features: PropertyFeatures,
): Promise<number> {
  try {
    const res = await axios.post("/api/app1/estimate", features, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.data?.success === 1) {
      const err: ApiErrorBody = res.data.error;
      throw new RequestError(err.code, err.message, res.status, err.details);
    }

    return res.data.prediction as number;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new RequestError(
          "NETWORK_ERROR",
          "Network error - please check your connection.",
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
        data?.message ?? "Request failed.",
        error.response.status,
      );
    }

    throw new RequestError("UNKNOWN_ERROR", "An unexpected error occurred.", 0);
  }
}
