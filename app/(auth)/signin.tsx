import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import { syncRemoteToLocal } from '@/services/supabase/sync';
import { fetchProfile } from '@/services/supabase/repositories';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    // Check onboarding status
    const currentUserId = useAuthStore.getState().user?.id;
    if (currentUserId) {
      const profile = await fetchProfile(currentUserId);
      if (profile && !profile.onboarding_completed) {
        router.replace('/onboarding');
      } else {
        await syncRemoteToLocal();
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Sign in to continue your journey.
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PrimaryButton theme={theme} label="Sign in" onPress={handleSignIn} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Don't have an account?
            </Text>
            <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => router.push('/(auth)/signup')}>
              Sign up
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  subtitle: { fontSize: 16, marginTop: 4, lineHeight: 22 },
  form: { marginTop: 32, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15 },
  link: { fontSize: 15, fontWeight: '600', marginLeft: 6 },
});
