"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MovieSearch, { MovieResult } from "@/components/record/MovieSearch";
import SimpleRecordForm from "@/components/record/SimpleRecordForm";

type Step = "search" | "form";

export default function AddMoviePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [selected, setSelected] = useState<MovieResult | null>(null);

  const handleSelect = (result: MovieResult) => {
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
        <h1 className="text-base font-semibold">영화 기록하기</h1>
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
        {step === "search" && <MovieSearch onSelect={handleSelect} />}
        {step === "form" && selected && (
          <SimpleRecordForm
            category="movie"
            searchMeta={{
              title: selected.title,
              poster_url: selected.poster_url,
              subtitle: selected.release_date ? `${selected.release_date.slice(0, 4)}년` : undefined,
              tags: selected.genres?.length ? selected.genres : undefined,
              cast: selected.cast?.length ? selected.cast : undefined,
            }}
            extraPayload={{ movie: { tmdb_id: selected.tmdb_id, genres: selected.genres, cast: selected.cast } }}
            showVenue
          />
        )}
      </main>
    </div>
  );
}
