import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionStatus } from '@/types';

interface SubscriptionState {
  entitlement: 'free' | 'premium';
  status: SubscriptionStatus;
  isLoading: boolean;
  setPremium: (status: SubscriptionStatus) => void;
  setFree: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Subscription store.
 * NOTE: In production, entitlement is verified through RevenueCat.
 * This store caches the last known state. The SubscriptionService
 * is the source of truth and should update this store on app launch.
 */
export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      entitlement: 'free',
      status: 'free',
      isLoading: false,
      setPremium: (status) => set({ entitlement: 'premium', status }),
      setFree: () => set({ entitlement: 'free', status: 'free' }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function isPremium(state: SubscriptionState): boolean {
  return state.entitlement === 'premium' && (state.status === 'active' || state.status === 'grace_period');
}
