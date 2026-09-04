"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SubCategoryType } from "@/types/record";
import { SearchResult } from "./PerformanceSearch";
import StarRating from "./StarRating";
import TagInput from "./TagInput";

// KOPIS 날짜 "2026.06.16" → HTML input "2026-06-16"
function toInputDate(kopisDate: string | null | undefined): string {
  if (!kopisDate) return "";
  return kopisDate.replace(/\./g, "-");
}

function defaultViewDate(periodStart: string, periodEnd: string): string {
  const today = new Date().toISOString().split("T")[0];
  if (!periodStart) return today;
  if (today >= periodStart && (!periodEnd || today <= periodEnd)) return today;
  return periodStart;
}

// "19:00" + "90분" → "20:30"
function calcEndTime(startTime: string, duration: string): string | null {
  const mins = parseInt(duration);
  if (isNaN(mins)) return null;
  const [h, m] = startTime.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const SUB_OPTIONS: { value: SubCategoryType; label: string }[] = [
  { value: "musical", label: "뮤지컬" },
  { value: "play", label: "연극" },
  { value: "concert", label: "콘서트" },
  { value: "etc", label: "기타" },
];

interface Props {
  subCategory: SubCategoryType;
  onSubCategoryChange?: (v: SubCategoryType) => void;
  searchResult: SearchResult | null;
}

const CAST_STORAGE_KEY = "moaboda_cast";

function loadSavedCast(): string[] {
  try { return JSON.parse(localStorage.getItem(CAST_STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function saveCast(names: string[]) {
  try {
    const existing = loadSavedCast();
    const merged = Array.from(new Set([...existing, ...names]));
    localStorage.setItem(CAST_STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

export default function RecordForm({ subCategory, onSubCategoryChange, searchResult }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [castSuggestions, setCastSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setCastSuggestions(loadSavedCast());
  }, []);

  const periodStart = toInputDate(searchResult?.period_start);
  const periodEnd = toInputDate(searchResult?.period_end);

  const kopisCast: string[] = searchResult?.cast ?? [];

  const [form, setForm] = useState({
    title: searchResult?.title ?? "",
    view_start: defaultViewDate(periodStart, periodEnd),
    rating: 0,
    review: "",
    venue: searchResult?.venue ?? "",
    selectedCast: [] as string[],
    extraCast: [] as string[],
    seat: "",
    show_time: "",
    duration: searchResult?.runtime ? String(parseInt(searchResult.runtime)) : "",
  });

  const set = (key: string, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isFuture = (() => {
    const [y, mo, d] = form.view_start.split("-").map(Number);
    const [h, m] = form.show_time ? form.show_time.split(":").map(Number) : [0, 0];
    return new Date(y, mo - 1, d, h, m) > new Date();
  })();

  const toggleCast = (name: string) =>
    setForm((prev) => ({
      ...prev,
      selectedCast: prev.selectedCast.includes(name)
        ? prev.selectedCast.filter((c) => c !== name)
        : [...prev.selectedCast, name],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.view_start) return;
    setSubmitting(true);
    try {
      const cast = [...form.selectedCast, ...form.extraCast];
      if (form.extraCast.length > 0) saveCast(form.extraCast);
      const status = isFuture ? "planned" : "done";
      await api.records.create({
        category: "performance",
        sub_category: subCategory,
        title: form.title,
        view_start: form.view_start,
        status,
        rating: isFuture ? null : (form.rating || null),
        review: isFuture ? null : (form.review || null),
        poster_url: searchResult?.poster_url ?? null,
        show_time: form.show_time || null,
        seat: form.seat || null,
        // 출연진은 그날 본 배우라 기록에 저장한다 (공연 카탈로그를 덮어쓰지 않도록)
        cast: cast.length > 0 ? cast : null,
        performance: {
          venue: form.venue || null,
          duration: form.duration || null,
          period_start: periodStart || null,
          period_end: periodEnd || null,
          kopis_id: searchResult?.kopis_id ?? null,
        },
      });
      router.push("/");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold">상세 정보를 입력해주세요</h2>

      {searchResult?.poster_url && (
        <img
          src={searchResult.poster_url}
          alt={form.title}
          className="mx-auto h-48 rounded-xl object-cover shadow-sm"
        />
      )}

      {onSubCategoryChange && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">분류</label>
          <div className="flex gap-2">
            {SUB_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onSubCategoryChange(value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  subCategory === value
                    ? "border-brand bg-brand text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500">제목 *</label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500">
          관람일 *
          {periodStart && periodEnd && (
            <span className="ml-2 font-normal text-zinc-400">
              ({periodStart} ~ {periodEnd})
            </span>
          )}
        </label>
        <input
          required
          type="date"
          value={form.view_start}
          min={periodStart || undefined}
          max={periodEnd || undefined}
          onChange={(e) => set("view_start", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      {!isFuture && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">평점</label>
          <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500">극장</label>
        <input
          value={form.venue}
          onChange={(e) => set("venue", e.target.value)}
          placeholder="예) 블루스퀘어 신한카드홀"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500">좌석</label>
        <input
          value={form.seat}
          onChange={(e) => set("seat", e.target.value)}
          placeholder="예) 1층 B구역 12열 5번"
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500">
          공연 시간
          {form.show_time && form.duration && (() => {
            const end = calcEndTime(form.show_time, form.duration);
            return end ? <span className="ml-2 font-normal text-zinc-400">→ {end} 종료</span> : null;
          })()}
        </label>
        <div className="flex items-center gap-2">
          <input
            value={form.show_time}
            onChange={(e) => set("show_time", e.target.value)}
            placeholder="15:00"
            className="w-28 rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
          <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-3 focus-within:border-zinc-400">
            <input
              type="number"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="–"
              className="w-full text-sm outline-none"
            />
            <span className="shrink-0 text-sm text-zinc-400">분</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500">출연진</label>
        {kopisCast.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kopisCast.map((name) => {
              const selected = form.selectedCast.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCast(name)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? "border-brand bg-brand text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
        <TagInput
          value={form.extraCast}
          onChange={(tags) => set("extraCast", tags)}
          placeholder="목록에 없으면 직접 입력 후 Enter"
          suggestions={castSuggestions}
        />
      </div>


      {!isFuture && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">감상평</label>
          <textarea
            value={form.review}
            onChange={(e) => set("review", e.target.value)}
            rows={4}
            placeholder="이번 공연은 어땠나요?"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400 resize-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand py-3 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
      >
        {submitting ? "저장 중..." : "기록 저장"}
      </button>
    </form>
  );
}
