import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ results: [] });

  const url = new URL("http://www.aladin.co.kr/ttb/api/ItemSearch.aspx");
  url.searchParams.set("TTBKey", process.env.ALADIN_TTB_KEY!);
  url.searchParams.set("Query", query);
  url.searchParams.set("QueryType", "Title");
  url.searchParams.set("MaxResults", "10");
  url.searchParams.set("start", "1");
  url.searchParams.set("SearchTarget", "Book");
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");
  url.searchParams.set("Cover", "Big");

  const res = await fetch(url.toString());
  if (!res.ok) return NextResponse.json({ error: "Aladin API error" }, { status: res.status });

  const data = await res.json();
  const results = (data.item ?? []).map((b: any) => ({
    isbn: b.isbn13 || b.isbn,
    title: b.title,
    author: b.author ?? null,
    publisher: b.publisher ?? null,
    pub_date: b.pubDate ?? null,
    poster_url: b.cover ?? null,
    description: b.description ?? null,
    category: b.categoryName ? b.categoryName.split(">")[1]?.trim() ?? null : null,
  }));

  return NextResponse.json({ results });
}
