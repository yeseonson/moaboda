"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubCategoryType } from "@/types/record";
import PerformanceSearch, { SearchResult } from "@/components/record/PerformanceSearch";
import RecordForm from "@/components/record/RecordForm";
import { api } from "@/lib/api";

// KOPIS 장르 → 서브카테고리 자동 매핑
function inferSubCategory(genre: string | null): SubCategoryType {
  if (!genre) return "etc";
  if (genre.includes("뮤지컬")) return "musical";
  if (genre.includes("연극")) return "play";
  if (genre.includes("콘서트") || genre.includes("클래식") || genre.includes("국악")) return "concert";
  return "etc";
}

type Step = "search" | "form";

export default function AddPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [subCategory, setSubCategory] = useState<SubCategoryType>("musical");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const handleSearchSelect = async (result: SearchResult | null) => {
    // 전에 기록한 적 있는 공연이면 저장해둔 극장·러닝타임을 우선 쓴다.
    // (KOPIS 값을 한 번 고쳐놨다면 그 값이 계속 따라오도록)
    let merged = result;
    if (result?.kopis_id) {
      try {
        const saved = await api.performances.byKopisId(result.kopis_id);
        if (saved) {
          merged = {
            ...result,
            venue: saved.venue ?? result.venue,
            runtime: saved.duration ?? result.runtime,
          };
        }
      } catch {
        // 조회 실패해도 KOPIS 값으로 진행
      }
    }
    setSearchResult(merged);
    setSubCategory(inferSubCategory(result?.genre ?? null));
    setStep("form");
  };

  return (
    <div className="min-h-screen bg-canvas pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button
          onClick={() => {
            if (step === "search") router.back();
            else setStep("search");
          }}
          className="text-lg text-zinc-500"
        >
          ←
        </button>
        <h1 className="text-base font-semibold">공연 기록하기</h1>
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
        {step === "search" && <PerformanceSearch onSelect={handleSearchSelect} />}
        {step === "form" && (
          <RecordForm
            subCategory={subCategory}
            onSubCategoryChange={setSubCategory}
            searchResult={searchResult}
          />
        )}
      </main>
    </div>
  );
}
