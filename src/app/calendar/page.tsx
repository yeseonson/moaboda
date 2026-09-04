"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord, STATUS_COLOR, STATUS_LABEL, SUB_CATEGORY_LABEL, recordDate } from "@/types/record";
import PageHeader from "@/components/layout/PageHeader";

const DOT_COLOR: Record<CategoryType, string> = {
  performance: "bg-violet-400",
  movie: "bg-blue-400",
  book: "bg-pink-400",
};

const DOT_HEX: Record<CategoryType, string> = {
  performance: "#a78bfa",
  movie: "#60a5fa",
  book: "#f472b6",
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
    <div className="min-h-screen bg-zinc-50 pb-20">
      <PageHeader />

      <main className="mx-auto max-w-lg p-4 space-y-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="px-2 py-1 text-zinc-500 hover:text-zinc-800">‹</button>
            <span className="text-base font-semibold">{year}년 {month}월</span>
            <button onClick={nextMonth} className="px-2 py-1 text-zinc-500 hover:text-zinc-800">›</button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-zinc-400 py-1">{d}</div>
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
                    isSelected ? "bg-zinc-900" : isToday ? "bg-zinc-100" : "hover:bg-zinc-50"
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
                  active ? "border-transparent text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}
                style={active ? { backgroundColor: DOT_HEX[cat], borderColor: DOT_HEX[cat] } : {}}
              >
                <span className={`h-2 w-2 rounded-full ${DOT_COLOR[cat]}`} />
                {label}
              </button>
            );
          })}
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500">{displayLabel}</p>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-zinc-400 hover:text-zinc-600">
                전체 보기
              </button>
            )}
          </div>
          {displayRecords.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 py-4">
              {selectedDate ? "이 날의 기록이 없어요" : "이 달의 기록이 없어요"}
            </p>
          ) : (
            <ul className="space-y-2">
              {displayRecords.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/records/${r.id}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 transition hover:border-zinc-300"
                  >
                    {r.poster_url ? (
                      <img src={r.poster_url} alt={r.title} className="h-14 w-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className={`flex h-14 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${DOT_COLOR[r.category].replace("bg-", "bg-").replace("-400", "-100")}`}>
                        {r.category === "movie" ? "🎬" : r.category === "book" ? "📚" : "🎭"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                          {r.sub_category ? SUB_CATEGORY_LABEL[r.sub_category] : CATEGORY_LABEL[r.category]}
                        </span>
                        {r.status !== "done" && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        )}
                        <p className="truncate text-sm font-medium">{r.title}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400">{recordDate(r)}</p>
                      {r.category === "movie" && r.movies?.genres && r.movies.genres.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          {r.movies.genres.slice(0, 3).join(" · ")}
                        </p>
                      )}
                      {r.category === "book" && r.books?.genre && (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          {r.books.genre}
                        </p>
                      )}
                    </div>
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
