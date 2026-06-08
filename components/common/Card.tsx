import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 16,
  style,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  const cardStyles = [
    styles.card,
    {
      padding,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    variant === 'elevated' && {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: isDark ? 2 : 4,
    },
    variant === 'outlined' && {
      borderWidth: 1,
    },
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
export default Card;
