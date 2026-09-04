"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord, STATUS_COLOR, STATUS_LABEL, SUB_CATEGORY_LABEL, recordDate } from "@/types/record";
import PageHeader from "@/components/layout/PageHeader";
import RatingDots from "@/components/record/RatingDots";

const DOT_COLOR: Record<CategoryType, string> = {
  performance: "bg-cat-performance",
  movie: "bg-cat-movie",
  book: "bg-cat-book",
};

const CHIP_ACTIVE: Record<CategoryType, string> = {
  performance: "border-cat-performance bg-cat-performance",
  movie: "border-cat-movie bg-cat-movie",
  book: "border-cat-book bg-cat-book",
};

const CALENDAR_CATEGORIES: { value: CategoryType; label: string }[] = [
  { value: "performance", label: "공연" },
  { value: "movie", label: "영화" },
  { value: "book", label: "책" },
];

const CATEGORY_LABEL: Record<CategoryType, string> = {
  performance: "공연",
  movie: "영화",
  book: "책",
};

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "2026-09-02" -> SEP / 02 배지 */
function DateBadge({ date }: { date: string | null }) {
  if (!date) return null;
  const [, m, d] = date.split("-");
  return (
    <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft">
      <span className="text-[10px] font-medium tracking-wide text-ink-muted">
        {MONTH_ABBR[Number(m) - 1]}
      </span>
      <span className="text-lg font-semibold leading-tight text-ink">{d}</span>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [records, setRecords] = useState<CulturalRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryType | null>(null);

  useEffect(() => {
    api.records.list()
      .then((data) => setRecords(data ?? []))
      .catch(() => {});
  }, []);

  const recordsByDate = useMemo(() => {
    const map: Record<string, CulturalRecord[]> = {};
    for (const r of records) {
      const d = recordDate(r);
      if (!d) continue;
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    return map;
  }, [records]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthRecords = useMemo(
    () => records.filter((r) => recordDate(r)?.startsWith(monthPrefix))
           .sort((a, b) => (recordDate(a) ?? "").localeCompare(recordDate(b) ?? "")),
    [records, monthPrefix]
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const baseRecords = selectedDate ? (recordsByDate[selectedDate] ?? []) : monthRecords;
  const displayRecords = filterCategory ? baseRecords.filter(r => r.category === filterCategory) : baseRecords;
  const displayLabel = selectedDate ? selectedDate : `${year}년 ${month}월 전체`;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <PageHeader />

      <main className="mx-auto max-w-lg p-4 space-y-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="px-2 py-1 text-ink-muted hover:text-ink">‹</button>
            <span className="text-base font-semibold">{year}년 {month}월</span>
            <button onClick={nextMonth} className="px-2 py-1 text-ink-muted hover:text-ink">›</button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-ink-subtle py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
              const dayRecords = recordsByDate[dateStr] ?? [];
              const isToday = dateStr === today.toISOString().split("T")[0];
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`flex flex-col items-center rounded-xl py-1.5 transition ${
                    isSelected ? "bg-brand" : isToday ? "bg-brand-soft" : "hover:bg-brand-soft/60"
                  }`}
                >
                  <span className={`text-sm ${isSelected ? "font-bold text-white" : isToday ? "font-bold" : ""}`}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 h-2 items-center">
                    {dayRecords.slice(0, 3).map((r, i) => (
                      <div key={i} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[r.category]}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex gap-2 px-1">
          {CALENDAR_CATEGORIES.map(({ value: cat, label }) => {
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(active ? null : cat)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active ? `text-white ${CHIP_ACTIVE[cat]}` : "border-line-strong text-ink-muted hover:border-brand/40"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${DOT_COLOR[cat]}`} />
                {label}
              </button>
            );
          })}
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-muted">{displayLabel}</p>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-ink-subtle hover:text-ink">
                전체 보기
              </button>
            )}
          </div>
          {displayRecords.length === 0 ? (
            <p className="text-center text-sm text-ink-subtle py-4">
              {selectedDate ? "이 날의 기록이 없어요" : "이 달의 기록이 없어요"}
            </p>
          ) : (
            <ul className="space-y-2">
              {displayRecords.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/records/${r.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand/25"
                  >
                    <DateBadge date={recordDate(r)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLOR[r.category]}`} />
                        <span className="truncate">
                          {[
                            r.sub_category ? SUB_CATEGORY_LABEL[r.sub_category] : CATEGORY_LABEL[r.category],
                            r.category === "performance" ? r.performances?.venue : r.venue,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {r.status !== "done" && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold">{r.title}</p>
                    </div>
                    <RatingDots value={r.rating} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
