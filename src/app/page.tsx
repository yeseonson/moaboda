import { createClient } from "@/lib/supabase/server";
import RecentRecords from "@/components/record/RecentRecords";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <header className="sticky top-0 z-10 bg-white px-4 py-4 shadow-sm">
        <h1 className="text-xl font-bold">모아보다</h1>
      </header>

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
