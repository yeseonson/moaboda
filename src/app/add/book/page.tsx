"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BookSearch, { BookResult } from "@/components/record/BookSearch";
import SimpleRecordForm from "@/components/record/SimpleRecordForm";

type Step = "search" | "form";

export default function AddBookPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  // null = 검색을 건너뛰고 직접 입력. 카카오에 없는 독립출판물 등을 위해 열어둔다.
  const [selected, setSelected] = useState<BookResult | null>(null);

  const handleSelect = (result: BookResult | null) => {
    setSelected(result);
    setStep("form");
  };

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button
          onClick={() => (step === "search" ? router.back() : setStep("search"))}
          className="text-lg text-zinc-500"
        >
          ←
        </button>
        <h1 className="text-base font-semibold">책 기록하기</h1>
        <div className="ml-auto flex gap-1">
          {(["search", "form"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i <= (step === "search" ? 0 : 1) ? "bg-brand" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4">
        {step === "search" && <BookSearch onSelect={handleSelect} />}
        {step === "form" && (
          <SimpleRecordForm
            category="book"
            searchMeta={{
              title: selected?.title ?? "",
              poster_url: selected?.poster_url ?? null,
              subtitle: [selected?.author, selected?.publisher].filter(Boolean).join(" · ") || undefined,
              tags: selected?.category ? [selected.category] : undefined,
            }}
            // 직접 입력이어도 book 키는 넘긴다. 있어야 books 에 행이 생기고 기록이 작품에 붙는다.
            extraPayload={{
              book: {
                isbn: selected?.isbn ?? null,
                author: selected?.author ?? null,
                publisher: selected?.publisher ?? null,
                genre: selected?.category ?? null,
              },
            }}
          />
        )}
      </main>
    </div>
  );
}
