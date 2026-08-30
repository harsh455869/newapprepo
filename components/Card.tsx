import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface CardProps {
  theme: Theme;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ theme, children, style }: CardProps) {
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth || 0.5,
    padding: 16,
  },
});
