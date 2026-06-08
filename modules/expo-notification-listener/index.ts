import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

const ExpoNotificationListener = Platform.OS !== 'web'
  ? requireNativeModule('ExpoNotificationListener')
  : null;

export default {
  isPermissionGranted(): boolean {
    if (!ExpoNotificationListener) return false;
    try {
      return ExpoNotificationListener.isPermissionGranted();
    } catch {
      return false;
    }
  },
  requestPermission(): void {
    if (!ExpoNotificationListener) return;
    try {
      ExpoNotificationListener.requestPermission();
    } catch {}
  },
  getPendingNotifications(): string {
    if (!ExpoNotificationListener) return '[]';
    try {
      return ExpoNotificationListener.getPendingNotifications();
    } catch {
      return '[]';
    }
  },
  updateSupportedApps(apps: string[]): void {
    if (!ExpoNotificationListener) return;
    try {
      ExpoNotificationListener.updateSupportedApps(JSON.stringify(apps));
    } catch {}
  }
};
