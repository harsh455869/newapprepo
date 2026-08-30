import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface EmptyStateProps {
  theme: Theme;
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ theme, icon, title, message, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>{icon}</View>}
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  action: { marginTop: 20 },
});
