import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, DollarSign, Receipt, Tag, ArrowLeft } from 'lucide-react-native';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TextInput } from '../../components/common/TextInput';
import { DatePicker } from '../../components/common/DatePicker';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';

export default function EditTransactionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { categories, wallets, creditCards, transactions, updateTransaction } = useDataStore();

  const transaction = useMemo(() => {
    return transactions.find((t) => t.id === id);
  }, [transactions, id]);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [date, setDate] = useState(new Date());
  const [balanceError, setBalanceError] = useState('');

  React.useEffect(() => {
    if (transaction && type === 'expense' && amount && selectedWalletId) {
      const amt = parseFloat(amount);
      const wallet = wallets.find((w) => w.id === selectedWalletId);
      if (wallet && !isNaN(amt)) {
        const isSameWallet = transaction.wallet_id === selectedWalletId;
        const revertAmount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        const availableBalance = isSameWallet ? wallet.balance + revertAmount : wallet.balance;

        if (wallet.type === 'credit_card') {
          const card = creditCards.find((c) => c.wallet_id === wallet.id);
          if (card) {
            const outstanding = Math.abs(Math.min(0, availableBalance));
            const availableLimit = card.credit_limit - outstanding;
            if (amt > availableLimit) {
              setBalanceError(`Insufficient credit limit! Available limit is ₹${availableLimit.toFixed(2)}`);
            } else {
              setBalanceError('');
            }
          } else {
            setBalanceError('');
          }
        } else {
          if (amt > availableBalance) {
            setBalanceError(`Insufficient balance! Available balance is ₹${availableBalance.toFixed(2)}`);
          } else {
            setBalanceError('');
          }
        }
      } else {
        setBalanceError('');
      }
    } else {
      setBalanceError('');
    }
  }, [amount, selectedWalletId, type, wallets, transaction, creditCards]);

  // Populate data when transaction is loaded
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setSelectedCatId(transaction.category_id);
      setSelectedWalletId(transaction.wallet_id);
      setNotes(transaction.notes || '');
      setTagsInput(transaction.tags ? transaction.tags.join(', ') : '');
      setDate(new Date(transaction.date));
    }
  }, [transaction]);

  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.type === type && !c.is_deleted);
  }, [categories, type]);

  const handleSave = () => {
    if (!transaction) return;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transaction amount.');
      return;
    }

    if (!selectedCatId) {
      Alert.alert('Category Required', 'Please select a valid transaction category.');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Wallet Required', 'Please select a wallet to complete the ledger.');
      return;
    }

    const wallet = wallets.find((w) => w.id === selectedWalletId);
    if (!wallet) return;

    if (type === 'expense') {
      const isSameWallet = transaction.wallet_id === selectedWalletId;
      const revertAmount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      const availableBalance = isSameWallet ? wallet.balance + revertAmount : wallet.balance;

      if (wallet.type === 'credit_card') {
        const card = creditCards.find((c) => c.wallet_id === wallet.id);
        if (card) {
          const outstanding = Math.abs(Math.min(0, availableBalance));
          const availableLimit = card.credit_limit - outstanding;
          if (amt > availableLimit) {
            Alert.alert('Limit Exceeded', 'You cannot record an expense exceeding your available credit limit.');
            return;
          }
        }
      } else {
        if (amt > availableBalance) {
          Alert.alert('Insufficient Balance', 'You cannot record an expense exceeding your available wallet balance.');
          return;
        }
      }
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    updateTransaction(transaction.id, {
      wallet_id: selectedWalletId,
      category_id: selectedCatId,
      amount: amt,
      type,
      date: date.toISOString(),
      notes: notes.trim() || undefined,
      tags,
      payment_method: wallet.name,
    });

    Alert.alert('Updated 🎉', 'Transaction updated successfully!', [
      { text: 'Ok', onPress: () => router.back() },
    ]);
  };

  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Transaction not found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color={colors.text} size={22} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Transaction</Text>
            <View style={{ width: 34 }} />
          </View>

      {/* Type Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            {
              backgroundColor: type === 'expense' ? colors.errorLight : colors.border,
              borderColor: type === 'expense' ? colors.error : 'transparent',
            },
          ]}
          onPress={() => setType('expense')}
        >
          <Text
            style={{
              color: type === 'expense' ? colors.error : colors.textSecondary,
              fontWeight: '800',
            }}
          >
            EXPENSE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            {
              backgroundColor: type === 'income' ? colors.successLight : colors.border,
              borderColor: type === 'income' ? colors.success : 'transparent',
            },
          ]}
          onPress={() => setType('income')}
        >
          <Text
            style={{
              color: type === 'income' ? colors.success : colors.textSecondary,
              fontWeight: '800',
            }}
          >
            INCOME
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <TextInput
        label="Amount (₹)"
        placeholder="0.00"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        leftIcon={<DollarSign color={colors.primary} size={20} />}
        style={{ fontSize: 24, fontWeight: '800', height: 60 }}
      />

      {/* Category selector */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <View style={styles.categoryGrid}>
        {activeCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCatId === cat.id ? colors.primaryLight : colors.card,
                borderColor: selectedCatId === cat.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedCatId(cat.id)}
          >
            <View style={[styles.dot, { backgroundColor: cat.color }]} />
            <Text
              style={{
                color: selectedCatId === cat.id ? colors.primary : colors.text,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wallet selector */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Wallet / Account</Text>
      <View style={styles.categoryGrid}>
        {wallets
          .filter((w) => !w.is_deleted)
          .map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedWalletId === wallet.id ? colors.primaryLight : colors.card,
                  borderColor: selectedWalletId === wallet.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedWalletId(wallet.id)}
            >
              <View style={[styles.dot, { backgroundColor: wallet.color }]} />
              <Text
                style={{
                  color: selectedWalletId === wallet.id ? colors.primary : colors.text,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {wallet.name} (₹{wallet.balance.toFixed(0)})
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Date Picker */}
      <DatePicker label="Date" value={date} onChange={setDate} />

      {/* Notes Input */}
      <TextInput
        label="Notes"
        placeholder="Add details (e.g. Lunch with friends)"
        value={notes}
        onChangeText={setNotes}
        leftIcon={<Receipt color={colors.textSecondary} size={18} />}
      />

      {/* Tags Input */}
      <TextInput
        label="Tags (Comma separated)"
        placeholder="e.g. food, hangout, office"
        value={tagsInput}
        onChangeText={setTagsInput}
        leftIcon={<Tag color={colors.textSecondary} size={18} />}
      />

      {balanceError ? (
        <Text style={{ color: colors.error, fontSize: 13, fontWeight: '700', marginTop: 10, textAlign: 'center' }}>
          {balanceError}
        </Text>
      ) : null}

      <Button title="Save Changes" onPress={handleSave} variant="primary" style={{ marginTop: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
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
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
