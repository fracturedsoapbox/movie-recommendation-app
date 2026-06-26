// 影视相关类型定义

export interface Movie {
  id: string;
  title: string;
  poster: string;
  rating: number;
  year: number;
  tags: string[];
  description: string;
  director: string;
  actors: string[];
  duration: string;
  review: string; // AI趣味影评
}

export interface MovieFilter {
  tags?: string[];
  keyword?: string;
  minRating?: number;
}

export interface MovieListResponse {
  list: Movie[];
  total: number;
  hasMore: boolean;
}