import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LIFE_AREAS, getLifeAreaColor } from '@/constants/lifeAreas';
import { PRIORITIES } from '@/constants';

export default function TargetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const currentScores: Record<string, number> = JSON.parse((params.scores as string) || '{}');
  const skippedArr: string[] = JSON.parse((params.skipped as string) || '[]');
  const skipped = new Set(skippedArr);

  const [targets, setTargets] = useState<Record<string, number>>({});
  const [priorities, setPriorities] = useState<Record<string, string>>({});

  const getTarget = (code: string) => targets[code] ?? Math.min(100, (currentScores[code] ?? 50) + 20);

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/reason',
      params: {
        scores: JSON.stringify(currentScores),
        targets: JSON.stringify(targets),
        priorities: JSON.stringify(priorities),
        skipped: JSON.stringify(Array.from(skipped)),
      },
    });
  };

  const areasToRate = LIFE_AREAS.filter((a) => !skipped.has(a.code));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Where would you like to be?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Set your target for each area and choose what matters most to you.
        </Text>

        {areasToRate.map((area) => {
          const current = currentScores[area.code] ?? 50;
          const target = getTarget(area.code);
          const gap = target - current;
          const color = getLifeAreaColor(area.code);
          const priority = priorities[area.code] || 'medium';

          return (
            <View key={area.code} style={[styles.areaCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.areaHeader}>
                <View style={styles.areaTitleRow}>
                  <View style={[styles.areaDot, { backgroundColor: color }]} />
                  <Text style={[styles.areaCode, { color: theme.colors.text }]}>{area.code}</Text>
                  <Text style={[styles.areaName, { color: theme.colors.text }]}>{area.name}</Text>
                </View>
              </View>

              <View style={styles.scoreRow}>
                <View style={styles.scoreCol}>
                  <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Current</Text>
                  <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{current}%</Text>
                </View>
                <View style={styles.scoreCol}>
                  <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Target</Text>
                  <Text style={[styles.scoreValue, { color: color }]}>{target}%</Text>
                </View>
                <View style={styles.scoreCol}>
                  <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Gap</Text>
                  <Text style={[styles.scoreValue, { color: gap > 0 ? color : theme.colors.textTertiary }]}>
                    {gap > 0 ? `+${gap}` : gap}
                  </Text>
                </View>
              </View>

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={target}
                onValueChange={(v) => setTargets((prev) => ({ ...prev, [area.code]: Math.round(v) }))}
                minimumTrackTintColor={color}
                maximumTrackTintColor={theme.colors.surfaceTertiary}
                thumbTintColor={color}
                accessibilityLabel={`Set target for ${area.name}`}
              />

              <View style={styles.priorityRow}>
                <Text style={[styles.priorityLabel, { color: theme.colors.textSecondary }]}>Priority:</Text>
                {PRIORITIES.map((p) => (
                  <PriorityChip
                    key={p.value}
                    theme={theme}
                    label={p.label}
                    selected={priority === p.value}
                    color={color}
                    onPress={() => setPriorities((prev) => ({ ...prev, [area.code]: p.value }))}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <PrimaryButton theme={theme} label="Continue" onPress={handleContinue} />
      </View>
    </ScrollView>
  );
}

function PriorityChip({ theme, label, selected, color, onPress }: any) {
  return (
    <Text
      style={[
        styles.chip,
        selected
          ? { backgroundColor: color, color: '#fff' }
          : { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.textSecondary },
      ]}
      onPress={onPress}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, marginTop: 4, lineHeight: 22, marginBottom: 20 },
  areaCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth || 0.5, padding: 16, marginBottom: 12 },
  areaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  areaTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  areaDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  areaCode: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  areaName: { fontSize: 16, fontWeight: '500' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  scoreCol: { alignItems: 'center' },
  scoreLabel: { fontSize: 12, marginBottom: 2 },
  scoreValue: { fontSize: 20, fontWeight: '700' },
  slider: { width: '100%', height: 40, marginBottom: 8 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  priorityLabel: { fontSize: 14 },
  chip: { fontSize: 13, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  footer: { paddingTop: 16 },
});
