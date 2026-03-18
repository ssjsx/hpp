import { NextRequest, NextResponse } from "next/server";
import { buildFallbackOverview } from "@/lib/marketAnalysisFallback";

const JAVA_API_URL = process.env.JAVA_API_URL ?? "http://127.0.0.1:8080";

function buildSimplePdf(lines: string[]): ArrayBuffer {
  const text = lines.join("\\n").replace(/[()]/g, "");
  const stream = `BT /F1 12 Tf 50 760 Td (${text}) Tj ET`;

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf).buffer as ArrayBuffer;
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();

  try {
    const upstream = await fetch(
      `${JAVA_API_URL}/api/v1/market/export/pdf?${qs}`,
    );
    if (upstream.ok) {
      const content = await upstream.arrayBuffer();
      return new NextResponse(content, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="market-analysis.pdf"',
        },
      });
    }
  } catch {
    // Fallback to lightweight generated PDF.
  }

  const overview = buildFallbackOverview({});
  const lines = [
    "Property Market Analysis",
    `Total properties: ${overview.summary.totalCount}`,
    `Average price: ${overview.summary.avgPrice.toFixed(0)}`,
    `Median price: ${overview.summary.medianPrice.toFixed(0)}`,
    `Price range: ${overview.summary.minPrice.toFixed(0)} - ${overview.summary.maxPrice.toFixed(0)}`,
  ];

  const content = new Blob([buildSimplePdf(lines)], {
    type: "application/pdf",
  });

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="market-analysis.pdf"',
    },
  });
}
