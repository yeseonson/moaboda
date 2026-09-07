/**
 * Supabase(PostgrestError)는 Error 를 상속하지 않아 console.error 로 찍으면
 * `{}` 로만 보이는 경우가 있다. 사람이 읽을 수 있는 한 줄로 바꾼다.
 */
export function describeError(err: unknown): string {
  if (!err) return "알 수 없는 오류";
  if (typeof err === "string") return err;

  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.details, e.hint]
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    const code = typeof e.code === "string" ? ` (${e.code})` : "";
    if (parts.length) return parts.join(" · ") + code;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
