import { NextRequest, NextResponse } from "next/server";
import type { EstimateResult } from "@/lib/types";

const PATH = "/api/app1/history";
const PYTHON_API_URL = process.env.PYTHON_API_URL?.replace(/\/$/, "");

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: 1,
      error: {
        code,
        message,
        path: PATH,
      },
    },
    { status },
  );
}

export async function GET() {
  if (!PYTHON_API_URL) {
    return errorResponse(
      "CONFIG_ERROR",
      "PYTHON_API_URL is not configured in .env.",
      500,
    );
  }

  try {
    const upstream = await fetch(`${PYTHON_API_URL}/app1/history`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[app1/history] GET upstream call failed", {
      endpoint: `${PYTHON_API_URL}/app1/history`,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      "DB_READ_FAILED",
      "Unable to load estimate history from MySQL.",
      503,
    );
  }
}

export async function POST(req: NextRequest) {
  if (!PYTHON_API_URL) {
    return errorResponse(
      "CONFIG_ERROR",
      "PYTHON_API_URL is not configured in .env.",
      500,
    );
  }

  let body: EstimateResult;

  try {
    body = (await req.json()) as EstimateResult;
  } catch {
    return errorResponse(
      "INVALID_JSON",
      "Request body must be valid JSON.",
      400,
    );
  }

  if (!body?.id || !body?.inputs || typeof body?.prediction !== "number") {
    return errorResponse(
      "INVALID_PAYLOAD",
      "Invalid history entry payload.",
      400,
    );
  }

  try {
    const upstream = await fetch(`${PYTHON_API_URL}/app1/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[app1/history] POST upstream call failed", {
      endpoint: `${PYTHON_API_URL}/app1/history`,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      "DB_WRITE_FAILED",
      "Unable to save estimate history to MySQL.",
      503,
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!PYTHON_API_URL) {
    return errorResponse(
      "CONFIG_ERROR",
      "PYTHON_API_URL is not configured in .env.",
      500,
    );
  }

  const id = req.nextUrl.searchParams.get("id");

  try {
    const upstream = await fetch(
      `${PYTHON_API_URL}/app1/history${id ? `?id=${encodeURIComponent(id)}` : ""}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      },
    );
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[app1/history] DELETE upstream call failed", {
      endpoint: `${PYTHON_API_URL}/app1/history${id ? `?id=${encodeURIComponent(id)}` : ""}`,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      "DB_DELETE_FAILED",
      "Unable to delete estimate history from MySQL.",
      503,
    );
  }
}
