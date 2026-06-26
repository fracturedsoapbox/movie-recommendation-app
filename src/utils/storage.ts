// 本地存储工具
import Taro from '@tarojs/taro';

const STORAGE_PREFIX = 'movie_app_';

export const storage = {
  // 设置数据
  set(key: string, value: any): void {
    try {
      Taro.setStorageSync(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error('[Storage] Set data failed:', error);
    }
  },

  // 获取数据
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const data = Taro.getStorageSync(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue || null;
    } catch (error) {
      console.error('[Storage] Get data failed:', error);
      return defaultValue || null;
    }
  },

  // 删除数据
  remove(key: string): void {
    try {
      Taro.removeStorageSync(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('[Storage] Remove data failed:', error);
    }
  },

  // 清空所有数据
  clear(): void {
    try {
      Taro.clearStorageSync();
    } catch (error) {
      console.error('[Storage] Clear data failed:', error);
    }
  }
};