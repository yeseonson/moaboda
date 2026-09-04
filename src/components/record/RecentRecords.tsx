"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  CategoryType,
  CulturalRecord,
  STATUS_COLOR,
  STATUS_LABEL,
  StatusType,
  SUB_CATEGORY_LABEL,
  recordDate,
} from "@/types/record";

const STATUS_SECTIONS: { key: StatusType; label: string }[] = [
  { key: "planned", label: "관람 예정" },
  { key: "want", label: "보고 싶어요" },
  { key: "in_progress", label: "보는 중" },
  { key: "done", label: "봤어요" },
];

const STATUS_OPTS: { value: StatusType; label: string }[] = [
  { value: "want", label: "보고 싶어요" },
  { value: "in_progress", label: "보는 중" },
  { value: "done", label: "봤어요" },
];

const TABS: { key: CategoryType; label: string; icon: string }[] = [
  { key: "performance", label: "공연", icon: "🎭" },
  { key: "movie", label: "영화", icon: "🎬" },
  { key: "book", label: "책", icon: "📚" },
];

function RecordCard({
  record,
  onStatusChange,
}: {
  record: CulturalRecord;
  onStatusChange: (id: string, status: StatusType) => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const date = recordDate(record);
  const dateDisplay =
    record.category === "book" && record.view_start && record.view_end
      ? `${record.view_start} ~ ${record.view_end}`
      : date ?? "";

  const isMovieOrBook = record.category === "movie" || record.category === "book";

  const handleStatusPick = async (e: React.MouseEvent, newStatus: StatusType) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      await onStatusChange(record.id, newStatus);
    } finally {
      setSaving(false);
      setPickerOpen(false);
    }
  };

  const togglePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPickerOpen((v) => !v);
  };

  return (
    <div className="relative">
      <Link
        href={`/records/${record.id}`}
        className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition hover:border-zinc-300"
      >
        {record.poster_url ? (
          <img
            src={record.poster_url}
            alt={record.title}
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xl">
            {TABS.find((t) => t.key === record.category)?.icon ?? "📝"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {record.sub_category && (
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {SUB_CATEGORY_LABEL[record.sub_category]}
              </span>
            )}
            <p className="truncate text-sm font-medium">{record.title}</p>
            {isMovieOrBook && (
              <button
                onClick={togglePicker}
                className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition ${STATUS_COLOR[record.status]} ${saving ? "opacity-50" : ""}`}
              >
                {STATUS_LABEL[record.status]}
              </button>
            )}
          </div>
          {dateDisplay && (
            <p className="mt-0.5 text-xs text-zinc-400">
              {dateDisplay}
              {record.show_time && ` ${record.show_time}`}
            </p>
          )}
          {record.performances?.cast && record.performances.cast.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {record.performances.cast.join(", ")}
            </p>
          )}
          {record.category === "movie" &&
            record.movies?.genres &&
            record.movies.genres.length > 0 && (
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                {record.movies.genres.slice(0, 3).join(" · ")}
              </p>
            )}
          {record.category === "book" && record.books?.genre && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {record.books.genre}
            </p>
          )}
          {record.rating && record.status === "done" && (
            <p className="mt-0.5 text-xs text-yellow-500">
              {"★".repeat(record.rating)}
              {"☆".repeat(5 - record.rating)}
            </p>
          )}
        </div>
      </Link>

      {pickerOpen && (
        <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-md">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => handleStatusPick(e, opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                record.status === opt.value
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecentRecords() {
  const [records, setRecords] = useState<CulturalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CategoryType>(() => {
    try {
      return (sessionStorage.getItem("home_tab") as CategoryType) ?? "performance";
    } catch {
      return "performance";
    }
  });

  const handleTabChange = (key: CategoryType) => {
    try { sessionStorage.setItem("home_tab", key); } catch {}
    setTab(key);
  };

  useEffect(() => {
    api.records
      .list()
      .then((data) => setRecords(data ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (recordId: string, newStatus: StatusType) => {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
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
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...update } : r))
    );
    try {
      await api.records.update(recordId, update);
    } catch {
      api.records.list().then((data) => setRecords(data ?? [])).catch(() => {});
    }
  };

  const tabRecords = useMemo(() => {
    const filtered = records.filter((r) => r.category === tab);
    const grouped: Partial<Record<StatusType, CulturalRecord[]>> = {};
    for (const r of filtered) {
      if (!grouped[r.status]) grouped[r.status] = [];
      grouped[r.status]!.push(r);
    }
    grouped.planned?.sort((a, b) => {
      const aKey = (a.view_start ?? "") + (a.show_time ?? "");
      const bKey = (b.view_start ?? "") + (b.show_time ?? "");
      return aKey.localeCompare(bKey);
    });
    grouped.done?.sort((a, b) =>
      (recordDate(b) ?? "").localeCompare(recordDate(a) ?? "")
    );
    return grouped;
  }, [records, tab]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map(({ key }) => [key, records.filter((r) => r.category === key).length])
      ) as Record<CategoryType, number>,
    [records]
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />
        ))}
      </div>
    );
  }

  const isEmpty = STATUS_SECTIONS.every((s) => !tabRecords[s.key]?.length);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-zinc-200 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  tab === key ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-zinc-400">
          아직 기록이 없어요.
        </p>
      ) : (
        <div className="space-y-5">
          {STATUS_SECTIONS.map(({ key, label }) => {
            const list = tabRecords[key];
            if (!list?.length) return null;
            const sliced = key === "done" ? list.slice(0, 10) : list;
            return (
              <div key={key} className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400">{label}</h3>
                <ul className="space-y-2">
                  {sliced.map((r: CulturalRecord) => (
                    <li key={r.id}>
                      <RecordCard record={r} onStatusChange={handleStatusChange} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
