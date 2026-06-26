// 标签相关类型定义

export interface Tag {
  id: string;
  name: string;
  icon?: string;
  count: number; // 该标签下的影视数量
  isSelected?: boolean;
}

export type TagCategory = '热门' | '类型' | '风格' | '地区';