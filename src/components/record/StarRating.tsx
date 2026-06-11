"use client";

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value ? "text-yellow-400" : "text-zinc-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
