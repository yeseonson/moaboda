"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "⊞" },
  { href: "/calendar", label: "캘린더", icon: "◻" },
  { href: "/add", label: "기록", icon: "+" },
  { href: "/profile", label: "통계", icon: "○" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-100 bg-white">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive ? "text-zinc-900 font-medium" : "text-zinc-400"
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
