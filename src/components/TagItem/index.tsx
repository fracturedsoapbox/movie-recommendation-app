import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface TagItemProps {
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const TagItem: React.FC<TagItemProps> = ({ name, isSelected = false, onClick }) => {
  return (
    <View
      className={`${styles.tagItem} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <Text className={styles.tagText}>{name}</Text>
    </View>
  );
};

export default TagItem;