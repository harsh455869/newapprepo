import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { AreaBadge } from '@/components/AreaBadge';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ModalSheet } from '@/components/ModalSheet';
import { useLocalDataStore } from '@/store/localDataStore';
import { useAuthStore } from '@/store/authStore';
import { todayISO, formatDuration, relativeDayLabel } from '@/utils/date';
import {
  calculateCompletedTimeToday, generateDailyActionsFromHabits,
  getMeaningfulDaysThisWeek, sortByPriority,
} from '@/utils/calculations';
import { getLifeAreaName, getLifeAreaColor, LIFE_AREAS } from '@/constants/lifeAreas';
import { RESCUE_ACTIONS, RESCUE_AREA_CODES } from '@/constants';
import { Circle, CheckCircle2, Plus, Clock, Sparkles, ChevronRight } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dailyActions, habits, lifeAreas, timeEntries, addDailyAction, updateDailyAction, addTimeEntry } = useLocalDataStore();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const today = todayISO();
  const todaysActions = useMemo(() => dailyActions.filter((a) => a.date === today), [dailyActions, today]);

  // Auto-generate daily actions from habits
  const generatedActions = useMemo(() => {
    return generateDailyActionsFromHabits(habits, lifeAreas, dailyActions, today);
  }, [habits, lifeAreas, dailyActions, today]);

  // Merge existing + generated
  const allActions = useMemo(() => {
    const existingIds = new Set(todaysActions.map((a) => a.id));
    const newGenerated = generatedActions.filter((a) => !existingIds.has(a.id));
    return [...todaysActions, ...newGenerated];
  }, [todaysActions, generatedActions]);

  const completedMinutes = calculateCompletedTimeToday(dailyActions, today);
  const intentionalTimeToday = timeEntries
    .filter((e) => e.date === today && e.intentional)
    .reduce((sum, e) => sum + e.duration_minutes, 0);
  const meaningfulDays = getMeaningfulDaysThisWeek(dailyActions);

  // Categorize actions by area priority
  const priorityAreas = sortByPriority(lifeAreas.filter((a) => a.priority === 'high'));
  const highPriorityAreaIds = new Set(priorityAreas.map((a) => a.id));

  const priorityActions = allActions.filter((a) => highPriorityAreaIds.has(a.life_area_id));
  const otherActions = allActions.filter((a) => !highPriorityAreaIds.has(a.life_area_id));

  const handleToggleAction = (actionId: string, completed: boolean) => {
    updateDailyAction(actionId, {
      completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null,
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <ScreenWrapper theme={theme}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <ScreenHeader
          theme={theme}
          title="What matters today?"
          subtitle={relativeDayLabel(today)}
        />

        {/* Intentional time summary */}
        <View style={[styles.summaryRow, { gap: 12 }]}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Intentional time</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{formatDuration(completedMinutes + intentionalTimeToday)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Meaningful days</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{meaningfulDays} this week</Text>
          </View>
        </View>

        {/* Priority actions */}
        {priorityActions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Priorities</Text>
            {priorityActions.map((action) => (
              <ActionCard
                key={action.id}
                theme={theme}
                title={action.title}
                duration={action.duration_minutes}
                areaCode={lifeAreas.find((a) => a.id === action.life_area_id)?.code || ''}
                completed={action.completed}
                onToggle={() => handleToggleAction(action.id, action.completed)}
              />
            ))}
          </View>
        )}

        {/* Other actions */}
        {otherActions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Also today</Text>
            {otherActions.map((action) => (
              <ActionCard
                key={action.id}
                theme={theme}
                title={action.title}
                duration={action.duration_minutes}
                areaCode={lifeAreas.find((a) => a.id === action.life_area_id)?.code || ''}
                completed={action.completed}
                onToggle={() => handleToggleAction(action.id, action.completed)}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {allActions.length === 0 && (
          <EmptyState
            theme={theme}
            icon={<Clock size={28} color={theme.colors.textTertiary} />}
            title="Nothing planned yet"
            message="Create a goal and habits to get daily actions, or plan your day below."
            action={
              <View style={{ gap: 8 }}>
                <PrimaryButton theme={theme} label="Plan my day" onPress={() => setShowPlan(true)} />
                <PrimaryButton theme={theme} label="Create a goal" variant="secondary" onPress={() => router.push('/(tabs)/goals')} />
              </View>
            }
          />
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setShowPlan(true)}
          >
            <Sparkles size={18} color={theme.colors.primary} />
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Plan my day</Text>
            <ChevronRight size={16} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setShowRescue(true)}
          >
            <Clock size={18} color={theme.colors.warning} />
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>I wasted today</Text>
            <ChevronRight size={16} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 5-Minute Rescue Modal */}
      <RescueModal
        theme={theme}
        visible={showRescue}
        onClose={() => setShowRescue(false)}
        onComplete={(title: string, areaCode: string) => {
          const area = lifeAreas.find((a) => a.code === areaCode);
          const newAction = {
            id: uuidv4(),
            user_id: user?.id || 'guest',
            habit_id: null,
            life_area_id: area?.id || '',
            date: today,
            title,
            duration_minutes: 5,
            completed: true,
            completed_at: new Date().toISOString(),
            notes: '5-minute rescue',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          addDailyAction(newAction);
          setShowRescue(false);
        }}
      />

      {/* Plan My Day Modal */}
      <PlanDayModal
        theme={theme}
        visible={showPlan}
        onClose={() => setShowPlan(false)}
        lifeAreas={lifeAreas}
        habits={habits}
        onAddActions={(actions: any[]) => {
          for (const action of actions) {
            addDailyAction(action);
          }
          setShowPlan(false);
        }}
      />
    </ScreenWrapper>
  );
}

function ActionCard({ theme, title, duration, areaCode, completed, onToggle }: any) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: completed ? 0.6 : 1 }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {completed ? (
        <CheckCircle2 size={24} color={theme.colors.primary} />
      ) : (
        <Circle size={24} color={theme.colors.textTertiary} />
      )}
      <View style={styles.actionContent}>
        <Text
          style={[styles.actionTitle, { color: theme.colors.text, textDecorationLine: completed ? 'line-through' : 'none' }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <View style={styles.actionMeta}>
          <Text style={[styles.actionDuration, { color: theme.colors.textSecondary }]}>{formatDuration(duration)}</Text>
          <AreaBadge theme={theme} code={areaCode} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RescueModal({ theme, visible, onClose, onComplete }: any) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSelect = (areaCode: string) => {
    setSelectedArea(areaCode);
  };

  const handleCompleteAction = (title: string, areaCode: string) => {
    onComplete(title, areaCode);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedArea(null);
    }, 2000);
  };

  const handleClose = () => {
    setSelectedArea(null);
    setShowSuccess(false);
    onClose();
  };

  return (
    <ModalSheet theme={theme} visible={visible} title="5-Minute Rescue" onClose={handleClose}>
      {showSuccess ? (
        <View style={styles.rescueSuccess}>
          <CheckCircle2 size={56} color={theme.colors.primary} />
          <Text style={[styles.rescueSuccessTitle, { color: theme.colors.text }]}>Today wasn't completely lost.</Text>
          <Text style={[styles.rescueSuccessMsg, { color: theme.colors.textSecondary }]}>
            You took a small step. That's what matters.
          </Text>
        </View>
      ) : !selectedArea ? (
        <View>
          <Text style={[styles.rescueIntro, { color: theme.colors.textSecondary }]}>
            You still have 5 minutes. Pick an area and take one small action.
          </Text>
          {RESCUE_AREA_CODES.map((code) => {
            const area = LIFE_AREAS.find((a) => a.code === code);
            if (!area) return null;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.rescueAreaBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => handleSelect(code)}
              >
                <View style={[styles.rescueAreaDot, { backgroundColor: getLifeAreaColor(code) }]} />
                <Text style={[styles.rescueAreaName, { color: theme.colors.text }]}>{area.name}</Text>
                <ChevronRight size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View>
          <Text style={[styles.rescueAreaTitle, { color: theme.colors.text }]}>
            {getLifeAreaName(selectedArea)}
          </Text>
          <Text style={[styles.rescueIntro, { color: theme.colors.textSecondary }]}>
            Pick one. Just 5 minutes.
          </Text>
          {RESCUE_ACTIONS[selectedArea]?.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.rescueActionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleCompleteAction(action.title, selectedArea)}
            >
              <Text style={[styles.rescueActionText, { color: theme.colors.text }]}>{action.title}</Text>
              <ChevronRight size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ))}
          <Text style={[styles.rescueBack, { color: theme.colors.primary }]} onPress={() => setSelectedArea(null)}>
            ← Back to areas
          </Text>
        </View>
      )}
    </ModalSheet>
  );
}

function PlanDayModal({ theme, visible, onClose, lifeAreas, habits, onAddActions }: any) {
  const [availableTime, setAvailableTime] = useState(60);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const timeOptions = [15, 30, 60, 90, 120];

  const handleGenerate = () => {
    // Simple deterministic plan
    const plan: any[] = [];
    let remaining = availableTime;
    const selectedArr = Array.from(selectedAreas);

    // Sort habits by selected areas first, then by priority
    const activeHabits = habits.filter((h: any) => h.status === 'active');
    const sortedHabits = activeHabits.sort((a: any, b: any) => {
      const aSelected = selectedAreas.has(a.life_area_id) ? 0 : 1;
      const bSelected = selectedAreas.has(b.life_area_id) ? 0 : 1;
      return aSelected - bSelected;
    });

    for (const habit of sortedHabits) {
      if (remaining <= 0) break;
      const area = lifeAreas.find((a: any) => a.id === habit.life_area_id);
      const duration = Math.min(15, remaining);
      plan.push({
        id: uuidv4(),
        user_id: user?.id || 'guest',
        habit_id: habit.id,
        life_area_id: habit.life_area_id,
        date: todayISO(),
        title: habit.title,
        duration_minutes: duration,
        completed: false,
        completed_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      remaining -= duration;
    }

    onAddActions(plan);
  };

  return (
    <ModalSheet theme={theme} visible={visible} title="Plan My Day" onClose={onClose}>
      <ScrollView>
        <Text style={[styles.planLabel, { color: theme.colors.textSecondary }]}>
          How much intentional time do you have today?
        </Text>
        <View style={styles.timeOptions}>
          {timeOptions.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeChip,
                availableTime === t
                  ? { backgroundColor: theme.colors.primary }
                  : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
              onPress={() => setAvailableTime(t)}
            >
              <Text style={[styles.timeChipText, { color: availableTime === t ? '#fff' : theme.colors.text }]}>
                {t} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.planLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          Focus areas (optional)
        </Text>
        <View style={styles.areaChips}>
          {lifeAreas.map((area: any) => (
            <TouchableOpacity
              key={area.id}
              style={[
                styles.areaChip,
                selectedAreas.has(area.id)
                  ? { backgroundColor: getLifeAreaColor(area.code) + '30', borderColor: getLifeAreaColor(area.code) }
                  : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
              onPress={() => toggleArea(area.id)}
            >
              <View style={[styles.areaChipDot, { backgroundColor: getLifeAreaColor(area.code) }]} />
              <Text style={[styles.areaChipText, { color: theme.colors.text }]}>{area.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <PrimaryButton theme={theme} label={`Generate plan (${availableTime} min)`} onPress={handleGenerate} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth || 0.5, padding: 14 },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', opacity: 0.7 },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth || 0.5, marginBottom: 8, gap: 12 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '500', lineHeight: 21, marginBottom: 6 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionDuration: { fontSize: 13 },
  actionButtons: { gap: 10, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth || 0.5, gap: 10 },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '500' },
  // Rescue modal
  rescueIntro: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  rescueAreaBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth || 0.5, marginBottom: 8, gap: 10 },
  rescueAreaDot: { width: 10, height: 10, borderRadius: 5 },
  rescueAreaName: { flex: 1, fontSize: 16, fontWeight: '500' },
  rescueAreaTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  rescueActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth || 0.5, marginBottom: 8, gap: 8 },
  rescueActionText: { flex: 1, fontSize: 15 },
  rescueBack: { fontSize: 14, fontWeight: '500', marginTop: 16 },
  rescueSuccess: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  rescueSuccessTitle: { fontSize: 22, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  rescueSuccessMsg: { fontSize: 16, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  // Plan modal
  planLabel: { fontSize: 15, fontWeight: '500', marginBottom: 10 },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  timeChipText: { fontSize: 14, fontWeight: '600' },
  areaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 6 },
  areaChipDot: { width: 8, height: 8, borderRadius: 4 },
  areaChipText: { fontSize: 13, fontWeight: '500' },
});
