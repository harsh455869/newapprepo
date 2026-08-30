import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/theme';

interface ScreenHeaderProps {
  theme: Theme;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ theme, title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  textWrap: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  subtitle: { fontSize: 15, marginTop: 4, lineHeight: 22 },
});
