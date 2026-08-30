import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ModalSheet } from '@/components/ModalSheet';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useSubscriptionStore, isPremium } from '@/store/subscriptionStore';
import { useLocalDataStore } from '@/store/localDataStore';
import { SubscriptionService, SUBSCRIPTION_PRODUCTS } from '@/services/subscription/SubscriptionService';
import { exportUserData, deleteAccountData } from '@/services/supabase/repositories';
import { syncRemoteToLocal } from '@/services/supabase/sync';
import { ThemeMode } from '@/types';
import { User, Crown, Settings as SettingsIcon, Bell, Shield, Download, Trash2, LogOut, Info, FileText, ChevronRight, Check, Moon, Sun, Monitor } from 'lucide-react-native';

export default function MeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const subState = useSubscriptionStore();
  const premium = isPremium(subState);
  const localStore = useLocalDataStore();
  const [showPremium, setShowPremium] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'Your local data will remain on this device.', [
      { text: 'Cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleExport = async () => {
    if (user?.isGuest) {
      Alert.alert('Create an account', 'Export requires an account to access your cloud data.');
      return;
    }
    setExporting(true);
    try {
      const data = await exportUserData(user!.id);
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: 'My Life Framework Data' });
    } catch {
      Alert.alert('Export failed', 'Something went wrong. Please try again.');
    }
    setExporting(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            if (user?.isGuest) {
              localStore.clearLocalData();
              signOut();
              return;
            }
            setDeleting(true);
            try {
              await deleteAccountData(user!.id);
              localStore.clearLocalData();
              signOut();
            } catch {
              Alert.alert('Deletion failed', 'Something went wrong. Please try again.');
            }
            setDeleting(false);
          },
        },
      ]
    );
  };

  const handleDeleteLocal = () => {
    Alert.alert('Delete local data?', 'This removes all data stored on this device.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => localStore.clearLocalData() },
    ]);
  };

  const handlePurchase = async (productId: string) => {
    const result = await SubscriptionService.purchase(productId);
    if (!result.success) {
      Alert.alert('Subscriptions', result.error || 'Purchase failed. Make sure you are using a development build with RevenueCat configured.');
    }
  };

  const handleRestore = async () => {
    const result = await SubscriptionService.restorePurchases();
    if (!result.success) {
      Alert.alert('Restore purchases', result.error || 'Could not restore purchases.');
    }
  };

  return (
    <ScreenWrapper theme={theme}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
        <ScreenHeader theme={theme} title="Me" subtitle="Profile, settings & privacy" />

        {/* Profile card */}
        <Card theme={theme}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
              <User size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {user?.isGuest ? 'Guest' : 'Account'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {user?.isGuest ? 'Sign up to save your progress' : user?.email}
              </Text>
            </View>
            {!premium && (
              <TouchableOpacity onPress={() => setShowPremium(true)} style={[styles.upgradeBadge, { backgroundColor: theme.colors.premium + '20' }]}>
                <Crown size={14} color={theme.colors.premium} />
                <Text style={[styles.upgradeText, { color: theme.colors.premium }]}>Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Subscription */}
        <SectionTitle theme={theme}>Subscription</SectionTitle>
        <Card theme={theme}>
          <View style={styles.subRow}>
            <View>
              <Text style={[styles.subLabel, { color: theme.colors.text }]}>
                {premium ? 'Premium' : 'Free plan'}
              </Text>
              <Text style={[styles.subDesc, { color: theme.colors.textSecondary }]}>
                {premium ? 'All features unlocked' : 'Upgrade for advanced analytics'}
              </Text>
            </View>
            {!premium && (
              <TouchableOpacity onPress={() => setShowPremium(true)}>
                <Text style={[styles.subLink, { color: theme.colors.primary }]}>Go Premium →</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Settings */}
        <SectionTitle theme={theme}>Settings</SectionTitle>
        <Card theme={theme}>
          <SettingRow theme={theme} icon={<Moon size={18} color={theme.colors.textSecondary} />} label="Theme" value={mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'} onPress={() => setShowTheme(true)} />
          <Divider theme={theme} />
          <SettingRow theme={theme} icon={<Bell size={18} color={theme.colors.textSecondary} />} label="Notifications" value="Manage" onPress={() => Alert.alert('Notifications', 'Notification settings will be available in a future update.')} />
        </Card>

        {/* Privacy & Data */}
        <SectionTitle theme={theme}>Privacy & Data</SectionTitle>
        <Card theme={theme}>
          <SettingRow theme={theme} icon={<Shield size={18} color={theme.colors.textSecondary} />} label="Privacy Policy" onPress={() => setShowPrivacy(true)} />
          <Divider theme={theme} />
          <SettingRow theme={theme} icon={<FileText size={18} color={theme.colors.textSecondary} />} label="Terms of Service" onPress={() => setShowPrivacy(true)} />
          <Divider theme={theme} />
          <SettingRow theme={theme} icon={<Download size={18} color={theme.colors.textSecondary} />} label="Export my data" onPress={handleExport} loading={exporting} />
          <Divider theme={theme} />
          <SettingRow theme={theme} icon={<Trash2 size={18} color={theme.colors.textSecondary} />} label="Delete local data" onPress={handleDeleteLocal} />
          <Divider theme={theme} />
          <SettingRow theme={theme} icon={<Trash2 size={18} color={theme.colors.danger} />} label="Delete account" labelColor={theme.colors.danger} onPress={handleDeleteAccount} loading={deleting} />
        </Card>

        {/* About */}
        <SectionTitle theme={theme}>About</SectionTitle>
        <Card theme={theme}>
          <SettingRow theme={theme} icon={<Info size={18} color={theme.colors.textSecondary} />} label="About Life Framework" onPress={() => setShowAbout(true)} />
        </Card>

        {/* Sign out */}
        <View style={{ marginTop: 20 }}>
          <PrimaryButton theme={theme} label="Sign out" variant="secondary" onPress={handleSignOut} />
        </View>
      </ScrollView>

      {/* Premium modal */}
      <ModalSheet theme={theme} visible={showPremium} title="Go deeper" onClose={() => setShowPremium(false)}>
        <ScrollView>
          <Text style={[styles.premiumSubtitle, { color: theme.colors.textSecondary }]}>
            Understand how your actions are shaping your life.
          </Text>

          <View style={styles.benefitsList}>
            <BenefitItem theme={theme} text="Advanced progress trends" />
            <BenefitItem theme={theme} text="Long-term analytics (90d, 6m, 1y)" />
            <BenefitItem theme={theme} text="Priority alignment analysis" />
            <BenefitItem theme={theme} text="Life balance insights" />
            <BenefitItem theme={theme} text="Custom frameworks" />
            <BenefitItem theme={theme} text="AI Life Coach — Coming Soon" />
          </View>

          <View style={styles.planRow}>
            <TouchableOpacity
              style={[styles.planCard, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
              onPress={() => handlePurchase(SUBSCRIPTION_PRODUCTS.monthly)}
            >
              <Text style={[styles.planName, { color: theme.colors.text }]}>Monthly</Text>
              <Text style={[styles.planPrice, { color: theme.colors.text }]}>$4.99/mo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planCard, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
              onPress={() => handlePurchase(SUBSCRIPTION_PRODUCTS.annual)}
            >
              <View style={styles.planBest}>
                <Text style={[styles.planBestText, { color: theme.colors.primary }]}>BEST VALUE</Text>
              </View>
              <Text style={[styles.planName, { color: theme.colors.text }]}>Annual</Text>
              <Text style={[styles.planPrice, { color: theme.colors.primary }]}>$29.99/yr</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleRestore} style={{ marginTop: 16 }}>
            <Text style={[styles.restoreLink, { color: theme.colors.textSecondary }]}>Restore purchases</Text>
          </TouchableOpacity>

          <Text style={[styles.premiumNote, { color: theme.colors.textTertiary }]}>
            Subscriptions are managed through your app store. Cancel anytime.
          </Text>
        </ScrollView>
      </ModalSheet>

      {/* Theme modal */}
      <ModalSheet theme={theme} visible={showTheme} title="Theme" onClose={() => setShowTheme(false)}>
        <View>
          {([
            { value: 'system', label: 'System', icon: <Monitor size={18} color={theme.colors.textSecondary} /> },
            { value: 'light', label: 'Light', icon: <Sun size={18} color={theme.colors.textSecondary} /> },
            { value: 'dark', label: 'Dark', icon: <Moon size={18} color={theme.colors.textSecondary} /> },
          ] as const).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.themeRow, { borderColor: theme.colors.border }]}
              onPress={() => { setMode(opt.value as ThemeMode); setShowTheme(false); }}
            >
              {opt.icon}
              <Text style={[styles.themeLabel, { color: theme.colors.text }]}>{opt.label}</Text>
              {mode === opt.value && <Check size={18} color={theme.colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </ModalSheet>

      {/* Privacy modal */}
      <ModalSheet theme={theme} visible={showPrivacy} title="Privacy & Terms" onClose={() => setShowPrivacy(false)}>
        <ScrollView>
          <Text style={[styles.legalTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
          <Text style={[styles.legalText, { color: theme.colors.textSecondary }]}>
            Life Framework is designed to help you live intentionally. We respect your privacy.{"\n\n"}
            • Your life assessment, goals, habits, reflections, and time entries are stored securely in our database.{"\n"}
            • Your data is protected by Row Level Security — only you can access your own records.{"\n"}
            • We do not sell your personal data.{"\n"}
            • Analytics events are limited to app usage (e.g. "goal created") and never include your private notes, reflections, or financial details.{"\n"}
            • Subscription status is managed by RevenueCat and your app store.{"\n"}
            • You can export or delete your data at any time from this screen.{"\n\n"}
            For questions about your data, contact support before publishing your app.
          </Text>

          <Text style={[styles.legalTitle, { color: theme.colors.text, marginTop: 20 }]}>Terms of Service</Text>
          <Text style={[styles.legalText, { color: theme.colors.textSecondary }]}>
            Life Framework is a tool for self-reflection and intentional living.{"\n\n"}
            • The app provides personal assessment tools, not professional advice.{"\n"}
            • Life scores are your own subjective assessment and do not represent your worth.{"\n"}
            • The app is not a substitute for professional medical, mental health, or financial advice.{"\n"}
            • Subscription payments are processed by your app store.{"\n"}
            • You may cancel your subscription at any time through your app store settings.
          </Text>
        </ScrollView>
      </ModalSheet>

      {/* About modal */}
      <ModalSheet theme={theme} visible={showAbout} title="About" onClose={() => setShowAbout(false)}>
        <View>
          <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>Life Framework</Text>
          <Text style={[styles.aboutVersion, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>
            Be intentional with your time. Focus on what matters to you instead of unconsciously letting time disappear.{"\n\n"}
            The app helps you understand what matters, where you stand, where you want to go, and what small actions you can take today.
          </Text>
        </View>
      </ModalSheet>
    </ScreenWrapper>
  );
}

function SectionTitle({ theme, children }: any) {
  return <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{children}</Text>;
}

function SettingRow({ theme, icon, label, value, onPress, loading, labelColor }: any) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={loading}>
      {icon}
      <Text style={[styles.settingLabel, { color: labelColor || theme.colors.text }]}>{label}</Text>
      {value && <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>{value}</Text>}
      {loading ? <Text style={{ color: theme.colors.textTertiary }}>...</Text> : <ChevronRight size={16} color={theme.colors.textTertiary} />}
    </TouchableOpacity>
  );
}

function Divider({ theme }: any) {
  return <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />;
}

function BenefitItem({ theme, text }: any) {
  return (
    <View style={styles.benefitItem}>
      <View style={[styles.benefitCheck, { backgroundColor: theme.colors.primary }]}>
        <Check size={14} color="#fff" />
      </View>
      <Text style={[styles.benefitText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 17, fontWeight: '600' },
  profileEmail: { fontSize: 14, marginTop: 2 },
  upgradeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  upgradeText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { fontSize: 16, fontWeight: '500' },
  subDesc: { fontSize: 13, marginTop: 2 },
  subLink: { fontSize: 14, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingLabel: { flex: 1, fontSize: 15 },
  settingValue: { fontSize: 14 },
  divider: { height: 1, marginVertical: 2 },
  // Premium
  premiumSubtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  benefitsList: { gap: 12, marginBottom: 24 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  benefitText: { fontSize: 15, flex: 1 },
  planRow: { flexDirection: 'row', gap: 12 },
  planCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', position: 'relative' },
  planBest: { position: 'absolute', top: 6, right: 6 },
  planBestText: { fontSize: 9, fontWeight: '700' },
  planName: { fontSize: 16, fontWeight: '600' },
  planPrice: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  restoreLink: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  premiumNote: { fontSize: 12, marginTop: 12, textAlign: 'center', lineHeight: 16 },
  // Theme
  themeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth || 0.5, gap: 12 },
  themeLabel: { flex: 1, fontSize: 16 },
  // Legal
  legalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  legalText: { fontSize: 14, lineHeight: 22 },
  // About
  aboutTitle: { fontSize: 24, fontWeight: '700' },
  aboutVersion: { fontSize: 14, marginTop: 4 },
  aboutText: { fontSize: 15, lineHeight: 22, marginTop: 16 },
});
