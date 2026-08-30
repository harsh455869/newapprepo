import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionStatus } from '@/types';

/**
 * Subscription Service
 *
 * In production this wraps RevenueCat. Since RevenueCat requires a native
 * development build (not available in the in-browser preview), this service
 * provides the architecture with a clean interface that RevenueCat can be
 * plugged into.
 *
 * To integrate RevenueCat:
 * 1. npm install react-native-purchases
 * 2. Configure keys in .env: EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY, EXPO_PUBLIC_REVENUECAT_APPLE_KEY
 * 3. Replace the mock implementations below with actual RevenueCat SDK calls
 * 4. Create a development build with Expo Dev Client to test purchases
 *
 * See: https://www.revenuecat.com/docs/getting-started/installation/expo
 */

const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;

export const SUBSCRIPTION_PRODUCTS = {
  monthly: 'life_framework_monthly',
  annual: 'life_framework_annual',
};

export const ENTITLEMENT_ID = 'premium';

export const isRevenueCatConfigured = Boolean(REVENUECAT_GOOGLE_KEY || REVENUECAT_APPLE_KEY);

export const SubscriptionService = {
  async initialize(userId?: string): Promise<void> {
    if (!isRevenueCatConfigured) {
      useSubscriptionStore.getState().setFree();
      return;
    }
    // Production: Purchases.configure({ apiKey, appUserID: userId })
    useSubscriptionStore.getState().setFree();
  },

  async checkEntitlement(): Promise<boolean> {
    if (!isRevenueCatConfigured) {
      return false;
    }
    // Production: const { customerInfo } = await Purchases.getCustomerInfo()
    // return customerInfo.entitlements.active[ENTITLEMENT_ID] != null
    return false;
  },

  async purchase(productId: string): Promise<{ success: boolean; error?: string }> {
    if (!isRevenueCatConfigured) {
      return {
        success: false,
        error: 'Subscriptions require a development build with RevenueCat configured. See the setup guide.',
      };
    }
    // Production:
    // const offerings = await Purchases.getOfferings()
    // const package = offerings.current?.availablePackages.find(p => p.product.identifier === productId)
    // const { customerInfo } = await Purchases.purchasePackage(package)
    // const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] != null
    return { success: false, error: 'Not configured' };
  },

  async restorePurchases(): Promise<{ success: boolean; status?: SubscriptionStatus; error?: string }> {
    if (!isRevenueCatConfigured) {
      return {
        success: false,
        error: 'Subscriptions require a development build with RevenueCat configured.',
      };
    }
    // Production:
    // const { customerInfo } = await Purchases.restorePurchases()
    // const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] != null
    return { success: false, error: 'Not configured' };
  },

  async signOut(): Promise<void> {
    // Production: Purchases.logOut()
    useSubscriptionStore.getState().setFree();
  },
};
