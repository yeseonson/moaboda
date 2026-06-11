"use client";

import { SubCategoryType } from "@/types/record";

const OPTIONS: { value: SubCategoryType; label: string; emoji: string }[] = [
  { value: "musical", label: "뮤지컬", emoji: "🎭" },
  { value: "play", label: "연극", emoji: "🎬" },
  { value: "concert", label: "콘서트", emoji: "🎵" },
  { value: "etc", label: "기타", emoji: "✨" },
];

interface Props {
  onSelect: (v: SubCategoryType) => void;
}

export default function SubCategorySelect({ onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">어떤 공연인가요?</h2>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-6 text-sm font-medium transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            <span className="text-3xl">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
