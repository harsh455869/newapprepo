import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import { APP_NAME, APP_TAGLINE } from '@/constants';
import { Compass } from 'lucide-react-native';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setGuest = useAuthStore((s) => s.setGuest);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <Compass size={48} color={theme.colors.primary} strokeWidth={1.5} />
        </View>

        <Text style={[styles.appName, { color: theme.colors.text }]}>{APP_NAME}</Text>
        <Text style={[styles.tagline, { color: theme.colors.primary }]}>{APP_TAGLINE}</Text>

        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Understand what matters to you, decide where you want to go, and take small steps every day.
        </Text>

        <View style={styles.spacer} />

        <View style={styles.featureList}>
          <FeatureItem theme={theme} text="Assess 7 areas of your life" />
          <FeatureItem theme={theme} text="Set goals and build habits" />
          <FeatureItem theme={theme} text="Track intentional time" />
          <FeatureItem theme={theme} text="Reflect and adjust weekly" />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton
          theme={theme}
          label="Build My Framework"
          onPress={() => router.push('/(auth)/signup')}
        />
        <View style={styles.row}>
          <Text style={[styles.haveAccount, { color: theme.colors.textSecondary }]}>
            Already have an account?
          </Text>
          <Text
            style={[styles.signIn, { color: theme.colors.primary }]}
            onPress={() => router.push('/(auth)/signin')}
          >
            Sign in
          </Text>
        </View>
        <View style={[styles.divider, { borderColor: theme.colors.border }]} />
        <Text
          style={[styles.guestLink, { color: theme.colors.textTertiary }]}
          onPress={() => {
            setGuest();
            router.replace('/(tabs)');
          }}
        >
          Continue as guest
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ theme, text }: { theme: any; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <Text style={[styles.featureText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 36, fontWeight: '700', lineHeight: 42 },
  tagline: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  description: { fontSize: 16, lineHeight: 24, marginTop: 16 },
  spacer: { height: 32 },
  featureList: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  checkmark: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkmarkText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  featureText: { fontSize: 16 },
  footer: { paddingHorizontal: 0 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  haveAccount: { fontSize: 15 },
  signIn: { fontSize: 15, fontWeight: '600', marginLeft: 6 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth || 0.5, marginVertical: 16 },
  guestLink: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
});
