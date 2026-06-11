"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  CulturalRecord,
  SUB_CATEGORY_COLOR,
  SUB_CATEGORY_LABEL,
} from "@/types/record";

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<CulturalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  if (!record) return null;

  const perf = record.performances;
  const rating = record.rating ?? 0;

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
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${SUB_CATEGORY_COLOR[record.sub_category]}`}
              >
                {SUB_CATEGORY_LABEL[record.sub_category]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{record.view_date}</p>
          {rating > 0 && (
            <p className="mt-2 text-lg text-yellow-400">
              {"★".repeat(rating)}
              {"☆".repeat(5 - rating)}
            </p>
          )}
        </section>

        {perf && (perf.venue || perf.cast || perf.seat || perf.show_time) && (
          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700">공연 정보</h2>
            {perf.show_time && (
              <div>
                <p className="text-xs text-zinc-400">관람 시간</p>
                <p className="text-sm">
                  {perf.show_time}
                  {perf.duration &&
                    (() => {
                      const mins = parseInt(perf.duration);
                      if (isNaN(mins)) return ` (${perf.duration})`;
                      const [h, m] = perf.show_time!.split(":").map(Number);
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
            {perf.seat && (
              <div>
                <p className="text-xs text-zinc-400">좌석</p>
                <p className="text-sm">{perf.seat}</p>
              </div>
            )}
            {perf.cast && perf.cast.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400">출연진</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {perf.cast.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {record.review && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-zinc-700">감상평</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {record.review}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
