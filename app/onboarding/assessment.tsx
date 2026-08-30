import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LIFE_AREAS, getLifeAreaColor } from '@/constants/lifeAreas';
import { useLocalDataStore } from '@/store/localDataStore';

export default function AssessmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLifeArea } = useLocalDataStore();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const getScore = (code: string) => scores[code] ?? 50;
  const setScore = (code: string, value: number) => {
    setScores((prev) => ({ ...prev, [code]: Math.round(value) }));
    setSkipped((prev) => { const n = new Set(prev); n.delete(code); return n; });
  };
  const toggleSkip = (code: string) => {
    setSkipped((prev) => {
      const n = new Set(prev);
      if (n.has(code)) n.delete(code); else n.add(code);
      return n;
    });
  };

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/target',
      params: { scores: JSON.stringify(scores), skipped: JSON.stringify(Array.from(skipped)) },
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Where are you today?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Rate each area from 0 to 100. There is no right answer.
        </Text>

        {LIFE_AREAS.map((area) => {
          const score = getScore(area.code);
          const isSkipped = skipped.has(area.code);
          const color = getLifeAreaColor(area.code);

          return (
            <View key={area.code} style={[styles.areaCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.areaHeader}>
                <View style={styles.areaTitleRow}>
                  <View style={[styles.areaDot, { backgroundColor: color }]} />
                  <Text style={[styles.areaCode, { color: theme.colors.text }]}>{area.code}</Text>
                  <Text style={[styles.areaName, { color: theme.colors.text }]}>{area.name}</Text>
                </View>
                <Text style={[styles.scoreText, { color: isSkipped ? theme.colors.textTertiary : color }]}>
                  {isSkipped ? '—' : `${score}%`}
                </Text>
              </View>

              {!isSkipped && (
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={score}
                  onValueChange={(v) => setScore(area.code, v)}
                  minimumTrackTintColor={color}
                  maximumTrackTintColor={theme.colors.surfaceTertiary}
                  thumbTintColor={color}
                  accessibilityLabel={`Rate ${area.name} from 0 to 100`}
                />
              )}

              <Text
                style={[styles.skipLink, { color: theme.colors.textTertiary }]}
                onPress={() => toggleSkip(area.code)}
              >
                {isSkipped ? 'Include this area' : 'Skip this area'}
              </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, marginTop: 4, lineHeight: 22, marginBottom: 20 },
  areaCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth || 0.5, padding: 16, marginBottom: 12 },
  areaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  areaTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  areaDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  areaCode: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  areaName: { fontSize: 16, fontWeight: '500' },
  scoreText: { fontSize: 22, fontWeight: '700' },
  slider: { width: '100%', height: 40 },
  skipLink: { fontSize: 13, marginTop: 4, textAlign: 'right' },
  footer: { paddingTop: 16 },
});
