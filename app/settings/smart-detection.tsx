import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BellRing,
  Check,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TextInput } from '../../components/common/TextInput';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../store/useDataStore';
import ExpoNotificationListener from '../../modules/expo-notification-listener';

const SUPPORTED_APPS_LIST = [
  { name: 'Google Pay', pkg: 'com.google.android.apps.nbu.paisa.user' },
  { name: 'PhonePe', pkg: 'com.phonepe.app' },
  { name: 'Paytm', pkg: 'net.one97.paytm' },
  { name: 'Amazon Pay', pkg: 'com.amazon.mShop.android.shopping' },
  { name: 'HDFC Bank', pkg: 'com.snapwork.hdfc' },
  { name: 'ICICI Bank', pkg: 'com.csg.imobile' },
  { name: 'SBI', pkg: 'com.sbi.anywhere' },
  { name: 'Axis Bank', pkg: 'com.axis.mobile' },
  { name: 'Kotak Bank', pkg: 'com.msf.kbank.mobile' },
  { name: 'IndusInd Bank', pkg: 'com.indusind.mobile' },
];

export default function SmartDetectionSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { categories, smartExpenseSettings, updateSmartExpenseSettings, addRawNotification } = useDataStore();
  const insets = useSafeAreaInsets();

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCatId, setNewCatId] = useState('');

  // Check Android permission on screen mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = () => {
    if (Platform.OS === 'android') {
      const status = ExpoNotificationListener.isPermissionGranted();
      setPermissionGranted(status);
    } else {
      setPermissionGranted(false);
    }
  };

  const handleGrantPermission = () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'Notification listener service is only supported on Android devices.');
      return;
    }
    ExpoNotificationListener.requestPermission();
    // Start polling in background to update status when user returns
    const timer = setInterval(() => {
      const status = ExpoNotificationListener.isPermissionGranted();
      if (status) {
        setPermissionGranted(true);
        clearInterval(timer);
      }
    }, 1500);
    setTimeout(() => clearInterval(timer), 30000); // stop polling after 30s
  };

  const handleToggleFeature = () => {
    const isEnabling = !smartExpenseSettings.enabled;
    if (isEnabling && Platform.OS === 'android' && !permissionGranted) {
      Alert.alert(
        'Permission Required',
        'You must enable Notification Access in settings to read payment receipts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable Settings', onPress: handleGrantPermission },
        ]
      );
      return;
    }

    updateSmartExpenseSettings({ enabled: isEnabling });
  };

  const handleToggleApp = (pkg: string) => {
    let list = [...smartExpenseSettings.supportedApps];
    if (list.includes(pkg)) {
      list = list.filter((p) => p !== pkg);
    } else {
      list.push(pkg);
    }
    updateSmartExpenseSettings({ supportedApps: list });
    if (Platform.OS === 'android') {
      ExpoNotificationListener.updateSupportedApps(list);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !newCatId) {
      Alert.alert('Error', 'Please fill keyword and select category.');
      return;
    }

    const mapping = { ...smartExpenseSettings.autoCategorization };
    mapping[newKeyword.trim().toLowerCase()] = newCatId;

    updateSmartExpenseSettings({ autoCategorization: mapping });
    setNewKeyword('');
    setNewCatId('');
  };

  const handleRemoveKeyword = (kw: string) => {
    const mapping = { ...smartExpenseSettings.autoCategorization };
    delete mapping[kw];
    updateSmartExpenseSettings({ autoCategorization: mapping });
  };


  const expenseCategories = categories.filter((c) => c.type === 'expense' && !c.is_deleted);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Expense Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Toggle Feature Card */}
        <Card variant="elevated" style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.titleRow}>
                <Sparkles color={colors.primary} size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Smart Expense Reader</Text>
              </View>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                Parse transactional notifications locally to suggest expense and income items.
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.switchBtn,
                {
                  backgroundColor: smartExpenseSettings.enabled ? colors.success : colors.border,
                },
              ]}
              onPress={handleToggleFeature}
            >
              <View style={[styles.switchKnob, smartExpenseSettings.enabled && { alignSelf: 'flex-end' }]} />
            </TouchableOpacity>
          </View>

          {/* Android Permission Warning */}
          {Platform.OS === 'android' && (
            <View style={[styles.permissionStatus, { backgroundColor: colors.background, marginTop: 14 }]}>
              {permissionGranted ? (
                <View style={styles.flexRow}>
                  <ShieldCheck color={colors.success} size={18} />
                  <Text style={[styles.permissionStatusText, { color: colors.success }]}>
                    Notification Listener Active
                  </Text>
                </View>
              ) : (
                <View style={[styles.flexRow, { justifyContent: 'space-between', width: '100%' }]}>
                  <View style={styles.flexRow}>
                    <ShieldAlert color={colors.error} size={18} />
                    <Text style={[styles.permissionStatusText, { color: colors.error }]}>
                      Listener Service Disabled
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleGrantPermission}>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>GRANT</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {Platform.OS !== 'android' && (
            <Card variant="flat" style={[styles.fallbackAlert, { backgroundColor: colors.primaryLight, marginTop: 14 }]}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600', lineHeight: 16 }}>
                Note: Native notification interception is Android-only.
              </Text>
            </Card>
          )}
        </Card>


        {/* 3. Configurable Whitelist Apps */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Monitored Package Whitelist</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14, marginBottom: 20 }}>
          <Text style={[styles.helpText, { color: colors.textSecondary, marginBottom: 14 }]}>
            Intercept alerts ONLY from selected services:
          </Text>

          {SUPPORTED_APPS_LIST.map((app) => {
            const active = smartExpenseSettings.supportedApps.includes(app.pkg);
            return (
              <TouchableOpacity
                key={app.pkg}
                style={[styles.appRow, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
                onPress={() => handleToggleApp(app.pkg)}
              >
                <View>
                  <Text style={[styles.appName, { color: colors.text }]}>{app.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 2 }}>{app.pkg}</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.border,
                      backgroundColor: active ? colors.primary : colors.background,
                    },
                  ]}
                >
                  {active && <Check color="#FFF" size={12} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* 4. Auto Categorization Keyword Maps */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Auto Categorization Rules</Text>
        <Card variant="flat" style={{ backgroundColor: colors.card, padding: 14, marginBottom: 40 }}>
          <Text style={[styles.helpText, { color: colors.textSecondary, marginBottom: 14 }]}>
            Map merchant keywords to ledger categories automatically:
          </Text>

          {/* Form to add */}
          <View style={styles.addMappingRow}>
            <TextInput
              placeholder="Keyword (e.g. uber)"
              value={newKeyword}
              onChangeText={setNewKeyword}
              style={styles.addMappingInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPickerRow}>
              {expenseCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catChip,
                    { borderColor: colors.border, backgroundColor: newCatId === c.id ? colors.primaryLight : colors.background },
                    newCatId === c.id && { borderColor: colors.primary },
                  ]}
                  onPress={() => setNewCatId(c.id)}
                >
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={{ color: newCatId === c.id ? colors.primary : colors.text, fontSize: 10, fontWeight: '700' }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.addBtnCircle, { backgroundColor: colors.primary }]}
              onPress={handleAddKeyword}
            >
              <Plus color="#FFF" size={16} />
            </TouchableOpacity>
          </View>

          {/* Current list */}
          <View style={styles.mappingsList}>
            {Object.entries(smartExpenseSettings.autoCategorization).map(([kw, catId]) => {
              const cat = categories.find((c) => c.id === catId);
              return (
                <View
                  key={kw}
                  style={[styles.mappingItem, { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
                >
                  <View style={styles.mappingLeft}>
                    <Text style={[styles.mappingKw, { color: colors.text }]}>{kw}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginHorizontal: 8 }}>→</Text>
                    <View style={styles.mappingCat}>
                      <View style={[styles.dot, { backgroundColor: cat?.color || colors.primary }]} />
                      <Text style={[styles.mappingCatText, { color: colors.text }]}>
                        {cat?.name || 'Category'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveKeyword(kw)} style={styles.trashBtn}>
                    <Trash2 color={colors.error} size={16} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  scrollContent: {
    padding: 16,
  },
  toggleCard: {
    padding: 16,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  switchBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  permissionStatus: {
    padding: 10,
    borderRadius: 10,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  fallbackAlert: {
    padding: 10,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 10,
  },
  simulatorCard: {
    padding: 14,
    marginBottom: 20,
  },
  simulatorTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 11,
    lineHeight: 16,
  },
  simSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  simChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  simPreviewBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  simPreviewApp: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  simPreviewTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  simPreviewBody: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMappingInput: {
    width: '32%',
    height: 38,
    fontSize: 12,
    marginBottom: 0,
    marginRight: 6,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    height: 38,
    marginRight: 6,
  },
  catChip: {
    borderWidth: 1.5,
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  addBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mappingsList: {
    marginTop: 4,
  },
  mappingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  mappingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mappingKw: {
    fontSize: 13,
    fontWeight: '800',
  },
  mappingCat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mappingCatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trashBtn: {
    padding: 6,
  },
});
