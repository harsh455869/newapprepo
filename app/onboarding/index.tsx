import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LIFE_AREAS, LIFE_AREA_GROUPS } from '@/constants/lifeAreas';
import { APP_NAME } from '@/constants';
import { getLifeAreaColor } from '@/constants/lifeAreas';
import { Compass } from 'lucide-react-native';

export default function OnboardingIntro() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <Compass size={48} color={theme.colors.primary} strokeWidth={1.5} />
        </View>

        <Text style={[styles.appName, { color: theme.colors.text }]}>{APP_NAME}</Text>
        <Text style={[styles.tagline, { color: theme.colors.primary }]}>Be intentional with your time.</Text>

        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Your life has different areas. Let's understand where you are today and where you want to be.
        </Text>

        <View style={styles.areasSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your life areas</Text>
          {LIFE_AREA_GROUPS.map((group) => (
            <View key={group} style={styles.group}>
              <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>{group}</Text>
              {LIFE_AREAS.filter((a) => a.group === group).map((area) => (
                <View key={area.code} style={[styles.areaRow, { borderColor: theme.colors.borderLight }]}>
                  <View style={[styles.areaDot, { backgroundColor: getLifeAreaColor(area.code) }]} />
                  <View style={styles.areaInfo}>
                    <Text style={[styles.areaCode, { color: theme.colors.text }]}>{area.code}</Text>
                    <Text style={[styles.areaName, { color: theme.colors.text }]}>{area.name}</Text>
                  </View>
                  <Text style={[styles.areaDesc, { color: theme.colors.textTertiary }]}>{area.description}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          There is no right answer. This is your personal assessment.
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton theme={theme} label="Assess my life" onPress={() => router.push('/onboarding/assessment')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  appName: { fontSize: 32, fontWeight: '700' },
  tagline: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  description: { fontSize: 16, lineHeight: 24, marginTop: 16 },
  areasSection: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  group: { marginBottom: 20 },
  groupTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  areaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth || 0.5 },
  areaDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  areaInfo: { flex: 1 },
  areaCode: { fontSize: 12, fontWeight: '700' },
  areaName: { fontSize: 15, fontWeight: '500' },
  areaDesc: { fontSize: 12, textAlign: 'right', flex: 1 },
  note: { fontSize: 14, fontStyle: 'italic', marginTop: 16, lineHeight: 20 },
  footer: { paddingTop: 16 },
});
