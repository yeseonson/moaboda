"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CategoryType, CulturalRecord, SUB_CATEGORY_LABEL } from "@/types/record";

const CATEGORY_ICON: Record<CategoryType, string> = {
  performance: "🎭",
  movie: "🎬",
  book: "📚",
  exhibition: "🖼️",
};

const CATEGORY_LABEL: Record<CategoryType, string> = {
  performance: "공연",
  movie: "영화",
  book: "책",
  exhibition: "전시",
};

function isUpcoming(viewDate: string, showTime: string | null | undefined): boolean {
  const [y, mo, d] = viewDate.split("-").map(Number);
  const [h, m] = showTime ? showTime.split(":").map(Number) : [0, 0];
  return new Date(y, mo - 1, d, h, m) > new Date();
}

function RecordCard({ record }: { record: CulturalRecord }) {
  return (
    <Link
      href={`/records/${record.id}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition hover:border-zinc-300"
    >
      {record.poster_url ? (
        <img src={record.poster_url} alt={record.title} className="h-16 w-12 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xl">
          {CATEGORY_ICON[record.category]}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
            {record.sub_category ? SUB_CATEGORY_LABEL[record.sub_category] : CATEGORY_LABEL[record.category]}
          </span>
          <p className="truncate text-sm font-medium">{record.title}</p>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">
          {record.view_date}
          {record.performances?.show_time && ` ${record.performances.show_time}`}
        </p>
        {record.performances?.cast && record.performances.cast.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {record.performances.cast.join(", ")}
          </p>
        )}
        {record.rating && (
          <p className="mt-0.5 text-xs text-yellow-500">
            {"★".repeat(record.rating)}{"☆".repeat(5 - record.rating)}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function RecentRecords() {
  const [records, setRecords] = useState<CulturalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.records.list()
      .then((data) => setRecords(data ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const upcoming: CulturalRecord[] = [];
    const past: CulturalRecord[] = [];
    for (const r of records) {
      if (isUpcoming(r.view_date, r.performances?.show_time)) upcoming.push(r);
      else past.push(r);
    }
    // 예정: 날짜+시간 내림차순
    upcoming.sort((a, b) => {
      const aKey = a.view_date + (a.performances?.show_time ?? "00:00");
      const bKey = b.view_date + (b.performances?.show_time ?? "00:00");
      return bKey.localeCompare(aKey);
    });
    // 최근: 날짜 내림차순 (최신 먼저, 이미 API가 desc로 줌)
    return { upcoming, past };
  }, [records]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        아직 기록이 없어요.<br />첫 번째 기록을 남겨보세요!
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-400">관람 예정</h3>
          <ul className="space-y-2">
            {upcoming.map((r) => <li key={r.id}><RecordCard record={r} /></li>)}
          </ul>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-400">최근 기록</h3>
          <ul className="space-y-2">
            {past.slice(0, 10).map((r) => <li key={r.id}><RecordCard record={r} /></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
