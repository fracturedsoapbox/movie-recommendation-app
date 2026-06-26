import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { Movie } from '../../types/movie';
import { formatRating } from '../../utils/format';
import styles from './index.module.scss';

interface MovieCardProps {
  movie: Movie;
  onClick?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(movie);
    }
  };

  return (
    <View className={styles.movieCard} onClick={handleClick}>
      <View className={styles.posterContainer}>
        <Image
          className={styles.poster}
          src={movie.poster}
          mode="aspectFill"
          lazyLoad
          onError={(e) => {
            console.error('[MovieCard] Image load failed:', movie.poster, e);
          }}
        />
        <View className={styles.ratingBadge}>
          <Text className={styles.ratingText}>{formatRating(movie.rating)}</Text>
        </View>
      </View>
      <View className={styles.content}>
        <Text className={styles.title}>{movie.title}</Text>
        <View className={styles.meta}>
          <Text className={styles.year}>{movie.year}</Text>
          <Text className={styles.duration}>{movie.duration}</Text>
        </View>
        <View className={styles.tags}>
          {movie.tags.slice(0, 2).map((tag, index) => (
            <View key={index} className={styles.tag}>
              <Text className={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default MovieCard;