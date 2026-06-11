"use client";

import { useRouter } from "next/navigation";
import SimpleRecordForm from "@/components/record/SimpleRecordForm";

export default function AddExhibitionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <button onClick={() => router.back()} className="text-lg text-zinc-500">
          ←
        </button>
        <h1 className="text-base font-semibold">전시 기록하기</h1>
      </header>

      <main className="mx-auto max-w-lg p-4">
        <SimpleRecordForm
          category="exhibition"
          searchMeta={{ title: "", poster_url: null }}
        />
      </main>
    </div>
  );
}
