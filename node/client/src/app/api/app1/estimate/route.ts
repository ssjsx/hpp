import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
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
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        success: 1,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message:
            "Prediction service is unavailable. Please ensure it is running on port 8001.",
          path: "/api/app1/estimate",
        },
      },
      { status: 503 },
    );
  }
}
