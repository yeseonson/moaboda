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
  recordCast,
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
        className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-brand-soft p-3 transition hover:border-zinc-300"
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
          {recordCast(record).length > 0 && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {recordCast(record).join(", ")}
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
            <p className="mt-0.5 text-xs text-brass">
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
                  ? "bg-brand text-white"
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

/** 같은 작품의 관람 기록을 묶는 키. 작품이 연결 안 된 기록은 제목으로 묶는다. */
function workKey(r: CulturalRecord): string {
  return r.performance_id ?? r.movie_id ?? r.book_id ?? `title:${r.title}`;
}

interface WorkGroup {
  key: string;
  title: string;
  poster_url: string | null;
  category: CategoryType;
  sub_category: CulturalRecord["sub_category"];
  records: CulturalRecord[];  // 하위 탭으로 걸러진 것
  total: number;              // 상태 무관 전체 관람 수
  plannedCount: number;
  upcoming: string | null;    // 가장 가까운 예정 (정렬용)
  latest: string;
}

function GroupRow({
  group,
  open,
  onToggle,
  onStatusChange,
}: {
  group: WorkGroup;
  open: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: StatusType) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-brand-soft p-3 text-left transition hover:border-zinc-300"
      >
        {group.poster_url ? (
          <img
            src={group.poster_url}
            alt={group.title}
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xl">
            {TABS.find((t) => t.key === group.category)?.icon ?? "📝"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {group.sub_category && (
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {SUB_CATEGORY_LABEL[group.sub_category]}
              </span>
            )}
            <p className="truncate text-sm font-medium">{group.title}</p>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
              {group.total}회
            </span>
            {group.plannedCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR.planned}`}>
                예정 {group.plannedCount}
              </span>
            )}
            <span className="text-xs text-zinc-400">{group.latest}</span>
          </div>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium leading-none text-zinc-500">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <ul className="ml-4 space-y-2 border-l border-zinc-100 pl-3">
          {group.records.map((r) => (
            <li key={r.id}>
              <RecordCard record={r} onStatusChange={onStatusChange} />
            </li>
          ))}
        </ul>
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

  const [subTab, setSubTab] = useState<StatusType | "all">("all");
  const [year, setYear] = useState<string>(() => String(new Date().getFullYear()));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleTabChange = (key: CategoryType) => {
    try { sessionStorage.setItem("home_tab", key); } catch {}
    setTab(key);
    setExpanded(new Set());
  };

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

  const categoryRecords = useMemo(
    () => records.filter((r) => r.category === tab),
    [records, tab]
  );

  // 연도 -> 상태 순으로 거른다. 그래야 지난 연도에서 "관람 예정" 탭이 저절로 사라진다.
  const years = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of categoryRecords) {
      const d = recordDate(r);
      if (d) c[d.slice(0, 4)] = (c[d.slice(0, 4)] ?? 0) + 1;
    }
    return Object.entries(c).sort((a, b) => b[0].localeCompare(a[0]));
  }, [categoryRecords]);

  // 올해가 없으면 가장 최근 연도로 떨어진다.
  const activeYear =
    year === "all" || years.some(([y]) => y === year) ? year : years[0]?.[0] ?? "all";

  const yearRecords = useMemo(
    () =>
      activeYear === "all"
        ? categoryRecords
        : categoryRecords.filter((r) => (recordDate(r) ?? "").startsWith(activeYear)),
    [categoryRecords, activeYear]
  );

  // 해당 연도에 실제로 있는 상태만 하위 탭으로 노출한다.
  const subTabs = useMemo(() => {
    const present = STATUS_SECTIONS.filter(({ key }) =>
      yearRecords.some((r) => r.status === key)
    ).map(({ key, label }) => ({
      key: key as StatusType | "all",
      label,
      count: yearRecords.filter((r) => r.status === key).length,
    }));
    if (present.length < 2) return present;
    return [{ key: "all" as const, label: "전체", count: yearRecords.length }, ...present];
  }, [yearRecords]);

  // 탭/연도를 옮기면 이전 하위 탭이 없을 수 있으니 렌더 시점에 보정한다.
  const activeSubTab = subTabs.some((s) => s.key === subTab)
    ? subTab
    : subTabs[0]?.key ?? "all";

  const groups = useMemo(() => {
    const byWork = new Map<string, CulturalRecord[]>();
    for (const r of yearRecords) {
      const k = workKey(r);
      if (!byWork.has(k)) byWork.set(k, []);
      byWork.get(k)!.push(r);
    }

    const out: WorkGroup[] = [];
    for (const [key, all] of byWork) {
      const shown =
        activeSubTab === "all" ? [...all] : all.filter((r) => r.status === activeSubTab);
      if (shown.length === 0) continue;

      shown.sort((a, b) => (recordDate(b) ?? "").localeCompare(recordDate(a) ?? ""));
      const planned = all.filter((r) => r.status === "planned");
      const head = shown[0];

      out.push({
        key,
        title: head.title,
        poster_url: head.poster_url,
        category: head.category,
        sub_category: head.sub_category,
        records: shown,
        total: all.length,
        plannedCount: planned.length,
        upcoming:
          planned
            .map((r) => (r.view_start ?? "") + (r.show_time ?? ""))
            .sort()[0] ?? null,
        latest: recordDate(head) ?? "",
      });
    }

    // 예정이 남은 작품을 먼저, 가까운 순으로. "봤어요" 탭에서는 최근 관람 순.
    const floatUpcoming = activeSubTab !== "done";
    out.sort((a, b) => {
      if (floatUpcoming && (a.upcoming || b.upcoming)) {
        if (a.upcoming && b.upcoming) return a.upcoming.localeCompare(b.upcoming);
        return a.upcoming ? -1 : 1;
      }
      return b.latest.localeCompare(a.latest);
    });
    return out;
  }, [yearRecords, activeSubTab]);

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

  const isEmpty = categoryRecords.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-zinc-200 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-brand text-white"
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
        <div className="space-y-3">
          {years.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {years.map(([y, count]) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    activeYear === y
                      ? "bg-brand-soft text-brand"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {y}
                  <span className="ml-1 text-[10px] opacity-60">{count}</span>
                </button>
              ))}
              <button
                onClick={() => setYear("all")}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  activeYear === "all"
                    ? "bg-brand-soft text-brand"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                전체
                <span className="ml-1 text-[10px] opacity-60">{categoryRecords.length}</span>
              </button>
            </div>
          )}

          {subTabs.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {subTabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setSubTab(key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeSubTab === key
                      ? "bg-brand text-white"
                      : "bg-zinc-100 text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {label} {count}
                </button>
              ))}
            </div>
          )}

          <ul className="space-y-2">
            {groups.map((g) =>
              g.records.length === 1 ? (
                <li key={g.key}>
                  <RecordCard record={g.records[0]} onStatusChange={handleStatusChange} />
                </li>
              ) : (
                <li key={g.key}>
                  <GroupRow
                    group={g}
                    open={expanded.has(g.key)}
                    onToggle={() => toggleGroup(g.key)}
                    onStatusChange={handleStatusChange}
                  />
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
