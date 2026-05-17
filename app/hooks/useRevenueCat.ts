import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesOffering, INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';

const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';

// Global flag to track if RevenueCat is already configured
let isRevenueCatConfigured = false;
let configurationPromise: Promise<void> | null = null;

export function useRevenueCat() {
  const [isConfigured, setIsConfigured] = useState(isRevenueCatConfigured);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(!isRevenueCatConfigured);
  const isMounted = useRef(true);

  const fetchRevenueCatData = useCallback(async () => {
    // Get customer info
    try {
      const info = await Purchases.getCustomerInfo();
      if (isMounted.current) {
        setCustomerInfo(info);
      }
      console.log('Customer info loaded');
    } catch (infoError) {
      console.error('Error fetching customer info:', infoError);
      // Don't throw - allow app to continue with null customerInfo
    }

    // Get offerings
    try {
      const offerings = await Purchases.getOfferings();
      console.log('Offerings:', {
        current: offerings.current?.identifier,
        allCount: Object.keys(offerings.all).length,
      });

      if (offerings.current && isMounted.current) {
        setCurrentOffering(offerings.current);
        console.log('Current offering:', offerings.current.identifier);
        console.log('Packages:', offerings.current.availablePackages.length);
      } else {
        console.warn('No current offering - check RevenueCat dashboard');
      }
    } catch (offeringError) {
      console.error('Error fetching offerings:', offeringError);
      // Don't throw - allow app to continue without offerings
    }
  }, []);

  const initializePurchases = useCallback(async () => {
    try {
      // Validate API key
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
      console.log('RevenueCat API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
      if (!apiKey) {
        console.error('RevenueCat API key is not configured');
        if (isMounted.current) {
          setIsLoading(false);
        }
        return;
      }

      // If already configured globally, just fetch data
      if (isRevenueCatConfigured) {
        console.log('RevenueCat already configured, fetching data...');
        await fetchRevenueCatData();
        if (isMounted.current) {
          setIsConfigured(true);
          setIsLoading(false);
        }
        return;
      }

      // If configuration is in progress, wait for it
      if (configurationPromise) {
        console.log('Waiting for existing RevenueCat configuration...');
        await configurationPromise;
        await fetchRevenueCatData();
        if (isMounted.current) {
          setIsConfigured(true);
          setIsLoading(false);
        }
        return;
      }

      // First time configuration
      console.log('Initializing RevenueCat for the first time...');
      configurationPromise = (async () => {
        try {
          // Set log level for debugging
          if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
          } else {
            Purchases.setLogLevel(LOG_LEVEL.ERROR);
          }

          // Configure RevenueCat
          Purchases.configure({ apiKey });
          console.log('RevenueCat SDK configured successfully');

          isRevenueCatConfigured = true;
        } catch (configError) {
          console.error('Failed to configure RevenueCat:', configError);
          // Don't set isRevenueCatConfigured = true on error
          // This allows the app to continue without crashing
          throw configError;
        }
      })();

      await configurationPromise;

      if (isMounted.current) {
        setIsConfigured(true);
      }

      // Fetch customer info and offerings
      await fetchRevenueCatData();
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      if (isMounted.current) {
        setIsConfigured(false);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchRevenueCatData]);

  useEffect(() => {
    isMounted.current = true;
    initializePurchases();

    return () => {
      isMounted.current = false;
    };
  }, [initializePurchases]);

  const refreshCustomerInfo = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.error('Error refreshing customer info:', error);
      return null;
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  };

  // Dev-only: log out and create a fresh anonymous user (removes subscription)
  const resetUser = async () => {
    try {
      const info = await Purchases.logOut();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.error('Error resetting user:', error);
      throw error;
    }
  };

  const checkTrialEligibility = async (productIdentifiers: string[]): Promise<{ [productId: string]: boolean }> => {
    try {
      if (!isConfigured) return {};
      const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIdentifiers);
      const result: { [productId: string]: boolean } = {};
      for (const [productId, introEligibility] of Object.entries(eligibility)) {
        // ELIGIBLE or UNKNOWN (Android always returns UNKNOWN) → treat as eligible
        result[productId] = (introEligibility as any).status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE;
      }
      return result;
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      return {};
    }
  };

  // Check if user has active subscription
  const hasActiveSubscription = (entitlementIdentifier: string = 'Full Access') => {
    try {
      // If RevenueCat failed to configure, allow access to prevent blocking users
      if (!isConfigured) {
        console.warn('RevenueCat not configured - granting temporary access');
        return true;
      }

      if (!customerInfo) return false;
      if (!customerInfo.entitlements) return false;
      if (!customerInfo.entitlements.active) return false;
      return typeof customerInfo.entitlements.active[entitlementIdentifier] !== 'undefined';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  };

  return {
    isConfigured,
    isLoading,
    customerInfo,
    currentOffering,
    hasActiveSubscription,
    refreshCustomerInfo,
    restorePurchases,
    checkTrialEligibility,
    resetUser,
  };
}
