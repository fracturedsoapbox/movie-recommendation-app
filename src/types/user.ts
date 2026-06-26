// 用户相关类型定义

export interface UserPreference {
  selectedTags: string[];
  favoriteMovies: string[];
  viewHistory: string[];
}

export interface UserSettings {
  notifications: boolean;
  autoPlay: boolean;
}