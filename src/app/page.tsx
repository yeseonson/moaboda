import { createClient } from "@/lib/supabase/server";
import RecentRecords from "@/components/record/RecentRecords";
import PageHeader from "@/components/layout/PageHeader";
import { CategoryType, CATEGORY_LABEL } from "@/types/record";

const SUMMARY_ORDER: CategoryType[] = ["performance", "movie", "book"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 인사 카드의 카테고리별 집계. RLS 로 본인 기록만 조회된다.
  const { data: rows } = await supabase.from("records").select("category");
  const counts = SUMMARY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    count: (rows ?? []).filter((r) => r.category === category).length,
  }));

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <PageHeader />

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <section className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">안녕하세요</p>
            <p className="mt-1 truncate text-lg font-semibold">
              {user?.email?.split("@")[0]}님
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {counts.map(({ category, label, count }) => (
              <div
                key={category}
                className="w-14 rounded-xl bg-brand-soft py-2 text-center"
              >
                <p className="text-lg font-semibold leading-none text-brand">{count}</p>
                <p className="mt-1 text-xs text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <RecentRecords />
        </section>
      </main>
    </div>
  );
}
