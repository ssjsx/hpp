import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL?.replace(/\/$/, "");

export async function POST(req: NextRequest) {
  if (!PYTHON_API_URL) {
    return NextResponse.json(
      {
        success: 1,
        error: {
          code: "CONFIG_ERROR",
          message: "PYTHON_API_URL is not configured in .env.",
          path: "/api/app1/estimate",
        },
      },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: 1,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
          path: "/api/app1/estimate",
        },
      },
      { status: 400 },
    );
  }

  // Convert JSON payload to form-encoded so the Python backend can parse it
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    form.append(key, String(value));
  }

  try {
    const upstream = await fetch(`${PYTHON_API_URL}/app1/property-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[app1/estimate] upstream call failed", {
      endpoint: `${PYTHON_API_URL}/app1/property-estimate`,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        success: 1,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message:
            "Prediction service is unavailable. Check PYTHON_API_URL and python api_server connectivity.",
          path: "/api/app1/estimate",
        },
      },
      { status: 503 },
    );
  }
}
