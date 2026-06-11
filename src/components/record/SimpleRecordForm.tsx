"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CategoryType } from "@/types/record";
import StarRating from "./StarRating";

interface SearchMeta {
  title: string;
  poster_url: string | null;
  subtitle?: string;
}

interface Props {
  category: CategoryType;
  searchMeta: SearchMeta;
  extraPayload?: Record<string, unknown>;
  showVenue?: boolean;
  showShowNumber?: boolean;
}

export default function SimpleRecordForm({ category, searchMeta, extraPayload, showVenue, showShowNumber }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: searchMeta.title,
    view_date: new Date().toISOString().split("T")[0],
    rating: 0,
    review: "",
    venue: "",
    show_number: "",
  });

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const today = new Date().toISOString().split("T")[0];
  const isFuture = form.view_date > today;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.view_date) return;
    setSubmitting(true);
    try {
      await api.records.create({
        category,
        title: form.title,
        view_date: form.view_date,
        rating: form.rating || null,
        review: form.review || null,
        poster_url: searchMeta.poster_url,
        ...(showVenue || showShowNumber ? {
          performance: {
            venue: form.venue || null,
            show_number: form.show_number ? Number(form.show_number) : null,
          }
        } : {}),
        ...extraPayload,
      });
      router.push("/");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = category === "book" ? "완독일" : "관람일";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold">상세 정보를 입력해주세요</h2>

      {searchMeta.poster_url && (
        <img
          src={searchMeta.poster_url}
          alt={form.title}
          className="mx-auto h-48 rounded-xl object-cover shadow-sm"
        />
      )}

      {searchMeta.subtitle && (
        <p className="text-center text-sm text-zinc-400">{searchMeta.subtitle}</p>
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
        <label className="text-xs font-medium text-zinc-500">{dateLabel} *</label>
        <input
          required
          type="date"
          value={form.view_date}
          onChange={(e) => set("view_date", e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
      </div>

      {!isFuture && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">평점</label>
          <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
        </div>
      )}

      {showVenue && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">영화관</label>
          <input
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="예) CGV 강남, 롯데시네마 건대입구"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
        </div>
      )}

      {showShowNumber && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">회차</label>
          <input
            type="number"
            value={form.show_number}
            onChange={(e) => set("show_number", e.target.value)}
            placeholder="예) 2 (두 번째 관람)"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
        </div>
      )}

      {!isFuture && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">감상평</label>
          <textarea
            value={form.review}
            onChange={(e) => set("review", e.target.value)}
            rows={4}
            placeholder="어땠나요?"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400 resize-none"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
      >
        {submitting ? "저장 중..." : "기록 저장"}
      </button>
    </form>
  );
}
