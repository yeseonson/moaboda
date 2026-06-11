import { NextRequest, NextResponse } from "next/server";

const TMDB_GENRES: Record<number, string> = {
  28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디", 80: "범죄",
  99: "다큐멘터리", 18: "드라마", 10751: "가족", 14: "판타지", 36: "역사",
  27: "공포", 10402: "음악", 9648: "미스터리", 10749: "로맨스", 878: "SF",
  53: "스릴러", 10752: "전쟁", 37: "서부극",
};

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ results: [] });

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=ko-KR&region=KR`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    }
  );

  if (!res.ok) return NextResponse.json({ error: "TMDB API error" }, { status: res.status });

  const data = await res.json();
  const results = (data.results ?? []).slice(0, 10).map((m: any) => ({
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title,
    release_date: m.release_date ?? null,
    poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    overview: m.overview ?? null,
    genres: (m.genre_ids ?? []).map((id: number) => TMDB_GENRES[id]).filter(Boolean),
  }));

  return NextResponse.json({ results });
}
