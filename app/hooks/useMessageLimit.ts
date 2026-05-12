import { useState, useEffect } from 'react';
import { noteOps } from '@/lib/db';

const SOFT_LIMIT = __DEV__ ? 2 : 10;
const HARD_LIMIT = __DEV__ ? 5 : 30;

interface MessageLimitHook {
  canSendMessage: boolean;
  shouldShowSoftPrompt: boolean;
  shouldShowLimitMessage: boolean;
  messageCount: number;
  remainingMessages: number;
  checkLimit: () => boolean;
  refreshCount: () => Promise<void>;
  refreshAndCheckSoftLimit: () => Promise<boolean>;
  getLimitMessage: () => string;
}

export function useMessageLimit(hasActiveSubscription: (entitlement: string) => boolean): MessageLimitHook {
  const [messageCount, setMessageCount] = useState(0);
  const isPro = hasActiveSubscription('Full Access');

  useEffect(() => {
    loadMessageCount();
  }, []);

  const loadMessageCount = async () => {
    try {
      const count = await noteOps.countAll();
      setMessageCount(count);
    } catch (error) {
      console.error('Error loading message count:', error);
    }
  };

  const refreshCount = async () => {
    await loadMessageCount();
  };

  // Refresh count and immediately return whether soft limit is reached
  const refreshAndCheckSoftLimit = async (): Promise<boolean> => {
    try {
      const count = await noteOps.countAll();
      setMessageCount(count);
      return !isPro && count >= SOFT_LIMIT && count < HARD_LIMIT;
    } catch (error) {
      console.error('Error loading message count:', error);
      return false;
    }
  };

  const canSendMessage = isPro || messageCount < HARD_LIMIT;
  const shouldShowSoftPrompt = !isPro && messageCount >= SOFT_LIMIT && messageCount < HARD_LIMIT;
  const shouldShowLimitMessage = !isPro && messageCount >= HARD_LIMIT;

  const checkLimit = (): boolean => {
    if (isPro) return true;
    return messageCount < HARD_LIMIT;
  };

  const getLimitMessage = (): string => {
    return `You've reached the free limit of ${HARD_LIMIT} journal entries!\n\nUpgrade to Pro to unlock unlimited journaling.`;
  };

  const remainingMessages = Math.max(0, HARD_LIMIT - messageCount);

  return {
    canSendMessage,
    shouldShowSoftPrompt,
    shouldShowLimitMessage,
    messageCount,
    remainingMessages,
    checkLimit,
    refreshCount,
    refreshAndCheckSoftLimit,
    getLimitMessage,
  };
}
