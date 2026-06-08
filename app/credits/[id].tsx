import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  History,
  Image as ImageIcon,
  Info,
  Phone,
  Plus,
  Trash2,
  User,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../store/useDataStore';

export default function CreditDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const {
    credits,
    creditPayments,
    wallets,
    addCreditPayment,
    deleteCredit,
  } = useDataStore();

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // Find target credit entry
  const credit = useMemo(() => {
    return credits.find((c) => c.id === id && !c.is_deleted);
  }, [credits, id]);

  const activeWallets = wallets.filter((w) => !w.is_deleted && w.type !== 'credit_card');

  // Payments for this credit
  const payments = useMemo(() => {
    if (!credit) return [];
    return creditPayments.filter((p) => p.credit_id === credit.id);
  }, [credit, creditPayments]);

  // Compute metrics
  const metrics = useMemo(() => {
    if (!credit) return { paid: 0, remaining: 0, progress: 0 };
    const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.max(0, Number(credit.amount) - paid);
    const progress = Math.min(100, (paid / Number(credit.amount)) * 100);

    return { paid, remaining, progress };
  }, [credit, payments]);

  if (!credit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Credit record not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const isLent = credit.type === 'lent';
  const isOverdue = credit.due_date && credit.status !== 'closed' && new Date(credit.due_date) < new Date();

  const handleRecordPayment = () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid payment amount.');
      return;
    }

    if (amt > metrics.remaining) {
      Alert.alert(
        'Warning',
        `Entering ₹${amt} exceeds the remaining balance of ₹${metrics.remaining}. Do you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => submitPayment(amt),
          },
        ]
      );
    } else {
      submitPayment(amt);
    }
  };

  const submitPayment = (amountToPay: number) => {
    addCreditPayment(
      {
        credit_id: credit.id,
        amount: amountToPay,
        date: new Date().toISOString(),
        notes: payNotes.trim() || undefined,
      },
      selectedWalletId || undefined
    );

    setPaymentModalVisible(false);
    setPayAmount('');
    setPayNotes('');
    setSelectedWalletId('');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to permanently delete this credit entry? This will also dismiss all scheduled notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCredit(credit.id);
            router.replace('/credits');
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Details</Text>
        <TouchableOpacity style={styles.trashBtn} onPress={handleDelete}>
          <Trash2 color={colors.error} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Identity Card */}
        <Card variant="elevated" style={styles.mainCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: isLent ? colors.successLight : colors.errorLight }]}>
              <User color={isLent ? colors.success : colors.error} size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.personName, { color: colors.text }]}>{credit.person_name}</Text>
              {credit.mobile_number && (
                <View style={styles.phoneRow}>
                  <Phone size={12} color={colors.textSecondary} />
                  <Text style={[styles.phoneText, { color: colors.textSecondary }]}>{credit.mobile_number}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: isLent ? colors.successLight : colors.errorLight },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: isLent ? colors.success : colors.error }]}>
                {isLent ? 'LENT' : 'BORROWED'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Financial Breakdown */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCol}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>TOTAL AMOUNT</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ₹{Number(credit.amount).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.breakdownCol}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>REMAINING</Text>
              <Text style={[styles.breakdownValue, { color: isLent ? colors.success : colors.error }]}>
                ₹{metrics.remaining.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Paid Back: ₹{metrics.paid.toLocaleString()} ({metrics.progress.toFixed(0)}%)
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${metrics.progress}%`, backgroundColor: isLent ? colors.success : colors.error },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Info list */}
        <Card variant="flat" style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Info size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status:</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    credit.status === 'closed'
                      ? colors.success
                      : credit.status === 'partially_paid'
                      ? colors.primary
                      : colors.warning,
                  fontWeight: '800',
                },
              ]}
            >
              {credit.status.toUpperCase().replace('_', ' ')}
            </Text>
          </View>

          {credit.reason && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Info size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Reason:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{credit.reason}</Text>
            </View>
          )}

          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Calendar size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Logged Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(credit.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {credit.due_date && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Clock size={16} color={isOverdue ? colors.error : colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.infoLabel, { color: isOverdue ? colors.error : colors.textSecondary }]}>Due Date:</Text>
              <Text style={[styles.infoValue, { color: isOverdue ? colors.error : colors.text, fontWeight: isOverdue ? '800' : '600' }]}>
                {new Date(credit.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {isOverdue ? ' (OVERDUE)' : ''}
              </Text>
            </View>
          )}

          {credit.notes && (
            <View style={[styles.infoRow, { marginTop: 12, alignItems: 'flex-start' }]}>
              <Info size={16} color={colors.textSecondary} style={{ marginRight: 10, marginTop: 2 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Notes:</Text>
              <Text style={[styles.infoValue, { color: colors.text, flex: 1 }]}>{credit.notes}</Text>
            </View>
          )}
        </Card>

        {/* Attachment Card */}
        {credit.attachment_url && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attached Receipt</Text>
            <Card variant="flat" style={[styles.imageCard, { backgroundColor: colors.card }]}>
              <Image source={{ uri: credit.attachment_url }} style={styles.attachedImage} />
            </Card>
          </View>
        )}

        {/* Payments History Timeline */}
        <View style={styles.historyHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Repayment History</Text>
          <History size={16} color={colors.textSecondary} />
        </View>

        {payments.length === 0 ? (
          <Card variant="flat" style={styles.emptyCard}>
            <Coins color={colors.textSecondary} size={28} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No payments recorded yet.
            </Text>
          </Card>
        ) : (
          payments.map((p, idx) => (
            <Card variant="flat" key={p.id} style={[styles.paymentItem, { backgroundColor: colors.card }]}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentLeft}>
                  <View style={[styles.indexDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.paymentDate, { color: colors.text }]}>
                    {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={[styles.paymentAmount, { color: isLent ? colors.success : colors.error }]}>
                  {isLent ? '+' : '-'} ₹{Number(p.amount).toLocaleString('en-IN')}
                </Text>
              </View>
              {p.notes && (
                <Text style={[styles.paymentNotes, { color: colors.textSecondary }]}>
                  Note: {p.notes}
                </Text>
              )}
            </Card>
          ))
        )}

        {/* Floating action equivalent btn at bottom */}
        {credit.status !== 'closed' && (
          <Button
            title="Record Repayment"
            onPress={() => {
              setPayAmount(metrics.remaining.toString());
              setPaymentModalVisible(true);
            }}
            variant="primary"
            style={{ marginTop: 24, marginBottom: 40 }}
          />
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Record Repayment</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>
              Specify transaction details for {credit.person_name}. Remaining to pay: ₹{metrics.remaining.toLocaleString()}
            </Text>

            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Amount (₹)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text, height: 70, textAlignVertical: 'top' }]}
              placeholder="Notes (e.g. Paid in Cash, UPI transfer)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
              value={payNotes}
              onChangeText={setPayNotes}
            />

            {/* Wallet Selection */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Deduct/Add from Wallet?
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalWalletRow}>
              <TouchableOpacity
                style={[
                  styles.walletChip,
                  { borderColor: colors.border, backgroundColor: selectedWalletId === '' ? colors.primaryLight : colors.card },
                  selectedWalletId === '' && { borderColor: colors.primary },
                ]}
                onPress={() => setSelectedWalletId('')}
              >
                <Text style={{ color: selectedWalletId === '' ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>
                  Don't sync ledger
                </Text>
              </TouchableOpacity>

              {activeWallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.walletChip,
                    { borderColor: colors.border, backgroundColor: selectedWalletId === w.id ? colors.primaryLight : colors.card },
                    selectedWalletId === w.id && { borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedWalletId(w.id)}
                >
                  <WalletIcon color={w.color} size={12} style={{ marginRight: 6 }} />
                  <Text style={{ color: selectedWalletId === w.id ? colors.primary : colors.text, fontWeight: '700', fontSize: 11 }}>
                    {w.name} (₹{w.balance.toFixed(0)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setPaymentModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save Payment"
                onPress={handleRecordPayment}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
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
  trashBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  mainCard: {
    padding: 16,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  personName: {
    fontSize: 18,
    fontWeight: '800',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    opacity: 0.5,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  infoCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 100,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  imageCard: {
    padding: 8,
    borderRadius: 14,
  },
  attachedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  paymentItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  paymentNotes: {
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalWalletRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  walletChip: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
