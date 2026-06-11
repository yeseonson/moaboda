"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BookSearch, { BookResult } from "@/components/record/BookSearch";
import SimpleRecordForm from "@/components/record/SimpleRecordForm";

type Step = "search" | "form";

export default function AddBookPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [selected, setSelected] = useState<BookResult | null>(null);

  const handleSelect = (result: BookResult) => {
    setSelected(result);
    setStep("form");
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
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
                i <= (step === "search" ? 0 : 1) ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4">
        {step === "search" && <BookSearch onSelect={handleSelect} />}
        {step === "form" && selected && (
          <SimpleRecordForm
            category="book"
            searchMeta={{
              title: selected.title,
              poster_url: selected.poster_url,
              subtitle: [selected.author, selected.publisher].filter(Boolean).join(" · ") || undefined,
            }}
            extraPayload={{ book: { isbn: selected.isbn, author: selected.author, publisher: selected.publisher, genre: selected.category } }}
          />
        )}
      </main>
    </div>
  );
}
