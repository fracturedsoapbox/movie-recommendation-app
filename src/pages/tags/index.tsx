import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '../../store/useAppStore';
import TagItem from '../../components/TagItem';
import { mockTags } from '../../data/tags';
import { Tag } from '../../types/tag';
import { storage } from '../../utils/storage';
import styles from './index.module.scss';

// 标签分类
const tagCategories = [
  { name: '热门', tags: ['动作', '剧情', '喜剧', '爱情', '科幻', '悬疑'] },
  { name: '情感', tags: ['爱情', '剧情', '传记', '音乐'] },
  { name: '冒险', tags: ['动作', '冒险', '奇幻', '科幻'] },
  { name: '惊悚', tags: ['悬疑', '恐怖', '犯罪', '惊悚'] },
  { name: '文艺', tags: ['剧情', '传记', '历史', '音乐'] },
  { name: '儿童', tags: ['动画', '家庭', '冒险'] },
];

const TagsPage: React.FC = () => {
  const { selectedTags, setSelectedTags } = useAppStore();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 初始化标签数据
  useEffect(() => {
    console.log('[TagsPage] Initializing, selectedTags:', selectedTags);
    setAllTags(mockTags);
    setLocalSelectedTags(selectedTags);
  }, [selectedTags]);

  // 标签点击处理
  const handleTagClick = (tagName: string) => {
    console.log('[TagsPage] Tag clicked:', tagName);
    const newTags = localSelectedTags.includes(tagName)
      ? localSelectedTags.filter(t => t !== tagName)
      : [...localSelectedTags, tagName];
    
    setLocalSelectedTags(newTags);
    setSelectedTags(newTags);
    
    // 保存到本地存储
    storage.set('selectedTags', newTags);
    
    // 震动反馈
    Taro.vibrateShort({
      type: 'light'
    });
  };

  // 清空所有标签
  const handleClearAll = () => {
    console.log('[TagsPage] Clear all tags');
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有已选标签吗？',
      success: (res) => {
        if (res.confirm) {
          setLocalSelectedTags([]);
          setSelectedTags([]);
          storage.set('selectedTags', []);
          Taro.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  };

  // 获取已选标签对象
  const getSelectedTagObjects = (): Tag[] => {
    return allTags.filter(tag => localSelectedTags.includes(tag.name));
  };

  // 筛选后的标签（支持搜索）
  const filteredTags = useMemo(() => {
    if (!searchKeyword) return allTags;
    const keyword = searchKeyword.toLowerCase();
    return allTags.filter(tag => tag.name.toLowerCase().includes(keyword));
  }, [allTags, searchKeyword]);

  // 按分类获取标签对象
  const getTagsByCategory = (categoryTags: string[]): Tag[] => {
    return allTags.filter(tag => categoryTags.includes(tag.name));
  };

  return (
    <View className={styles.tagsPage}>
      {/* 顶部区域 */}
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.title}>选择标签</Text>
          <Text className={styles.selectedCount}>
            已选 {localSelectedTags.length} 个
          </Text>
        </View>

        {/* 搜索框 */}
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索标签..."
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>

        {/* 已选标签区域 */}
        {localSelectedTags.length > 0 && (
          <View className={styles.selectedTagsSection}>
            <Text className={styles.sectionTitle}>已选标签</Text>
            <View className={styles.selectedTagsContainer}>
              <View className={styles.selectedTagsList}>
                {getSelectedTagObjects().map(tag => (
                  <TagItem
                    key={tag.id}
                    name={tag.name}
                    isSelected={true}
                    onClick={() => handleTagClick(tag.name)}
                  />
                ))}
                <View className={styles.clearButton} onClick={handleClearAll}>
                  <Text>清空全部</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 所有标签区域 */}
      <ScrollView className={styles.allTagsSection} scrollY>
        {/* 搜索结果模式 */}
        {searchKeyword && (
          <View className={styles.searchResults}>
            <Text className={styles.categoryTitle}>搜索结果</Text>
            <View className={styles.tagsGrid}>
              {filteredTags.map(tag => (
                <View
                  key={tag.id}
                  className={`${styles.tagCard} ${localSelectedTags.includes(tag.name) ? styles.selected : ''}`}
                  onClick={() => handleTagClick(tag.name)}
                >
                  {localSelectedTags.includes(tag.name) && (
                    <View className={styles.selectedBadge}>
                      <Text className={styles.badgeIcon}>✓</Text>
                    </View>
                  )}
                  <Text className={styles.tagName}>{tag.name}</Text>
                  <Text className={styles.tagCount}>{tag.count}部</Text>
                </View>
              ))}
            </View>
            {filteredTags.length === 0 && (
              <View className={styles.emptyHint}>
                <Text>未找到相关标签</Text>
              </View>
            )}
          </View>
        )}

        {/* 分类标签模式 */}
        {!searchKeyword && (
          tagCategories.map(category => (
            <View key={category.name} className={styles.categorySection}>
              <Text className={styles.categoryTitle}>{category.name}</Text>
              <View className={styles.tagsRow}>
                {getTagsByCategory(category.tags).map(tag => (
                  <TagItem
                    key={tag.id}
                    name={tag.name}
                    isSelected={localSelectedTags.includes(tag.name)}
                    onClick={() => handleTagClick(tag.name)}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {/* 全部标签展示 */}
        {!searchKeyword && (
          <View className={styles.allTagsGridSection}>
            <Text className={styles.categoryTitle}>全部标签</Text>
            <View className={styles.tagsGrid}>
              {allTags.map(tag => (
                <View
                  key={tag.id}
                  className={`${styles.tagCard} ${localSelectedTags.includes(tag.name) ? styles.selected : ''}`}
                  onClick={() => handleTagClick(tag.name)}
                >
                  {localSelectedTags.includes(tag.name) && (
                    <View className={styles.selectedBadge}>
                      <Text className={styles.badgeIcon}>✓</Text>
                    </View>
                  )}
                  <Text className={styles.tagName}>{tag.name}</Text>
                  <Text className={styles.tagCount}>{tag.count}部</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TagsPage;