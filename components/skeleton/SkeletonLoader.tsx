import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
};

// Ready-to-use loader layouts
export const SkeletonListItem: React.FC = () => (
  <View style={styles.listItem}>
    <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
    <View style={{ flex: 1 }}>
      <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={12} />
    </View>
    <Skeleton width={60} height={20} />
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={[styles.card, { padding: 16 }]}>
    <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
    <Skeleton width="80%" height={32} style={{ marginBottom: 16 }} />
    <View style={styles.listItem}>
      <Skeleton width="30%" height={14} />
      <Skeleton width="30%" height={14} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
export default Skeleton;
