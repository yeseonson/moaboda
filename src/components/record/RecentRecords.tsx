"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import RatingDots from "./RatingDots";
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
        className="flex items-center gap-3 rounded-xl border border-line-strong p-3 transition hover:border-brand/25"
      >
        {record.poster_url ? (
          <img
            src={record.poster_url}
            alt={record.title}
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xl">
            {TABS.find((t) => t.key === record.category)?.icon ?? "📝"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {record.sub_category && (
              <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-ink-muted">
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
            <p className="mt-0.5 text-xs text-ink-subtle">
              {dateDisplay}
              {record.show_time && ` ${record.show_time}`}
            </p>
          )}
          {recordCast(record).length > 0 && (
            <p className="mt-0.5 truncate text-xs text-ink-subtle">
              {recordCast(record).join(", ")}
            </p>
          )}
          {record.category === "movie" &&
            record.movies?.genres &&
            record.movies.genres.length > 0 && (
              <p className="mt-0.5 truncate text-xs text-ink-subtle">
                {record.movies.genres.slice(0, 3).join(" · ")}
              </p>
            )}
          {record.category === "book" && record.books?.genre && (
            <p className="mt-0.5 truncate text-xs text-ink-subtle">
              {record.books.genre}
            </p>
          )}
          {record.status === "done" && (
            <RatingDots value={record.rating} size={7} className="mt-1" />
          )}
        </div>
      </Link>

      {pickerOpen && (
        <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-xl border border-line-strong bg-white p-1 shadow-md">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => handleStatusPick(e, opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                record.status === opt.value
                  ? "bg-brand text-white"
                  : "text-ink-muted hover:bg-brand-soft"
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
        className="flex w-full items-center gap-3 rounded-xl border border-line-strong p-3 text-left transition hover:border-brand/25"
      >
        {group.poster_url ? (
          <img
            src={group.poster_url}
            alt={group.title}
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xl">
            {TABS.find((t) => t.key === group.category)?.icon ?? "📝"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {group.sub_category && (
              <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-ink-muted">
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
            <span className="text-xs text-ink-subtle">{group.latest}</span>
          </div>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-medium leading-none text-ink-muted">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <ul className="ml-4 space-y-2 border-l border-line pl-3">
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
          <div key={i} className="h-20 animate-pulse rounded-xl bg-brand-soft" />
        ))}
      </div>
    );
  }

  const isEmpty = categoryRecords.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-line-strong p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-brand text-white"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  tab === key ? "bg-white/20 text-white" : "bg-brand-soft text-ink-subtle"
                }`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <img
            src="/assets/logo-symbol-mono.svg"
            alt=""
            aria-hidden
            className="h-14 w-14 opacity-15"
          />
          <p className="text-sm text-ink-subtle">아직 기록이 없어요.</p>
          <Link
            href={`/add/${tab}`}
            className="border-b border-brand/40 pb-0.5 text-sm font-medium text-brand transition hover:border-brand"
          >
            첫 {TABS.find((t) => t.key === tab)?.label} 기록하기
          </Link>
        </div>
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
                      : "text-ink-subtle hover:text-ink"
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
                    : "text-ink-subtle hover:text-ink"
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
                      : "bg-brand-soft text-ink-muted hover:text-ink"
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
