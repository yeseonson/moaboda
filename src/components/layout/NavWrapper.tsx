"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const HIDDEN_PATHS = ["/login", "/auth"];

export default function NavWrapper() {
  const pathname = usePathname();
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (hidden) return null;
  return <BottomNav />;
}
