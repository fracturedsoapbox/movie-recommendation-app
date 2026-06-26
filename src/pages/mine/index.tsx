import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '../../store/useAppStore';
import { storage } from '../../utils/storage';
import { getMoviesFromTMDB } from '../../data/movies';
import { Movie } from '../../types/movie';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { userPreference, updateUserPreference } = useAppStore();
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [viewHistory, setViewHistory] = useState<Movie[]>([]);
  const [stats, setStats] = useState({
    favoriteCount: 0,
    historyCount: 0,
    tagCount: 0
  });

  // 加载用户数据
  useEffect(() => {
    loadUserData();
  }, []);

  // 监听用户偏好变化
  useEffect(() => {
    setStats({
      favoriteCount: userPreference.favoriteMovies.length,
      historyCount: userPreference.viewHistory.length,
      tagCount: userPreference.selectedTags.length
    });
  }, [userPreference]);

  const loadUserData = async () => {
    console.log('[MinePage] Loading user data');
    
    // 加载所有电影数据
    const allMovies = await getMoviesFromTMDB();
    
    // 加载收藏列表
    const favoriteIds = storage.get<string[]>('favoriteMovies', []) || [];
    const favorites = allMovies.filter(movie => favoriteIds.includes(movie.id));
    setFavoriteMovies(favorites);

    // 加载浏览历史
    const historyIds = storage.get<string[]>('viewHistory', []) || [];
    const history = allMovies.filter(movie => historyIds.includes(movie.id));
    setViewHistory(history);

    console.log('[MinePage] User data loaded:', {
      favorites: favorites.length,
      history: history.length
    });
  };

  // 下拉刷新
  const onPullDownRefresh = () => {
    console.log('[MinePage] Pull down refresh');
    loadUserData();
    Taro.stopPullDownRefresh();
  };

  // 菜单项点击处理
  const handleMenuClick = (type: string) => {
    console.log('[MinePage] Menu clicked:', type);
    
    switch (type) {
      case 'favorite':
        if (favoriteMovies.length === 0) {
          Taro.showToast({
            title: '暂无收藏',
            icon: 'none'
          });
          return;
        }
        // 跳转到收藏列表页面（可以用弹窗展示）
        showMovieList('我的收藏', favoriteMovies);
        break;
      case 'history':
        if (viewHistory.length === 0) {
          Taro.showToast({
            title: '暂无浏览记录',
            icon: 'none'
          });
          return;
        }
        // 跳转到历史记录页面（可以用弹窗展示）
        showMovieList('浏览历史', viewHistory);
        break;
      case 'tags':
        Taro.switchTab({
          url: '/pages/tags/index'
        });
        break;
      case 'settings':
        Taro.showToast({
          title: '设置功能开发中',
          icon: 'none'
        });
        break;
      case 'about':
        Taro.showModal({
          title: '关于我们',
          content: '基于标签匹配的高分影视推荐+AI趣味影评小程序\n版本：1.0.0\n\n本小程序为您提供个性化的影视推荐服务，结合AI技术生成趣味影评，让您的观影体验更加丰富。',
          showCancel: false
        });
        break;
    }
  };

  // 显示影视列表弹窗
  const showMovieList = (title: string, movies: Movie[]) => {
    const movieNames = movies.map(m => `• ${m.title} (${m.rating}分)`).join('\n');
    Taro.showModal({
      title: `${title} (${movies.length}部)`,
      content: movieNames,
      showCancel: false,
      confirmText: '关闭'
    });
  };

  // 清空浏览历史
  const handleClearHistory = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有浏览记录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.set('viewHistory', []);
          updateUserPreference({ viewHistory: [] });
          setViewHistory([]);
          Taro.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  };

  return (
    <ScrollView className={styles.minePage} scrollY onScrollToLower={onPullDownRefresh}>
      {/* 用户信息卡片 */}
      <View className={styles.userInfoCard}>
        <View className={styles.avatar}>👤</View>
        <Text className={styles.nickname}>影视爱好者</Text>
        <Text className={styles.tagCount}>
          已选择 {userPreference.selectedTags.length} 个兴趣标签
        </Text>
      </View>

      {/* 统计信息 */}
      <View className={styles.statsSection}>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.favoriteCount}</Text>
          <Text className={styles.statLabel}>收藏</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.historyCount}</Text>
          <Text className={styles.statLabel}>历史</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.tagCount}</Text>
          <Text className={styles.statLabel}>标签</Text>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className={styles.menuSection}>
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={() => handleMenuClick('favorite')}>
            <View className={styles.menuLeft}>
              <View className={styles.menuIcon}>⭐</View>
              <Text className={styles.menuText}>我的收藏</Text>
            </View>
            <View className={styles.menuRight}>
              <Text className={styles.menuValue}>{stats.favoriteCount}部</Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>

          <View className={styles.menuItem} onClick={() => handleMenuClick('history')}>
            <View className={styles.menuLeft}>
              <View className={styles.menuIcon}>🕐</View>
              <Text className={styles.menuText}>浏览历史</Text>
            </View>
            <View className={styles.menuRight}>
              <Text className={styles.menuValue}>{stats.historyCount}部</Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>

          <View className={styles.menuItem} onClick={() => handleMenuClick('tags')}>
            <View className={styles.menuLeft}>
              <View className={styles.menuIcon}>🏷️</View>
              <Text className={styles.menuText}>标签管理</Text>
            </View>
            <View className={styles.menuRight}>
              <Text className={styles.menuValue}>{stats.tagCount}个</Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>

          <View className={styles.menuItem} onClick={handleClearHistory}>
            <View className={styles.menuLeft}>
              <View className={styles.menuIcon}>🗑️</View>
              <Text className={styles.menuText}>清空历史</Text>
            </View>
            <View className={styles.menuRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>

          <View className={styles.menuItem} onClick={() => handleMenuClick('settings')}>
            <View className={styles.menuLeft}>
              <View className={styles.menuIcon}>⚙️</View>
              <Text className={styles.menuText}>设置</Text>
            </View>
            <View className={styles.menuRight}>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 关于我们 */}
      <View className={styles.aboutSection} onClick={() => handleMenuClick('about')}>
        <Text className={styles.aboutTitle}>关于我们</Text>
        <Text className={styles.aboutVersion}>版本 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;