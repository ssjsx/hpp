import "server-only";

import type { EstimateResult } from "@/lib/types";

const PYTHON_API_URL = process.env.PYTHON_API_URL;

export async function getInitialEstimateHistory(): Promise<EstimateResult[]> {
  if (!PYTHON_API_URL) {
    return [];
  }

  try {
    const res = await fetch(`${PYTHON_API_URL}/app1/history`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as {
      success?: number;
      history?: EstimateResult[];
    };

    if (data.success === 1) {
      return [];
    }

    return data.history ?? [];
  } catch {
    return [];
  }
}
