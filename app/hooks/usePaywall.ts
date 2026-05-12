import { useState } from 'react';
import { Alert } from 'react-native';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useRevenueCat } from './useRevenueCat';
import { noteOps } from '@/lib/db';

const PRO_WELCOME_MESSAGES = [
  "Welcome to Infinite HONE! 🎉 You're fully unlocked now — unlimited journaling, AI coaching, effect size tracking, everything. Let's make the most of it.",
  "You just unlocked your full potential 🔓 No more limits — I'm here for every thought, every iteration, every breakthrough.",
  "Infinite HONE activated! 🌟 From here on out, there's nothing holding us back. Unlimited entries, full AI support, all the tools. Ready when you are.",
];

export function usePaywall() {
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const { hasActiveSubscription, refreshCustomerInfo, isConfigured, isLoading } = useRevenueCat();

  const showPaywall = () => {
    // Check if RevenueCat is ready before showing paywall
    if (!isConfigured || isLoading) {
      Alert.alert(
        'Loading',
        'Please wait while we load subscription information...',
        [{ text: 'OK' }]
      );
      return;
    }
    setIsPaywallVisible(true);
  };

  const hidePaywall = () => {
    setIsPaywallVisible(false);
  };

  const handlePaywallResult = async (result: typeof PAYWALL_RESULT[keyof typeof PAYWALL_RESULT]) => {
    setIsPaywallVisible(false);

    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      await refreshCustomerInfo();
      const message = PRO_WELCOME_MESSAGES[Math.floor(Math.random() * PRO_WELCOME_MESSAGES.length)];
      try {
        await noteOps.create({
          content: message,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Error creating pro welcome message:', error);
      }
    } else if (result === PAYWALL_RESULT.ERROR) {
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
    // PAYWALL_RESULT.CANCELLED - User cancelled
  };

  return {
    isPaywallVisible,
    showPaywall,
    hidePaywall,
    handlePaywallResult,
    hasActiveSubscription,
    isConfigured,
    isLoading,
  };
}
