"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord } from "@/types/record";

const CAT_COLOR: Record<CategoryType, string> = {
  performance: "#a78bfa",
  movie: "#60a5fa",
  book: "#f472b6",
  exhibition: "#4ade80",
};

const CAT_LABEL: Record<CategoryType, string> = {
  performance: "공연", movie: "영화", book: "책", exhibition: "전시",
};

// ── 재사용 컴포넌트 ──────────────────────────────────────

function donutColor(ratio: number) {
  // ratio 0→1 : 연한 라벤더(0.2) → 중간 보라(0.75)
  const opacity = (0.2 + ratio * 0.55).toFixed(2);
  return `rgba(109,40,217,${opacity})`;
}

function DonutChart({ data }: { data: [string, number][] }) {
  const total = data.reduce((s, [, v]) => s + v, 0);
  const r = 60; const cx = 80; const cy = 80;
  const circ = 2 * Math.PI * r;
  const GAP = data.length > 1 ? 3 : 0;
  const maxCount = data[0]?.[1] ?? 1;
  let offset = 0;
  const segs = data.map(([title, count]) => {
    const dash = (count / total) * circ;
    const color = donutColor(count / maxCount);
    const s = { title, count, dash, offset, color };
    offset += dash;
    return s;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width={160} height={160} className="shrink-0">
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={22}
            strokeDasharray={`${Math.max(s.dash - GAP, 0)} ${circ - Math.max(s.dash - GAP, 0)}`}
            strokeDashoffset={circ / 4 - s.offset} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#71717a" fontSize={11}>전체</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#18181b" fontSize={18} fontWeight="bold">{total}</text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segs.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="truncate text-xs text-zinc-600">{s.title}</span>
            <span className="ml-auto shrink-0 text-xs font-semibold text-zinc-500">{s.count}회</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthlyBar({ records, filterCat }: { records: CulturalRecord[]; filterCat?: CategoryType }) {
  const now = new Date();
  // offset=0: 현재 반기, -1: 이전 반기, ...
  const [offset, setOffset] = useState(0);

  const currentHalf = now.getMonth() < 6 ? 1 : 2;
  const currentYear = now.getFullYear();
  // offset 적용한 반기 계산
  const totalHalves = currentYear * 2 + (currentHalf - 1) + offset;
  const dispYear = Math.floor(totalHalves / 2);
  const dispHalf = (totalHalves % 2) + 1; // 1=상반기, 2=하반기
  const startMonth = dispHalf === 1 ? 1 : 7;

  const months = Array.from({ length: 6 }, (_, i) => {
    const m = startMonth + i;
    return {
      key: `${dispYear}-${String(m).padStart(2, "0")}`,
      label: `${m}월`,
    };
  });
  const data = months.map(({ key, label }) => {
    const cats: Partial<Record<CategoryType, number>> = {};
    for (const r of records) {
      if (r.view_date.startsWith(key) && (!filterCat || r.category === filterCat))
        cats[r.category] = (cats[r.category] ?? 0) + 1;
    }
    const total = Object.values(cats).reduce((s, v) => s + v, 0);
    return { label, cats, total };
  });
  const max = Math.max(...data.map(d => d.total), 1);
  const color = filterCat ? CAT_COLOR[filterCat] : undefined;
  const periodLabel = `${dispYear}년 ${dispHalf === 1 ? "상반기" : "하반기"}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOffset(o => o - 1)}
          className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:text-zinc-700">←</button>
        <span className="text-xs font-semibold text-zinc-600">{periodLabel}</span>
        <button type="button" onClick={() => setOffset(o => o + 1)}
          disabled={offset >= 0}
          className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:text-zinc-700 disabled:opacity-30">→</button>
      </div>
      <div className="flex items-end gap-2 h-28 mt-6">
        {data.map(({ label, cats, total: t }) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-col-reverse rounded-md overflow-hidden"
              style={{ height: `${(t / max) * 96}px`, minHeight: t > 0 ? "4px" : "0" }}>
              {(Object.entries(cats) as [CategoryType, number][]).map(([cat, cnt]) => (
                <div key={cat} style={{ height: `${(cnt / t) * 100}%`, backgroundColor: color ?? CAT_COLOR[cat] }} />
              ))}
            </div>
            {t > 0 && <span className="text-xs font-medium text-zinc-600">{t}</span>}
            <span className="text-xs text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
      {!filterCat && (
        <div className="flex flex-wrap gap-3">
          {(Object.entries(CAT_LABEL) as [CategoryType, string][]).map(([cat, label]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CAT_COLOR[cat] }} />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingDist({ records }: { records: CulturalRecord[] }) {
  const rated = records.filter(r => r.rating);
  if (!rated.length) return <p className="text-sm text-zinc-400">평점 기록이 없어요</p>;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: rated.filter(r => r.rating === star).length,
  }));
  const max = Math.max(...dist.map(d => d.count), 1);
  return (
    <div className="space-y-1.5">
      {dist.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2">
          <span className="shrink-0 w-20 text-xs text-yellow-400">{"★".repeat(star)}</span>
          <div className="flex-1 rounded-full bg-zinc-100 h-2">
            <div className="h-2 rounded-full bg-zinc-400 transition-all"
              style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="w-4 text-right text-xs text-zinc-500">{count}</span>
        </div>
      ))}
    </div>
  );
}

function GenreBar({ items }: { items: [string, number][] }) {
  if (!items.length) return <p className="text-sm text-zinc-400">장르 정보가 없어요</p>;
  const max = items[0][1];
  return (
    <div className="space-y-1.5">
      {items.map(([genre, count]) => (
        <div key={genre} className="flex items-center gap-2">
          <span className="w-16 shrink-0 truncate text-xs text-zinc-600">{genre}</span>
          <div className="flex-1 rounded-full bg-zinc-100 h-2">
            <div className="h-2 rounded-full bg-zinc-400 transition-all"
              style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="w-4 text-right text-xs text-zinc-500">{count}</span>
        </div>
      ))}
    </div>
  );
}

function isPast(viewDate: string, showTime?: string | null): boolean {
  const [y, mo, d] = viewDate.split("-").map(Number);
  const [h, m] = showTime ? showTime.split(":").map(Number) : [0, 0];
  return new Date(y, mo - 1, d, h, m) <= new Date();
}

// ── 메인 페이지 ──────────────────────────────────────────

type StatTab = "전체" | "공연" | "영화" | "책";
const STAT_TABS: StatTab[] = ["전체", "공연", "영화", "책"];

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [records, setRecords] = useState<CulturalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatTab>("전체");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    api.records.list().then((data) => setRecords(data ?? [])).finally(() => setLoading(false));
  }, []);

  const perfRecords = useMemo(() => records.filter(r => r.category === "performance"), [records]);
  const movieRecords = useMemo(() => records.filter(r => r.category === "movie"), [records]);
  const bookRecords = useMemo(() => records.filter(r => r.category === "book"), [records]);

  const movieGenres = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of movieRecords)
      for (const g of r.movies?.genres ?? []) c[g] = (c[g] ?? 0) + 1;
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [movieRecords]);

  const bookGenres = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of bookRecords) {
      const g = r.books?.genre;
      if (g) c[g] = (c[g] ?? 0) + 1;
    }
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [bookRecords]);

  const perfByTitle = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of perfRecords) c[r.title] = (c[r.title] ?? 0) + 1;
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [perfRecords]);

  const castStats = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of perfRecords) {
      for (const name of r.performances?.cast ?? []) c[name] = (c[name] ?? 0) + 1;
    }
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [perfRecords]);

  const total = records.length;
  const avgRating = (() => {
    const rated = records.filter(r => r.rating && isPast(r.view_date, r.performances?.show_time));
    return rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : 0;
  })();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="sticky top-0 z-10 bg-white px-4 py-4 shadow-sm">
        <h1 className="text-xl font-bold">통계</h1>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium">{email}</p>
        </section>

        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
        ) : (
          <>
            {/* 요약 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-zinc-700">나의 기록</h2>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">{total}</span>
                <span className="mb-1 text-sm text-zinc-500">개</span>
              </div>
              {avgRating > 0 && (
                <p className="text-sm text-zinc-500">
                  평균 평점 <span className="font-semibold text-yellow-500">{avgRating.toFixed(1)}점</span>
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                {(Object.entries(CAT_LABEL) as [CategoryType, string][]).map(([cat, label]) => {
                  const count = records.filter(r => r.category === cat).length;
                  if (!count) return null;
                  return (
                    <div key={cat} className="flex items-center gap-1.5 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAT_COLOR[cat] }} />
                      <span className="text-zinc-500">{label}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 통계 탭 */}
            <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-zinc-100 px-5 pt-5">
                <h2 className="mr-4 text-sm font-semibold text-zinc-700 self-end pb-2">통계</h2>
                {STAT_TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 pb-2 text-sm font-medium transition-colors ${
                      tab === t ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-6">
                {/* 전체 탭 */}
                {tab === "전체" && (
                  <div>
                    <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                    <MonthlyBar records={records} />
                  </div>
                )}

                {/* 공연 탭 */}
                {tab === "공연" && (
                  <>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                      <MonthlyBar records={records} filterCat="performance" />
                    </div>
                    {perfByTitle.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">공연별 횟수</p>
                        <DonutChart data={perfByTitle} />
                      </div>
                    )}
                    {castStats.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">함께한 배우</p>
                        <div className="space-y-2">
                          {castStats.map(([name, count]) => {
                            const ratio = count / castStats[0][1];
                            return (
                              <div key={name} className="flex items-center gap-2">
                                <span className="w-24 truncate text-xs text-zinc-600">{name}</span>
                                <div className="flex-1 rounded-full bg-zinc-100 h-2">
                                  <div className="h-2 rounded-full transition-all"
                                    style={{ width: `${ratio * 100}%`, backgroundColor: `rgba(139,92,246,${0.25 + ratio * 0.75})` }} />
                                </div>
                                <span className="w-8 text-right text-xs font-medium text-zinc-500">{count}회</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {perfRecords.length === 0 && <p className="text-sm text-zinc-400">공연 기록이 없어요</p>}
                  </>
                )}

                {/* 영화 탭 */}
                {tab === "영화" && (
                  <>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                      <MonthlyBar records={records} filterCat="movie" />
                    </div>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">장르별 통계</p>
                      <GenreBar items={movieGenres} />
                    </div>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">평점 분포</p>
                      <RatingDist records={movieRecords} />
                    </div>
                    {movieRecords.length === 0 && <p className="text-sm text-zinc-400">영화 기록이 없어요</p>}
                  </>
                )}

                {/* 책 탭 */}
                {tab === "책" && (
                  <>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                      <MonthlyBar records={records} filterCat="book" />
                    </div>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">장르별 통계</p>
                      <GenreBar items={bookGenres} />
                    </div>
                    <div>
                      <p className="mb-3 text-xs font-medium text-zinc-500">평점 분포</p>
                      <RatingDist records={bookRecords} />
                    </div>
                    {bookRecords.length === 0 && <p className="text-sm text-zinc-400">책 기록이 없어요</p>}
                  </>
                )}
              </div>
            </section>
          </>
        )}

        <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <button onClick={handleLogout}
            className="w-full px-5 py-4 text-left text-sm font-medium text-red-500 transition hover:bg-red-50">
            로그아웃
          </button>
        </section>
      </main>
    </div>
  );
}
