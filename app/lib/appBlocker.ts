import * as DeviceActivity from "react-native-device-activity";

type AuthorizationStatus = "approved" | "denied" | "notDetermined" | "unsupported" | "unknown";

export const APP_BLOCKER_SELECTION_ID = "kadoze-doomscroll-apps";

export type AppBlockerSelectionSummary = {
  supported: boolean;
  applicationCount?: number;
  categoryCount?: number;
  webDomainCount?: number;
  hasSelection?: boolean;
};

function getSummaryFromMetadata(
  metadata?: DeviceActivity.ActivitySelectionMetadata,
): AppBlockerSelectionSummary {
  const applicationCount = metadata?.applicationCount ?? 0;
  const categoryCount = metadata?.categoryCount ?? 0;
  const webDomainCount = metadata?.webDomainCount ?? 0;

  return {
    supported: DeviceActivity.isAvailable(),
    applicationCount,
    categoryCount,
    webDomainCount,
    hasSelection: applicationCount + categoryCount + webDomainCount > 0,
  };
}

function getSelectionInput(): DeviceActivity.ActivitySelectionInput {
  return { activitySelectionId: APP_BLOCKER_SELECTION_ID };
}

function updateDefaultShield() {
  DeviceActivity.updateShield(
    {
      title: "Kadoze locked",
      subtitle: "Finish your main task and daily habits before opening this.",
      primaryButtonLabel: "OK",
      iconSystemName: "lock.fill",
    },
    {
      primary: {
        behavior: "close",
      },
    },
    "Kadoze updated anti-doomscroll shield",
  );
}

function mapAuthorizationStatus(
  status: DeviceActivity.AuthorizationStatusType,
): AuthorizationStatus {
  if (status === DeviceActivity.AuthorizationStatus.approved) return "approved";
  if (status === DeviceActivity.AuthorizationStatus.denied) return "denied";
  if (status === DeviceActivity.AuthorizationStatus.notDetermined) return "notDetermined";
  return "unknown";
}

export const appBlocker = {
  isSupported: DeviceActivity.isAvailable(),

  async requestAuthorization() {
    if (!DeviceActivity.isAvailable()) return false;
    await DeviceActivity.requestAuthorization("individual");
    return true;
  },

  async getAuthorizationStatus(): Promise<AuthorizationStatus> {
    if (!DeviceActivity.isAvailable()) return "unsupported";
    return mapAuthorizationStatus(DeviceActivity.getAuthorizationStatus());
  },

  async presentActivityPicker(): Promise<AppBlockerSelectionSummary> {
    return this.getSelectionSummary();
  },

  async applyShield(): Promise<AppBlockerSelectionSummary> {
    if (!DeviceActivity.isAvailable()) return { supported: false };
    updateDefaultShield();
    DeviceActivity.blockSelection(getSelectionInput(), "Kadoze anti-doomscroll lock active");
    DeviceActivity.refreshManagedSettingsStore();
    return this.getSelectionSummary();
  },

  async clearShield() {
    if (!DeviceActivity.isAvailable()) return false;
    DeviceActivity.unblockSelection(getSelectionInput(), "Kadoze anti-doomscroll lock unlocked");
    DeviceActivity.refreshManagedSettingsStore();
    return true;
  },

  async getSelectionSummary(): Promise<AppBlockerSelectionSummary> {
    if (!DeviceActivity.isAvailable()) return { supported: false };

    try {
      const metadata = DeviceActivity.activitySelectionMetadata(getSelectionInput());
      return getSummaryFromMetadata(metadata);
    } catch {
      return getSummaryFromMetadata();
    }
  },
};

export const AppBlockerSelectionSheet = DeviceActivity.DeviceActivitySelectionSheetViewPersisted;
export type AppBlockerSelectionMetadata = DeviceActivity.ActivitySelectionMetadata;
