import { createClient } from "@/lib/supabase/client";
import { withDerivedStatus, type CulturalRecord, type PerformanceWork } from "@/types/record";

/** records + 조인된 작품 정보 (CulturalRecord 와 동일한 모양) */
const RECORD_SELECT = "*, movies(*), books(*), performances(*)";

type WorkKind = "movie" | "book" | "performance";

/** 작품(works) 테이블 메타: records 의 FK 컬럼과 중복 판별용 자연키 */
const WORK_META: Record<WorkKind, { table: string; fk: string; key: string }> = {
  movie: { table: "movies", fk: "movie_id", key: "tmdb_id" },
  book: { table: "books", fk: "book_id", key: "isbn" },
  performance: { table: "performances", fk: "performance_id", key: "kopis_id" },
};

type Json = Record<string, unknown>;
type SupabaseClient = ReturnType<typeof createClient>;

/** 폼에서 올라오는 payload: records 평면 필드 + 작품 정보 중첩 객체 */
type WritePayload = Json & {
  movie?: Json;
  book?: Json;
  performance?: Json;
};

/** undefined 만 걸러낸다. null 은 "값을 비운다"는 의도라 살려둔다. */
function defined(obj: Json): Json {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** 기존 작품 행을 덮어쓸 때는 실제 값이 있는 필드만 반영한다.
 *  (폼이 장르를 안 보냈다고 이미 저장된 장르를 지우면 안 되므로) */
function present(obj: Json): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
}

async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("로그인이 필요합니다.");
  return data.user.id;
}

/**
 * 작품 정보를 works 테이블에 반영하고 그 id 를 돌려준다.
 * 자연키(tmdb_id/isbn/kopis_id)의 unique 제약에 기대어 upsert 한 번으로 처리한다.
 * 조회 없이 넣으므로 같은 작품이 동시에 두 번 저장돼도 카탈로그가 갈라지지 않는다.
 */
async function resolveWorkId(
  supabase: SupabaseClient,
  kind: WorkKind,
  work: Json,
  fallback: { title: unknown; poster_url: unknown }
): Promise<string> {
  const { table, key } = WORK_META[kind];
  // 값이 있는 필드만 보낸다. 폼이 장르를 안 보냈다고 기존 장르가 지워지면 안 되므로.
  const payload = present({
    title: fallback.title,
    poster_url: fallback.poster_url,
    ...work,
  });

  // 자연키가 없으면 충돌 대상이 없으니 그냥 새로 만든다 (KOPIS 미등록 공연 등).
  const query =
    payload[key] === undefined
      ? supabase.from(table).insert(payload)
      : supabase.from(table).upsert(payload, { onConflict: key });

  const { data, error } = await query.select("id").single();
  if (error) throw error;
  return data.id as string;
}

/** 이미 연결된 작품 행이 있으면 그 행을 수정하고, 없으면 새로 만든다. */
async function patchWork(
  supabase: SupabaseClient,
  kind: WorkKind,
  work: Json,
  currentId: string | null,
  fallback: { title: unknown; poster_url: unknown }
): Promise<string> {
  if (!currentId) return resolveWorkId(supabase, kind, work, fallback);

  const patch = present(work);
  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from(WORK_META[kind].table).update(patch).eq("id", currentId);
    if (error) throw error;
  }
  return currentId;
}

/**
 * payload 를 records 컬럼과 작품별 중첩 객체로 가른다.
 * read_count 는 폼이 book 안에 넣어 보내지만 실제로는 records 의 컬럼이라 끌어올린다.
 */
function splitPayload(body: WritePayload) {
  const { movie, book, performance, ...record } = body;
  const works: Partial<Record<WorkKind, Json>> = {};

  if (movie) works.movie = { ...movie };
  if (performance) works.performance = { ...performance };
  if (book) {
    const bookWork = { ...book };
    if ("read_count" in bookWork) {
      record.read_count = bookWork.read_count;
      delete bookWork.read_count;
    }
    works.book = bookWork;
  }

  return { record: record as Json, works };
}

export const api = {
  records: {
    async list(params?: { category?: string; sub_category?: string }): Promise<CulturalRecord[]> {
      const supabase = createClient();
      const userId = await requireUserId(supabase);

      let query = supabase
        .from("records")
        .select(RECORD_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (params?.category) query = query.eq("category", params.category);
      if (params?.sub_category) query = query.eq("sub_category", params.sub_category);

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as unknown as CulturalRecord[]).map(withDerivedStatus);
    },

    async get(id: string): Promise<CulturalRecord> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("records")
        .select(RECORD_SELECT)
        .eq("id", id)
        .single();
      if (error) throw error;
      return withDerivedStatus(data as unknown as CulturalRecord);
    },

    async create(body: WritePayload): Promise<CulturalRecord> {
      const supabase = createClient();
      const userId = await requireUserId(supabase);
      const { record, works } = splitPayload(body);
      const fallback = { title: record.title, poster_url: record.poster_url };

      for (const kind of Object.keys(works) as WorkKind[]) {
        record[WORK_META[kind].fk] = await resolveWorkId(supabase, kind, works[kind]!, fallback);
      }

      const { data, error } = await supabase
        .from("records")
        .insert({ ...defined(record), user_id: userId })
        .select(RECORD_SELECT)
        .single();
      if (error) throw error;
      return withDerivedStatus(data as unknown as CulturalRecord);
    },

    async update(id: string, body: WritePayload): Promise<CulturalRecord> {
      const supabase = createClient();
      const { record, works } = splitPayload(body);
      const kinds = Object.keys(works) as WorkKind[];

      if (kinds.length > 0) {
        const { data: current, error } = await supabase
          .from("records")
          .select("movie_id, book_id, performance_id, title, poster_url")
          .eq("id", id)
          .single();
        if (error) throw error;

        const fallback = {
          title: record.title ?? current.title,
          poster_url: record.poster_url ?? current.poster_url,
        };

        for (const kind of kinds) {
          const { fk } = WORK_META[kind];
          record[fk] = await patchWork(
            supabase,
            kind,
            works[kind]!,
            current[fk as keyof typeof current] as string | null,
            fallback
          );
        }
      }

      const { data, error } = await supabase
        .from("records")
        .update(defined(record))
        .eq("id", id)
        .select(RECORD_SELECT)
        .single();
      if (error) throw error;
      return withDerivedStatus(data as unknown as CulturalRecord);
    },

    async delete(id: string): Promise<null> {
      const supabase = createClient();
      const { error } = await supabase.from("records").delete().eq("id", id);
      if (error) throw error;
      return null;
    },
  },

  performances: {
    /**
     * 이미 기록한 적 있는 공연이면 카탈로그에 저장된 극장·러닝타임을 돌려준다.
     * 한 번 고쳐둔 값이 다음 기록에도 그대로 쓰이도록 하기 위한 것.
     */
    async byKopisId(kopisId: string): Promise<PerformanceWork | null> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("performances")
        .select("*")
        .eq("kopis_id", kopisId)
        .maybeSingle();
      if (error) throw error;
      return (data as PerformanceWork | null) ?? null;
    },
  },

  /** KOPIS 는 키를 노출하면 안 되므로 자체 Route Handler 를 거친다. */
  search: {
    performances: (q: string) => getJson(`/api/search/performances?q=${encodeURIComponent(q)}`),
    performanceDetail: (kopisId: string) =>
      getJson(`/api/search/performances/${encodeURIComponent(kopisId)}`),
  },
};

async function getJson(path: string) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
