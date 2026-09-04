export type CategoryType = "movie" | "performance" | "book";
export type SubCategoryType = "musical" | "play" | "concert" | "etc";
export type StatusType = "want" | "in_progress" | "done" | "planned";

export const STATUS_LABEL: Record<StatusType, string> = {
  want: "보고 싶어요",
  in_progress: "보는 중",
  planned: "관람 예정",
  done: "봤어요",
};

export const STATUS_COLOR: Record<StatusType, string> = {
  want: "bg-cat-book/12 text-cat-book",
  in_progress: "bg-cat-movie/12 text-cat-movie",
  planned: "bg-brass/12 text-brass",
  done: "bg-brand-soft text-ink-muted",
};

// ── Works (정규화된 작품 정보) ────────────────────────────────

export interface MovieWork {
  id: string;
  tmdb_id: number | null;
  title: string;
  poster_url: string | null;
  genres: string[] | null;
  cast: string[] | null;
}

export interface BookWork {
  id: string;
  isbn: string | null;
  title: string;
  poster_url: string | null;
  author: string | null;
  publisher: string | null;
  genre: string | null;
}

export interface PerformanceWork {
  id: string;
  kopis_id: string | null;
  title: string;
  poster_url: string | null;
  venue: string | null;
  cast: string[] | null;
  duration: string | null;
  period_start: string | null;
  period_end: string | null;
}

// ── CulturalRecord ────────────────────────────────────────────

export interface CulturalRecord {
  id: string;
  user_id: string;
  category: CategoryType;
  sub_category: SubCategoryType | null;
  movie_id: string | null;
  book_id: string | null;
  performance_id: string | null;
  title: string;
  poster_url: string | null;
  view_start: string | null;
  view_end: string | null;
  status: StatusType;
  rating: number | null;
  review: string | null;
  // 관람별 정보 (records 테이블)
  show_time: string | null;
  seat: string | null;
  show_number: number | null;
  cast: string[] | null;       // 그날 실제로 본 배우 (공연 전체 출연진은 performances.cast)
  venue: string | null;        // 영화관 (영화)
  read_count: number | null;   // 책 회독수
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // 조인된 작품 정보
  movies: MovieWork | null;
  books: BookWork | null;
  performances: PerformanceWork | null;
}

/** 캘린더/정렬에 사용할 대표 날짜: 책은 완독일, 나머지는 관람일 */
export function recordDate(r: CulturalRecord): string | null {
  return r.view_end ?? r.view_start;
}

/** 표시·집계용 출연진: 그날 본 배우가 기록돼 있으면 그걸, 없으면 공연 전체 출연진 */
export function recordCast(r: CulturalRecord): string[] {
  return r.cast ?? r.performances?.cast ?? [];
}

export const CATEGORY_LABEL: Record<CategoryType, string> = {
  movie: "영화",
  performance: "공연",
  book: "책",
};

export const SUB_CATEGORY_LABEL: Record<SubCategoryType, string> = {
  musical: "뮤지컬",
  play: "연극",
  concert: "콘서트",
  etc: "기타",
};

export const SUB_CATEGORY_COLOR: Record<SubCategoryType, string> = {
  musical: "bg-brass/12 text-brass",
  play: "bg-cat-performance/12 text-cat-performance",
  concert: "bg-cat-movie/12 text-cat-movie",
  etc: "bg-brand-soft text-ink-muted",
};

// 하위 호환 alias (기존 코드에서 MovieDetail 등으로 참조하는 경우)
export type MovieDetail = MovieWork;
export type BookDetail = BookWork;
export type PerformanceDetail = PerformanceWork;
