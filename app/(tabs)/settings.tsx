import { useRouter } from 'expo-router';
import {
  Bell,
  CloudLightning,
  LogOut,
  Moon,
  Palette,
  Shield,
  Trash2,
  User as UserIcon,
  CreditCard,
  Tv,
  Folder,
  Sparkles,
  ListTodo,
  Download,
  Upload,
} from 'lucide-react-native';
import React from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { useSyncStore } from '../../store/useSyncStore';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const { user, isGuest, preferences, updatePreferences, signOut } = useAuthStore();
  const {
    clearAllLocalData,
    transactions,
    detectedNotifications,
    wallets,
    categories,
    importBackupData,
  } = useDataStore();
  const { pendingQueue, clearQueue, isOnline, isSyncing, triggerSync } = useSyncStore();

  const handleExportBackup = async () => {
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        wallets: wallets.filter((w) => !w.is_deleted),
        categories: categories.filter((c) => !c.is_deleted),
        transactions: transactions.filter((t) => !t.is_deleted),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = `MyExpenses_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export My Expenses Backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed ❌', `An error occurred while creating the backup: ${error.message}`);
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsedData = JSON.parse(fileContent);

      if (!parsedData.transactions || !Array.isArray(parsedData.transactions)) {
        Alert.alert(
          'Invalid Backup File ⚠️',
          'The selected file is not a valid My Expenses backup (missing transactions array).'
        );
        return;
      }

      Alert.alert(
        'Confirm Import 📥',
        `This will import:\n• ${parsedData.transactions.length} Transactions\n• ${parsedData.wallets?.length || 0} Wallets\n• ${parsedData.categories?.length || 0} Categories\n\nNew items will be added and synced. Existing records will not be overwritten. Do you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import Data',
            onPress: () => {
              try {
                const importResult = importBackupData({
                  wallets: parsedData.wallets,
                  categories: parsedData.categories,
                  transactions: parsedData.transactions,
                });

                if (importResult.success) {
                  Alert.alert(
                    'Import Successful! 🎉',
                    `Successfully imported:\n• ${importResult.importedTransactions} Transactions\n• ${importResult.importedWallets} New Wallets\n• ${importResult.importedCategories} New Categories\n\nAll imported items have been queued for cloud synchronization.`
                  );
                } else {
                  Alert.alert('Import Failed ❌', 'Failed to import the backup data.');
                }
              } catch (e: any) {
                Alert.alert('Import Error ❌', e.message);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Import failed:', error);
      Alert.alert('Import Failed ❌', `An error occurred while reading the file: ${error.message}`);
    }
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme: mode });
  };

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handlePurgeData = () => {
    Alert.alert(
      'Purge All Data! ⚠️',
      'This will permanently erase all local wallets, transactions, custom categories, and budgets. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: () => {
            clearAllLocalData();
            clearQueue();
            Alert.alert('Reset Successful', 'All local transaction tables have been purged.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight, overflow: 'hidden' }]}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <UserIcon color={colors.primary} size={32} />
          )}
        </View>
        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.full_name || user?.name || 'Guest User'}
          </Text>
          {user?.email && (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {user.email}
            </Text>
          )}
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
            {isGuest 
              ? 'Guest Account' 
              : user?.auth_provider === 'google' 
              ? 'Google Account' 
              : 'Email Account'}
          </Text>
        </View>
      </View>

      {/* Guest Mode CTA Card */}
      {isGuest && (
        <View style={styles.section}>
          <Card variant="elevated" style={[styles.ctaCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaTitle}>Back Up Your Data ☁️</Text>
            <Text style={styles.ctaDesc}>
              Create an account to back up and sync your data across devices.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={async () => {
                await signOut(); // Clears guest and returns to login
                router.replace('/(auth)/login');
              }}
            >
              <Text style={[styles.ctaBtnText, { color: colors.primary }]}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {/* Sync Warning Banner */}
      {!isGuest && pendingQueue.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (isSyncing) return;
              triggerSync();
              Alert.alert('Sync Started 🔄', 'Attempting to sync your local database to the cloud...');
            }}
          >
            <Card 
              variant="flat" 
              style={[
                styles.warningCard, 
                { 
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', 
                  borderColor: colors.warning,
                }
              ]}
            >
              <View style={styles.row}>
                <CloudLightning color={colors.warning} size={22} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.warningTitle, { color: colors.warning }]}>
                    Cloud Sync Pending ⚠️
                  </Text>
                  <Text style={[styles.warningDesc, { color: colors.text }]}>
                    You have <Text style={{ fontWeight: '800' }}>{pendingQueue.length}</Text> record{pendingQueue.length > 1 ? 's' : ''} stored locally on this device that {!isOnline ? 'cannot' : 'have not'} be uploaded to the cloud database.
                    {isSyncing ? ' Sync in progress...' : ' Tap this card to try syncing now.'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>
                    Total local database: {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      )}

      {/* Theme Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance & Theme</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14 }}>
          <View style={styles.row}>
            <View style={styles.iconLabelRow}>
              <Palette color={colors.primary} size={20} style={{ marginRight: 10 }} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Selected Theme</Text>
            </View>
          </View>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: preferences.theme === t ? colors.primaryLight : colors.border,
                    borderColor: preferences.theme === t ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleThemeChange(t)}
              >
                <Text
                  style={{
                    color: preferences.theme === t ? colors.primary : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </View>

      {/* Category Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Local Settings</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14 }}>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/categories')}>
            <Folder color={colors.primary} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>Manage Categories</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Wealth Management Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Wealth Management</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14 }}>
          {/* Credit Card Dashboard Shortcut */}
          <TouchableOpacity 
            style={[styles.actionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingBottom: 14 }]} 
            onPress={() => router.push('/credit-cards')}
          >
            <CreditCard color={colors.primary} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>Manage Credit Cards</Text>
          </TouchableOpacity>

          {/* Subscriptions Tracker Shortcut */}
          <TouchableOpacity style={[styles.actionRow, { paddingTop: 14 }]} onPress={() => router.push('/subscriptions')}>
            <Tv color={colors.accent} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>Manage Subscriptions</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Offline Sync State */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Database Synchronization</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 16 }}>
          <View style={styles.row}>
            <CloudLightning color={colors.accent} size={22} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Sync Status</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {isGuest
                  ? 'Inactive (Guest Mode)'
                  : isSyncing
                  ? `Sync in progress: ${pendingQueue.length} records remaining`
                  : pendingQueue.length > 0
                  ? `${isOnline ? 'Pending sync' : 'Offline'}: ${pendingQueue.length} records waiting for upload`
                  : isOnline
                  ? 'All transaction tables synchronized with cloud databases.'
                  : 'Waiting for connectivity to synchronize records.'}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Backup & Restore */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Backup & Data Transfer</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14 }}>
          {/* Export Backup */}
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingBottom: 14 }]}
            onPress={handleExportBackup}
          >
            <Download color={colors.primary} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>Export Local Backup (JSON) 📤</Text>
          </TouchableOpacity>

          {/* Import Backup */}
          <TouchableOpacity
            style={[styles.actionRow, { paddingTop: 14 }]}
            onPress={handleImportBackup}
          >
            <Upload color={colors.success} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>Import Backup (JSON) 📥</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Notifications Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Settings</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14 }}>
          <TouchableOpacity
            style={[styles.row, { justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingBottom: 14 }]}
            onPress={() => updatePreferences({ notifications_enabled: !preferences.notifications_enabled })}
          >
            <View style={styles.iconLabelRow}>
              <Bell color={colors.purple} size={20} style={{ marginRight: 10 }} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Budget Limit Reminders</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
              {preferences.notifications_enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          {/* Smart Expense Settings Shortcut */}
          <TouchableOpacity 
            style={[styles.actionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 14 }]} 
            onPress={() => router.push('/settings/smart-detection')}
          >
            <Sparkles color={colors.accent} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>Smart Expense Detection</Text>
          </TouchableOpacity>

          {/* Review Queue Shortcut with Badge */}
          <TouchableOpacity 
            style={[styles.row, { justifyContent: 'space-between', paddingTop: 14 }]} 
            onPress={() => router.push('/settings/detected-transactions')}
          >
            <View style={styles.iconLabelRow}>
              <ListTodo color={colors.success} size={20} style={{ marginRight: 12 }} />
              <Text style={[styles.actionRowText, { color: colors.text }]}>Review Detected Transactions</Text>
            </View>
            {detectedNotifications.filter(dn => dn.status === 'pending').length > 0 && (
              <View style={{ backgroundColor: colors.error, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>
                  {detectedNotifications.filter(dn => dn.status === 'pending').length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>
      </View>

      {/* System Actions */}
      <View style={[styles.section, { marginBottom: 60 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Actions</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14 }}>
          {/* Purge Local Data */}
          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]} onPress={handlePurgeData}>
            <Trash2 color={colors.error} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.error }]}>Erase Local Database</Text>
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity style={[styles.actionRow, { paddingTop: 14 }]} onPress={handleSignOut}>
            <LogOut color={colors.textSecondary} size={20} style={{ marginRight: 12 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>
              {isGuest ? 'Exit Guest Mode' : 'Sign Out Account'}
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  ctaCard: {
    padding: 18,
    borderRadius: 16,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  ctaDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 10,
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  warningDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
