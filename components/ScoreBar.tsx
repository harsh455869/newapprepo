import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '@/theme';

interface ScoreBarProps {
  theme: Theme;
  current: number;
  target: number;
  color?: string;
  showLabels?: boolean;
}

export function ScoreBar({ theme, current, target, color, showLabels = true }: ScoreBarProps) {
  const barColor = color || theme.colors.primary;
  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceTertiary }]}>
        <View style={[styles.fill, { width: `${current}%`, backgroundColor: barColor }]} />
        {target > 0 && (
          <View style={[styles.targetMarker, { left: `${target}%`, borderColor: theme.colors.textTertiary }]} />
        )}
      </View>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Current: {current}%</Text>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Target: {target}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  fill: { height: '100%', borderRadius: 4 },
  targetMarker: { position: 'absolute', top: -2, bottom: -2, width: 2, borderWidth: 1, borderStyle: 'dashed' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 12 },
});
