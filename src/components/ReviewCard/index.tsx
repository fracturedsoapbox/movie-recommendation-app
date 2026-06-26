import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ReviewCardProps {
  content: string;
  author?: string;
  time?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ content, author, time }) => {
  return (
    <View className={styles.reviewCard}>
      <View className={styles.reviewContent}>
        <Text className={styles.reviewText}>{content}</Text>
      </View>
      {(author || time) && (
        <View className={styles.reviewMeta}>
          {author && <Text className={styles.author}>{author}</Text>}
          {time && <Text className={styles.time}>{time}</Text>}
        </View>
      )}
    </View>
  );
};

export default ReviewCard;