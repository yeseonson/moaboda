"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const HIDDEN_PATHS = ["/login", "/auth", "/edit"];

const ITEMS = [
  { href: "/add/performance", label: "공연", emoji: "🎭" },
  { href: "/add/movie", label: "영화", emoji: "🎬" },
  { href: "/add/book", label: "책", emoji: "📚" },
];

export default function FloatingAddButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/add";
  if (hidden || !loggedIn) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col items-end gap-2 pb-1">
            {ITEMS.map(({ href, label, emoji }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-md transition hover:bg-zinc-50 active:scale-95"
              >
                <span className="text-sm font-medium text-zinc-800">{label}</span>
                <span className="text-lg leading-none">{emoji}</span>
              </Link>
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-hover active:scale-95"
          aria-label="기록 추가"
        >
          <span
            className="text-2xl leading-none transition-transform duration-200"
            style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            +
          </span>
        </button>
      </div>
    </>
  );
}
