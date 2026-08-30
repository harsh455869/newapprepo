import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '@/theme';
import { getLifeAreaColor, getLifeAreaName } from '@/constants/lifeAreas';

interface AreaBadgeProps {
  theme: Theme;
  code: string;
  size?: 'sm' | 'md';
  showName?: boolean;
}

export function AreaBadge({ theme, code, size = 'sm', showName }: AreaBadgeProps) {
  const color = getLifeAreaColor(code);
  const name = getLifeAreaName(code);

  return (
    <View style={[styles.container, size === 'sm' ? styles.sm : styles.md, { backgroundColor: color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.code, { color }, size === 'sm' ? styles.codeSm : styles.codeMd]}>
        {code}
      </Text>
      {showName && (
        <Text style={[styles.name, { color: theme.colors.textSecondary }]}>{name}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  sm: {},
  md: { paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  code: { fontSize: 11, fontWeight: '700' },
  codeSm: { fontSize: 11 },
  codeMd: { fontSize: 13 },
  name: { fontSize: 12, marginLeft: 4 },
});
