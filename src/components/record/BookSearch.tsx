"use client";

import { useState } from "react";

export interface BookResult {
  isbn: string;
  title: string;
  author: string | null;
  publisher: string | null;
  pub_date: string | null;
  poster_url: string | null;
  description: string | null;
  category: string | null;
}

interface Props {
  onSelect: (result: BookResult) => void;
}

export default function BookSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search/books?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-zinc-700">책 검색</label>
        <div className="mt-1 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="책 제목을 입력하세요"
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
          <button
            onClick={search}
            disabled={loading}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            검색
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-sm text-zinc-400">검색 중...</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-center text-sm text-zinc-400">검색 결과가 없어요</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((book) => (
            <li key={book.isbn}>
              <button
                onClick={() => onSelect(book)}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3 text-left hover:border-zinc-300 transition"
              >
                {book.poster_url ? (
                  <img src={book.poster_url} alt={book.title} className="h-16 w-11 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-16 w-11 rounded-lg bg-zinc-100 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-medium text-sm text-zinc-900 truncate">{book.title}</div>
                  {book.author && <div className="text-xs text-zinc-400 truncate">{book.author}</div>}
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {book.publisher && <span className="text-xs text-zinc-400">{book.publisher}</span>}
                    {book.category && (
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">{book.category}</span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
