"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord, recordCast, recordDate, SUB_CATEGORY_LABEL } from "@/types/record";
import PageHeader from "@/components/layout/PageHeader";

const CAT_COLOR: Record<CategoryType, string> = {
  performance: "#a78bfa",
  movie: "#60a5fa",
  book: "#f472b6",
};

const CAT_LABEL: Record<CategoryType, string> = {
  performance: "공연",
  movie: "영화",
  book: "책",
};

// ── 재사용 컴포넌트 ──────────────────────────────────────

function donutColor(ratio: number) {
  // ratio 0→1 : 연한 라벤더(0.2) → 중간 보라(0.75)
  const opacity = (0.2 + ratio * 0.55).toFixed(2);
  return `rgba(109,40,217,${opacity})`;
}

const CAT_LABEL_TO_COLOR: Record<string, string> = {
  "공연": "#a78bfa",
  "영화": "#60a5fa",
  "책": "#f472b6",
};
const PERF_COLORS = ["#a78bfa","#7c3aed","#c4b5fd","#6d28d9","#ddd6fe","#8b5cf6","#ede9fe","#4c1d95"];
const BOOK_COLORS = ["#f472b6","#ec4899","#db2777","#be185d","#f9a8d4","#fbcfe8","#fce7f3","#9d174d"];
const MOVIE_COLORS = ["#60a5fa","#1d4ed8","#bfdbfe","#1e40af","#dbeafe","#3b82f6","#93c5fd","#1e3a8a"];

function DonutChart({ data, colors }: { data: [string, number][]; colors?: string[] }) {
  const total = data.reduce((s, [, v]) => s + v, 0);
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  const maxCount = data[0]?.[1] ?? 1;
  let offset = 0;
  const segs = data.map(([title, count], i) => {
    const dash = (count / total) * circ;
    const color = colors ? (colors[i % colors.length]) : donutColor(count / maxCount);
    const s = { title, count, dash, offset, color };
    offset += dash;
    return s;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width={160} height={160} className="shrink-0">
        {segs.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={22}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#71717a"
          fontSize={11}
        >
          전체
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="#18181b"
          fontSize={18}
          fontWeight="bold"
        >
          {total}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segs.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate text-xs text-zinc-600">{s.title}</span>
            <span className="ml-auto shrink-0 text-xs font-semibold text-zinc-500">
              {s.count}회
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const WORK_COLORS: Partial<Record<CategoryType, string[]>> = {
  performance: PERF_COLORS,
  book: BOOK_COLORS,
  movie: MOVIE_COLORS,
};

function MonthlyBar({
  records,
  filterCat,
  colorByWork,
}: {
  records: CulturalRecord[];
  filterCat?: CategoryType;
  colorByWork?: boolean;
}) {
  const now = new Date();
  const [offset, setOffset] = useState(0);

  const currentHalf = now.getMonth() < 6 ? 1 : 2;
  const currentYear = now.getFullYear();
  const totalHalves = currentYear * 2 + (currentHalf - 1) + offset;
  const dispYear = Math.floor(totalHalves / 2);
  const dispHalf = (totalHalves % 2) + 1;
  const startMonth = dispHalf === 1 ? 1 : 7;

  const workColorMap = useMemo(() => {
    if (!colorByWork) return {};
    const map: Record<string, string> = {};
    let idx = 0;
    for (const r of records) {
      if (r.status !== "done" || (filterCat && r.category !== filterCat)) continue;
      const key = r.performance_id ?? r.movie_id ?? r.book_id ?? r.title;
      const palette = (filterCat && WORK_COLORS[filterCat]) ?? PERF_COLORS;
      if (key && !map[key]) map[key] = palette[idx++ % palette.length];
    }
    return map;
  }, [records, filterCat, colorByWork]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const m = startMonth + i;
    return {
      key: `${dispYear}-${String(m).padStart(2, "0")}`,
      label: `${m}월`,
    };
  });
  const data = months.map(({ key, label }) => {
    const segments: Record<string, number> = {};
    for (const r of records) {
      if (
        r.status === "done" &&
        recordDate(r)?.startsWith(key) &&
        (!filterCat || r.category === filterCat)
      ) {
        const segKey = colorByWork
          ? (r.performance_id ?? r.movie_id ?? r.book_id ?? r.title ?? "")
          : r.category;
        segments[segKey] = (segments[segKey] ?? 0) + 1;
      }
    }
    const total = Object.values(segments).reduce((s, v) => s + v, 0);
    return { label, segments, total };
  });
  const max = Math.max(...data.map((d) => d.total), 1);
  const color = filterCat && !colorByWork ? CAT_COLOR[filterCat] : undefined;
  const periodLabel = `${dispYear}년 ${dispHalf === 1 ? "상반기" : "하반기"}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:text-zinc-700"
        >
          ←
        </button>
        <span className="text-xs font-semibold text-zinc-600">
          {periodLabel}
        </span>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          disabled={offset >= 0}
          className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
        >
          →
        </button>
      </div>
      <div className="flex items-end gap-2 h-28 mt-6">
        {data.map(({ label, segments, total: t }) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="flex w-full flex-col-reverse rounded-md overflow-hidden"
              style={{
                height: `${(t / max) * 96}px`,
                minHeight: t > 0 ? "4px" : "0",
              }}
            >
              {Object.entries(segments).map(([segKey, cnt]) => (
                <div
                  key={segKey}
                  style={{
                    height: `${(cnt / t) * 100}%`,
                    backgroundColor: colorByWork
                      ? (workColorMap[segKey] ?? PERF_COLORS[0])
                      : (color ?? CAT_COLOR[segKey as CategoryType]),
                  }}
                />
              ))}
            </div>
            {t > 0 && (
              <span className="text-xs font-medium text-zinc-600">{t}</span>
            )}
            <span className="text-xs text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
      {!filterCat && (
        <div className="flex flex-wrap gap-3">
          {(Object.entries(CAT_LABEL) as [CategoryType, string][]).map(
            ([cat, label]) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CAT_COLOR[cat] }}
                />
                {label}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function RatingDist({ records, color = "#a1a1aa" }: { records: CulturalRecord[]; color?: string }) {
  const rated = records.filter((r) => r.rating);
  if (!rated.length)
    return <p className="text-sm text-zinc-400">평점 기록이 없어요</p>;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: rated.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(...dist.map((d) => d.count), 1);
  return (
    <div className="space-y-1.5">
      {dist.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2">
          <span className="shrink-0 w-20 text-xs text-brass">
            {"★".repeat(star)}
          </span>
          <div className="flex-1 rounded-full bg-zinc-100 h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-4 text-right text-xs text-zinc-500">{count}</span>
        </div>
      ))}
    </div>
  );
}

function GenreBar({ items, color = "#a1a1aa" }: { items: [string, number][]; color?: string }) {
  if (!items.length)
    return <p className="text-sm text-zinc-400"> 장르 데이터가 없어요</p>;
  const max = items[0][1];
  return (
    <div className="space-y-1.5">
      {items.map(([genre, count]) => (
        <div key={genre} className="flex items-center gap-2">
          <span className="w-20 shrink-0 truncate text-xs text-zinc-600">
            {genre}
          </span>
          <div className="flex-1 rounded-full bg-zinc-100 h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-4 text-right text-xs text-zinc-500">{count}</span>
        </div>
      ))}
    </div>
  );
}

function isPast(r: CulturalRecord): boolean {
  const d = recordDate(r);
  if (!d) return false;
  const [y, mo, day] = d.split("-").map(Number);
  const [h, m] = r.show_time?.split(":").map(Number) ?? [0, 0];
  return new Date(y, mo - 1, day, h, m) <= new Date();
}

// ── 메인 페이지 ──────────────────────────────────────────

type StatTab = "전체" | "공연" | "영화" | "책";
const STAT_TABS: StatTab[] = ["전체", "공연", "영화", "책"];

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [records, setRecords] = useState<CulturalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatTab>("전체");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
    api.records
      .list()
      .then((data) => setRecords(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const perfRecords = useMemo(() => records.filter((r) => r.category === "performance"), [records]);
  const movieRecords = useMemo(() => records.filter((r) => r.category === "movie"), [records]);
  const bookRecords = useMemo(() => records.filter((r) => r.category === "book"), [records]);

  // 완료 기준 필터 (통계 계산용)
  const donePerfRecords = useMemo(() => perfRecords.filter(r => r.status === "done"), [perfRecords]);
  const doneMovieRecords = useMemo(() => movieRecords.filter(r => r.status === "done"), [movieRecords]);
  const doneBookRecords = useMemo(() => bookRecords.filter(r => r.status === "done"), [bookRecords]);

  const catDistribution = useMemo(() => {
    const data: [string, number][] = [
      ["공연", donePerfRecords.length],
      ["영화", doneMovieRecords.length],
      ["책", doneBookRecords.length],
    ].filter(([, n]) => (n as number) > 0) as [string, number][];
    return data;
  }, [donePerfRecords, doneMovieRecords, doneBookRecords]);


  const perfByRun = useMemo(() => {
    const c: Record<string, { label: string; count: number }> = {};
    for (const r of donePerfRecords) {
      const perf = r.performances;
      const key = r.performance_id ?? r.title;
      const year = perf?.period_start ? perf.period_start.slice(0, 4) : null;
      const label = year ? `${r.title} (${year})` : r.title;
      if (!c[key]) c[key] = { label, count: 0 };
      c[key].count++;
    }
    return Object.values(c)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((v) => [v.label, v.count] as [string, number]);
  }, [donePerfRecords]);

  const movieByRun = useMemo(() => {
    const c: Record<string, { label: string; count: number }> = {};
    for (const r of doneMovieRecords) {
      const key = r.movie_id ?? r.title;
      const year = r.view_start ? r.view_start.slice(0, 4) : null;
      const label = year ? `${r.title} (${year})` : r.title;
      if (!c[key]) c[key] = { label, count: 0 };
      c[key].count++;
    }
    return Object.values(c)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((v) => [v.label, v.count] as [string, number]);
  }, [doneMovieRecords]);

  const movieGenres = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of doneMovieRecords)
      for (const g of r.movies?.genres ?? []) c[g] = (c[g] ?? 0) + 1;
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [doneMovieRecords]);

  const perfSubCats = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of donePerfRecords) {
      const s = r.sub_category ? SUB_CATEGORY_LABEL[r.sub_category] : "기타";
      c[s] = (c[s] ?? 0) + 1;
    }
    return Object.entries(c).sort(([, a], [, b]) => b - a);
  }, [donePerfRecords]);

  const bookGenres = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of doneBookRecords) {
      const g = r.books?.genre;
      if (g) c[g] = (c[g] ?? 0) + 1;
    }
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [doneBookRecords]);

  const bookAuthors = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of doneBookRecords) {
      const a = r.books?.author?.split("(")[0].trim();
      if (a) c[a] = (c[a] ?? 0) + 1;
    }
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [doneBookRecords]);

  const castStats = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of donePerfRecords)
      for (const name of recordCast(r)) c[name] = (c[name] ?? 0) + 1;
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [donePerfRecords]);

  const movieCastStats = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of doneMovieRecords)
      for (const name of r.movies?.cast ?? []) c[name] = (c[name] ?? 0) + 1;
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [doneMovieRecords]);

  const total = records.length;
  const avgRating = (() => {
    const rated = records.filter(
      (r) => r.status === "done" && r.rating && isPast(r),
    );
    return rated.length
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : 0;
  })();

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <PageHeader />

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
                  평균 평점{" "}
                  <span className="font-semibold text-brass">
                    {avgRating.toFixed(1)}점
                  </span>
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                {(Object.entries(CAT_LABEL) as [CategoryType, string][]).map(
                  ([cat, label]) => {
                    const count = records.filter(
                      (r) => r.category === cat,
                    ).length;
                    if (!count) return null;
                    return (
                      <div
                        key={cat}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CAT_COLOR[cat] }}
                        />
                        <span className="text-zinc-500">{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            {/* 통계 탭 */}
            <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-zinc-100 px-5 pt-5">
                <h2 className="mr-4 text-sm font-semibold text-zinc-700 self-end pb-2">
                  통계
                </h2>
                {STAT_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 pb-2 text-sm font-medium transition-colors ${
                      tab === t
                        ? "border-b-2 border-brand text-brand"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-6">
                {/* 전체 탭 */}
                {tab === "전체" &&
                  (records.length === 0 ? (
                    <p className="text-sm text-zinc-400">아직 기록이 없어요.</p>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                        <MonthlyBar records={records} />
                      </div>
                      {catDistribution.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">카테고리 분포</p>
                          <DonutChart data={catDistribution} colors={catDistribution.map(([label]) => CAT_LABEL_TO_COLOR[label] ?? "#a1a1aa")} />
                        </div>
                      )}
                    </div>
                  ))}

                {/* 공연 탭 */}
                {tab === "공연" &&
                  (perfRecords.length === 0 ? (
                    <p className="text-sm text-zinc-400">아직 기록이 없어요.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 text-xs text-zinc-500">
                        <span>관람 <strong className="text-zinc-800">{donePerfRecords.length}</strong></span>
                        <span>관람 예정 <strong className="text-zinc-800">{perfRecords.filter(r => r.status === "planned").length}</strong></span>
                      </div>
                      {donePerfRecords.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">
                          월별 기록
                        </p>
                        <MonthlyBar records={records} filterCat="performance" colorByWork />
                      </div>
                      )}
                      {perfSubCats.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">장르별 통계</p>
                          <GenreBar items={perfSubCats} color={CAT_COLOR.performance} />
                        </div>
                      )}
                      {perfByRun.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">
                            공연별 관람 횟수
                          </p>
                          <DonutChart data={perfByRun} colors={PERF_COLORS} />
                        </div>
                      )}
                      {castStats.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">
                            함께한 배우
                          </p>
                          <div className="space-y-2">
                            {castStats.map(([name, count]) => {
                              const ratio = count / castStats[0][1];
                              return (
                                <div
                                  key={name}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-24 truncate text-xs text-zinc-600">
                                    {name}
                                  </span>
                                  <div className="flex-1 rounded-full bg-zinc-100 h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${ratio * 100}%`,
                                        backgroundColor: `rgba(167,139,250,${0.25 + ratio * 0.75})`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-8 text-right text-xs font-medium text-zinc-500">
                                    {count}회
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ))}

                {/* 영화 탭 */}
                {tab === "영화" &&
                  (movieRecords.length === 0 ? (
                    <p className="text-sm text-zinc-400">아직 기록이 없어요.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 text-xs text-zinc-500">
                        <span>봤어요 <strong className="text-zinc-800">{doneMovieRecords.length}</strong></span>
                        <span>보는 중 <strong className="text-zinc-800">{movieRecords.filter(r => r.status === "in_progress").length}</strong></span>
                        <span>보고 싶어요 <strong className="text-zinc-800">{movieRecords.filter(r => r.status === "want").length}</strong></span>
                      </div>
                      {doneMovieRecords.length > 0 && (<>
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                        <MonthlyBar records={records} filterCat="movie" colorByWork />
                      </div>
                      {movieByRun.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">영화별 관람 횟수</p>
                          <DonutChart data={movieByRun} colors={MOVIE_COLORS} />
                        </div>
                      )}
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">장르별 통계</p>
                        <GenreBar items={movieGenres} color={CAT_COLOR.movie} />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">평점 분포</p>
                        <RatingDist records={doneMovieRecords} color={CAT_COLOR.movie} />
                      </div>
                      {movieCastStats.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">함께한 배우</p>
                          <div className="space-y-2">
                            {movieCastStats.map(([name, count]) => {
                              const ratio = count / movieCastStats[0][1];
                              return (
                                <div key={name} className="flex items-center gap-2">
                                  <span className="w-24 truncate text-xs text-zinc-600">{name}</span>
                                  <div className="flex-1 rounded-full bg-zinc-100 h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${ratio * 100}%`,
                                        backgroundColor: `rgba(96,165,250,${0.25 + ratio * 0.75})`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-8 text-right text-xs font-medium text-zinc-500">{count}편</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </>)}
                    </>
                  ))}

                {/* 책 탭 */}
                {tab === "책" &&
                  (bookRecords.length === 0 ? (
                    <p className="text-sm text-zinc-400">아직 기록이 없어요.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 text-xs text-zinc-500">
                        <span>완독 <strong className="text-zinc-800">{doneBookRecords.length}</strong></span>
                        <span>읽는 중 <strong className="text-zinc-800">{bookRecords.filter(r => r.status === "in_progress").length}</strong></span>
                        <span>읽고 싶어요 <strong className="text-zinc-800">{bookRecords.filter(r => r.status === "want").length}</strong></span>
                      </div>
                      {doneBookRecords.length > 0 && (<>
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">월별 기록</p>
                        <MonthlyBar records={records} filterCat="book" colorByWork />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">장르별 통계</p>
                        <GenreBar items={bookGenres} color={CAT_COLOR.book} />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-zinc-500">평점 분포</p>
                        <RatingDist records={doneBookRecords} color={CAT_COLOR.book} />
                      </div>
                      {bookAuthors.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-zinc-500">작가별 통계</p>
                          <div className="space-y-2">
                            {bookAuthors.map(([name, count]) => {
                              const ratio = count / bookAuthors[0][1];
                              return (
                                <div key={name} className="flex items-center gap-2">
                                  <span className="w-24 truncate text-xs text-zinc-600">{name}</span>
                                  <div className="flex-1 rounded-full bg-zinc-100 h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${ratio * 100}%`,
                                        backgroundColor: `rgba(244,114,182,${0.25 + ratio * 0.75})`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-8 text-right text-xs font-medium text-zinc-500">{count}권</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </>)}
                    </>
                  ))}
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}
