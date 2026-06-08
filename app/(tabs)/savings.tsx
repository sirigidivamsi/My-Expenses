import { useRouter } from 'expo-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Coins,
  DollarSign,
  Plus,
  ShieldCheck,
  TrendingUp,
  Wallet as WalletIcon,
  ArrowLeftRight,
} from 'lucide-react-native';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';
import { SavingsPlan, SavingsPlanType } from '../../types';

// Animated progress bar component for smooth rendering
const AnimatedProgressBar = ({ progress, color, border }: { progress: number; color: string; border: string }) => {
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
    <View style={[styles.progressBarBg, { backgroundColor: border }]}>
      <Animated.View
        style={[
          styles.progressBarFill,
          { width: widthInterpolation, backgroundColor: color },
        ]}
      />
    </View>
  );
};

export default function SavingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const {
    savingsPlans,
    creditCards,
    wallets,
    transactions,
    addSavingsPlan,
    recordSavingsContribution,
    deleteSavingsPlan,
    credits,
    creditPayments,
    getFinancialMetrics,
  } = useDataStore();

  // Dialog State
  const [modalVisible, setModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null);

  // New Plan form fields
  const [planType, setPlanType] = useState<SavingsPlanType>('sip');
  const [planName, setPlanName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [interestRate, setInterestRate] = useState('');

  // Record payment fields
  const [payAmount, setPayAmount] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');

  // Filter out deleted plans
  const activePlans = useMemo(() => {
    return savingsPlans.filter((p) => !p.is_deleted);
  }, [savingsPlans]);

  // Compute Wealth & Asset Metrics via centralized store selector
  const metrics = useMemo(() => {
    const values = getFinancialMetrics();

    // Monthly committed savings contributions
    const monthlyContributionSum = activePlans
      .filter((p) => p.is_active)
      .reduce((sum, p) => sum + Number(p.monthly_contribution), 0);

    return {
      ...values,
      monthlyContributionSum,
    };
  }, [activePlans, getFinancialMetrics]);

  // Handle new plan submission
  const handleCreatePlan = () => {
    if (!planName || !institutionName || !contributionAmount || !targetAmount) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    addSavingsPlan({
      type: planType,
      name: planName.trim(),
      institution_name: institutionName.trim(),
      monthly_contribution: Number(contributionAmount),
      target_amount: Number(targetAmount),
      current_amount: Number(currentAmount) || 0,
      interest_rate: interestRate ? Number(interestRate) : undefined,
      start_date: new Date().toISOString(),
      is_active: true,
    });

    setModalVisible(false);
    // Reset form
    setPlanName('');
    setInstitutionName('');
    setContributionAmount('');
    setTargetAmount('');
    setCurrentAmount('0');
    setInterestRate('');
  };

  // Handle contribution payment submission
  const handleRecordContribution = () => {
    if (!selectedPlan) return;
    if (!payAmount || Number(payAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
      return;
    }
    if (!sourceWalletId) {
      Alert.alert('No Source', 'Please select a source bank/cash account.');
      return;
    }

    recordSavingsContribution(selectedPlan.id, Number(payAmount), sourceWalletId);
    setRecordModalVisible(false);
    setSelectedPlan(null);
    setPayAmount('');
    setSourceWalletId('');
  };

  // Helper for instrument type labels
  const getPlanTypeName = (type: SavingsPlanType) => {
    switch (type) {
      case 'sip':
        return 'Mutual Fund SIP';
      case 'rd':
        return 'Recurring Deposit';
      case 'gold':
        return 'Gold Savings Scheme';
      case 'chit':
        return 'Chit Fund / Chitti';
      case 'fd':
        return 'Fixed Deposit';
      case 'ppf':
        return 'PPF (Public Provident Fund)';
      case 'nps':
        return 'NPS (National Pension)';
      case 'emergency_fund':
        return 'Emergency Fund';
      case 'goal':
        return 'Custom Savings Goal';
      default:
        return 'Investment';
    }
  };

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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* 1. Net Worth Dashboard (Assets vs Liabilities) */}
      <Card variant="elevated" style={styles.netWorthCard}>
        <View style={styles.cardHeader}>
          <Text style={[styles.netWorthTitle, { color: colors.textSecondary }]}>
            YOUR NET WORTH
          </Text>
          <ShieldCheck color={colors.success} size={20} />
        </View>
        <Text style={[styles.netWorthValue, { color: colors.text }]}>
          ₹{metrics.netWorth.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </Text>
        
        <View style={styles.divider} />

        <View style={styles.netWorthRow}>
          <View style={styles.netWorthCol}>
            <View style={styles.metricLabelRow}>
              <ArrowDownRight color={colors.success} size={16} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Total Assets
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              ₹{metrics.totalAssets.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.metricDetail, { color: colors.textSecondary }]}>
              Bank: ₹{metrics.cashAndBank.toLocaleString('en-IN')} + Invested
            </Text>
          </View>

          <View style={styles.netWorthCol}>
            <View style={styles.metricLabelRow}>
              <ArrowUpRight color={colors.error} size={16} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Liabilities
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.error }]}>
              ₹{metrics.totalLiabilities.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.metricDetail, { color: colors.textSecondary }]}>
              Credit Cards & Bills
            </Text>
          </View>
        </View>
      </Card>

      {/* 2. Monthly Contributions Metric Row */}
      <View style={styles.quickMetricsRow}>
        <Card variant="flat" style={[styles.quickMetricCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.quickMetricLabel, { color: colors.textSecondary }]}>
            Monthly Commitment
          </Text>
          <Text style={[styles.quickMetricValue, { color: colors.primary }]}>
            ₹{metrics.monthlyContributionSum.toLocaleString('en-IN')}/mo
          </Text>
        </Card>
        <Card variant="flat" style={[styles.quickMetricCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.quickMetricLabel, { color: colors.textSecondary }]}>
            Active Plans
          </Text>
          <Text style={[styles.quickMetricValue, { color: colors.text }]}>
            {activePlans.length} plans
          </Text>
        </Card>
      </View>

      {/* 3. Monthly Money Allocation Screen / Section */}
      <Card variant="outlined" style={styles.allocationCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Monthly Money Allocation
          </Text>
          <Coins color={colors.primary} size={18} />
        </View>
        <Text style={[styles.allocationSubtitle, { color: colors.textSecondary }]}>
          How your salary is allocated this month:
        </Text>

        {/* Visual Allocation Bar */}
        <View style={styles.allocationBarContainer}>
          <View style={[styles.allocationSegment, { flex: 4, backgroundColor: colors.primary }]} />
          <View style={[styles.allocationSegment, { flex: 2.5, backgroundColor: colors.success }]} />
          <View style={[styles.allocationSegment, { flex: 1.5, backgroundColor: colors.purple }]} />
          <View style={[styles.allocationSegment, { flex: 2, backgroundColor: colors.accent }]} />
        </View>

        <View style={styles.allocationLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Expenses (40%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Mutual Funds (25%)</Text>
          </View>
        </View>
        <View style={styles.allocationLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.purple }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>RD / Gold (15%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Liquidity (20%)</Text>
          </View>
        </View>
      </Card>

      {/* Credits & Loans Shortcut */}
      <Card variant="flat" style={{ backgroundColor: colors.card, marginBottom: 20, padding: 16 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          onPress={() => router.push('/credits')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: colors.primaryLight, padding: 10, borderRadius: 12, marginRight: 12 }}>
              <ArrowLeftRight color={colors.primary} size={20} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                Credits & Loans
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Lent: ₹{metrics.activeCreditsLent.toLocaleString('en-IN')} • Borrowed: ₹{metrics.activeCreditsBorrowed.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <ChevronRight color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </Card>

      {/* 4. Active Savings Plans List */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Active Savings Plans
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Plus color="#FFF" size={16} />
          <Text style={styles.addBtnText}>Add Plan</Text>
        </TouchableOpacity>
      </View>

      {activePlans.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <Coins color={colors.textSecondary} size={36} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No active savings plans registered. Start building wealth today!
          </Text>
        </Card>
      ) : (
        activePlans.map((plan) => {
          const progress = Math.min(100, (Number(plan.current_amount) / plan.target_amount) * 100);
          return (
            <Card variant="elevated" key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  <Text style={[styles.planType, { color: colors.textSecondary }]}>
                    {getPlanTypeName(plan.type)} • {plan.institution_name}
                  </Text>
                </View>
                {plan.interest_rate && (
                  <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.success }]}>
                      {plan.interest_rate}% p.a.
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                    Saved: ₹{Number(plan.current_amount).toLocaleString()} / ₹
                    {plan.target_amount.toLocaleString()}
                  </Text>
                  <Text style={[styles.progressPct, { color: colors.primary }]}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>
                <AnimatedProgressBar progress={progress} color={colors.primary} border={colors.border} />
              </View>

              <View style={styles.divider} />

              {/* Action Rows */}
              <View style={styles.planFooterRow}>
                <Text style={[styles.planFooterAmt, { color: colors.textSecondary }]}>
                  Inst: ₹{plan.monthly_contribution.toLocaleString()}/mo
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.smallRecordBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                    onPress={() => {
                      setSelectedPlan(plan);
                      setPayAmount(plan.monthly_contribution.toString());
                      // default first bank wallet
                      const bankWallet = wallets.find((w) => w.type === 'bank' && !w.is_deleted);
                      if (bankWallet) setSourceWalletId(bankWallet.id);
                      setRecordModalVisible(true);
                    }}
                  >
                    <Text style={[styles.smallRecordBtnText, { color: colors.primary }]}>
                      Pay Installment
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => {
                      Alert.alert(
                        'Remove Plan',
                        'Are you sure you want to stop tracking this savings plan?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteSavingsPlan(plan.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* 5. Add Savings Plan Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Savings Plan</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Instrument Selector */}
              <Text style={[styles.label, { color: colors.text }]}>Investment Type</Text>
              <View style={styles.typeSelectorGrid}>
                {(['sip', 'rd', 'gold', 'chit', 'fd', 'ppf', 'emergency_fund', 'goal'] as SavingsPlanType[]).map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        { borderColor: colors.border },
                        planType === type && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setPlanType(type)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          { color: colors.text },
                          planType === type && { color: '#FFF', fontWeight: '800' },
                        ]}
                      >
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Goal Name *</Text>
              <RNTextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Parag Parikh Flexi Cap / HDFC RD"
                placeholderTextColor={colors.textSecondary}
                value={planName}
                onChangeText={setPlanName}
              />

              <Text style={[styles.label, { color: colors.text }]}>Institution / Organizer Name *</Text>
              <RNTextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. SBI Bank / Tanishq Jewellers"
                placeholderTextColor={colors.textSecondary}
                value={institutionName}
                onChangeText={setInstitutionName}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Monthly Installment *</Text>
                  <RNTextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="₹5,000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={contributionAmount}
                    onChangeText={setContributionAmount}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Target Amount *</Text>
                  <RNTextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="₹1,20,000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Paid till date</Text>
                  <RNTextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="₹15,000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Interest Rate (% p.a.)</Text>
                  <RNTextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. 7.1"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={interestRate}
                    onChangeText={setInterestRate}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Create Goal"
                  onPress={handleCreatePlan}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 6. Record Installment Payment Modal */}
      <Modal visible={recordModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.recordModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Installment Payment</Text>
            {selectedPlan && (
              <Text style={[styles.recordLabel, { color: colors.textSecondary }]}>
                Adding payment for: <Text style={{ color: colors.text, fontWeight: '700' }}>{selectedPlan.name}</Text>
              </Text>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Amount Paid *</Text>
            <RNTextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <Text style={[styles.label, { color: colors.text }]}>Paid From Account *</Text>
            <View style={styles.walletPickerList}>
              {wallets
                .filter((w) => !w.is_deleted && w.type !== 'credit_card')
                .map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletItem,
                      { borderColor: colors.border },
                      sourceWalletId === w.id && {
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setSourceWalletId(w.id)}
                  >
                    <WalletIcon color={w.color} size={18} style={{ marginRight: 8 }} />
                    <Text style={[styles.walletItemText, { color: colors.text }]}>
                      {w.name} (Bal: ₹{Number(w.balance).toLocaleString()})
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setRecordModalVisible(false);
                  setSelectedPlan(null);
                }}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Record Payment"
                onPress={handleRecordContribution}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  netWorthCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  netWorthTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    opacity: 0.5,
  },
  netWorthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  netWorthCol: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricDetail: {
    fontSize: 10,
    fontWeight: '500',
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickMetricCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
  },
  quickMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickMetricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  allocationCard: {
    marginBottom: 24,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  allocationSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 16,
  },
  allocationBarContainer: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  allocationSegment: {
    height: '100%',
  },
  allocationLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  planCard: {
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
  },
  planType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressPct: {
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
  planFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planFooterAmt: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallRecordBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  smallRecordBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trashBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
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
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  recordModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
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
  },
  typeSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  typeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  recordLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletPickerList: {
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
});
