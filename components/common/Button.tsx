import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'success' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  icon,
  size = 'medium',
  onPress,
  disabled,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  // Get background & text color based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: colors.primaryLight,
          text: colors.primary,
          border: 'transparent',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: colors.primary,
          border: colors.primary,
        };
      case 'text':
        return {
          bg: 'transparent',
          text: colors.primary,
          border: 'transparent',
        };
      case 'success':
        return {
          bg: colors.success,
          text: '#FFFFFF',
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: colors.error,
          text: '#FFFFFF',
          border: 'transparent',
        };
      case 'primary':
      default:
        return {
          bg: colors.primary,
          text: '#FFFFFF',
          border: 'transparent',
        };
    }
  };

  const { bg, text, border } = getVariantStyles();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: bg,
      borderColor: border,
      borderWidth: border !== 'transparent' ? 1.5 : 0,
      opacity: disabled || isLoading ? 0.6 : 1,
    },
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    style,
  ];

  const textStyles = [
    styles.text,
    { color: text },
    size === 'small' && styles.textSmall,
    size === 'large' && styles.textLarge,
  ];

  return (
    <Pressable
      onPress={disabled || isLoading ? undefined : onPress}
      style={({ pressed }) => [
        buttonStyles,
        pressed && !disabled && !isLoading && styles.pressed,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
});
export default Button;
