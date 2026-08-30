import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/services/supabase/client';
import { SubscriptionService } from '@/services/subscription/SubscriptionService';

export default function RootLayout() {
  useFrameworkReady();
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, session, setAuthenticated, clear, setGuest } = useAuthStore();

  useEffect(() => {
    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthenticated({ id: data.session.user.id, email: data.session.user.email || '', isGuest: false });
        SubscriptionService.initialize(data.session.user.id);
      } else {
        // Check if guest mode was previously selected (persisted in auth store)
        const state = useAuthStore.getState();
        if (state.user?.isGuest) {
          setGuest();
        } else {
          clear();
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthenticated({ id: session.user.id, email: session.user.email || '', isGuest: false });
          await SubscriptionService.initialize(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          clear();
        }
      })();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Route guard
  useEffect(() => {
    if (session === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    if (session === 'unauthenticated' && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/welcome');
    } else if ((session === 'authenticated' || session === 'guest') && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme.mode === 'dark' ? ('light' as any) : ('dark' as any)} />
    </>
  );
}
