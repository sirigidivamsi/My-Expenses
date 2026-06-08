import { useColorScheme } from 'react-native';
import { colors } from '../constants/colors';
import { useAuthStore } from '../store/useAuthStore';

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const themePref = useAuthStore((state) => state.preferences.theme);

  const activeTheme =
    themePref === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePref;

  const currentColors = colors[activeTheme];

  return {
    theme: activeTheme,
    colors: currentColors,
    isDark: activeTheme === 'dark',
  };
};
export type ThemeHook = ReturnType<typeof useTheme>;
