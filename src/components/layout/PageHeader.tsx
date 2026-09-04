"use client";

import LogoutButton from "./LogoutButton";

export default function PageHeader() {
  return (
    <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm flex items-center justify-between">
      <img src="/logo.png" alt="모아보다" className="h-6 object-contain" />
      <LogoutButton />
    </header>
  );
}
