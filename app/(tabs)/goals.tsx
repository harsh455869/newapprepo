import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
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
import { Goal, Habit, GoalStatus, HabitFrequency } from '@/types';
import { getLifeAreaColor, getLifeAreaName } from '@/constants/lifeAreas';
import { MAX_ACTIVE_HABITS, HABIT_FREQUENCIES, GOAL_STATUSES } from '@/constants';
import { getActiveHabits, getActiveGoals } from '@/utils/calculations';
import { Target, Plus, ChevronDown, ChevronRight, Circle, CheckCircle2, Pause, Archive, Trash2, AlertCircle } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { createGoal, updateGoal, deleteGoal as deleteGoalRemote, createHabit, deleteHabit as deleteHabitRemote } from '@/services/supabase/repositories';

export default function GoalsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { goals, habits, lifeAreas, addGoal, updateGoal: updateLocalGoal, deleteGoal: deleteLocalGoal, addHabit, updateHabit: updateLocalHabit, deleteHabit: deleteLocalHabit } = useLocalDataStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitForGoal, setHabitForGoal] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const otherGoals = useMemo(() => goals.filter((g) => g.status !== 'active'), [goals]);

  const toggleExpand = (id: string) => {
    setExpandedGoals((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCreateGoal = async (data: { title: string; description: string; life_area_id: string; current_value?: number; target_value?: number; deadline?: string }) => {
    const newGoal: Goal = {
      id: uuidv4(),
      user_id: user?.id || 'guest',
      life_area_id: data.life_area_id,
      title: data.title,
      description: data.description || null,
      current_value: data.current_value ?? null,
      target_value: data.target_value ?? null,
      deadline: data.deadline || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addGoal(newGoal);
    if (!user?.isGuest) {
      try { await createGoal({ ...newGoal, id: undefined } as any); } catch {}
    }
    setShowGoalForm(false);
  };

  const handleDeleteGoal = async (id: string) => {
    deleteLocalGoal(id);
    if (!user?.isGuest) {
      try { await deleteGoalRemote(id); } catch {}
    }
  };

  const handleStatusChange = async (id: string, status: GoalStatus) => {
    updateLocalGoal(id, { status });
    if (!user?.isGuest) {
      try { await updateGoal(id, { status }); } catch {}
    }
  };

  const handleCreateHabit = async (data: { title: string; goal_id: string; life_area_id: string; frequency: HabitFrequency; estimated_impact: number }) => {
    const newHabit: Habit = {
      id: uuidv4(),
      user_id: user?.id || 'guest',
      goal_id: data.goal_id,
      life_area_id: data.life_area_id,
      title: data.title,
      frequency: data.frequency,
      estimated_impact: data.estimated_impact,
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addHabit(newHabit);
    if (!user?.isGuest) {
      try { await createHabit({ ...newHabit, id: undefined } as any); } catch {}
    }
    setShowHabitForm(false);
    setHabitForGoal(null);
  };

  const handleDeleteHabit = async (id: string) => {
    deleteLocalHabit(id);
    if (!user?.isGuest) {
      try { await deleteHabitRemote(id); } catch {}
    }
  };

  const activeHabitsCount = getActiveHabits(habits).length;

  return (
    <ScreenWrapper theme={theme}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <ScreenHeader
          theme={theme}
          title="Goals & Habits"
          subtitle={`${activeGoals.length} active goals · ${activeHabitsCount}/${MAX_ACTIVE_HABITS} active habits`}
        />

        <View style={{ marginBottom: 16 }}>
          <PrimaryButton theme={theme} label="Create a goal" onPress={() => setShowGoalForm(true)} />
        </View>

        {activeGoals.length === 0 && otherGoals.length === 0 ? (
          <EmptyState
            theme={theme}
            icon={<Target size={28} color={theme.colors.textTertiary} />}
            title="You haven't created a goal yet"
            message="Goals help you turn your priorities into concrete outcomes."
            action={<PrimaryButton theme={theme} label="Create your first goal" onPress={() => setShowGoalForm(true)} />}
          />
        ) : (
          <>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                theme={theme}
                goal={goal}
                habits={habits.filter((h) => h.goal_id === goal.id)}
                lifeAreas={lifeAreas}
                expanded={expandedGoals.has(goal.id)}
                onToggleExpand={() => toggleExpand(goal.id)}
                onAddHabit={() => { setHabitForGoal(goal.id); setShowHabitForm(true); }}
                onDeleteHabit={handleDeleteHabit}
                onStatusChange={(status: GoalStatus) => handleStatusChange(goal.id, status)}
                onDelete={() => handleDeleteGoal(goal.id)}
              />
            ))}

            {otherGoals.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Other goals</Text>
                {otherGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    theme={theme}
                    goal={goal}
                    habits={habits.filter((h) => h.goal_id === goal.id)}
                    lifeAreas={lifeAreas}
                    expanded={expandedGoals.has(goal.id)}
                    onToggleExpand={() => toggleExpand(goal.id)}
                    onAddHabit={() => { setHabitForGoal(goal.id); setShowHabitForm(true); }}
                    onDeleteHabit={handleDeleteHabit}
                    onStatusChange={(status: GoalStatus) => handleStatusChange(goal.id, status)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {showGoalForm && (
        <GoalFormModal
          theme={theme}
          visible={showGoalForm}
          lifeAreas={lifeAreas}
          onClose={() => setShowGoalForm(false)}
          onCreate={handleCreateGoal}
        />
      )}

      {showHabitForm && (
        <HabitFormModal
          theme={theme}
          visible={showHabitForm}
          lifeAreas={lifeAreas}
          goals={activeGoals}
          presetGoalId={habitForGoal}
          activeHabitsCount={activeHabitsCount}
          onClose={() => { setShowHabitForm(false); setHabitForGoal(null); }}
          onCreate={handleCreateHabit}
        />
      )}
    </ScreenWrapper>
  );
}

function GoalCard({ theme, goal, habits, lifeAreas, expanded, onToggleExpand, onAddHabit, onDeleteHabit, onStatusChange, onDelete }: any) {
  const area = lifeAreas.find((a: any) => a.id === goal.life_area_id);
  const color = area ? getLifeAreaColor(area.code) : theme.colors.primary;
  const activeHabits = habits.filter((h: Habit) => h.status === 'active');

  return (
    <View style={[styles.goalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <TouchableOpacity style={styles.goalHeader} onPress={onToggleExpand} activeOpacity={0.7}>
        <View style={styles.goalTitleRow}>
          {goal.status === 'completed' ? (
            <CheckCircle2 size={20} color={theme.colors.primary} />
          ) : goal.status === 'paused' ? (
            <Pause size={20} color={theme.colors.warning} />
          ) : goal.status === 'archived' ? (
            <Archive size={20} color={theme.colors.textTertiary} />
          ) : (
            <Circle size={20} color={color} />
          )}
          <Text style={[styles.goalTitle, { color: theme.colors.text }]} numberOfLines={2}>{goal.title}</Text>
        </View>
        <View style={styles.goalMeta}>
          <AreaBadge theme={theme} code={area?.code || ''} />
          {expanded ? <ChevronDown size={18} color={theme.colors.textTertiary} /> : <ChevronRight size={18} color={theme.colors.textTertiary} />}
        </View>
      </TouchableOpacity>

      {goal.description && (
        <Text style={[styles.goalDesc, { color: theme.colors.textSecondary }]} numberOfLines={expanded ? undefined : 1}>
          {goal.description}
        </Text>
      )}

      {(goal.current_value !== null || goal.target_value !== null) && (
        <View style={styles.valueRow}>
          {goal.current_value !== null && <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>Current: {goal.current_value}</Text>}
          {goal.target_value !== null && <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>Target: {goal.target_value}</Text>}
          {goal.deadline && <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>Deadline: {goal.deadline}</Text>}
        </View>
      )}

      <Text style={[styles.habitCount, { color: theme.colors.textSecondary }]}>
        {activeHabits.length} {activeHabits.length === 1 ? 'habit' : 'habits'}
      </Text>

      {expanded && (
        <View style={styles.expandedContent}>
          {habits.map((habit: Habit) => (
            <HabitRow
              key={habit.id}
              theme={theme}
              habit={habit}
              areaCode={area?.code || ''}
              onDelete={() => onDeleteHabit(habit.id)}
            />
          ))}

          {goal.status === 'active' && (
            <TouchableOpacity style={[styles.addHabitBtn, { borderColor: theme.colors.border }]} onPress={onAddHabit}>
              <Plus size={16} color={theme.colors.primary} />
              <Text style={[styles.addHabitText, { color: theme.colors.primary }]}>Add habit</Text>
            </TouchableOpacity>
          )}

          <View style={styles.statusActions}>
            {goal.status !== 'completed' && (
              <TouchableOpacity onPress={() => onStatusChange('completed')}>
                <Text style={[styles.statusAction, { color: theme.colors.primary }]}>Mark complete</Text>
              </TouchableOpacity>
            )}
            {goal.status === 'active' && (
              <TouchableOpacity onPress={() => onStatusChange('paused')}>
                <Text style={[styles.statusAction, { color: theme.colors.warning }]}>Pause</Text>
              </TouchableOpacity>
            )}
            {goal.status === 'paused' && (
              <TouchableOpacity onPress={() => onStatusChange('active')}>
                <Text style={[styles.statusAction, { color: theme.colors.primary }]}>Resume</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDelete}>
              <Text style={[styles.statusAction, { color: theme.colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function HabitRow({ theme, habit, areaCode, onDelete }: any) {
  return (
    <View style={[styles.habitRow, { borderColor: theme.colors.borderLight }]}>
      <View style={styles.habitInfo}>
        <Text style={[styles.habitTitle, { color: theme.colors.text }]} numberOfLines={1}>{habit.title}</Text>
        <Text style={[styles.habitMeta, { color: theme.colors.textSecondary }]}>
          {HABIT_FREQUENCIES.find((f) => f.value === habit.frequency)?.label} · Impact: {habit.estimated_impact}%
        </Text>
      </View>
      {habit.status === 'active' && <AreaBadge theme={theme} code={areaCode} />}
      <TouchableOpacity onPress={onDelete}>
        <Trash2 size={16} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

function GoalFormModal({ theme, visible, lifeAreas, onClose, onCreate }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lifeAreaId, setLifeAreaId] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!title.trim()) { setError('Goal title is required'); return; }
    if (!lifeAreaId) { setError('Select a life area'); return; }
    onCreate({
      title: title.trim(),
      description: description.trim(),
      life_area_id: lifeAreaId,
      current_value: currentValue ? Number(currentValue) : undefined,
      target_value: targetValue ? Number(targetValue) : undefined,
      deadline: deadline || undefined,
    });
    // Reset
    setTitle(''); setDescription(''); setLifeAreaId(''); setCurrentValue(''); setTargetValue(''); setDeadline(''); setError(null);
  };

  return (
    <ModalSheet theme={theme} visible={visible} title="Create Goal" onClose={onClose}>
      <ScrollView>
        <FormField label="Goal title" theme={theme}>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={title} onChangeText={setTitle} placeholder="e.g. Increase monthly income" placeholderTextColor={theme.colors.textTertiary} />
        </FormField>

        <FormField label="Description (optional)" theme={theme}>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={description} onChangeText={setDescription} placeholder="Add details..." placeholderTextColor={theme.colors.textTertiary} multiline />
        </FormField>

        <FormField label="Life area" theme={theme}>
          <View style={styles.chipRow}>
            {lifeAreas.map((area: any) => (
              <TouchableOpacity
                key={area.id}
                style={[styles.chip, lifeAreaId === area.id ? { backgroundColor: getLifeAreaColor(area.code) + '30', borderColor: getLifeAreaColor(area.code) } : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                onPress={() => setLifeAreaId(area.id)}
              >
                <View style={[styles.chipDot, { backgroundColor: getLifeAreaColor(area.code) }]} />
                <Text style={[styles.chipText, { color: theme.colors.text }]}>{area.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>

        <View style={styles.row}>
          <FormField label="Current (optional)" theme={theme} half>
            <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={currentValue} onChangeText={setCurrentValue} placeholder="e.g. 40000" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" />
          </FormField>
          <FormField label="Target (optional)" theme={theme} half>
            <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={targetValue} onChangeText={setTargetValue} placeholder="e.g. 80000" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" />
          </FormField>
        </View>

        <FormField label="Deadline (optional)" theme={theme}>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textTertiary} />
        </FormField>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={{ marginTop: 20 }}>
          <PrimaryButton theme={theme} label="Create goal" onPress={handleCreate} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

function HabitFormModal({ theme, visible, lifeAreas, goals, presetGoalId, activeHabitsCount, onClose, onCreate }: any) {
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState(presetGoalId || '');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [impact, setImpact] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const selectedGoal = goals.find((g: Goal) => g.id === goalId);
  const lifeAreaId = selectedGoal?.life_area_id || '';
  const atLimit = activeHabitsCount >= MAX_ACTIVE_HABITS;

  const handleCreate = () => {
    if (!title.trim()) { setError('Habit title is required'); return; }
    if (!goalId) { setError('Select a goal'); return; }
    if (atLimit) { setError(`You can have at most ${MAX_ACTIVE_HABITS} active habits. Focus on what matters most.`); return; }
    onCreate({ title: title.trim(), goal_id: goalId, life_area_id: lifeAreaId, frequency, estimated_impact: impact });
    setTitle(''); setGoalId(presetGoalId || ''); setFrequency('daily'); setImpact(50); setError(null);
  };

  return (
    <ModalSheet theme={theme} visible={visible} title="Create Habit" onClose={onClose}>
      <ScrollView>
        {atLimit && (
          <View style={[styles.warningBox, { backgroundColor: theme.colors.warning + '20' }]}>
            <AlertCircle size={16} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              You have {activeHabitsCount} active habits. Focus on a few habits for better results.
            </Text>
          </View>
        )}

        <FormField label="Habit title" theme={theme}>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={title} onChangeText={setTitle} placeholder="e.g. Learn freelancing for 20 minutes" placeholderTextColor={theme.colors.textTertiary} />
        </FormField>

        <FormField label="Goal" theme={theme}>
          <View style={styles.chipRow}>
            {goals.map((goal: Goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.chip, goalId === goal.id ? { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                onPress={() => setGoalId(goal.id)}
              >
                <Text style={[styles.chipText, { color: theme.colors.text }]} numberOfLines={1}>{goal.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>

        <FormField label="Frequency" theme={theme}>
          <View style={styles.chipRow}>
            {HABIT_FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, frequency === f.value ? { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                onPress={() => setFrequency(f.value as HabitFrequency)}
              >
                <Text style={[styles.chipText, { color: theme.colors.text }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>

        <FormField label={`Estimated impact: ${impact}%`} theme={theme}>
          <Text style={[styles.impactNote, { color: theme.colors.textSecondary }]}>
            Your estimate of how much this habit could contribute. Not a guaranteed result.
          </Text>
        </FormField>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={{ marginTop: 20 }}>
          <PrimaryButton theme={theme} label="Create habit" onPress={handleCreate} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

function FormField({ label, children, theme, half }: any) {
  return (
    <View style={[styles.field, half && styles.fieldHalf]}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  goalCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth || 0.5, padding: 16, marginBottom: 10 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  goalTitle: { fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 22 },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalDesc: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  valueRow: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  valueText: { fontSize: 13 },
  habitCount: { fontSize: 13, marginTop: 8 },
  expandedContent: { marginTop: 12 },
  habitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth || 0.5, gap: 8 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 14, fontWeight: '500' },
  habitMeta: { fontSize: 12, marginTop: 2 },
  addHabitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, marginTop: 10, gap: 6 },
  addHabitText: { fontSize: 14, fontWeight: '600' },
  statusActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth || 0.5, borderTopColor: '#E5E5E3' },
  statusAction: { fontSize: 13, fontWeight: '500' },
  // Form
  field: { marginBottom: 16 },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 48 },
  row: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 6 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 14, marginTop: 8 },
  warningBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8, marginBottom: 16 },
  warningText: { fontSize: 13, flex: 1 },
  impactNote: { fontSize: 13, lineHeight: 18 },
});
