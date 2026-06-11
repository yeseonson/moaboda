export type CategoryType = "movie" | "performance" | "exhibition" | "book";
export type SubCategoryType = "musical" | "play" | "concert" | "etc";

export interface PerformanceDetail {
  record_id: string;
  venue: string | null;
  cast: string[] | null;
  seat: string | null;
  show_number: number | null;
  show_time: string | null;
  duration: string | null;
  period_start: string | null;
  period_end: string | null;
  kopis_id: string | null;
}

export interface MovieDetail {
  record_id: string;
  tmdb_id: number | null;
  genres: string[] | null;
}

export interface BookDetail {
  record_id: string;
  isbn: string | null;
  author: string | null;
  publisher: string | null;
  genre: string | null;
}

export interface CulturalRecord {
  id: string;
  user_id: string;
  category: CategoryType;
  sub_category: SubCategoryType | null;
  title: string;
  view_date: string;
  rating: number | null;
  review: string | null;
  poster_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  performances: PerformanceDetail | null;
  movies: MovieDetail | null;
  books: BookDetail | null;
}

export const CATEGORY_LABEL: Record<CategoryType, string> = {
  movie: "영화",
  performance: "공연",
  exhibition: "전시",
  book: "책",
};

export const SUB_CATEGORY_LABEL: Record<SubCategoryType, string> = {
  musical: "뮤지컬",
  play: "연극",
  concert: "콘서트",
  etc: "기타",
};

export const SUB_CATEGORY_COLOR: Record<SubCategoryType, string> = {
  musical: "bg-yellow-100 text-yellow-800",
  play: "bg-purple-100 text-purple-800",
  concert: "bg-orange-100 text-orange-800",
  etc: "bg-gray-100 text-gray-700",
};
