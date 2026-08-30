import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase/client';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  session: 'loading' | 'guest' | 'authenticated' | 'unauthenticated';
  error: string | null;
  setGuest: () => void;
  setAuthenticated: (user: User) => void;
  setLoading: () => void;
  clear: () => void;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: 'loading',
      error: null,

      setGuest: () => set({ user: { id: 'guest', email: '', isGuest: true }, session: 'guest', error: null }),
      setAuthenticated: (user) => set({ user, session: 'authenticated', error: null }),
      setLoading: () => set({ session: 'loading' }),
      clear: () => set({ user: null, session: 'unauthenticated', error: null }),

      signUp: async (email, password, name) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: name || '' } },
          });
          if (error) return { error: error.message };
          if (data.user) {
            set({ user: { id: data.user.id, email, isGuest: false }, session: 'authenticated', error: null });
          }
          return { error: null };
        } catch (e: any) {
          return { error: e?.message || 'Something went wrong. Please try again.' };
        }
      },

      signIn: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { error: error.message };
          if (data.user) {
            set({ user: { id: data.user.id, email, isGuest: false }, session: 'authenticated', error: null });
          }
          return { error: null };
        } catch (e: any) {
          return { error: e?.message || 'Something went wrong. Please try again.' };
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          // ignore
        }
        get().clear();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
);
