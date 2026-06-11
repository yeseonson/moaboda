"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export interface SearchResult {
  kopis_id: string;
  title: string;
  poster_url: string | null;
  venue: string | null;
  period_start: string | null;
  period_end: string | null;
  genre: string | null;
  cast: string[] | null;
  runtime: string | null;
}

interface Props {
  onSelect: (result: SearchResult | null) => void;
}

export default function PerformanceSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search.performances(query);
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">공연을 검색해주세요</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="공연 제목 입력..."
        className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
      />

      {loading && (
        <p className="text-center text-sm text-zinc-400">검색 중...</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.kopis_id}>
              <button
                onClick={async () => {
                  setSelecting(r.kopis_id);
                  try {
                    const detail = await api.search.performanceDetail(r.kopis_id);
                    onSelect({ ...r, ...detail });
                  } catch {
                    onSelect(r);
                  } finally {
                    setSelecting(null);
                  }
                }}
                disabled={selecting === r.kopis_id}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3 text-left transition hover:border-zinc-300 disabled:opacity-50"
              >
                {r.poster_url ? (
                  <img
                    src={r.poster_url}
                    alt={r.title}
                    className="h-16 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-zinc-100 text-xl">
                    🎭
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  {r.venue && (
                    <p className="truncate text-xs text-zinc-400">{r.venue}</p>
                  )}
                  {r.period_start && (
                    <p className="text-xs text-zinc-400">
                      {r.period_start} ~ {r.period_end}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="space-y-2 text-center">
          <p className="text-sm text-zinc-400">검색 결과가 없어요.</p>
          <button
            onClick={() => onSelect(null)}
            className="text-sm font-medium text-zinc-600 underline underline-offset-2"
          >
            직접 입력하기
          </button>
        </div>
      )}
    </div>
  );
}
