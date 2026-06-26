import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface RatingStarProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
}

const RatingStar: React.FC<RatingStarProps> = ({ rating, size = 'medium' }) => {
  const fullStars = Math.floor(rating / 2);
  const hasHalfStar = rating % 2 >= 1;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClass = styles[size];

  return (
    <View className={`${styles.ratingStar} ${sizeClass}`}>
      <Text className={styles.ratingText}>{rating.toFixed(1)}</Text>
      <View className={styles.stars}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} className={styles.starFull}>★</Text>
        ))}
        {hasHalfStar && <Text className={styles.starHalf}>★</Text>}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} className={styles.starEmpty}>★</Text>
        ))}
      </View>
    </View>
  );
};

export default RatingStar;