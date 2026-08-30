import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
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
import { useSubscriptionStore, isPremium } from '@/store/subscriptionStore';
import { getLifeAreaColor, getLifeAreaName, LIFE_AREAS } from '@/constants/lifeAreas';
import { PROGRESS_PERIODS, FREE_PERIODS, PREMIUM_PERIODS, TIME_CATEGORIES } from '@/constants';
import { getLast7Days, formatDuration, formatDate, getWeekStartISO, todayISO, getDateRange } from '@/utils/date';
import { calculatePriorityAlignment, getMeaningfulDaysThisWeek, getMostActiveArea, getNeglectedAreas } from '@/utils/calculations';
import { TimeCategory, TimeEntry, WeeklyReflection } from '@/types';
import { TrendingUp, Plus, Clock, Calendar, Lock, BookOpen, ChevronRight } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { createTimeEntry, deleteTimeEntry as deleteTimeEntryRemote, createReflection } from '@/services/supabase/repositories';

export default function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { lifeAreas, timeEntries, dailyActions, reflections, addTimeEntry, deleteTimeEntry: deleteLocalEntry, addReflection } = useLocalDataStore();
  const { user } = useAuthStore();
  const subState = useSubscriptionStore();
  const premium = isPremium(subState);

  const [period, setPeriod] = useState('7d');
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const last7 = getLast7Days();

  // Intentional time by day for chart
  const timeByDay = useMemo(() => {
    return last7.map((day) => {
      const minutes = timeEntries
        .filter((e) => e.date === day && e.intentional)
        .reduce((sum, e) => sum + e.duration_minutes, 0);
      return { day, minutes };
    });
  }, [timeEntries, last7]);

  // Time by category
  const timeByCategory = useMemo(() => {
    const range = getDateRange(period as any);
    const entries = timeEntries.filter((e) => e.date >= range.start && e.date <= range.end);
    const map: Record<string, number> = {};
    for (const e of entries) {
      map[e.category] = (map[e.category] || 0) + e.duration_minutes;
    }
    return map;
  }, [timeEntries, period]);

  // Priority alignment
  const alignment = useMemo(() => calculatePriorityAlignment(lifeAreas, timeEntries), [lifeAreas, timeEntries]);
  const meaningfulDays = getMeaningfulDaysThisWeek(dailyActions);
  const mostActive = getMostActiveArea(timeEntries, lifeAreas);
  const neglected = getNeglectedAreas(lifeAreas, timeEntries);

  const maxMinutes = Math.max(...timeByDay.map((d) => d.minutes), 1);
  const totalIntentional = timeByDay.reduce((sum, d) => sum + d.minutes, 0);

  const isPeriodLocked = (p: string) => !premium && PREMIUM_PERIODS.includes(p as any);

  const handleAddTime = async (data: { activity: string; category: TimeCategory; duration_minutes: number; intentional: boolean; life_area_id?: string }) => {
    const entry: TimeEntry = {
      id: uuidv4(),
      user_id: user?.id || 'guest',
      life_area_id: data.life_area_id || null,
      activity: data.activity,
      category: data.category,
      duration_minutes: data.duration_minutes,
      date: todayISO(),
      intentional: data.intentional,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addTimeEntry(entry);
    if (!user?.isGuest) {
      try { await createTimeEntry({ ...entry, id: undefined } as any); } catch {}
    }
    setShowTimeForm(false);
  };

  const handleDeleteTime = async (id: string) => {
    deleteLocalEntry(id);
    if (!user?.isGuest) {
      try { await deleteTimeEntryRemote(id); } catch {}
    }
  };

  const handleSaveReflection = async (data: { what_worked: string; what_didnt: string; next_week: string }) => {
    const ref: WeeklyReflection = {
      id: uuidv4(),
      user_id: user?.id || 'guest',
      week_start: getWeekStartISO(),
      what_worked: data.what_worked || null,
      what_didnt: data.what_didnt || null,
      next_week: data.next_week || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addReflection(ref);
    if (!user?.isGuest) {
      try { await createReflection({ ...ref, id: undefined } as any); } catch {}
    }
    setShowReflection(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScreenWrapper theme={theme}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <ScreenHeader theme={theme} title="Progress" subtitle="See how you're moving" />

        {/* Time tracking button */}
        <TouchableOpacity
          style={[styles.trackBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => setShowTimeForm(true)}
        >
          <Clock size={18} color={theme.colors.primary} />
          <Text style={[styles.trackBtnText, { color: theme.colors.text }]}>Record time</Text>
          <Plus size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PROGRESS_PERIODS.map((p) => {
            const locked = isPeriodLocked(p.value);
            return (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.periodChip,
                  period === p.value
                    ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
                onPress={() => setPeriod(p.value)}
              >
                {locked && <Lock size={10} color={period === p.value ? '#fff' : theme.colors.textTertiary} />}
                <Text style={[styles.periodText, { color: period === p.value ? '#fff' : theme.colors.text }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {premium && (
          <View style={styles.premiumHint}>
            <Text style={[styles.premiumHintText, { color: theme.colors.premium }]}>Premium trends enabled</Text>
          </View>
        )}

        {/* Weekly chart */}
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Intentional time (last 7 days)</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{formatDuration(totalIntentional)} total</Text>
          <View style={styles.chart}>
            {timeByDay.map((d) => (
              <View key={d.day} style={styles.barCol}>
                <View style={styles.barWrap}>
                  <View
                    style={[styles.bar, { height: `${(d.minutes / maxMinutes) * 100}%`, backgroundColor: d.minutes > 0 ? theme.colors.primary : theme.colors.surfaceTertiary }]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.colors.textTertiary }]}>{d.day.slice(5)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Meaningful days */}
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Meaningful days this week</Text>
          <Text style={[styles.bigValue, { color: theme.colors.primary }]}>{meaningfulDays} / 7</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
            {meaningfulDays >= 5 ? "You're building momentum." : meaningfulDays >= 3 ? "Keep going, one day at a time." : "Start again today."}
          </Text>
        </Card>

        {/* Priority Alignment - premium feature */}
        <Card theme={theme}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Priority Alignment</Text>
            {!premium && <Lock size={14} color={theme.colors.textTertiary} />}
          </View>
          {premium ? (
            <View>
              {alignment.length > 0 ? (
                alignment.map((a) => (
                  <View key={a.areaCode} style={styles.alignmentRow}>
                    <View style={styles.alignmentLabel}>
                      <View style={[styles.alignmentDot, { backgroundColor: getLifeAreaColor(a.areaCode) }]} />
                      <Text style={[styles.alignmentName, { color: theme.colors.text }]}>{getLifeAreaName(a.areaCode)}</Text>
                      {a.priority === 'high' && <Text style={[styles.alignmentPriority, { color: getLifeAreaColor(a.areaCode) }]}>HIGH</Text>}
                    </View>
                    <Text style={[styles.alignmentPercent, { color: theme.colors.textSecondary }]}>{a.percentage}%</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No intentional time recorded yet.</Text>
              )}
              {neglected.length > 0 && (
                <Text style={[styles.alignmentNote, { color: theme.colors.textSecondary }]}>
                  You spent less intentional time on your highest priority than you planned.
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text style={[styles.lockedText, { color: theme.colors.textSecondary }]}>
                See how your daily behavior aligns with what you say matters most.
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/me')} style={{ marginTop: 8 }}>
                <Text style={[styles.upgradeLink, { color: theme.colors.premium }]}>Unlock with Premium →</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Time by category */}
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Time by category ({period})</Text>
          {Object.keys(timeByCategory).length > 0 ? (
            Object.entries(timeByCategory).map(([cat, mins]) => (
              <View key={cat} style={styles.catRow}>
                <Text style={[styles.catLabel, { color: theme.colors.text }]}>{TIME_CATEGORIES.find((c) => c.value === cat)?.label || cat}</Text>
                <Text style={[styles.catValue, { color: theme.colors.textSecondary }]}>{formatDuration(mins)}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No time recorded in this period.</Text>
          )}
        </Card>

        {/* Recent time entries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent time entries</Text>
          {timeEntries.slice(0, 5).map((entry) => (
            <View key={entry.id} style={[styles.entryRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.entryInfo}>
                <Text style={[styles.entryActivity, { color: theme.colors.text }]} numberOfLines={1}>{entry.activity}</Text>
                <Text style={[styles.entryMeta, { color: theme.colors.textSecondary }]}>
                  {formatDate(entry.date, 'MMM d')} · {formatDuration(entry.duration_minutes)} · {entry.intentional ? 'Intentional' : 'Unplanned'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteTime(entry.id)}>
                <Text style={[styles.deleteLink, { color: theme.colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          {timeEntries.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No time entries yet.</Text>
          )}
        </View>

        {/* Weekly reflection */}
        <View style={styles.section}>
          <View style={styles.reflectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly reflection</Text>
            <TouchableOpacity onPress={() => setShowReflection(true)}>
              <Plus size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {reflections.length > 0 ? (
            reflections.slice(0, 3).map((ref) => (
              <Card key={ref.id} theme={theme}>
                <Text style={[styles.reflectionDate, { color: theme.colors.textSecondary }]}>
                  Week of {formatDate(ref.week_start)}
                </Text>
                {ref.what_worked && (
                  <View style={styles.reflectionField}>
                    <Text style={[styles.reflectionLabel, { color: theme.colors.primary }]}>What worked</Text>
                    <Text style={[styles.reflectionText, { color: theme.colors.text }]}>{ref.what_worked}</Text>
                  </View>
                )}
                {ref.what_didnt && (
                  <View style={styles.reflectionField}>
                    <Text style={[styles.reflectionLabel, { color: theme.colors.warning }]}>What didn't</Text>
                    <Text style={[styles.reflectionText, { color: theme.colors.text }]}>{ref.what_didnt}</Text>
                  </View>
                )}
                {ref.next_week && (
                  <View style={styles.reflectionField}>
                    <Text style={[styles.reflectionLabel, { color: theme.colors.accent }]}>Next week</Text>
                    <Text style={[styles.reflectionText, { color: theme.colors.text }]}>{ref.next_week}</Text>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <EmptyState
              theme={theme}
              icon={<BookOpen size={28} color={theme.colors.textTertiary} />}
              title="Your first weekly reflection will appear here"
              message="Take 5 minutes to review your week."
              action={<PrimaryButton theme={theme} label="Start reflection" onPress={() => setShowReflection(true)} />}
            />
          )}
        </View>

        {/* AI Coming Soon */}
        <Card theme={theme}>
          <View style={styles.aiHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>AI Life Coach</Text>
            <View style={[styles.comingSoon, { backgroundColor: theme.colors.premium + '20' }]}>
              <Text style={[styles.comingSoonText, { color: theme.colors.premium }]}>COMING SOON</Text>
            </View>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
            Future features: "Review my month", "What should I focus on?", "Plan my next week"
          </Text>
        </Card>
      </ScrollView>

      {showTimeForm && (
        <TimeEntryModal
          theme={theme}
          visible={showTimeForm}
          lifeAreas={lifeAreas}
          onClose={() => setShowTimeForm(false)}
          onSave={handleAddTime}
        />
      )}

      {showReflection && (
        <ReflectionModal
          theme={theme}
          visible={showReflection}
          onClose={() => setShowReflection(false)}
          onSave={handleSaveReflection}
          stats={{
            meaningfulDays,
            totalIntentional,
            mostActive: mostActive ? getLifeAreaName(mostActive) : null,
            neglected: neglected.map(getLifeAreaName),
          }}
        />
      )}
    </ScreenWrapper>
  );
}

function TimeEntryModal({ theme, visible, lifeAreas, onClose, onSave }: any) {
  const [activity, setActivity] = useState('');
  const [category, setCategory] = useState<TimeCategory>('health');
  const [duration, setDuration] = useState('30');
  const [intentional, setIntentional] = useState(true);
  const [lifeAreaId, setLifeAreaId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!activity.trim()) { setError('Activity is required'); return; }
    const dur = Number(duration);
    if (!dur || dur < 1) { setError('Enter a valid duration'); return; }
    onSave({ activity: activity.trim(), category, duration_minutes: dur, intentional, life_area_id: lifeAreaId || undefined });
    setActivity(''); setCategory('health'); setDuration('30'); setIntentional(true); setLifeAreaId(''); setError(null);
  };

  return (
    <ModalSheet theme={theme} visible={visible} title="Record Time" onClose={onClose}>
      <ScrollView>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Activity</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={activity} onChangeText={setActivity} placeholder="What did you do?" placeholderTextColor={theme.colors.textTertiary} />

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Category</Text>
        <View style={styles.chipRow}>
          {TIME_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, category === c.value ? { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
              onPress={() => setCategory(c.value as TimeCategory)}
            >
              <Text style={[styles.chipText, { color: theme.colors.text }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Duration (minutes)</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={duration} onChangeText={setDuration} placeholder="30" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" />

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>Was this intentional?</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity style={[styles.chip, intentional ? { backgroundColor: theme.colors.primary + '30', borderColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]} onPress={() => setIntentional(true)}>
            <Text style={[styles.chipText, { color: theme.colors.text }]}>Intentional</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, !intentional ? { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border } : { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]} onPress={() => setIntentional(false)}>
            <Text style={[styles.chipText, { color: theme.colors.text }]}>Unplanned</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={{ marginTop: 20 }}>
          <PrimaryButton theme={theme} label="Save time entry" onPress={handleSave} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

function ReflectionModal({ theme, visible, onClose, onSave, stats }: any) {
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidnt, setWhatDidnt] = useState('');
  const [nextWeek, setNextWeek] = useState('');

  return (
    <ModalSheet theme={theme} visible={visible} title="Weekly Reflection" onClose={onClose}>
      <ScrollView>
        <View style={styles.reflectionStats}>
          <Text style={[styles.reflectionStat, { color: theme.colors.textSecondary }]}>
            Meaningful days: {stats.meaningfulDays}/7 · Intentional time: {formatDuration(stats.totalIntentional)}
          </Text>
          {stats.mostActive && (
            <Text style={[styles.reflectionStat, { color: theme.colors.textSecondary }]}>
              Most active: {stats.mostActive}
            </Text>
          )}
          {stats.neglected.length > 0 && (
            <Text style={[styles.reflectionStat, { color: theme.colors.textSecondary }]}>
              Neglected: {stats.neglected.join(', ')}
            </Text>
          )}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>What worked?</Text>
        <TextInput style={[styles.input, styles.inputTall, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={whatWorked} onChangeText={setWhatWorked} placeholder="What went well this week?" placeholderTextColor={theme.colors.textTertiary} multiline textAlignVertical="top" />

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>What didn't?</Text>
        <TextInput style={[styles.input, styles.inputTall, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={whatDidnt} onChangeText={setWhatDidnt} placeholder="What didn't go as planned?" placeholderTextColor={theme.colors.textTertiary} multiline textAlignVertical="top" />

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>What matters next week?</Text>
        <TextInput style={[styles.input, styles.inputTall, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.border }]} value={nextWeek} onChangeText={setNextWeek} placeholder="Your focus for next week" placeholderTextColor={theme.colors.textTertiary} multiline textAlignVertical="top" />

        <View style={{ marginTop: 20 }}>
          <PrimaryButton theme={theme} label="Save reflection" onPress={() => { onSave({ what_worked: whatWorked, what_didnt: whatDidnt, next_week: nextWeek }); setWhatWorked(''); setWhatDidnt(''); setNextWeek(''); }} />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth || 0.5, marginBottom: 16, gap: 10 },
  trackBtnText: { flex: 1, fontSize: 15, fontWeight: '500' },
  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  periodChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 4 },
  periodText: { fontSize: 12, fontWeight: '600' },
  premiumHint: { marginBottom: 12 },
  premiumHintText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bigValue: { fontSize: 32, fontWeight: '700', marginTop: 8 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginTop: 16 },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barWrap: { flex: 1, width: 20, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 10, marginTop: 4 },
  alignmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  alignmentLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alignmentDot: { width: 8, height: 8, borderRadius: 4 },
  alignmentName: { fontSize: 14 },
  alignmentPriority: { fontSize: 10, fontWeight: '700' },
  alignmentPercent: { fontSize: 14, fontWeight: '600' },
  alignmentNote: { fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 18 },
  lockedText: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  upgradeLink: { fontSize: 14, fontWeight: '600' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  catLabel: { fontSize: 14 },
  catValue: { fontSize: 14, fontWeight: '500' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth || 0.5, marginBottom: 6 },
  entryInfo: { flex: 1 },
  entryActivity: { fontSize: 14, fontWeight: '500' },
  entryMeta: { fontSize: 12, marginTop: 2 },
  deleteLink: { fontSize: 12, fontWeight: '500' },
  emptyText: { fontSize: 14, marginTop: 4 },
  reflectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reflectionDate: { fontSize: 13, marginBottom: 8 },
  reflectionField: { marginTop: 8 },
  reflectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  reflectionText: { fontSize: 14, lineHeight: 20 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comingSoon: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  comingSoonText: { fontSize: 10, fontWeight: '700' },
  // Form
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 48 },
  inputTall: { minHeight: 80 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 14, marginTop: 8 },
  reflectionStats: { gap: 4 },
  reflectionStat: { fontSize: 13, lineHeight: 18 },
});
