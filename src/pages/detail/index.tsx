import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { storage } from '../../utils/storage';
import { getMovieDetail, getMoviesFromTMDB } from '../../data/movies';
import { Movie } from '../../types/movie';
import { useAppStore } from '../../store/useAppStore';

import { generateAIReview, getReviewStyles } from '../../services/aiReview';
import styles from './index.module.scss';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const { updateUserPreference } = useAppStore();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [aiReview, setAiReview] = useState('');
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [userReview, setUserReview] = useState('');

  // 加载影视详情
  useEffect(() => {
    const movieId = router.params.id;
    console.log('[DetailPage] Loading movie detail, id:', movieId);
    loadMovieDetail(movieId);
  }, [router.params.id]);

  // 加载影视详情数据
  const loadMovieDetail = async (movieId?: string) => {
    if (!movieId) {
      console.error('[DetailPage] No movie id provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 从TMDB数据中查找影视
      const foundMovie = await getMovieDetail(movieId);
      if (foundMovie) {
        setMovie(foundMovie);
        
        // 检查是否已收藏
        const favorites = storage.get<string[]>('favoriteMovies', []) || [];
        setIsFavorite(favorites.includes(movieId));
        
        // 加载相关推荐（相同标签的影视）
        const allMovies = await getMoviesFromTMDB();
        const related = allMovies
          .filter(m => 
            m.id !== movieId && 
            m.tags.some(tag => foundMovie.tags.includes(tag))
          )
          .slice(0, 5);
        setRelatedMovies(related);
        
        console.log('[DetailPage] Movie loaded:', foundMovie.title);
      } else {
        console.error('[DetailPage] Movie not found:', movieId);
        Taro.showToast({
          title: '影视不存在',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[DetailPage] Load movie detail failed:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack();
  };

  // 收藏/取消收藏
  const handleFavorite = () => {
    if (!movie) return;

    try {
      const favorites = storage.get<string[]>('favoriteMovies', []) || [];
      let newFavorites: string[];

      if (isFavorite) {
        newFavorites = favorites.filter(id => id !== movie.id);
        setIsFavorite(false);
        Taro.showToast({
          title: '已取消收藏',
          icon: 'success'
        });
      } else {
        newFavorites = [...(favorites || []), movie.id];
        setIsFavorite(true);
        Taro.showToast({
          title: '收藏成功',
          icon: 'success'
        });
      }

      storage.set('favoriteMovies', newFavorites);
      updateUserPreference({ favoriteMovies: newFavorites });
      
      console.log('[DetailPage] Favorite updated:', movie.id, isFavorite);
    } catch (error) {
      console.error('[DetailPage] Update favorite failed:', error);
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  };

  // 分享
  const handleShare = () => {
    if (!movie) return;

    Taro.showShareMenu({
      withShareTicket: true
    });

    Taro.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    });
  };

  // 展开/收起剧情简介
  const toggleDescription = () => {
    setDescriptionExpanded(!descriptionExpanded);
  };

  // 生成AI影评
  const handleGenerateAIReview = async () => {
    if (!movie) return;

    setAiReviewLoading(true);
    Taro.showLoading({ title: '生成中...' });

    try {
      const result = await generateAIReview(movie.title, selectedStyle);
      if (result.success) {
        setAiReview(result.review);
        Taro.showToast({
          title: '生成成功',
          icon: 'success'
        });
      } else {
        Taro.showToast({
          title: result.error || '生成失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[DetailPage] Generate AI review failed:', error);
      Taro.showToast({
        title: '生成失败',
        icon: 'none'
      });
    } finally {
      setAiReviewLoading(false);
      Taro.hideLoading();
    }
  };

  // 根据用户输入生成个性化影评
  const handleGenerateFromUserReview = async () => {
    if (!movie || !userReview.trim()) {
      Taro.showToast({
        title: '请输入您的观后感',
        icon: 'none'
      });
      return;
    }

    setAiReviewLoading(true);
    Taro.showLoading({ title: '生成中...' });

    try {
      // 使用用户输入作为上下文生成影评
      const prompt = `${userReview}。请基于以上观后感，用有趣的风格为电影"${movie.title}"生成一段影评，控制在100字以内，直接输出影评内容。`;
      const result = await generateAIReview(movie.title + ' ' + prompt, selectedStyle);
      
      if (result.success) {
        setAiReview(result.review);
        Taro.showToast({
          title: '生成成功',
          icon: 'success'
        });
      } else {
        Taro.showToast({
          title: result.error || '生成失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[DetailPage] Generate from user review failed:', error);
      Taro.showToast({
        title: '生成失败',
        icon: 'none'
      });
    } finally {
      setAiReviewLoading(false);
      Taro.hideLoading();
    }
  };

  // 点击相关影视
  const handleRelatedMovieClick = (relatedMovie: Movie) => {
    console.log('[DetailPage] Related movie clicked:', relatedMovie.id);
    Taro.redirectTo({
      url: `/pages/detail/index?id=${relatedMovie.id}`
    });
  };

  // 加载状态
  if (loading) {
    return (
      <View className={styles.loading}>
        <Text>加载中...</Text>
      </View>
    );
  }

  // 错误状态
  if (!movie) {
    return (
      <View className={styles.error}>
        <Text className={styles.errorIcon}>🎬</Text>
        <Text className={styles.errorText}>影视信息加载失败</Text>
        <Button className={styles.retryButton} onClick={() => handleBack()}>
          返回
        </Button>
      </View>
    );
  }

  return (
    <View className={styles.detailPage}>
      <ScrollView scrollY>
        {/* 海报区域 */}
        <View className={styles.posterSection}>
          <Image className={styles.poster} src={movie.poster} mode="aspectFill" />
          <View className={styles.posterOverlay}>
            <View className={styles.movieInfo}>
              <Text className={styles.title}>{movie.title}</Text>
              <View className={styles.meta}>
                <Text className={styles.rating}>{movie.rating.toFixed(1)}</Text>
                <Text className={styles.year}>{movie.year}</Text>
                <Text className={styles.duration}>{movie.duration}</Text>
              </View>
              <View className={styles.tags}>
                {movie.tags.map((tag, index) => (
                  <View key={index} className={styles.tag}>
                    <Text className={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View className={styles.backButton} onClick={handleBack}>
            ←
          </View>
        </View>

        {/* 内容区域 */}
        <View className={styles.contentSection}>
          {/* 基本信息 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📋</Text>
              基本信息
            </Text>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>导演：</Text>
              <Text className={styles.infoValue}>{movie.director}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>主演：</Text>
              <Text className={styles.infoValue}>{movie.actors.join('、')}</Text>
            </View>
          </View>

          {/* 剧情简介 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📖</Text>
              剧情简介
            </Text>
            <Text className={styles.description}>
              {descriptionExpanded ? movie.description : `${movie.description.substring(0, 100)}...`}
            </Text>
            {movie.description.length > 100 && (
              <Text className={styles.expandButton} onClick={toggleDescription}>
                {descriptionExpanded ? '收起' : '展开更多'}
              </Text>
            )}
          </View>

          {/* AI趣味影评 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🤖</Text>
              AI趣味影评
            </Text>
            
            {/* 风格选择 */}
            <View className={styles.styleSelector}>
              <Text className={styles.styleLabel}>选择风格：</Text>
              <ScrollView className={styles.styleList} scrollX>
                {getReviewStyles().map(style => (
                  <View
                    key={style.key}
                    className={`${styles.styleItem} ${selectedStyle === style.key ? styles.styleItemActive : ''}`}
                    onClick={() => setSelectedStyle(style.key)}
                  >
                    <Text>{style.emoji}</Text>
                    <Text className={styles.styleName}>{style.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 一键生成AI影评 */}
            <Button
              className={styles.generateButton}
              onClick={handleGenerateAIReview}
              loading={aiReviewLoading}
            >
              <Text>✨ 一键生成AI影评</Text>
            </Button>

            {/* 用户输入观后感 */}
            <View className={styles.userReviewSection}>
              <Text className={styles.userReviewLabel}>或者输入你的观后感：</Text>
              <Input
                className={styles.userReviewInput}
                placeholder="分享你对这部电影的看法..."
                value={userReview}
                onInput={(e) => setUserReview(e.detail.value)}
                maxlength={200}
              />
              <Button
                className={styles.generateFromUserButton}
                onClick={handleGenerateFromUserReview}
                loading={aiReviewLoading}
              >
                <Text>基于我的感受生成</Text>
              </Button>
            </View>

            {/* AI生成的影评展示 */}
            {aiReview && (
              <View className={styles.aiReviewCard}>
                <View className={styles.aiReviewBadge}>
                  <Text>✨ AI生成</Text>
                </View>
                <Text className={styles.aiReviewContent}>{aiReview}</Text>
              </View>
            )}
          </View>

          {/* 相关推荐 */}
          {relatedMovies.length > 0 && (
            <View className={styles.relatedSection}>
              <Text className={styles.relatedTitle}>相关推荐</Text>
              <View className={styles.relatedMovies}>
                {relatedMovies.map(relatedMovie => (
                  <View
                    key={relatedMovie.id}
                    className={styles.relatedMovieCard}
                    onClick={() => handleRelatedMovieClick(relatedMovie)}
                  >
                    <Image
                      className={styles.relatedPoster}
                      src={relatedMovie.poster}
                      mode="aspectFill"
                    />
                    <Text className={styles.relatedTitle}>{relatedMovie.title}</Text>
                    <Text className={styles.relatedRating}>{relatedMovie.rating.toFixed(1)}分</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className={styles.bottomBar}>
        <Button
          className={`${styles.actionButton} ${styles.secondaryButton}`}
          onClick={handleShare}
        >
          <Text className={styles.buttonIcon}>📤</Text>
          <Text>分享</Text>
        </Button>
        <Button
          className={`${styles.actionButton} ${isFavorite ? styles.secondaryButton : styles.primaryButton}`}
          onClick={handleFavorite}
        >
          <Text className={styles.buttonIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          <Text>{isFavorite ? '已收藏' : '收藏'}</Text>
        </Button>
      </View>
    </View>
  );
};

export default DetailPage;