"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord, OTT_PLATFORMS, StatusType, recordCast } from "@/types/record";
import StarRating from "@/components/record/StarRating";
import TagInput from "@/components/record/TagInput";

const STATUS_OPTS: { value: StatusType; label: string }[] = [
  { value: "want", label: "보고 싶어요" },
  { value: "in_progress", label: "보는 중" },
  { value: "done", label: "봤어요" },
];

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<CategoryType>("performance");
  const [status, setStatus] = useState<StatusType>("done");
  const [genreInput, setGenreInput] = useState("");
  const [watchMode, setWatchMode] = useState<"cinema" | "ott">("cinema");
  const [ottPick, setOttPick] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    view_start: "",
    view_end: "",
    rating: 0,
    review: "",
    venue: "",
    cast: [] as string[],
    seat: "",
    show_time: "",
    duration: "",
  });

  useEffect(() => {
    api.records.get(id).then((record: CulturalRecord) => {
      const perf = record.performances;
      setCategory(record.category);
      if (record.ott) {
        setWatchMode("ott");
        setOttPick(OTT_PLATFORMS.includes(record.ott as never) ? record.ott : "기타");
      }
      setStatus(record.status ?? "done");
      setGenreInput(
        record.category === "movie" ? (record.movies?.genres?.join(", ") ?? "")
        : record.category === "book" ? (record.books?.genre ?? "")
        : ""
      );
      setForm({
        title: record.title,
        view_start: record.view_start ?? "",
        view_end: record.view_end ?? "",
        rating: record.rating ?? 0,
        review: record.review ?? "",
        venue:
          record.category === "performance"
            ? perf?.venue ?? ""
            : record.ott ?? record.cinema ?? "",
        cast: recordCast(record),
        seat: record.seat ?? "",
        show_time: record.show_time ?? "",
        duration: perf?.duration ? String(parseInt(perf.duration)) : "",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const set = (key: string, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isPerformance = category === "performance";
  const isMovie = category === "movie";
  const isBook = category === "book";
  const isDone = status === "done";
  const isWant = status === "want";
  const isInProgress = status === "in_progress";

  const isFuture = (() => {
    if (!form.view_start) return false;
    const [y, mo, d] = form.view_start.split("-").map(Number);
    const [h, m] = form.show_time ? form.show_time.split(":").map(Number) : [0, 0];
    return new Date(y, mo - 1, d, h, m) > new Date();
  })();

  const perfStatus = isFuture ? "planned" : "done";

  const [castSuggestions, setCastSuggestions] = useState<string[]>([]);
  useEffect(() => {
    try { setCastSuggestions(JSON.parse(localStorage.getItem("moaboda_cast") ?? "[]")); }
    catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resolvedStatus = isPerformance ? perfStatus : status;
      const showRatingReview = isPerformance ? !isFuture : isDone;
      await api.records.update(id, {
        title: form.title,
        view_start: isWant ? null : (form.view_start || null),
        view_end: (isBook && isDone) ? (form.view_end || null) : null,
        status: resolvedStatus,
        rating: showRatingReview ? (form.rating || null) : null,
        review: showRatingReview ? (form.review || null) : null,
        ...(isPerformance ? {
          show_time: form.show_time || null,
          seat: form.seat || null,
          // 출연진은 그날 본 배우라 기록에 저장한다 (공연 카탈로그를 덮어쓰지 않도록)
          cast: form.cast.length > 0 ? form.cast : null,
          performance: {
            venue: form.venue || null,
            duration: form.duration || null,
          },
        } : isMovie ? {
          ...(watchMode === "ott"
            ? { ott: (ottPick === "기타" ? form.venue.trim() : ottPick) || null, cinema: null }
            : { cinema: form.venue.trim() || null, ott: null }),
          movie: {
            ...(genreInput.trim() ? { genres: genreInput.split(",").map(g => g.trim()).filter(Boolean) } : {}),
          },
        } : isBook ? {
          book: {
            ...(genreInput.trim() ? { genre: genreInput.trim() } : {}),
          },
        } : {}),
      });
      router.push(`/records/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-canvas" />;

  return (
    <div className="min-h-screen bg-canvas pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="text-lg text-zinc-500">←</button>
        <h1 className="text-base font-semibold">기록 수정</h1>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5 p-4">

        {(isMovie || isBook) && (
          <div className="flex rounded-xl border border-zinc-200 p-1 gap-1">
            {STATUS_OPTS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                  status === opt.value ? "bg-brand text-white" : "text-zinc-500 hover:text-zinc-700"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500">제목 *</label>
          <input required value={form.title} onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
        </div>

        {(isPerformance || !isWant) && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">
              {isPerformance ? "관람일" : isBook ? "시작일" : "관람일"} *
            </label>
            <input required type="date" value={form.view_start}
              onChange={(e) => set("view_start", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
          </div>
        )}
        {isBook && isDone && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">완독일</label>
            <input type="date" value={form.view_end}
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

        {(isPerformance ? !isFuture : isDone) && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">평점</label>
            <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
          </div>
        )}

        {isPerformance && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">극장</label>
            <input value={form.venue} onChange={(e) => set("venue", e.target.value)}
              placeholder="예) 블루스퀘어 신한카드홀"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
          </div>
        )}

        {isMovie && !isWant && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500">관람 방식</label>
            <div className="flex gap-1 rounded-xl border border-zinc-200 p-1">
              {(["cinema", "ott"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setWatchMode(m)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                    watchMode === m ? "bg-brand text-white" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {m === "cinema" ? "영화관" : "OTT"}
                </button>
              ))}
            </div>

            {watchMode === "cinema" ? (
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)}
                placeholder="예) CGV 강남"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[...OTT_PLATFORMS, "기타"].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setOttPick(name)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        ottPick === name
                          ? "border-brand bg-brand text-white"
                          : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {ottPick === "기타" && (
                  <input value={form.venue} onChange={(e) => set("venue", e.target.value)}
                    placeholder="플랫폼 이름"
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
                )}
              </div>
            )}
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
              <TagInput value={form.cast} onChange={(tags) => set("cast", tags)}
                placeholder="이름 입력 후 Enter" suggestions={castSuggestions} />
            </div>
          </>
        )}

        {(isPerformance ? !isFuture : isDone) && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">감상평</label>
            <textarea value={form.review} onChange={(e) => set("review", e.target.value)}
              rows={4} className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400" />
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full rounded-xl bg-brand py-3 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50">
          {submitting ? "저장 중..." : "수정 완료"}
        </button>
      </form>
    </div>
  );
}
