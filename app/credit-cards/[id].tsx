import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Gift,
  Info,
  Plus,
  TrendingDown,
  Trash2,
  Wallet as WalletIcon,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';

export default function CreditCardDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();

  const {
    creditCards,
    wallets,
    creditCardStatements,
    creditCardEMIs,
    creditCardRewards,
    recordCreditCardPayment,
    triggerCardStatementGeneration,
    addCreditCardEMI,
    deleteCreditCardEMI,
    deleteCreditCard,
    transactions,
  } = useDataStore();

  const card = useMemo(() => {
    return creditCards.find((c) => c.id === id);
  }, [creditCards, id]);

  const cardWallet = useMemo(() => {
    if (!card) return null;
    return wallets.find((w) => w.id === card.wallet_id);
  }, [wallets, card]);

  // EMIs linked to this card
  const cardEMIs = useMemo(() => {
    return creditCardEMIs.filter((e) => e.card_id === id && !e.is_deleted);
  }, [creditCardEMIs, id]);

  // Statements linked to this card
  const cardStatements = useMemo(() => {
    return creditCardStatements
      .filter((s) => s.card_id === id)
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }, [creditCardStatements, id]);

  // Rewards linked to this card
  const cardRewards = useMemo(() => {
    return creditCardRewards.find((r) => r.card_id === id);
  }, [creditCardRewards, id]);

  // Card specific transactions
  const cardTransactions = useMemo(() => {
    return transactions
      .filter((t) => !t.is_deleted && t.wallet_id === card?.wallet_id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, card?.wallet_id]);

  // Outstanding Calculation
  const outstanding = useMemo(() => {
    if (!cardWallet) return 0;
    // Wallet balance represents cash (negative balance is debt)
    return Math.abs(Math.min(0, Number(cardWallet.balance)));
  }, [cardWallet]);

  // Modal Dialogs
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState<'full' | 'partial' | 'minimum'>('full');
  const [sourceWalletId, setSourceWalletId] = useState('');

  // Add EMI Dialog
  const [emiModalVisible, setEmiModalVisible] = useState(false);
  const [emiName, setEmiName] = useState('');
  const [emiTotalAmount, setEmiTotalAmount] = useState('');
  const [emiMonthlyAmount, setEmiMonthlyAmount] = useState('');
  const [emiTotalMonths, setEmiTotalMonths] = useState('');
  const [emiAPR, setEmiAPR] = useState('');

  if (!card) {
    return (
      <View style={[styles.container, styles.loadingBox, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Card details not found.</Text>
      </View>
    );
  }

  const handleRecordPayment = () => {
    if (!payAmount || Number(payAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    if (!sourceWalletId) {
      Alert.alert('No Source', 'Please select a source bank/cash account.');
      return;
    }

    recordCreditCardPayment(card.id, Number(payAmount), payType, sourceWalletId);
    setPayModalVisible(false);
    setPayAmount('');
    setSourceWalletId('');
  };

  const handleAddEMI = () => {
    if (!emiName || !emiTotalAmount || !emiMonthlyAmount || !emiTotalMonths) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    addCreditCardEMI({
      card_id: card.id,
      purchase_name: emiName.trim(),
      purchase_amount: Number(emiTotalAmount),
      emi_amount: Number(emiMonthlyAmount),
      interest_rate: emiAPR ? Number(emiAPR) : 0,
      total_months: Number(emiTotalMonths),
      remaining_months: Number(emiTotalMonths),
      paid_emis: 0,
      start_date: new Date().toISOString(),
    });

    setEmiModalVisible(false);
    setEmiName('');
    setEmiTotalAmount('');
    setEmiMonthlyAmount('');
    setEmiTotalMonths('');
    setEmiAPR('');
  };

  const handleDeleteCard = () => {
    Alert.alert(
      'Remove Credit Card',
      'Are you sure you want to remove this credit card and all its statement records? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Card',
          style: 'destructive',
          onPress: () => {
            deleteCreditCard(card.id);
            router.back();
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  return (
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Card Details</Text>
        <TouchableOpacity style={styles.trashBtn} onPress={handleDeleteCard}>
          <Trash2 color={colors.error} size={20} />
        </TouchableOpacity>
      </View>

      {/* 1. Digital Card */}
      <View style={styles.cardPreviewBox}>
        <View style={[styles.digitalCard, { backgroundColor: card.card_color }]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.bankNameText}>{card.bank_name}</Text>
            <Text style={styles.cardTypeText}>{card.card_type.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardNameText}>{card.card_name}</Text>
          
          <View style={styles.cardMidRow}>
            <Text style={styles.cardNumberText}>••••  ••••  ••••  {card.last_four}</Text>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardFooterLabel}>Outstanding</Text>
              <Text style={styles.cardFooterVal}>₹{outstanding.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardFooterLabel}>Available Limit</Text>
              <Text style={styles.cardFooterVal}>₹{(card.credit_limit - outstanding).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Billing Cycle & Statement Info */}
      <Card variant="elevated" style={styles.cycleCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cycleCardTitle, { color: colors.text }]}>Billing Cycle Info</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.smallCycleBtn, { backgroundColor: colors.accent + '15', marginRight: 8 }]}
              onPress={() => {
                router.push(`/transaction/add?wallet_id=${card.wallet_id}`);
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800' }}>
                + Add Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallCycleBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                triggerCardStatementGeneration(card.id);
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
                Generate Bill
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cycleGrid}>
          <View style={styles.cycleCol}>
            <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>Statement Day</Text>
            <Text style={[styles.cycleVal, { color: colors.text }]}>Every {card.statement_date}th</Text>
          </View>
          <View style={styles.cycleCol}>
            <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>Due Day</Text>
            <Text style={[styles.cycleVal, { color: colors.primary, fontWeight: '800' }]}>
              Every {card.due_date}th
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Quick Payment Action buttons */}
        {outstanding > 0 ? (
          <View style={styles.paymentActionsBox}>
            <TouchableOpacity
              style={[styles.paymentBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setPayAmount(outstanding.toString());
                setPayType('full');
                const bankWallet = wallets.find((w) => w.type === 'bank' && !w.is_deleted);
                if (bankWallet) setSourceWalletId(bankWallet.id);
                setPayModalVisible(true);
              }}
            >
              <Text style={styles.paymentBtnText}>Pay Bill (₹{outstanding})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentBtnOutlined, { borderColor: colors.primary }]}
              onPress={() => {
                setPayAmount(Math.ceil(outstanding * 0.05).toString());
                setPayType('minimum');
                const bankWallet = wallets.find((w) => w.type === 'bank' && !w.is_deleted);
                if (bankWallet) setSourceWalletId(bankWallet.id);
                setPayModalVisible(true);
              }}
            >
              <Text style={[styles.paymentBtnOutlinedText, { color: colors.primary }]}>
                Pay Min Due
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.paidMessageRow}>
            <Text style={{ color: colors.success, fontSize: 13, fontWeight: '700' }}>
              ✓ Fully paid. No outstanding bill.
            </Text>
          </View>
        )}
      </Card>

      {/* 3. Rewards Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Rewards & Lounges</Text>
      </View>
      <Card variant="flat" style={[styles.rewardsCard, { backgroundColor: colors.card }]}>
        <View style={styles.rewardsRow}>
          <View style={styles.rewardsCol}>
            <Gift color={colors.success} size={18} style={{ marginBottom: 4 }} />
            <Text style={[styles.rewardsVal, { color: colors.text }]}>
              ₹{cardRewards ? cardRewards.cashback_earned.toFixed(0) : '0'}
            </Text>
            <Text style={[styles.rewardsLabel, { color: colors.textSecondary }]}>Cashback Earned</Text>
          </View>

          <View style={styles.rewardsCol}>
            <Gift color={colors.accent} size={18} style={{ marginBottom: 4 }} />
            <Text style={[styles.rewardsVal, { color: colors.text }]}>
              {cardRewards ? cardRewards.points_earned.toFixed(0) : '0'}
            </Text>
            <Text style={[styles.rewardsLabel, { color: colors.textSecondary }]}>Points Earned</Text>
          </View>

          <View style={styles.rewardsCol}>
            <Info color={colors.purple} size={18} style={{ marginBottom: 4 }} />
            <Text style={[styles.rewardsVal, { color: colors.text }]}>
              {cardRewards ? cardRewards.lounge_visits_remaining : '0'}
            </Text>
            <Text style={[styles.rewardsLabel, { color: colors.textSecondary }]}>Lounges Left</Text>
          </View>
        </View>
      </Card>

      {/* 4. EMI Tracker Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active EMIs</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setEmiModalVisible(true)}
        >
          <Plus color="#FFF" size={14} />
          <Text style={styles.addBtnText}>Add EMI</Text>
        </TouchableOpacity>
      </View>

      {cardEMIs.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No active EMIs on this card.
          </Text>
        </Card>
      ) : (
        cardEMIs.map((emi) => (
          <Card key={emi.id} variant="outlined" style={styles.emiCard}>
            <View style={styles.emiHeader}>
              <View>
                <Text style={[styles.emiNameText, { color: colors.text }]}>{emi.purchase_name}</Text>
                <Text style={[styles.emiMonthsText, { color: colors.textSecondary }]}>
                  {emi.total_months - emi.remaining_months} / {emi.total_months} months paid
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteCreditCardEMI(emi.id)}>
                <Trash2 color={colors.error} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.emiDetailRow}>
              <View>
                <Text style={[styles.emiLabel, { color: colors.textSecondary }]}>Monthly EMI</Text>
                <Text style={[styles.emiVal, { color: colors.text }]}>₹{emi.emi_amount}/mo</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.emiLabel, { color: colors.textSecondary }]}>Outstanding Purchase</Text>
                <Text style={[styles.emiVal, { color: colors.text }]}>
                  ₹{(emi.emi_amount * emi.remaining_months).toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}

      {/* 5. Statement History List */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statement History</Text>
      </View>

      {cardStatements.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No statements generated yet.
          </Text>
        </Card>
      ) : (
        cardStatements.map((stmt) => (
          <Card key={stmt.id} variant="outlined" style={styles.stmtHistoryCard}>
            <View style={styles.stmtTopRow}>
              <Text style={[styles.stmtDateText, { color: colors.text }]}>
                Bill Generated: {new Date(stmt.created_at || '').toLocaleDateString()}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      stmt.status === 'paid'
                        ? colors.success + '20'
                        : stmt.status === 'partially_paid'
                        ? colors.accent + '20'
                        : colors.error + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        stmt.status === 'paid'
                          ? colors.success
                          : stmt.status === 'partially_paid'
                          ? colors.accent
                          : colors.error,
                    },
                  ]}
                >
                  {stmt.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.stmtMetrics}>
              <View>
                <Text style={[styles.stmtMetricLabel, { color: colors.textSecondary }]}>
                  Billed Amount
                </Text>
                <Text style={[styles.stmtMetricVal, { color: colors.text }]}>
                  ₹{stmt.statement_amount.toLocaleString()}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.stmtMetricLabel, { color: colors.textSecondary }]}>
                  Paid Amount
                </Text>
                <Text style={[styles.stmtMetricVal, { color: colors.success }]}>
                  ₹{stmt.paid_amount.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}

      {/* 6. Payment Recording Modal */}
      <Modal visible={payModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Credit Card Payment</Text>

            <Text style={[styles.label, { color: colors.text }]}>Amount to Pay *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="₹5,000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <Text style={[styles.label, { color: colors.text }]}>Select Bank Account *</Text>
            <View style={styles.walletList}>
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
                onPress={() => setPayModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Record Payment"
                onPress={handleRecordPayment}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 7. Add EMI Modal */}
      <Modal visible={emiModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Convert Purchase to EMI</Text>

            <Text style={[styles.label, { color: colors.text }]}>Purchase Name *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. MacBook / iPhone / Sofa"
              placeholderTextColor={colors.textSecondary}
              value={emiName}
              onChangeText={setEmiName}
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Total Amount *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="₹90,000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={emiTotalAmount}
                  onChangeText={setEmiTotalAmount}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Monthly EMI *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="₹7,500"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={emiMonthlyAmount}
                  onChangeText={setEmiMonthlyAmount}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Duration (Months) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="12"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={emiTotalMonths}
                  onChangeText={setEmiTotalMonths}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Interest Rate (% p.a.)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. 14%"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={emiAPR}
                  onChangeText={setEmiAPR}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEmiModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save EMI"
                onPress={handleAddEMI}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* 6. Card Transactions */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Card Transactions</Text>
      </View>

      {cardTransactions.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No transactions made with this card.
          </Text>
        </Card>
      ) : (
        cardTransactions.map((item) => {
          const cat = useDataStore.getState().categories.find((c) => c.id === item.category_id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.txItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push({ pathname: '/transaction/edit', params: { id: item.id } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.txName, { color: colors.text }]}>
                  {cat?.name || 'Uncategorized'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {new Date(item.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={[
                    styles.txAmount,
                    { color: item.type === 'income' ? colors.success : colors.error, marginRight: 8 },
                  ]}
                >
                  {item.type === 'income' ? '+' : '-'}₹{Number(item.amount).toFixed(0)}
                </Text>
                <ChevronRight color={colors.textSecondary} size={16} />
              </View>
            </TouchableOpacity>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  trashBtn: {
    padding: 6,
  },
  cardPreviewBox: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  digitalCard: {
    width: '100%',
    height: 180,
    padding: 20,
    justifyContent: 'space-between',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTypeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.8,
  },
  cardNameText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 4,
  },
  cardMidRow: {
    marginVertical: 4,
  },
  cardNumberText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardFooterLabel: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '500',
    opacity: 0.7,
    textTransform: 'uppercase',
  },
  cardFooterVal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cycleCard: {
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cycleCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  smallCycleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cycleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cycleCol: {
    flex: 1,
  },
  cycleLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  cycleVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    opacity: 0.5,
  },
  paymentActionsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  paymentBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  paymentBtnOutlined: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 6,
  },
  paymentBtnOutlinedText: {
    fontSize: 12,
    fontWeight: '800',
  },
  paidMessageRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  rewardsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardsCol: {
    flex: 1,
    alignItems: 'center',
  },
  rewardsVal: {
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 2,
  },
  rewardsLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emiCard: {
    padding: 14,
    marginBottom: 10,
  },
  emiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emiNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  emiMonthsText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  emiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emiLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  emiVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  stmtHistoryCard: {
    padding: 14,
    marginBottom: 10,
  },
  stmtTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stmtDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stmtMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stmtMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  stmtMetricVal: {
    fontSize: 14,
    fontWeight: '700',
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
    maxHeight: 500,
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
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletList: {
    maxHeight: 180,
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
    marginTop: 16,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  txName: {
    fontSize: 14,
    fontWeight: '700',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});
