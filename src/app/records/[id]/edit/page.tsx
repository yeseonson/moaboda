"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord, SubCategoryType } from "@/types/record";
import StarRating from "@/components/record/StarRating";
import TagInput from "@/components/record/TagInput";

const DATE_LABEL: Record<CategoryType, string> = {
  performance: "관람일",
  movie: "관람일",
  book: "완독일",
  exhibition: "관람일",
};

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<CategoryType>("performance");
  const [form, setForm] = useState({
    title: "",
    view_date: "",
    rating: 0,
    review: "",
    venue: "",
    cast: [] as string[],
    seat: "",
    show_number: "",
    show_time: "",
    duration: "",
  });

  useEffect(() => {
    api.records.get(id).then((record: CulturalRecord) => {
      const perf = record.performances;
      setCategory(record.category);
      setForm({
        title: record.title,
        view_date: record.view_date,
        rating: record.rating ?? 0,
        review: record.review ?? "",
        venue: perf?.venue ?? "",
        cast: perf?.cast ?? [],
        seat: perf?.seat ?? "",
        show_number: perf?.show_number?.toString() ?? "",
        show_time: perf?.show_time ?? "",
        duration: perf?.duration ? String(parseInt(perf.duration)) : "",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const set = (key: string, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isPerformance = category === "performance";
  const isMovie = category === "movie";

  const isFuture = (() => {
    if (!form.view_date) return false;
    const [y, mo, d] = form.view_date.split("-").map(Number);
    const [h, m] = form.show_time ? form.show_time.split(":").map(Number) : [0, 0];
    return new Date(y, mo - 1, d, h, m) > new Date();
  })();

  const [castSuggestions, setCastSuggestions] = useState<string[]>([]);
  useEffect(() => {
    try { setCastSuggestions(JSON.parse(localStorage.getItem("moaboda_cast") ?? "[]")); }
    catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.records.update(id, {
        title: form.title,
        view_date: form.view_date,
        rating: form.rating || null,
        review: form.review || null,
        ...(isPerformance ? {
          performance: {
            venue: form.venue || null,
            cast: form.cast.length > 0 ? form.cast : null,
            seat: form.seat || null,
            show_number: form.show_number ? Number(form.show_number) : null,
            show_time: form.show_time || null,
            duration: form.duration || null,
          },
        } : isMovie ? {
          performance: {
            venue: form.venue || null,
            show_number: form.show_number ? Number(form.show_number) : null,
          },
        } : {}),
      });
      router.push(`/records/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-50" />;

  return (
    <div className="min-h-screen bg-zinc-50 pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="text-lg text-zinc-500">←</button>
        <h1 className="text-base font-semibold">기록 수정</h1>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5 p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">제목 *</label>
          <input required value={form.title} onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">{DATE_LABEL[category]} *</label>
          <input required type="date" value={form.view_date} onChange={(e) => set("view_date", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>
        {!isFuture && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">평점</label>
            <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
          </div>
        )}
        {(isPerformance || isMovie) && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">{isPerformance ? "극장" : "영화관"}</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)}
              placeholder={isPerformance ? "예) 블루스퀘어 신한카드홀" : "예) CGV 강남"}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
          </div>
        )}
        {isPerformance && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">좌석</label>
              <input value={form.seat} onChange={(e) => set("seat", e.target.value)}
                placeholder="예) 1층 B구역 12열 5번"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">
                관람 시간
                {form.show_time && form.duration && (() => {
                  const mins = parseInt(form.duration);
                  if (isNaN(mins)) return null;
                  const [h, m] = form.show_time.split(":").map(Number);
                  if (isNaN(h) || isNaN(m)) return null;
                  const total = h * 60 + m + mins;
                  const end = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                  return <span className="ml-2 font-normal text-zinc-400">→ {end} 종료</span>;
                })()}
              </label>
              <div className="flex items-center gap-2">
                <input value={form.show_time} onChange={(e) => set("show_time", e.target.value)}
                  placeholder="15:00"
                  className="w-28 rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
                <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-3 focus-within:border-zinc-400">
                  <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)}
                    placeholder="–" className="w-full text-sm outline-none" />
                  <span className="shrink-0 text-sm text-zinc-400">분</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">출연진</label>
              <TagInput value={form.cast} onChange={(tags) => set("cast", tags)} placeholder="이름 입력 후 Enter" suggestions={castSuggestions} />
            </div>
          </>
        )}
        {!isFuture && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">감상평</label>
            <textarea value={form.review} onChange={(e) => set("review", e.target.value)}
              rows={4} className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
          </div>
        )}
        <button type="submit" disabled={submitting}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
          {submitting ? "저장 중..." : "수정 완료"}
        </button>
      </form>
    </div>
  );
}
