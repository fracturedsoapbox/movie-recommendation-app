// 标签Mock数据
import { Tag } from '../types/tag';

export const mockTags: Tag[] = [
  { id: '1', name: '科幻', count: 156 },
  { id: '2', name: '动作', count: 234 },
  { id: '3', name: '爱情', count: 189 },
  { id: '4', name: '喜剧', count: 178 },
  { id: '5', name: '悬疑', count: 145 },
  { id: '6', name: '剧情', count: 267 },
  { id: '7', name: '冒险', count: 134 },
  { id: '8', name: '动画', count: 123 },
  { id: '9', name: '恐怖', count: 89 },
  { id: '10', name: '战争', count: 67 },
  { id: '11', name: '犯罪', count: 98 },
  { id: '12', name: '历史', count: 76 },
  { id: '13', name: '音乐', count: 54 },
  { id: '14', name: '传记', count: 45 },
  { id: '15', name: '奇幻', count: 112 }
];

// 热门标签（按数量排序）
export const getPopularTags = (tags: Tag[], limit: number = 8): Tag[] => {
  return tags
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};