import { NextRequest, NextResponse } from "next/server";
import { fetchKopis, runtimeMinutes, splitCast, tag } from "@/lib/kopis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kopis_id: string }> }
) {
  const { kopis_id } = await params;

  let xml: string;
  try {
    xml = await fetchKopis(`/${encodeURIComponent(kopis_id)}`, {});
  } catch {
    // 상세는 목록 결과를 보강하는 용도라, 실패해도 빈 값으로 넘긴다.
    return NextResponse.json({});
  }

  return NextResponse.json({
    kopis_id,
    title: tag(xml, "prfnm"),
    poster_url: tag(xml, "poster"),
    venue: tag(xml, "fcltynm"),
    period_start: tag(xml, "prfpdfrom"),
    period_end: tag(xml, "prfpdto"),
    genre: tag(xml, "genrenm"),
    cast: splitCast(tag(xml, "prfcast")),
    runtime: runtimeMinutes(tag(xml, "prfruntime")),
  });
}
