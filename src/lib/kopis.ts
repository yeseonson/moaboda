/**
 * KOPIS(공연예술통합전산망) 오픈API 클라이언트.
 * 응답이 XML 이라 필요한 필드만 뽑아 쓴다. 스키마가 평평해서 정규식으로 충분하다.
 */

const KOPIS_BASE = "http://www.kopis.or.kr/openApi/restful/pblprfr";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function unwrap(raw: string): string | null {
  const value = raw
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m])
    .trim();
  return value === "" ? null : value;
}

/** <name>…</name> 의 첫 값. 없으면 null. */
export function tag(xml: string, name: string): string | null {
  // s 플래그로 개행까지 매칭 (문자 클래스 이스케이프를 쓰지 않는다)
  const match = xml.match(new RegExp(`<${name}>(.*?)</${name}>`, "s"));
  return match ? unwrap(match[1]) : null;
}

/** 목록 응답의 <db> 블록들 */
export function rows(xml: string): string[] {
  return xml.match(/<db>[\s\S]*?<\/db>/g) ?? [];
}

/** "김유정, 박보검" → ["김유정", "박보검"] */
export function splitCast(value: string | null): string[] | null {
  if (!value) return null;
  const names = value
    .split(",")
    // KOPIS 는 명단이 더 있을 때 마지막 이름 뒤에 "등" 을 붙인다 ("한보라 등").
    // 이름의 일부가 아니므로 떼어낸다. 단독으로 온 "등" 도 버린다.
    .map((n) => n.trim().replace(/\s+등$/, "").trim())
    .filter((n) => n && n !== "등");
  return names.length > 0 ? names : null;
}

/** KOPIS 러닝타임 "2시간 30분" -> 150. 분 단위 숫자만 돌려준다. */
export function runtimeMinutes(raw: string | null): string | null {
  if (!raw) return null;
  // 숫자만 뽑는다. 문자 클래스로 처리해 이스케이프를 쓰지 않는다.
  const nums = raw.split(/[^0-9]+/).filter(Boolean).map(Number);
  if (nums.length === 0) return null;
  const total = raw.includes("시간") ? nums[0] * 60 + (nums[1] ?? 0) : nums[0];
  return total > 0 ? String(total) : null;
}

function yyyymmdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/** KOPIS 는 기간이 필수라 넉넉히 앞뒤 2년을 잡는다. */
export function defaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  return { stdate: yyyymmdd(from), eddate: yyyymmdd(to) };
}

/** KOPIS 호출. 키가 없으면 호출 전에 막는다. */
export async function fetchKopis(path: string, params: Record<string, string>): Promise<string> {
  const key = process.env.KOPIS_API_KEY;
  if (!key) throw new Error("KOPIS_API_KEY_MISSING");

  const url = new URL(`${KOPIS_BASE}${path}`);
  url.searchParams.set("service", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`KOPIS ${res.status}`);
  return res.text();
}
