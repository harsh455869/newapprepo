import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ScoreBar } from '@/components/ScoreBar';
import { AreaBadge } from '@/components/AreaBadge';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ModalSheet } from '@/components/ModalSheet';
import { useLocalDataStore } from '@/store/localDataStore';
import { useAuthStore } from '@/store/authStore';
import { LIFE_AREAS, LIFE_AREA_GROUPS, getLifeAreaColor, getLifeAreaName } from '@/constants/lifeAreas';
import { LifeArea, Priority } from '@/types';
import { calculateGap } from '@/utils/calculations';
import { todayISO, getLast7Days, formatDuration } from '@/utils/date';
import { PRIORITIES } from '@/constants';
import { LayoutGrid, ChevronRight, TrendingUp, Clock } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/services/supabase/client';
import { updateLifeArea as updateLifeAreaRemote } from '@/services/supabase/repositories';
import Slider from '@react-native-community/slider';
import { TextInput } from 'react-native';

export default function LifeScreen() {
  const theme = useTheme();
  const { lifeAreas, timeEntries, goals, habits, updateLifeArea: updateLocal } = useLocalDataStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [editingArea, setEditingArea] = useState<LifeArea | null>(null);

  const last7 = getLast7Days();
  const recentTimeByArea = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of timeEntries) {
      if (last7.includes(entry.date) && entry.intentional && entry.life_area_id) {
        map[entry.life_area_id] = (map[entry.life_area_id] || 0) + entry.duration_minutes;
      }
    }
    return map;
  }, [timeEntries, last7]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleUpdateArea = async (id: string, updates: Partial<LifeArea>) => {
    updateLocal(id, updates);
    if (!user?.isGuest) {
      try { await updateLifeAreaRemote(id, updates); } catch {}
    }
    setEditingArea(null);
  };

  if (lifeAreas.length === 0) {
    return (
      <ScreenWrapper theme={theme}>
        <ScreenHeader theme={theme} title="Life" subtitle="Your life areas at a glance" />
        <EmptyState
          theme={theme}
          icon={<LayoutGrid size={28} color={theme.colors.textTertiary} />}
          title="No life areas yet"
          message="Complete onboarding to assess your life areas and set targets."
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper theme={theme}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <ScreenHeader theme={theme} title="Life" subtitle="Your life areas at a glance" />

        {LIFE_AREA_GROUPS.map((group) => {
          const groupAreas = lifeAreas.filter((a) => {
            const def = LIFE_AREAS.find((la) => la.code === a.code);
            return def?.group === group;
          });
          if (groupAreas.length === 0) return null;

          return (
            <View key={group} style={styles.group}>
              <Text style={[styles.groupTitle, { color: theme.colors.textSecondary }]}>{group}</Text>
              {groupAreas.map((area) => (
                <LifeAreaCard
                  key={area.id}
                  theme={theme}
                  area={area}
                  goalCount={goals.filter((g) => g.life_area_id === area.id && g.status === 'active').length}
                  habitCount={habits.filter((h) => h.life_area_id === area.id && h.status === 'active').length}
                  recentMinutes={recentTimeByArea[area.id] || 0}
                  onPress={() => setEditingArea(area)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>

      {editingArea && (
        <EditAreaModal
          theme={theme}
          area={editingArea}
          visible={!!editingArea}
          onClose={() => setEditingArea(null)}
          onSave={(updates: Partial<LifeArea>) => handleUpdateArea(editingArea.id, updates)}
        />
      )}
    </ScreenWrapper>
  );
}

function LifeAreaCard({ theme, area, goalCount, habitCount, recentMinutes, onPress }: any) {
  const color = getLifeAreaColor(area.code);
  const gap = calculateGap(area.current_score, area.target_score);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.cardCode, { color: theme.colors.text }]}>{area.code}</Text>
          <Text style={[styles.cardName, { color: theme.colors.text }]}>{area.name}</Text>
        </View>
        {area.priority === 'high' && (
          <View style={[styles.priorityBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.priorityText, { color }]}>HIGH</Text>
          </View>
        )}
      </View>

      <ScoreBar theme={theme} current={area.current_score} target={area.target_score} color={color} />

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Gap</Text>
          <Text style={[styles.footerValue, { color: gap > 0 ? color : theme.colors.textTertiary }]}>
            {gap > 0 ? `+${gap}` : gap}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Goals</Text>
          <Text style={[styles.footerValue, { color: theme.colors.text }]}>{goalCount}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Habits</Text>
          <Text style={[styles.footerValue, { color: theme.colors.text }]}>{habitCount}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>7-day</Text>
          <Text style={[styles.footerValue, { color: theme.colors.text }]}>{formatDuration(recentMinutes)}</Text>
        </View>
      </View>

      {area.reason && (
        <View style={[styles.reasonBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Text style={[styles.reasonText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            "{area.reason}"
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function EditAreaModal({ theme, area, visible, onClose, onSave }: any) {
  const [currentScore, setCurrentScore] = useState(area.current_score);
  const [targetScore, setTargetScore] = useState(area.target_score);
  const [priority, setPriority] = useState<Priority>(area.priority);
  const [reason, setReason] = useState(area.reason || '');
  const color = getLifeAreaColor(area.code);

  return (
    <ModalSheet theme={theme} visible={visible} title={`${area.code} — ${area.name}`} onClose={onClose}>
      <ScrollView>
        <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Current score: {currentScore}%</Text>
        <SliderWrapper theme={theme} value={currentScore} color={color} onValueChange={setCurrentScore} />

        <Text style={[styles.editLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Target score: {targetScore}%</Text>
        <SliderWrapper theme={theme} value={targetScore} color={color} onValueChange={setTargetScore} />

        <Text style={[styles.editLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.priorityChip,
                priority === p.value
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
              onPress={() => setPriority(p.value as Priority)}
            >
              <Text style={[styles.priorityChipText, { color: priority === p.value ? '#fff' : theme.colors.text }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.editLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Why does this matter?</Text>
        <TextInput
          style={[styles.reasonInput, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={reason}
          onChangeText={setReason}
          placeholder="Your motivation..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
        />

        <View style={{ marginTop: 24 }}>
          <PrimaryButton theme={theme} label="Save changes" onPress={() => onSave({ current_score: currentScore, target_score: targetScore, priority, reason })} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

function SliderWrapper({ theme, value, color, onValueChange }: any) {
  return (
    <Slider
      style={{ width: '100%', height: 40 }}
      minimumValue={0}
      maximumValue={100}
      step={1}
      value={value}
      onValueChange={onValueChange}
      minimumTrackTintColor={color}
      maximumTrackTintColor={theme.colors.surfaceTertiary}
      thumbTintColor={color}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  group: { marginBottom: 24 },
  groupTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth || 0.5, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  cardCode: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  cardName: { fontSize: 16, fontWeight: '500' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footerItem: { alignItems: 'center' },
  footerLabel: { fontSize: 11, marginBottom: 2 },
  footerValue: { fontSize: 15, fontWeight: '600' },
  reasonBox: { marginTop: 12, padding: 10, borderRadius: 8 },
  reasonText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  // Edit modal
  editLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  priorityChipText: { fontSize: 14, fontWeight: '600' },
  reasonInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
});
