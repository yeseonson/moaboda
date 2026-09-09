"use client";

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

/**
 * 반 단계(0.5)까지 받는 별점 입력.
 * 별 하나를 좌/우 두 영역으로 나눠 왼쪽은 x.5, 오른쪽은 x.0 을 준다.
 */
export default function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = value >= star;
          const half = !filled && value >= star - 0.5;
          return (
            <span key={star} className="relative inline-block text-2xl leading-none">
              {/* 배경(빈 별) */}
              <span className="text-zinc-200">★</span>

              {/* 채움: 꽉 찬 별이면 100%, 반이면 50% 만 덮는다 */}
              {(filled || half) && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden text-brass"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  ★
                </span>
              )}

              {/* 클릭 영역 — 왼쪽 절반 = x.5, 오른쪽 절반 = x.0 */}
              <button
                type="button"
                onClick={() => onChange(star - 0.5)}
                aria-label={`${star - 0.5}점`}
                className="absolute inset-y-0 left-0 w-1/2"
              />
              <button
                type="button"
                onClick={() => onChange(star)}
                aria-label={`${star}점`}
                className="absolute inset-y-0 right-0 w-1/2"
              />
            </span>
          );
        })}
      </div>

      {value > 0 && (
        <span className="text-sm font-medium text-ink-muted">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
