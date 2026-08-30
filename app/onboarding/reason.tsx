import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LIFE_AREAS, getLifeAreaColor } from '@/constants/lifeAreas';
import { useLocalDataStore } from '@/store/localDataStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase/client';
import { upsertLifeArea, updateProfile } from '@/services/supabase/repositories';
import { syncRemoteToLocal } from '@/services/supabase/sync';
import { v4 as uuidv4 } from 'uuid';

export default function ReasonScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { addLifeArea } = useLocalDataStore();
  const { user } = useAuthStore();

  const currentScores: Record<string, number> = JSON.parse((params.scores as string) || '{}');
  const targets: Record<string, number> = JSON.parse((params.targets as string) || '{}');
  const priorities: Record<string, string> = JSON.parse((params.priorities as string) || '{}');
  const skippedArr: string[] = JSON.parse((params.skipped as string) || '[]');
  const skipped = new Set(skippedArr);

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const highPriorityAreas = LIFE_AREAS.filter(
    (a) => !skipped.has(a.code) && priorities[a.code] === 'high'
  );
  const otherAreas = LIFE_AREAS.filter(
    (a) => !skipped.has(a.code) && priorities[a.code] !== 'high'
  );

  const handleComplete = async () => {
    setSaving(true);
    try {
      const isGuest = user?.isGuest;
      const userId = user?.id || 'guest';

      for (const area of LIFE_AREAS) {
        if (skipped.has(area.code)) {
          // Still create a life area with default scores for skipped ones
        }

        const areaData = {
          id: uuidv4(),
          user_id: userId,
          code: area.code,
          name: area.name,
          current_score: currentScores[area.code] ?? 50,
          target_score: targets[area.code] ?? Math.min(100, (currentScores[area.code] ?? 50) + 20),
          priority: (priorities[area.code] as 'high' | 'medium' | 'low') || 'medium',
          reason: reasons[area.code] || null,
          is_custom: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (isGuest) {
          addLifeArea(areaData);
        } else {
          await upsertLifeArea({
            ...areaData,
            id: undefined,
          } as any);
        }
      }

      // Mark onboarding completed
      if (!isGuest && user) {
        await updateProfile(user.id, { onboarding_completed: true });
        await syncRemoteToLocal();
      }

      router.replace('/(tabs)');
    } catch (e) {
      // Still navigate to tabs
      router.replace('/(tabs)');
    }
    setSaving(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Why does this matter to you?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Connect your priorities to your deeper motivation. This will remind you why you started.
        </Text>

        {highPriorityAreas.length === 0 && otherAreas.length === 0 && (
          <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
            No areas to set reasons for. Continue to finish onboarding.
          </Text>
        )}

        {highPriorityAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>High priority areas</Text>
            {highPriorityAreas.map((area) => (
              <ReasonCard
                key={area.code}
                theme={theme}
                area={area}
                value={reasons[area.code] || ''}
                onChangeText={(text: string) => setReasons((prev) => ({ ...prev, [area.code]: text }))}
              />
            ))}
          </View>
        )}

        {otherAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Other areas (optional)
            </Text>
            {otherAreas.map((area) => (
              <ReasonCard
                key={area.code}
                theme={theme}
                area={area}
                value={reasons[area.code] || ''}
                onChangeText={(text: string) => setReasons((prev) => ({ ...prev, [area.code]: text }))}
                optional
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton theme={theme} label="Complete setup" onPress={handleComplete} loading={saving} />
      </View>
    </ScrollView>
  );
}

function ReasonCard({ theme, area, value, onChangeText, optional }: any) {
  const color = getLifeAreaColor(area.code);
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.areaHeader}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.areaCode, { color: theme.colors.text }]}>{area.code}</Text>
        <Text style={[styles.areaName, { color: theme.colors.text }]}>{area.name}</Text>
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={optional ? "Why does this matter? (optional)" : "Why does this matter to you?"}
        placeholderTextColor={theme.colors.textTertiary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  content: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 15, marginTop: 4, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  empty: { fontSize: 15, textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth || 0.5, padding: 16, marginBottom: 12 },
  areaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  areaCode: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  areaName: { fontSize: 16, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 80 },
  footer: { paddingTop: 16 },
});
