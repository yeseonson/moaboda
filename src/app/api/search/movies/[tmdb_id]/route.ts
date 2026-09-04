import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tmdb_id: string }> }
) {
  const { tmdb_id } = await params;

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdb_id}/credits?language=ko-KR`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
    }
  );

  if (!res.ok) return NextResponse.json({ cast: [] });

  const data = await res.json();
  const cast: string[] = (data.cast ?? [])
    .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
    .slice(0, 10)
    .map((c: { name: string }) => c.name);

  return NextResponse.json({ cast });
}
