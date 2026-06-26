import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '../../store/useAppStore';
import MovieCard from '../../components/MovieCard';
import TagItem from '../../components/TagItem';
import { Movie } from '../../types/movie';
import { mockTags, getPopularTags } from '../../data/tags';
import { Tag } from '../../types/tag';
import { getMoviesFromTMDB, getRecommendedByTags } from '../../data/movies';
import { storage } from '../../utils/storage';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { selectedTags, setSelectedTags } = useAppStore();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [popularTags] = useState(() => getPopularTags(mockTags, 8));

  // 加载影视列表
  const loadMovies = async (pageNum: number = 1, isRefresh: boolean = false) => {
    if (loading) return;

    try {
      setLoading(true);
      console.log('[HomePage] Loading movies, page:', pageNum, 'isRefresh:', isRefresh, 'activeTags:', activeTags);

      let movieList: Movie[];

      if (activeTags.length > 0) {
        // 有标签时使用标签匹配推荐算法
        movieList = await getRecommendedByTags(activeTags);
        console.log('[HomePage] 使用标签推荐, 数量:', movieList.length);
      } else {
        // 无标签时获取全部高分电影
        movieList = await getMoviesFromTMDB();
        console.log('[HomePage] 获取全部高分, 数量:', movieList.length);
      }

      // 关键词筛选
      if (keyword) {
        const kw = keyword.toLowerCase();
        movieList = movieList.filter(m =>
          m.title.toLowerCase().includes(kw) ||
          m.description.toLowerCase().includes(kw)
        );
      }

      // 评分筛选（≥7.5分）
      movieList = movieList.filter(m => m.rating >= 7.5);

      console.log('[HomePage] 筛选后电影数量:', movieList.length);

      // 分页处理（每页10条）
      const pageSize = 10;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedMovies = movieList.slice(startIndex, endIndex);

      if (isRefresh || pageNum === 1) {
        setMovies(pagedMovies);
      } else {
        setMovies((prev: Movie[]) => [...prev, ...pagedMovies]);
      }

      setHasMore(endIndex < movieList.length);
      setPage(pageNum);
    } catch (error) {
      console.error('[HomePage] Load movies failed:', error);
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
      // 停止下拉刷新
      if (isRefresh) {
        Taro.stopPullDownRefresh();
      }
    }
  };

  // 初始化加载
  useEffect(() => {
    console.log('[HomePage] Initializing, selectedTags:', selectedTags);
    setActiveTags(selectedTags);
    loadMovies(1, true);
  }, []);

  // 监听标签变化
  useEffect(() => {
    if (activeTags.length > 0 || keyword) {
      loadMovies(1, true);
    }
  }, [activeTags, keyword]);

  // 标签点击处理
  const handleTagClick = (tagName: string) => {
    console.log('[HomePage] Tag clicked:', tagName);
    const newTags = activeTags.includes(tagName)
      ? activeTags.filter((t: string) => t !== tagName)
      : [...activeTags, tagName];

    setActiveTags(newTags);
    setSelectedTags(newTags);

    // 保存到本地存储
    storage.set('selectedTags', newTags);
  };

  // 搜索输入处理
  const handleSearchInput = (e: any) => {
    const value = e.detail.value;
    setKeyword(value);
  };

  // 影视卡片点击处理
  const handleMovieClick = (movie: Movie) => {
    console.log('[HomePage] Movie clicked:', movie.id);

    // 保存到浏览历史
    const history = storage.get<string[]>('viewHistory', []) || [];
    const newHistory = [movie.id, ...history.filter((id: string) => id !== movie.id)].slice(0, 50);
    storage.set('viewHistory', newHistory);

    // 跳转到详情页
    Taro.navigateTo({
      url: `/pages/detail/index?id=${movie.id}`
    });
  };

  // 下拉刷新
  const onPullDownRefresh = () => {
    console.log('[HomePage] Pull down refresh');
    loadMovies(1, true);
  };

  // 上拉加载更多
  const onReachBottom = () => {
    console.log('[HomePage] Reach bottom, hasMore:', hasMore, 'loading:', loading);
    if (hasMore && !loading) {
      loadMovies(page + 1, false);
    }
  };

  return (
    <View className={styles.homePage}>
      {/* 顶部搜索和标签区域 */}
      <View className={styles.header}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索影视名称..."
            value={keyword}
            onInput={handleSearchInput}
          />
        </View>

        <View className={styles.tagsContainer}>
          <View className={styles.tagsList}>
            {popularTags.map((tag: Tag) => (
              <View key={tag.id} className={styles.tagItemWrapper}>
                <TagItem
                  name={tag.name}
                  isSelected={activeTags.includes(tag.name)}
                  onClick={() => handleTagClick(tag.name)}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView
        className={styles.content}
        scrollY
        onScrollToLower={onReachBottom}
        lowerThreshold={100}
        refresherEnabled={true}
        refresherTriggered={loading}
        onRefresherRefresh={onPullDownRefresh}
      >
        <View className={styles.movieList}>
          {movies.map((movie: Movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={handleMovieClick}
            />
          ))}
        </View>

        {/* 加载状态 */}
        {loading && (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        )}

        {/* 没有更多 */}
        {!hasMore && movies.length > 0 && (
          <View className={styles.noMore}>
            <Text>没有更多了</Text>
          </View>
        )}

        {/* 空状态 */}
        {!loading && movies.length === 0 && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🎬</Text>
            <Text className={styles.emptyText}>暂无推荐影视</Text>
            <Text className={styles.emptyHint}>试试选择其他标签或搜索关键词</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomePage;
