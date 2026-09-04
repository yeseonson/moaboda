import { NextRequest, NextResponse } from "next/server";
import { defaultPeriod, fetchKopis, rows, tag } from "@/lib/kopis";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json([]);

  let xml: string;
  try {
    xml = await fetchKopis("", { ...defaultPeriod(), cpage: "1", rows: "10", shprfnm: query });
  } catch (err) {
    const missingKey = err instanceof Error && err.message === "KOPIS_API_KEY_MISSING";
    return NextResponse.json(
      { error: missingKey ? "KOPIS_API_KEY가 설정되지 않았습니다." : "KOPIS API error" },
      { status: missingKey ? 500 : 502 }
    );
  }

  const results = rows(xml).map((row) => ({
    kopis_id: tag(row, "mt20id"),
    title: tag(row, "prfnm"),
    poster_url: tag(row, "poster"),
    venue: tag(row, "fcltynm"),
    period_start: tag(row, "prfpdfrom"),
    period_end: tag(row, "prfpdto"),
    genre: tag(row, "genrenm"),
    cast: null,
    runtime: null,
  }));

  return NextResponse.json(results.filter((r) => r.kopis_id));
}
