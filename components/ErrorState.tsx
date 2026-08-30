import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface ErrorStateProps {
  theme: Theme;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export function ErrorState({ theme, message, onRetry, retryLabel, style }: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message || 'Something went wrong. Check your connection and try again.'}
      </Text>
      {onRetry && (
        <RetryButton theme={theme} label={retryLabel || 'Retry'} onPress={onRetry} />
      )}
    </View>
  );
}

function RetryButton({ theme, label, onPress }: { theme: Theme; label: string; onPress: () => void }) {
  return (
    <Text
      style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '600', marginTop: 12 }}
      onPress={onPress}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
