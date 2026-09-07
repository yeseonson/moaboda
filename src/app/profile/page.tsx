"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";

import { CulturalRecord, recordCast, SUB_CATEGORY_LABEL } from "@/types/record";
import PageHeader from "@/components/layout/PageHeader";
import {


  GenreBar,
  MonthlyBar,
  RankedList,
  RatingDist,
  RatioBar,
  SummaryHeader,
} from "@/components/stats/charts";

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

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <PageHeader />

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium">{email}</p>
        </section>

        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-brand-soft" />
        ) : (
          <>
            {/* 요약 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
              <SummaryHeader records={records} />
              <RatioBar records={records} />
            </section>

            {/* 통계 탭 */}
            <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-line px-5 pt-5">
                <h2 className="mr-4 text-sm font-semibold text-ink self-end pb-2">
                  통계
                </h2>
                {STAT_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 pb-2 text-sm font-medium transition-colors ${
                      tab === t
                        ? "border-b-2 border-brand text-brand"
                        : "text-ink-subtle hover:text-ink-muted"
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
                    <p className="text-sm text-ink-subtle">아직 기록이 없어요.</p>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">월별 기록</p>
                        <MonthlyBar records={records} />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">별점 분포</p>
                        <RatingDist records={records.filter((r) => r.status === "done")} />
                      </div>
                    </div>
                  ))}

                {/* 공연 탭 */}
                {tab === "공연" &&
                  (perfRecords.length === 0 ? (
                    <p className="text-sm text-ink-subtle">아직 기록이 없어요.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 text-xs text-ink-muted">
                        <span>관람 <strong className="text-ink">{donePerfRecords.length}</strong></span>
                        <span>관람 예정 <strong className="text-ink">{perfRecords.filter(r => r.status === "planned").length}</strong></span>
                      </div>
                      {donePerfRecords.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">
                          월별 기록
                        </p>
                        <MonthlyBar records={records} filterCat="performance" />
                      </div>
                      )}
                      {perfSubCats.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-ink-muted">장르별 통계</p>
                          <GenreBar items={perfSubCats} />
                        </div>
                      )}
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">별점 분포</p>
                        <RatingDist records={donePerfRecords} />
                      </div>
                      {perfByRun.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-ink-muted">
                            공연별 관람 횟수
                          </p>
                          <RankedList items={perfByRun} moreUnit="편" />
                        </div>
                      )}
                      {castStats.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-ink-muted">
                            함께한 배우
                          </p>
                          <RankedList items={castStats} moreUnit="명" />
                        </div>
                      )}
                    </>
                  ))}

                {/* 영화 탭 */}
                {tab === "영화" &&
                  (movieRecords.length === 0 ? (
                    <p className="text-sm text-ink-subtle">아직 기록이 없어요.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 text-xs text-ink-muted">
                        <span>봤어요 <strong className="text-ink">{doneMovieRecords.length}</strong></span>
                        <span>보는 중 <strong className="text-ink">{movieRecords.filter(r => r.status === "in_progress").length}</strong></span>
                        <span>보고 싶어요 <strong className="text-ink">{movieRecords.filter(r => r.status === "want").length}</strong></span>
                      </div>
                      {doneMovieRecords.length > 0 && (<>
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">월별 기록</p>
                        <MonthlyBar records={records} filterCat="movie" />
                      </div>
                      {movieByRun.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-ink-muted">영화별 관람 횟수</p>
                          <RankedList items={movieByRun} moreUnit="편" />
                        </div>
                      )}
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">장르별 통계</p>
                        <GenreBar items={movieGenres} />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">평점 분포</p>
                        <RatingDist records={doneMovieRecords} />
                      </div>
                      {movieCastStats.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-ink-muted">함께한 배우</p>
                          <RankedList items={movieCastStats} moreUnit="명" />
                        </div>
                      )}
                      </>)}
                    </>
                  ))}

                {/* 책 탭 */}
                {tab === "책" &&
                  (bookRecords.length === 0 ? (
                    <p className="text-sm text-ink-subtle">아직 기록이 없어요.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 text-xs text-ink-muted">
                        <span>완독 <strong className="text-ink">{doneBookRecords.length}</strong></span>
                        <span>읽는 중 <strong className="text-ink">{bookRecords.filter(r => r.status === "in_progress").length}</strong></span>
                        <span>읽고 싶어요 <strong className="text-ink">{bookRecords.filter(r => r.status === "want").length}</strong></span>
                      </div>
                      {doneBookRecords.length > 0 && (<>
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">월별 기록</p>
                        <MonthlyBar records={records} filterCat="book" />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">장르별 통계</p>
                        <GenreBar items={bookGenres} />
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-medium text-ink-muted">평점 분포</p>
                        <RatingDist records={doneBookRecords} />
                      </div>
                      {bookAuthors.length > 0 && (
                        <div>
                          <p className="mb-3 text-xs font-medium text-ink-muted">작가별 통계</p>
                          <RankedList items={bookAuthors} moreUnit="명" />
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
