import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface LoadingStateProps {
  theme: Theme;
  message?: string;
  style?: ViewStyle;
}

export function LoadingState({ theme, message, style }: LoadingStateProps) {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { marginTop: 12, fontSize: 14 },
});
