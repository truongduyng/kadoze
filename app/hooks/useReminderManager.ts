import { useState, useCallback, useEffect } from 'react';
import { storage, STORAGE_KEYS, type ReminderState } from '@/lib/storage';
import {
  hasNotificationPermissionAsync,
  registerForPushNotificationsAsync,
  scheduleRepeatingNotification,
  cancelNotification,
} from '@/lib/notifications';

const HABIT_DEFAULTS: ReminderState   = { enabled: false, hour: 9,  minute: 0 };
const EVENING_DEFAULTS: ReminderState = { enabled: false, hour: 21, minute: 0 };

function readHabitState(): ReminderState {
  return {
    enabled: storage.getBoolean(STORAGE_KEYS.HABIT_REMINDER_ENABLED) ?? HABIT_DEFAULTS.enabled,
    hour:    storage.getNumber(STORAGE_KEYS.HABIT_REMINDER_HOUR)     ?? HABIT_DEFAULTS.hour,
    minute:  storage.getNumber(STORAGE_KEYS.HABIT_REMINDER_MINUTE)   ?? HABIT_DEFAULTS.minute,
  };
}

function readEveningState(): ReminderState {
  return {
    enabled: storage.getBoolean(STORAGE_KEYS.EVENING_REMINDER_ENABLED) ?? EVENING_DEFAULTS.enabled,
    hour:    storage.getNumber(STORAGE_KEYS.EVENING_REMINDER_HOUR)     ?? EVENING_DEFAULTS.hour,
    minute:  storage.getNumber(STORAGE_KEYS.EVENING_REMINDER_MINUTE)   ?? EVENING_DEFAULTS.minute,
  };
}

function hasSavedReminderPreference(): boolean {
  return (
    storage.contains(STORAGE_KEYS.HABIT_REMINDER_ENABLED) ||
    storage.contains(STORAGE_KEYS.EVENING_REMINDER_ENABLED)
  );
}

export function useReminderManager() {
  const [habitState,   setHabitState]   = useState<ReminderState>(readHabitState);
  const [eveningState, setEveningState] = useState<ReminderState>(readEveningState);
  const [isUpdating,   setIsUpdating]   = useState(false);

  const toggleHabitReminder = useCallback(async (
    enabled: boolean,
    hour: number,
    minute: number,
  ) => {
    setIsUpdating(true);
    try {
      const existingId = storage.getString(STORAGE_KEYS.HABIT_REMINDER_ID);
      if (existingId) {
        await cancelNotification(existingId);
        storage.remove(STORAGE_KEYS.HABIT_REMINDER_ID);
      }

      if (enabled) {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        const id = await scheduleRepeatingNotification(
          'Time to check in on your habits',
          'Keep your streak going - open Kadoze and complete your habits.',
          hour,
          minute,
        );
        storage.set(STORAGE_KEYS.HABIT_REMINDER_ID, id);
      }

      storage.set(STORAGE_KEYS.HABIT_REMINDER_ENABLED, enabled);
      storage.set(STORAGE_KEYS.HABIT_REMINDER_HOUR,    hour);
      storage.set(STORAGE_KEYS.HABIT_REMINDER_MINUTE,  minute);
      setHabitState({ enabled, hour, minute });
    } catch (e) {
      console.error('toggleHabitReminder failed:', e);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const toggleEveningReminder = useCallback(async (
    enabled: boolean,
    hour: number,
    minute: number,
  ) => {
    setIsUpdating(true);
    try {
      const existingId = storage.getString(STORAGE_KEYS.EVENING_REMINDER_ID);
      if (existingId) {
        await cancelNotification(existingId);
        storage.remove(STORAGE_KEYS.EVENING_REMINDER_ID);
      }

      if (enabled) {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        const id = await scheduleRepeatingNotification(
          'Time for your evening reset',
          'Wind down and prepare for tomorrow - open Kadoze to start your reset routine.',
          hour,
          minute,
        );
        storage.set(STORAGE_KEYS.EVENING_REMINDER_ID, id);
      }

      storage.set(STORAGE_KEYS.EVENING_REMINDER_ENABLED, enabled);
      storage.set(STORAGE_KEYS.EVENING_REMINDER_HOUR,    hour);
      storage.set(STORAGE_KEYS.EVENING_REMINDER_MINUTE,  minute);
      setEveningState({ enabled, hour, minute });
    } catch (e) {
      console.error('toggleEveningReminder failed:', e);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    if (hasSavedReminderPreference()) return;

    let cancelled = false;

    const enableGrantedReminders = async () => {
      const hasPermission = await hasNotificationPermissionAsync();
      if (!hasPermission || cancelled) return;

      await Promise.all([
        toggleHabitReminder(true, HABIT_DEFAULTS.hour, HABIT_DEFAULTS.minute),
        toggleEveningReminder(true, EVENING_DEFAULTS.hour, EVENING_DEFAULTS.minute),
      ]);
    };

    enableGrantedReminders();

    return () => {
      cancelled = true;
    };
  }, [toggleHabitReminder, toggleEveningReminder]);

  return { habitState, eveningState, isUpdating, toggleHabitReminder, toggleEveningReminder };
}
