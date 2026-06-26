// 应用全局状态管理
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { UserPreference } from '../types/user';

interface AppContextType {
  userPreference: UserPreference;
  updateUserPreference: (preference: Partial<UserPreference>) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PREFERENCE: UserPreference = {
  selectedTags: [],
  favoriteMovies: [],
  viewHistory: []
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userPreference, setUserPreference] = useState<UserPreference>(DEFAULT_PREFERENCE);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 初始化：从本地存储加载用户偏好
  useEffect(() => {
    const savedPreference = storage.get<UserPreference>('userPreference', DEFAULT_PREFERENCE);
    if (savedPreference) {
      setUserPreference(savedPreference);
      setSelectedTags(savedPreference.selectedTags || []);
    }
  }, []);

  // 更新用户偏好
  const updateUserPreference = (preference: Partial<UserPreference>) => {
    const newPreference = { ...userPreference, ...preference };
    setUserPreference(newPreference);
    storage.set('userPreference', newPreference);
  };

  // 更新选中的标签
  const handleSetSelectedTags = (tags: string[]) => {
    setSelectedTags(tags);
    updateUserPreference({ selectedTags: tags });
  };

  return (
    <AppContext.Provider
      value={{
        userPreference,
        updateUserPreference,
        selectedTags,
        setSelectedTags: handleSetSelectedTags
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return context;
};