/** 평점을 도트 5개로. 0.5 단위는 반만 채운 도트로 표시한다. */
export default function RatingDots({
  value,
  size = 8,
  className = "",
}: {
  value: number | null;
  size?: number;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div
      className={`flex shrink-0 items-center ${className}`}
      style={{ gap: size / 2 }}
      aria-label={`평점 ${value}점`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(Math.max(value - i, 0), 1); // 1 = 꽉, 0.5 = 반, 0 = 빔
        return (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: size,
              height: size,
              background:
                fill === 0
                  ? "var(--color-line-strong)"
                  : fill === 1
                    ? "var(--color-brass)"
                    : "linear-gradient(90deg, var(--color-brass) 50%, var(--color-line-strong) 50%)",
            }}
          />
        );
      })}
    </div>
  );
}
