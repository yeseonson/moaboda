"use client";

import { useRouter } from "next/navigation";

const CATEGORIES = [
  { href: "/add/performance", label: "공연", sub: "뮤지컬 · 연극 · 콘서트", emoji: "🎭" },
  { href: "/add/movie", label: "영화", sub: "TMDB 검색 연동", emoji: "🎬" },
  { href: "/add/book", label: "책", sub: "알라딘 검색 연동", emoji: "📚" },
  { href: "/add/exhibition", label: "전시", sub: "직접 입력", emoji: "🖼️" },
];

export default function AddCategoryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="text-lg text-zinc-500">
          ←
        </button>
        <h1 className="text-base font-semibold">무엇을 기록할까요?</h1>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-3">
        {CATEGORIES.map(({ href, label, sub, emoji }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="w-full flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left transition hover:border-zinc-400 hover:shadow-sm active:scale-[0.98]"
          >
            <span className="text-3xl">{emoji}</span>
            <div>
              <div className="font-semibold text-zinc-900">{label}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>
            </div>
            <span className="ml-auto text-zinc-300">→</span>
          </button>
        ))}
      </main>
    </div>
  );
}
