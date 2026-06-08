import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Plus,
  RefreshCw,
  Trash2,
  Tv,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../store/useDataStore';
import { Subscription } from '../../types';

// Animated progress bar component for fee waivers
const AnimatedProgressBar = ({ progress, color, border, height = 8 }: { progress: number; color: string; border: string; height?: number }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: border, overflow: 'hidden', marginTop: 10 }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          width: widthInterpolation,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const {
    subscriptions,
    wallets,
    creditCards,
    addSubscription,
    recordSubscriptionPayment,
    deleteSubscription,
  } = useDataStore();

  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => !s.is_deleted);
  }, [subscriptions]);

  // Compute monthly subscription cost
  const monthlyCost = useMemo(() => {
    return activeSubs.reduce((sum, s) => {
      if (s.billing_period === 'monthly') {
        return sum + Number(s.amount);
      } else {
        // yearly split to monthly
        return sum + Number(s.amount) / 12;
      }
    }, 0);
  }, [activeSubs]);

  // CC Annual Fee waivers list
  const activeWaiverCards = useMemo(() => {
    return creditCards.filter((c) => !c.is_deleted && c.annual_fee_waiver_spend && Number(c.annual_fee_waiver_spend) > 0);
  }, [creditCards]);

  // Add sub form state
  const [modalVisible, setModalVisible] = useState(false);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subPeriod, setSubPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [walletId, setWalletId] = useState('');

  const handleAddSub = () => {
    if (!subName || !subAmount || !walletId) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    // Default next billing date to today (so it shows as "Pay" immediately)
    const nextDate = new Date();

    addSubscription({
      name: subName.trim(),
      amount: Number(subAmount),
      billing_period: subPeriod,
      next_billing_date: nextDate.toISOString(),
      payment_wallet_id: walletId,
      is_active: true,
    });

    setModalVisible(false);
    setSubName('');
    setSubAmount('');
    setWalletId('');
  };

  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscriptions</Text>
        <TouchableOpacity
          style={[styles.addSubBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            const defaultWallet = wallets.find((w) => !w.is_deleted);
            if (defaultWallet) setWalletId(defaultWallet.id);
            setModalVisible(true);
          }}
        >
          <Plus color="#FFF" size={18} />
        </TouchableOpacity>
      </View>

      {/* 1. Monthly Cost Card */}
      <Card variant="elevated" style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          MONTHLY SUBSCRIPTIONS COST
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          ₹{monthlyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>/mo</Text>
        </Text>
        <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
          Tracks active Netflix, Prime, Spotify, and system renewals.
        </Text>
      </Card>

      {/* 2. CC Annual Fee Waiver Tracker */}
      {activeWaiverCards.length > 0 && (
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Annual Fee Waivers Progress
          </Text>
          {activeWaiverCards.map((card) => {
            const spent = card.credit_limit - card.available_limit; // Current billing spent as metric or estimate
            // In My Expenses, let's fetch total transactions on this card as overall annual spent
            const totalAnnualSpent = useDataStore.getState().transactions
              .filter((t) => t.wallet_id === card.wallet_id && !t.is_deleted)
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const progressPct = Math.min(100, (totalAnnualSpent / Number(card.annual_fee_waiver_spend)) * 100);

            return (
              <Card key={card.id} variant="outlined" style={styles.waiverCard}>
                <View style={styles.waiverCardHeader}>
                  <Text style={[styles.waiverCardName, { color: colors.text }]}>
                    {card.bank_name} {card.card_name}
                  </Text>
                  <Text style={[styles.waiverFeeText, { color: colors.textSecondary }]}>
                    Fee: ₹{card.annual_fee || 0}
                  </Text>
                </View>

                <View style={styles.waiverProgressBox}>
                  <View style={styles.progressBarLabelRow}>
                    <Text style={[styles.progressBarLabel, { color: colors.textSecondary }]}>
                      Spend ₹{totalAnnualSpent.toLocaleString()} / ₹
                      {Number(card.annual_fee_waiver_spend).toLocaleString()}
                    </Text>
                    <Text style={[styles.progressBarPct, { color: colors.primary }]}>
                      {progressPct.toFixed(0)}%
                    </Text>
                  </View>
                  <AnimatedProgressBar progress={progressPct} color={colors.primary} border={colors.border} />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* 3. Subscriptions List */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16, marginBottom: 12 }]}>
        Active Subscriptions ({activeSubs.length})
      </Text>

      {activeSubs.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <Tv color={colors.textSecondary} size={36} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No subscriptions tracked yet. Click the "+" button at the top to add Netflix, Spotify, etc.
          </Text>
        </Card>
      ) : (
        activeSubs.map((sub) => {
          const billingWallet = wallets.find((w) => w.id === sub.payment_wallet_id);
          const daysLeft = Math.ceil(
            (new Date(sub.next_billing_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );

          return (
            <Card key={sub.id} variant="outlined" style={styles.subCard}>
              <View style={styles.subTopRow}>
                <View>
                  <Text style={[styles.subName, { color: colors.text }]}>{sub.name}</Text>
                  <Text style={[styles.subWallet, { color: colors.textSecondary }]}>
                    Paid via: {billingWallet?.name || 'Unknown account'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.subAmount, { color: colors.text }]}>
                    ₹{sub.amount}
                    <Text style={{ fontSize: 11, fontWeight: '500' }}>/{sub.billing_period === 'monthly' ? 'mo' : 'yr'}</Text>
                  </Text>
                  <View
                    style={[
                      styles.daysBadge,
                      {
                        backgroundColor:
                          daysLeft <= 3
                            ? colors.error + '15'
                            : daysLeft <= 7
                            ? colors.accent + '15'
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysBadgeText,
                        {
                          color:
                            daysLeft <= 3
                              ? colors.error
                              : daysLeft <= 7
                              ? colors.accent
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {daysLeft <= 0 ? 'Due Today' : `${daysLeft} days left`}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.subFooterRow}>
                <Text style={[styles.nextBillingText, { color: colors.textSecondary }]}>
                  Next Bill: {new Date(sub.next_billing_date).toLocaleDateString()}
                </Text>

                <View style={styles.actions}>
                  {daysLeft > 10 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.success + '15', marginRight: 8 }}>
                      <CheckCircle color={colors.success} size={14} style={{ marginRight: 4 }} />
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>Paid</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                      onPress={() => {
                        Alert.alert(
                          'Confirm Payment',
                          `Record ₹${sub.amount} subscription payment for ${sub.name} from ${billingWallet?.name || 'account'}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Confirm', onPress: () => recordSubscriptionPayment(sub.id) },
                          ]
                        );
                      }}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Pay</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert(
                        'Remove Subscription',
                        'Are you sure you want to stop tracking this subscription?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteSubscription(sub.id) },
                        ]
                      );
                    }}
                  >
                    <Trash2 color={colors.error} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* 4. Add Subscription Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Subscription</Text>

            <Text style={[styles.label, { color: colors.text }]}>Subscription Name *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Netflix / Spotify / Prime / ChatGPT"
              placeholderTextColor={colors.textSecondary}
              value={subName}
              onChangeText={setSubName}
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Price Amount *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="₹649"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={subAmount}
                  onChangeText={setSubAmount}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Billing Cycle *</Text>
                <View style={styles.cycleToggle}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      subPeriod === 'monthly' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSubPeriod('monthly')}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: colors.text },
                        subPeriod === 'monthly' && { color: '#FFF', fontWeight: '700' },
                      ]}
                    >
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      subPeriod === 'yearly' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSubPeriod('yearly')}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: colors.text },
                        subPeriod === 'yearly' && { color: '#FFF', fontWeight: '700' },
                      ]}
                    >
                      Yearly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Select Payment Account *</Text>
            <ScrollView style={styles.walletList} showsVerticalScrollIndicator={false}>
              {wallets
                .filter((w) => !w.is_deleted)
                .map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletItem,
                      { borderColor: colors.border },
                      walletId === w.id && {
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setWalletId(w.id)}
                  >
                    <WalletIcon color={w.color} size={18} style={{ marginRight: 8 }} />
                    <Text style={[styles.walletItemText, { color: colors.text }]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Track Subscription"
                onPress={handleAddSub}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  addSubBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionMargin: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  waiverCard: {
    padding: 14,
    marginBottom: 10,
  },
  waiverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waiverCardName: {
    fontSize: 14,
    fontWeight: '800',
  },
  waiverFeeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  waiverProgressBox: {},
  progressBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressBarPct: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  subCard: {
    marginBottom: 12,
    padding: 14,
  },
  subTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subName: {
    fontSize: 15,
    fontWeight: '800',
  },
  subWallet: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  subAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  daysBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    opacity: 0.5,
  },
  subFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextBillingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: 520,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cycleToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  walletList: {
    maxHeight: 140,
    marginBottom: 16,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  walletItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
