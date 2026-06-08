import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(isPassword);

  const handleFocus = (e: any) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.card,
            borderColor: error
              ? colors.error
              : focused
              ? colors.primary
              : colors.border,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <RNTextInput
          style={[
            styles.input,
            { color: colors.text },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={hidePassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.iconRight}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {hidePassword ? 'SHOW' : 'HIDE'}
            </Text>
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingVertical: 10,
  },
  iconLeft: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
export default TextInput;
