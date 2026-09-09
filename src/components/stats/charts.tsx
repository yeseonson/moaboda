"use client";

import { useState } from "react";
import { CategoryType, CulturalRecord, recordDate } from "@/types/record";
import RatingDots from "@/components/record/RatingDots";

/** 순위형 차트 램프 (assets/tokens.css). 1위가 가장 진하다. */
export const CHART_RAMP = ["#27473C", "#3D6455", "#5A806F", "#8AA79A", "#C3D2CB"];
export const CHART_ACCENT = "#C08A2E"; // 평균선 · 1~3위 번호
/** 관람 예정은 채움 대신 사선 (assets/README.md) */
export const PLANNED_HATCH =
  "repeating-linear-gradient(135deg,#C3D2CB 0 3px,#E2E9E5 3px 6px)";

export const CAT_COLOR: Record<CategoryType, string> = {
  performance: "#27473C",
  movie: "#3E5F7A",
  book: "#9E4A2F",
};

export const CAT_LABEL: Record<CategoryType, string> = {
  performance: "공연",
  movie: "영화",
  book: "책",
};

/** 순위(0부터)에 대응하는 램프 색. 램프보다 항목이 많으면 마지막 색. */
export function rampColor(rank: number): string {
  return CHART_RAMP[Math.min(rank, CHART_RAMP.length - 1)];
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

// ── 카테고리 비율 바 ──────────────────────────────────────
// 도넛 대신 쓴다. 한 카테고리가 90% 를 넘으면 도넛은 원 하나로 보여 정보가 없다.
export function RatioBar({ records }: { records: CulturalRecord[] }) {
  const cats = (Object.keys(CAT_LABEL) as CategoryType[])
    .map((cat) => ({ cat, count: records.filter((r) => r.category === cat).length }))
    .filter((c) => c.count > 0);
  const total = cats.reduce((s, c) => s + c.count, 0);
  if (!total) return null;

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {cats.map(({ cat, count }) => (
          <div
            key={cat}
            style={{ width: `${(count / total) * 100}%`, backgroundColor: CAT_COLOR[cat] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {cats.map(({ cat, count }) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CAT_COLOR[cat] }} />
            <span className="text-ink-muted">{CAT_LABEL[cat]}</span>
            <span className="font-semibold text-ink">{count}</span>
            <span className="text-ink-subtle">{pct(count, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 월별 기록 (12개월 한 화면) ────────────────────────────
export function MonthlyBar({
  records,
  filterCat,
}: {
  records: CulturalRecord[];
  filterCat?: CategoryType;
}) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const inMonth = records.filter(
      (r) => recordDate(r)?.startsWith(key) && (!filterCat || r.category === filterCat)
    );
    return {
      month: i + 1,
      done: inMonth.filter((r) => r.status === "done").length,
      planned: inMonth.filter((r) => r.status === "planned").length,
    };
  });

  const max = Math.max(...months.map((m) => m.done + m.planned), 1);
  const doneMonths = months.filter((m) => m.done > 0);
  const avg = doneMonths.length
    ? doneMonths.reduce((s, m) => s + m.done, 0) / doneMonths.length
    : 0;

  const H = 112; // 그래프 높이(px)
  const barColor = filterCat ? CAT_COLOR[filterCat] : CAT_COLOR.performance;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-3 text-xs">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="px-1 text-ink-subtle transition hover:text-ink"
        >
          ←
        </button>
        <span className="font-semibold text-ink-muted">{year}년</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= thisYear}
          className="px-1 text-ink-subtle transition hover:text-ink disabled:opacity-30"
        >
          →
        </button>
      </div>

      <div className="relative" style={{ height: H }}>
        {/* 평균선 */}
        {avg > 0 && (
          <div
            className="absolute inset-x-0 flex items-center"
            style={{ bottom: (avg / max) * H }}
          >
            <div className="h-px flex-1 border-t border-dashed" style={{ borderColor: CHART_ACCENT }} />
            <span className="ml-1 text-[10px] font-medium" style={{ color: CHART_ACCENT }}>
              평균 {avg.toFixed(1)}
            </span>
          </div>
        )}

        <div className="flex h-full items-end gap-1">
          {months.map(({ month, done, planned }) => (
            <div key={month} className="flex flex-1 flex-col justify-end gap-0.5">
              {planned > 0 && (
                <div
                  className="w-full rounded-t-sm"
                  style={{ height: (planned / max) * H, background: PLANNED_HATCH }}
                />
              )}
              {done > 0 && (
                <div
                  className={planned > 0 ? "w-full" : "w-full rounded-t-sm"}
                  style={{ height: (done / max) * H, backgroundColor: barColor }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1">
        {months.map(({ month, done, planned }) => (
          <div key={month} className="flex-1 text-center">
            <p className="text-[10px] font-medium text-ink-muted">{done + planned || ""}</p>
            <p className="text-[10px] text-ink-subtle">{month}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: barColor }} />
          {filterCat === "book" ? "완독" : "관람 완료"}
        </span>
        {/* 책에는 '관람 예정' 상태가 없다. 사선 막대가 없으면 범례도 뺀다 */}
        {months.some((m) => m.planned > 0) && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: PLANNED_HATCH }} />
            관람 예정
          </span>
        )}
        {avg > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed" style={{ borderColor: CHART_ACCENT }} />
            월평균
          </span>
        )}
      </div>
    </div>
  );
}

// ── 별점 분포 (세로 막대) ─────────────────────────────────
export function RatingDist({ records }: { records: CulturalRecord[] }) {
  const rated = records.filter((r) => r.rating);
  if (!rated.length) return <p className="text-sm text-ink-subtle">평점 기록이 없어요</p>;

  // 반 단계까지 그대로 보여준다. 정수로 묶으면 3.5 가 3 에 흡수돼
  // 분포가 뭉개진다 (왓챠 임포트분은 절반이 반 단계).
  const dist = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((star) => ({
    star,
    count: rated.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(...dist.map((d) => d.count), 1);
  // 큰 순서대로 진한 색 (크기 순서 = 색 순서)
  const rankOf = new Map(
    [...dist].sort((a, b) => b.count - a.count).map((d, i) => [d.star, i])
  );

  return (
    <div className="flex items-end gap-1" style={{ height: 132 }}>
      {dist.map(({ star, count }) => (
        <div key={star} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-medium text-ink-muted">{count || ""}</span>
          <div
            className="w-full rounded-t-sm"
            style={{
              height: Math.max((count / max) * 96, count > 0 ? 4 : 0),
              backgroundColor: rampColor(rankOf.get(star) ?? 4),
            }}
          />
          {/* 정수 눈금만 라벨을 단다. 9칸에 전부 적으면 읽기 어렵다 */}
          <span className="h-3 text-[11px] text-ink-subtle">
            {Number.isInteger(star) ? star : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 장르별 (가로 막대 + 비율) ─────────────────────────────
export function GenreBar({ items }: { items: [string, number][] }) {
  if (!items.length) return <p className="text-sm text-ink-subtle">장르 데이터가 없어요</p>;
  const max = items[0][1];
  const total = items.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-1.5">
      {items.map(([genre, count], i) => (
        <div key={genre} className="flex items-center gap-2">
          <span className="w-16 shrink-0 truncate text-xs font-medium text-ink">{genre}</span>
          <div className="h-2.5 flex-1 rounded-full bg-chart-track">
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: rampColor(i) }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs font-semibold text-ink">{count}</span>
          <span className="w-8 shrink-0 text-right text-[11px] text-ink-subtle">
            {pct(count, total)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 순위 목록 (상위 N + 더보기) ───────────────────────────
export function RankedList({
  items,
  initial = 6,
  unit = "회",
  moreUnit = "개",
}: {
  items: [string, number][];
  initial?: number;
  unit?: string;
  moreUnit?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return <p className="text-sm text-ink-subtle">데이터가 없어요</p>;

  const max = items[0][1];
  const shown = expanded ? items : items.slice(0, initial);

  return (
    <div className="space-y-2">
      {shown.map(([name, count], i) => (
        <div key={name} className="flex items-center gap-2">
          <span
            className="w-4 shrink-0 text-right text-xs font-semibold"
            style={i < 3 ? { color: CHART_ACCENT } : { color: "var(--color-ink-subtle)" }}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className={`truncate text-xs ${i < 3 ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {name}
            </p>
            <div className="h-1.5 rounded-full bg-chart-track">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%`, backgroundColor: rampColor(i) }}
              />
            </div>
          </div>
          <span
            className={`w-8 shrink-0 text-right text-xs ${i < 3 ? "font-bold text-ink" : "text-ink-muted"}`}
          >
            {count}
          </span>
        </div>
      ))}

      {items.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="pl-6 text-xs font-medium text-brand transition hover:opacity-70"
        >
          {expanded ? "접기" : `전체 ${items.length}${moreUnit} 보기`}
        </button>
      )}
      <span className="sr-only">{unit}</span>
    </div>
  );
}

// ── 요약 카드 헤더 (총계 · 평균 별점 · 관람/예정) ──────────
export function SummaryHeader({ records }: { records: CulturalRecord[] }) {
  const done = records.filter((r) => r.status === "done");
  const planned = records.filter((r) => r.status === "planned");
  const rated = done.filter((r) => r.rating);
  const avg = rated.length
    ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
    : 0;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs text-ink-muted">나의 기록</p>
        <p className="mt-1 flex items-end gap-1">
          <span className="text-3xl font-bold leading-none text-ink">{records.length}</span>
          <span className="text-sm text-ink-muted">개</span>
        </p>
      </div>
      <div className="flex items-center gap-4 text-right">
        {avg > 0 && (
          <div>
            <p className="text-[11px] text-ink-muted">평균 별점</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-sm font-bold text-ink">{avg.toFixed(1)}</span>
              <RatingDots value={avg} size={5} />
            </div>
          </div>
        )}
        <div className="border-l border-line pl-4">
          <p className="text-[11px] text-ink-muted">관람 / 예정</p>
          <p className="mt-1 text-sm">
            <span className="font-bold text-ink">{done.length}</span>
            <span className="text-ink-subtle"> / {planned.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
