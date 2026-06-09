import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Coins,
  Edit2,
  HelpCircle,
  Info,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react-native';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
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
import { DetectedTransaction } from '../../types';

export default function DetectedTransactionsQueueScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { detectedNotifications, categories, wallets, processDetectedTransaction } = useDataStore();

  // Sync native notifications on screen load
  useEffect(() => {
    useDataStore.getState().syncDetectedNotifications();
  }, []);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit fields for expanded item
  const [editAmount, setEditAmount] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [editWalletId, setEditWalletId] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Pending detected items
  const pendingNotifications = useMemo(() => {
    return detectedNotifications.filter((dn) => dn.status === 'pending');
  }, [detectedNotifications]);

  const activeWallets = wallets.filter((w) => !w.is_deleted && w.type !== 'credit_card');

  // Handle expanding an item to edit/save
  const handleToggleExpand = (item: DetectedTransaction) => {
    if (expandedId === item.id) {
      setExpandedId(null);
    } else {
      setExpandedId(item.id);
      setEditAmount(item.amount.toString());
      setEditMerchant(item.merchant);
      setEditNotes(`Detected via notification from ${item.app_name}`);
      
      // Select pre-classified category
      let preClassifiedCatId = '';
      const merchantLower = item.merchant.toLowerCase();
      
      // 1. Search past transactions in the ledger for any matches on the current merchant name (case-insensitive)
      const storeTransactions = useDataStore.getState().transactions;
      const matchingTx = [...storeTransactions]
        .filter((t) => !t.is_deleted && (
          t.tags.some((tag) => tag.toLowerCase() === merchantLower) ||
          (t.notes && t.notes.toLowerCase().includes(merchantLower))
        ))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (matchingTx) {
        preClassifiedCatId = matchingTx.category_id;
      }

      // 2. If no ledger match, lookup auto-categorization maps from store settings
      if (!preClassifiedCatId) {
        const settings = useDataStore.getState().smartExpenseSettings;
        for (const [kw, cid] of Object.entries(settings.autoCategorization)) {
          if (merchantLower.includes(kw.toLowerCase())) {
            preClassifiedCatId = cid;
            break;
          }
        }
      }

      // 3. Fallbacks
      if (!preClassifiedCatId) {
        preClassifiedCatId = item.transaction_type === 'income'
          ? 'd2222222-2222-2222-2222-222222222201' // Salary
          : 'd1111111-1111-1111-1111-111111111104'; // Bills
      }

      setEditCatId(preClassifiedCatId);

      // Auto select first bank wallet by default
      const bankWallet = activeWallets.find((w) => w.type === 'bank') || activeWallets[0];
      setEditWalletId(bankWallet ? bankWallet.id : '');
    }
  };

  const handleSaveTransaction = (id: string, type: 'income' | 'expense') => {
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    if (!editMerchant.trim()) {
      Alert.alert('Validation Error', 'Please enter a merchant name.');
      return;
    }

    if (!editCatId) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    if (!editWalletId) {
      Alert.alert('Validation Error', 'Please select a wallet.');
      return;
    }

    const wallet = wallets.find((w) => w.id === editWalletId);
    if (!wallet) return;

    // Save to ledger
    processDetectedTransaction(id, 'save', {
      amount: amt,
      wallet_id: editWalletId,
      category_id: editCatId,
      type,
      notes: editNotes.trim(),
      payment_method: wallet.name,
      tags: ['smart-detection', editMerchant.toLowerCase()],
    });

    setExpandedId(null);
    Alert.alert('Logged 🎉', 'Transaction saved to your main ledger!');
  };

  const handleIgnoreNotification = (id: string) => {
    processDetectedTransaction(id, 'ignore');
    setExpandedId(null);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detected Queue</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingNotifications.length} items</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Helper info */}
        <Card variant="flat" style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
          <Info size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Review notification logs. Approve them to add items to your ledger, or ignore them to clear suggestions.
          </Text>
        </Card>

        {/* List of Detected Suggestions */}
        {pendingNotifications.length === 0 ? (
          <Card variant="flat" style={styles.emptyCard}>
            <CheckCircle color={colors.success} size={48} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up! ✨</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              There are no new detected transactions in the queue. Ensure Smart Expense Reader is enabled in Settings to auto-detect payment notifications.
            </Text>
            <Button
              title="Open Settings"
              onPress={() => router.push('/settings/smart-detection')}
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </Card>
        ) : (
          pendingNotifications.map((item) => {
            const isExpanded = expandedId === item.id;
            const isIncome = item.transaction_type === 'income';

            return (
              <View key={item.id} style={styles.listItemContainer}>
                <Card variant="flat" style={[styles.listItem, { backgroundColor: colors.card }]}>
                  {/* Summary Row */}
                  <TouchableOpacity
                    style={styles.summaryRow}
                    onPress={() => handleToggleExpand(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.summaryLeft}>
                      <View style={[styles.appAvatar, { backgroundColor: isIncome ? colors.successLight : colors.errorLight }]}>
                        <Smartphone color={isIncome ? colors.success : colors.error} size={16} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.merchantName, { color: colors.text }]}>{item.merchant}</Text>
                        <Text style={[styles.appSource, { color: colors.textSecondary }]}>
                          via {item.app_name} • {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.summaryRight}>
                      <Text style={[styles.amountVal, { color: isIncome ? colors.success : colors.error }]}>
                        {isIncome ? '+' : '-'} ₹{Number(item.amount).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.clickToReview, { color: colors.primary }]}>
                        {isExpanded ? 'Collapse' : 'Tap to Review'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Edit / Save Panel */}
                  {isExpanded && (
                    <View style={styles.expandedPanel}>
                      <View style={styles.divider} />

                      {/* Display original body */}
                      <View style={[styles.originalBodyBox, { backgroundColor: colors.background }]}>
                        <Text style={[styles.bodyLabel, { color: colors.textSecondary }]}>ORIGINAL NOTIFICATION:</Text>
                        <Text style={[styles.bodyText, { color: colors.text }]}>{item.body}</Text>
                      </View>

                      {/* Editing fields */}
                      <TextInput
                        label="Merchant Name"
                        value={editMerchant}
                        onChangeText={setEditMerchant}
                      />

                      <TextInput
                        label="Amount (₹)"
                        value={editAmount}
                        onChangeText={setEditAmount}
                        keyboardType="numeric"
                      />

                      {/* Category Selection */}
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                        {categories
                          .filter((c) => c.type === item.transaction_type && !c.is_deleted)
                          .map((c) => (
                            <TouchableOpacity
                              key={c.id}
                              style={[
                                styles.pickerChip,
                                { borderColor: colors.border, backgroundColor: editCatId === c.id ? colors.primaryLight : colors.background },
                                editCatId === c.id && { borderColor: colors.primary },
                              ]}
                              onPress={() => setEditCatId(c.id)}
                            >
                              <View style={[styles.dot, { backgroundColor: c.color }]} />
                              <Text style={{ color: editCatId === c.id ? colors.primary : colors.text, fontSize: 11, fontWeight: '700' }}>
                                {c.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>

                      {/* Wallet Selection */}
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Target Account / Wallet</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                        {activeWallets.map((w) => (
                          <TouchableOpacity
                            key={w.id}
                            style={[
                              styles.pickerChip,
                              { borderColor: colors.border, backgroundColor: editWalletId === w.id ? colors.primaryLight : colors.background },
                              editWalletId === w.id && { borderColor: colors.primary },
                            ]}
                            onPress={() => setEditWalletId(w.id)}
                          >
                            <WalletIcon color={w.color} size={12} style={{ marginRight: 6 }} />
                            <Text style={{ color: editWalletId === w.id ? colors.primary : colors.text, fontSize: 11, fontWeight: '700' }}>
                              {w.name} (₹{w.balance.toFixed(0)})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Notes */}
                      <TextInput
                        label="Transaction Notes"
                        value={editNotes}
                        onChangeText={setEditNotes}
                      />

                      {/* Action buttons */}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.ignoreBtn, { borderColor: colors.error }]}
                          onPress={() => handleIgnoreNotification(item.id)}
                        >
                          <XCircle color={colors.error} size={16} />
                          <Text style={[styles.ignoreBtnText, { color: colors.error }]}>DISMISS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.saveBtn, { backgroundColor: colors.success }]}
                          onPress={() => handleSaveTransaction(item.id, item.transaction_type)}
                        >
                          <CheckCircle color="#FFF" size={16} />
                          <Text style={styles.saveBtnText}>LOG TRANSACTION</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </Card>
              </View>
            );
          })
        )}
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
    flex: 1,
    marginLeft: 12,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
  listItemContainer: {
    marginBottom: 12,
  },
  listItem: {
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  appAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '800',
  },
  appSource: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  amountVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  clickToReview: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  expandedPanel: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  originalBodyBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  bodyLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 38,
  },
  pickerChip: {
    borderWidth: 1.5,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  ignoreBtn: {
    flex: 1.2,
    borderWidth: 1.5,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },
  ignoreBtnText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  saveBtn: {
    flex: 2,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  emptyCard: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});
