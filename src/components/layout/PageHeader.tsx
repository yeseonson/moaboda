"use client";

import LogoutButton from "./LogoutButton";

export default function PageHeader() {
  return (
    <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm flex items-center justify-between">
      {/* 가로 락업 최소 폭 88px — h-7 기준 약 100px */}
      <img src="/assets/logo-horizontal-green.svg" alt="모아보다" className="h-7 w-auto" />
      <LogoutButton />
    </header>
  );
}
