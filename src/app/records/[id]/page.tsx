"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  CulturalRecord,
  STATUS_COLOR,
  STATUS_LABEL,
  StatusType,
  SUB_CATEGORY_COLOR,
  SUB_CATEGORY_LABEL,
  recordCast,
  recordDate,
} from "@/types/record";

const STATUS_OPTS: { value: StatusType; label: string }[] = [
  { value: "want", label: "보고 싶어요" },
  { value: "in_progress", label: "보는 중" },
  { value: "done", label: "봤어요" },
];

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CulturalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    api.records
      .get(id)
      .then(setRecord)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("이 기록을 삭제할까요?")) return;
    setDeleting(true);
    try {
      await api.records.delete(id);
      router.push("/");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!record || statusSaving) return;
    const today = new Date().toISOString().split("T")[0];
    const update: Partial<CulturalRecord> & { status: StatusType } = { status: newStatus };
    if (newStatus === "want") {
      update.view_start = null;
      update.view_end = null;
    } else if (newStatus === "done") {
      if (record.category === "movie" && !record.view_start) update.view_start = today;
      if (record.category === "book") {
        if (!record.view_start) update.view_start = today;
        if (!record.view_end) update.view_end = today;
      }
    }
    setRecord((prev) => (prev ? { ...prev, ...update } : prev));
    setStatusSaving(true);
    try {
      await api.records.update(id, update);
    } catch {
      setRecord((prev) => (prev ? { ...prev, status: record.status } : prev));
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="h-64 animate-pulse bg-zinc-200" />
        <div className="p-4 space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    );
  }

  const openReview = () => {
    setReviewDraft(record?.review ?? "");
    setEditingReview(true);
  };

  const saveReview = async () => {
    if (!record || reviewSaving) return;
    const next = reviewDraft.trim() || null;
    setReviewSaving(true);
    try {
      await api.records.update(record.id, { review: next });
      setRecord((prev) => (prev ? { ...prev, review: next } : prev));
      setEditingReview(false);
    } finally {
      setReviewSaving(false);
    }
  };

  if (!record) return null;

  const perf = record.performances;
  const mov = record.movies;
  const bk = record.books;
  const rating = record.rating ?? 0;
  const isMovieOrBook = record.category === "movie" || record.category === "book";

  return (
    <div className="min-h-screen bg-zinc-50 pb-10">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="text-lg text-zinc-500">
          ←
        </button>
        <div className="flex gap-3">
          <Link
            href={`/records/${id}/edit`}
            className="text-sm font-medium text-zinc-600"
          >
            수정
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-medium text-red-500 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </header>

      {record.poster_url && (
        <div className="flex justify-center bg-zinc-900 py-8">
          <img
            src={record.poster_url}
            alt={record.title}
            className="h-64 rounded-xl object-cover shadow-lg"
          />
        </div>
      )}

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold">{record.title}</h1>
            {record.sub_category && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${SUB_CATEGORY_COLOR[record.sub_category]}`}>
                {SUB_CATEGORY_LABEL[record.sub_category]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {record.category === "book" && record.view_start && record.view_end
              ? `${record.view_start} ~ ${record.view_end}`
              : recordDate(record)}
            {record.read_count && record.read_count > 1 && (
              <span className="ml-2 text-xs text-zinc-400">{record.read_count}번째 읽기</span>
            )}
          </p>
          {rating > 0 && (
            <p className="mt-2 text-lg text-yellow-400">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </p>
          )}

          {isMovieOrBook && (
            <div className={`mt-4 flex gap-1 rounded-xl border border-zinc-200 p-1 transition-opacity ${statusSaving ? "opacity-50" : ""}`}>
              {STATUS_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={statusSaving}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                    record.status === opt.value
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {perf && (perf.venue || recordCast(record).length > 0 || record.seat || record.show_time) && (
          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700">공연 정보</h2>
            {record.show_time && (
              <div>
                <p className="text-xs text-zinc-400">관람 시간</p>
                <p className="text-sm">
                  {record.show_time}
                  {perf.duration &&
                    (() => {
                      const mins = parseInt(perf.duration);
                      if (isNaN(mins)) return ` (${perf.duration})`;
                      const [h, m] = record.show_time!.split(":").map(Number);
                      const total = h * 60 + m + mins;
                      const end = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                      return ` ~ ${end}`;
                    })()}
                </p>
              </div>
            )}
            {perf.venue && (
              <div>
                <p className="text-xs text-zinc-400">극장</p>
                <p className="text-sm">{perf.venue}</p>
              </div>
            )}
            {record.seat && (
              <div>
                <p className="text-xs text-zinc-400">좌석</p>
                <p className="text-sm">{record.seat}</p>
              </div>
            )}
            {recordCast(record).length > 0 && (
              <div>
                <p className="text-xs text-zinc-400">출연진</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {recordCast(record).map((name) => (
                    <span key={name} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {record.category === "movie" && mov && (mov.genres?.length || mov.cast?.length) && (
          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700">영화 정보</h2>
            {mov.genres && mov.genres.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400">장르</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {mov.genres.map((g) => (
                    <span key={g} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">{g}</span>
                  ))}
                </div>
              </div>
            )}
            {mov.cast && mov.cast.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400">출연진</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {mov.cast.map((name) => (
                    <span key={name} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {record.category === "book" && bk && (bk.author || bk.publisher || bk.genre || record.read_count) && (
          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700">책 정보</h2>
            {bk.author && (
              <div>
                <p className="text-xs text-zinc-400">저자</p>
                <p className="text-sm">{bk.author}</p>
              </div>
            )}
            {bk.publisher && (
              <div>
                <p className="text-xs text-zinc-400">출판사</p>
                <p className="text-sm">{bk.publisher}</p>
              </div>
            )}
            {bk.genre && (
              <div>
                <p className="text-xs text-zinc-400">장르</p>
                <p className="text-sm">{bk.genre}</p>
              </div>
            )}
            {record.read_count && (
              <div>
                <p className="text-xs text-zinc-400">회독</p>
                <p className="text-sm">{record.read_count}회독</p>
              </div>
            )}
          </section>
        )}

        {/* 아직 안 본 기록에는 감상평 칸을 띄우지 않는다 (수정 화면과 동일한 기준) */}
        {record.status === "done" && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">감상평</h2>
              {record.review && !editingReview && (
                <button onClick={openReview} className="text-xs font-medium text-zinc-400 hover:text-zinc-600">
                  수정
                </button>
              )}
            </div>

            {/* 감상평이 없으면 곧바로 입력칸을 띄운다 (한 번 더 누르지 않도록) */}
            {editingReview || !record.review ? (
              <div className="space-y-2">
                <textarea
                  autoFocus={editingReview}
                  value={reviewDraft}
                  onChange={(e) => setReviewDraft(e.target.value)}
                  rows={5}
                  placeholder={
                    record.category === "performance"
                      ? "이 공연은 어땠나요?"
                      : record.category === "movie"
                        ? "이 영화는 어땠나요?"
                        : "이 책은 어땠나요?"
                  }
                  className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
                <div className="flex justify-end gap-2">
                  {record.review && (
                    <button
                      onClick={() => setEditingReview(false)}
                      disabled={reviewSaving}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 disabled:opacity-50"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={saveReview}
                    disabled={reviewSaving || (!reviewDraft.trim() && !record.review)}
                    className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
                  >
                    {reviewSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {record.review}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
