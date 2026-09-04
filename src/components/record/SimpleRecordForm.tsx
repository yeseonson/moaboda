"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CategoryType, StatusType } from "@/types/record";
import StarRating from "./StarRating";

interface SearchMeta {
  title: string;
  poster_url: string | null;
  subtitle?: string;
  tags?: string[];
  cast?: string[];
}

interface Props {
  category: CategoryType;
  searchMeta: SearchMeta;
  extraPayload?: Record<string, unknown>;
  showVenue?: boolean;
  showShowNumber?: boolean;
  defaultShowNumber?: number;
  defaultReadCount?: number;
}

const STATUS_OPTS: { value: StatusType; label: string }[] = [
  { value: "want", label: "보고 싶어요" },
  { value: "in_progress", label: "보는 중" },
  { value: "done", label: "봤어요" },
];

const today = new Date().toISOString().split("T")[0];

export default function SimpleRecordForm({ category, searchMeta, extraPayload, showVenue, showShowNumber, defaultShowNumber = 1, defaultReadCount = 1 }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [genreInput, setGenreInput] = useState(searchMeta.tags?.join(", ") ?? "");
  const [status, setStatus] = useState<StatusType>("done");
  const [form, setForm] = useState({
    title: searchMeta.title,
    view_start: today,
    view_end: today,
    rating: 0,
    review: "",
    venue: "",
    show_number: defaultShowNumber,
    read_count: defaultReadCount,
  });

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isDone = status === "done";
  const isWant = status === "want";
  const isInProgress = status === "in_progress";
  const isBook = category === "book";
  const isMovie = category === "movie";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    if (isDone && (isMovie || isBook) && !form.rating) return alert("별점을 입력해주세요.");
    setSubmitting(true);
    try {
      const finalExtra = (() => {
        const base: Record<string, unknown> = { ...extraPayload };
        if (isMovie && genreInput.trim()) {
          const genres = genreInput.split(",").map(g => g.trim()).filter(Boolean);
          base.movie = { ...((base.movie as object) ?? {}), genres };
        }
        if (isBook) {
          const bookBase = (base.book as object) ?? {};
          const book: Record<string, unknown> = { ...bookBase };
          if (genreInput.trim()) book.genre = genreInput.trim();
          if (isDone) book.read_count = form.read_count;
          base.book = book;
        }
        return base;
      })();

      await api.records.create({
        category,
        title: form.title,
        view_start: isWant ? null : form.view_start,
        view_end: (isBook && isDone) ? form.view_end : null,
        status,
        rating: isDone ? (form.rating || null) : null,
        review: isDone ? (form.review || null) : null,
        poster_url: searchMeta.poster_url,
        ...(showVenue && !isWant ? { venue: form.venue || null } : {}),
        ...(showShowNumber && isDone ? { show_number: form.show_number } : {}),
        ...finalExtra,
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

      {searchMeta.poster_url && (
        <img src={searchMeta.poster_url} alt={form.title}
          className="mx-auto h-48 rounded-xl object-cover shadow-sm" />
      )}
      {searchMeta.subtitle && (
        <p className="text-center text-sm text-zinc-400">{searchMeta.subtitle}</p>
      )}
      {searchMeta.cast && searchMeta.cast.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {searchMeta.cast.slice(0, 8).map((name) => (
            <span key={name} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 상태 선택 */}
      <div className="flex rounded-xl border border-zinc-200 p-1 gap-1">
        {STATUS_OPTS.map(opt => (
          <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              status === opt.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500">제목 *</label>
        <input required value={form.title} onChange={(e) => set("title", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
      </div>

      {/* 날짜 필드 */}
      {!isWant && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">
            {isBook && isInProgress ? "시작일" : isBook && isDone ? "시작일" : isMovie ? "관람일" : "관람일"}
          </label>
          <input required type="date" value={form.view_start}
            onChange={(e) => set("view_start", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>
      )}
      {isBook && isDone && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">완독일</label>
          <input required type="date" value={form.view_end}
            min={form.view_start || undefined}
            onChange={(e) => set("view_end", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>
      )}

      {(isMovie || isBook) && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">장르</label>
          <input value={genreInput} onChange={(e) => setGenreInput(e.target.value)}
            placeholder={isMovie ? "예) 액션, SF" : "예) 소설"}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>
      )}

      {isDone && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">평점</label>
          <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
        </div>
      )}

      {showVenue && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">영화관</label>
          <input value={form.venue} onChange={(e) => set("venue", e.target.value)}
            placeholder="예) CGV 강남, 롯데시네마 건대입구"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>
      )}


      {isDone && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">감상평</label>
          <textarea value={form.review} onChange={(e) => set("review", e.target.value)}
            rows={4} placeholder="어땠나요?"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400 resize-none" />
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
        {submitting ? "저장 중..." : "기록 저장"}
      </button>
    </form>
  );
}
