import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { lightTheme, darkTheme, Theme } from '@/theme';

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  if (mode === 'light') return lightTheme;
  if (mode === 'dark') return darkTheme;
  return systemScheme === 'dark' ? darkTheme : lightTheme;
}
