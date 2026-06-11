"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/login", "/auth", "/add", "/edit"];

export default function FloatingAddButton() {
  const pathname = usePathname();
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p)) || pathname.includes("/edit");
  if (hidden) return null;

  return (
    <Link
      href="/add"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-lg transition hover:bg-zinc-700 active:scale-95"
    >
      +
    </Link>
  );
}
