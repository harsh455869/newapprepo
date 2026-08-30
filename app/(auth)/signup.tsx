import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase/client';
import { fetchProfile, updateProfile } from '@/services/supabase/repositories';
import { syncRemoteToLocal } from '@/services/supabase/sync';
import { migrateGuestDataToAccount } from '@/services/supabase/sync';

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, user } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    if (!email.trim() || !password.trim() || !name.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const wasGuest = user?.isGuest;
    const { error: signUpError } = await signUp(email.trim(), password, name.trim());

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return;
    }

    // If user was a guest, migrate their local data
    if (wasGuest) {
      await migrateGuestDataToAccount();
    } else {
      // Sync profile and set onboarding not completed
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        const profile = await fetchProfile(currentUserId);
        if (profile && !profile.onboarding_completed) {
          // Need to complete onboarding
          router.replace('/onboarding');
          setLoading(false);
          return;
        } else if (profile?.onboarding_completed) {
          await syncRemoteToLocal();
          router.replace('/(tabs)');
          setLoading(false);
          return;
        }
      }
      // Default: go to onboarding
      router.replace('/onboarding');
    }
    setLoading(false);
    router.replace('/onboarding');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Start building your life framework.
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

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
                placeholder="At least 6 characters"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PrimaryButton theme={theme} label="Create account" onPress={handleSignUp} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Already have an account?
            </Text>
            <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => router.push('/(auth)/signin')}>
              Sign in
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
  subtitle: { fontSize: 16, color: '#6B6B6B', marginTop: 4, lineHeight: 22 },
  form: { marginTop: 32, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15 },
  link: { fontSize: 15, fontWeight: '600', marginLeft: 6 },
});
