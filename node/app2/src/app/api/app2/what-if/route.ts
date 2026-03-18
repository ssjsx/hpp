import { NextRequest, NextResponse } from "next/server";
import { buildFallbackWhatIf } from "@/lib/marketAnalysisFallback";
import type { PropertyFeatures } from "@/lib/types";

const JAVA_API_URL = process.env.JAVA_API_URL;

export async function POST(req: NextRequest) {
  let body: PropertyFeatures;

  try {
    body = (await req.json()) as PropertyFeatures;
  } catch {
    return NextResponse.json(
      {
        success: 1,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
          path: "/api/app2/what-if",
        },
      },
      { status: 400 },
    );
  }

  try {
    if (!JAVA_API_URL) {
      throw new Error("JAVA_API_URL is not configured");
    }

    const upstream = await fetch(`${JAVA_API_URL}/api/v1/market/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (upstream.ok) {
      return NextResponse.json(await upstream.json(), {
        status: upstream.status,
      });
    }
  } catch {
    // Fall through to local fallback
  }

  const fallback = await buildFallbackWhatIf(body);
  return NextResponse.json(fallback);
}
