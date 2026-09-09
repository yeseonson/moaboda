import { NextRequest, NextResponse } from "next/server";

/**
 * 카카오 책 검색.
 * 알라딘 OpenAPI 가 2026-10-30 에 종료돼 옮겨왔다.
 * 알라딘과 달리 저자·역자가 배열로 나뉘어 오지만, 분류(장르)는 주지 않는다.
 */

interface KakaoBook {
  title: string;
  contents: string;
  isbn: string;
  datetime: string;
  authors: string[];
  translators: string[];
  publisher: string;
  thumbnail: string;
}

/** 카카오는 "isbn10 isbn13" 을 공백으로 붙여 준다. 둘 중 13자리를 쓴다. */
function pickIsbn(raw: string): string {
  const parts = (raw ?? "").split(/\s+/).filter(Boolean);
  return parts.find((p) => p.length === 13) ?? parts[0] ?? "";
}

/**
 * 썸네일은 120x174 로 작다. URL 의 fname 파라미터가 원본 주소(458x638 쯤)라 그걸 꺼내 쓴다.
 * 크기를 직접 고쳐 쓰는 것(R120x174 -> R240x348)은 문서에 없는 동작이라 기대지 않는다.
 * fname 은 http 로 오는데 그대로 두면 https 페이지에서 mixed content 로 막힌다.
 */
function coverUrl(thumbnail: string): string | null {
  if (!thumbnail) return null;
  try {
    const origin = new URL(thumbnail).searchParams.get("fname");
    return origin ? origin.replace(/^http:\/\//, "https://") : thumbnail;
  } catch {
    return thumbnail;
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ results: [] });

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return NextResponse.json({ error: "KAKAO_REST_API_KEY_MISSING" }, { status: 500 });

  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", query);
  url.searchParams.set("target", "title");
  url.searchParams.set("size", "10");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${key}` },
  });
  if (!res.ok) return NextResponse.json({ error: "Kakao API error" }, { status: res.status });

  const data = await res.json();
  const results = (data.documents ?? []).map((b: KakaoBook) => ({
    isbn: pickIsbn(b.isbn),
    title: b.title,
    // 역자는 저장할 곳이 없어 저자만 넘긴다
    author: b.authors?.join(", ") || null,
    publisher: b.publisher || null,
    pub_date: b.datetime ? b.datetime.slice(0, 10) : null,
    poster_url: coverUrl(b.thumbnail),
    description: b.contents || null,
    // 카카오는 분류를 주지 않는다. 장르는 직접 입력한다.
    category: null,
  }));

  return NextResponse.json({ results });
}
