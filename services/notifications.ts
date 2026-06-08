import { Platform } from 'react-native';

let Notifications: any = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  // Configure notification behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Request notifications permissions
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Create Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  return finalStatus === 'granted';
};

// Schedule immediate local notification
export const triggerLocalNotification = async (title: string, body: string) => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.error('Failed to trigger local notification', error);
  }
};

// Schedule future-dated notification
export const scheduleLocalNotification = async (title: string, body: string, date: Date) => {
  if (Platform.OS === 'web') return null;
  if (date.getTime() <= Date.now()) return null; // Can't schedule in past

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: date as any,
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule future local notification', error);
    return null;
  }
};

// Cancel a scheduled notification
export const cancelScheduledNotification = async (id: string) => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.error('Failed to cancel scheduled notification', error);
  }
};

// Schedule daily reminder at 9:30 PM
export const scheduleDailyReminder = async () => {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const existingReminder = scheduled.find(
      (n: any) => n.content.data?.type === 'daily-expense-reminder'
    );
    if (existingReminder) {
      await Notifications.cancelScheduledNotificationAsync(existingReminder.identifier);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Expense Update 📝',
        body: "Don't forget to record today's expenses and keep your balance up to date!",
        sound: true,
        data: { type: 'daily-expense-reminder' },
      },
      trigger: {
        hour: 21,
        minute: 30,
        repeats: true,
      },
    });
    console.log('Daily reminder scheduled with ID:', id);
    return id;
  } catch (error) {
    console.error('Failed to schedule daily reminder notification', error);
    return null;
  }
};
