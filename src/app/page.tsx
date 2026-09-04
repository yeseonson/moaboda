import { createClient } from "@/lib/supabase/server";
import RecentRecords from "@/components/record/RecentRecords";
import PageHeader from "@/components/layout/PageHeader";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <PageHeader />

      <main className="mx-auto max-w-lg space-y-6 p-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">안녕하세요</p>
          <p className="mt-1 text-lg font-semibold">
            {user?.email?.split("@")[0]}님 👋
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <RecentRecords />
        </section>
      </main>

    </div>
  );
}
