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
    const res = await fetch("/api/app1/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: ApiErrorBody };
      const errBody = data.error;
      throw new RequestError(
        errBody?.code ?? "API_ERROR",
        errBody?.message ?? "Failed to get property estimate.",
        res.status,
        errBody?.details,
      );
    }
    const data = await res.json();

    return data.prediction as number;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }

    throw new RequestError("UNKNOWN_ERROR", "An unexpected error occurred.", 0);
  }
}
