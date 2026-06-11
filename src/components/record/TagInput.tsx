"use client";

import { KeyboardEvent, useState } from "react";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export default function TagInput({ value, onChange, placeholder, suggestions = [] }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = input.trim()
    ? suggestions.filter(
        (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
      )
    : [];

  const add = (tag = input.trim()) => {
    if (!tag || value.includes(tag)) { setInput(""); return; }
    onChange([...value, tag]);
    setInput("");
    setOpen(false);
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !input && value.length > 0) onChange(value.slice(0, -1));
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex min-h-[46px] w-full flex-wrap gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 focus-within:border-zinc-400">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="text-zinc-400 hover:text-zinc-700">×</button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onBlur={() => { add(); setOpen(false); }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-100 bg-white shadow-lg overflow-hidden">
          {filtered.slice(0, 8).map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); add(s); }}
                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
