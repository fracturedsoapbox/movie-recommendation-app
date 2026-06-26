// 格式化工具

// 格式化评分（保留一位小数）
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

// 格式化影视时长
export const formatDuration = (duration: string): string => {
  return duration;
};

// 截断文本（多行）
export const truncateText = (text: string, maxLines: number = 2): string => {
  if (!text) return '';
  const maxLength = maxLines * 30; // 假设每行30个字符
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};