import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/theme';

interface ScreenWrapperProps {
  theme: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function ScreenWrapper({ theme, children, style, padded = true }: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 },
      padded && styles.padded,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { paddingHorizontal: 20 },
});
