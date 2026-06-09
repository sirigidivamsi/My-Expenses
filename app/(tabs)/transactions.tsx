import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Pencil,
  FileText,
} from 'lucide-react-native';
import React, { useMemo, useState, useEffect } from 'react';
import { exportTransactionsToPDF } from '../../utils/pdfExport';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { TextInput } from '../../components/common/TextInput';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';
import { Transaction } from '../../types';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  
  const { transactions, categories, wallets, deleteTransaction } = useDataStore();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<'all' | 'credit_card' | 'cash_bank'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'highest' | 'lowest'>('latest');

  useEffect(() => {
    if (categoryId) {
      setFilterCategory(categoryId);
      setShowFilters(true);
    }
  }, [categoryId]);

  const handleExportPress = () => {
    Alert.alert(
      'Export PDF Report 📄',
      'Select which ledger entries you wish to export to a PDF document:',
      [
        {
          text: 'Current Month Only',
          onPress: async () => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const currentMonthTxs = activeTransactions.filter((t) => {
              const tDate = new Date(t.date);
              return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
            });

            if (currentMonthTxs.length === 0) {
              Alert.alert('No Transactions', 'You have no transactions recorded in the current month.');
              return;
            }

            const monthName = now.toLocaleString('default', { month: 'long' });
            await exportTransactionsToPDF(
              currentMonthTxs,
              categories,
              `Transactions Ledger - ${monthName} ${currentYear}`
            );
          },
        },
        {
          text: 'Total Transactions (All-Time)',
          onPress: async () => {
            if (activeTransactions.length === 0) {
              Alert.alert('No Transactions', 'There are no active transactions in your database.');
              return;
            }

            await exportTransactionsToPDF(
              activeTransactions,
              categories,
              'Complete Transactions Ledger'
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.is_deleted);
  }, [transactions]);

  // Apply filters & search
  const filteredTransactions = useMemo(() => {
    let result = [...activeTransactions];

    // Search Notes, tags, or category names
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
        const catName = cat ? cat.name.toLowerCase() : '';
        const notes = t.notes ? t.notes.toLowerCase() : '';
        const tags = t.tags.join(' ').toLowerCase();
        return catName.includes(q) || notes.includes(q) || tags.includes(q);
      });
    }

    // Filter Type
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }

    // Filter Category
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category_id === filterCategory);
    }

    // Filter Account / Card
    if (filterAccount === 'credit_card') {
      result = result.filter((t) => {
        const wallet = wallets.find((w) => w.id === t.wallet_id);
        return wallet?.type === 'credit_card';
      });
    } else if (filterAccount === 'cash_bank') {
      result = result.filter((t) => {
        const wallet = wallets.find((w) => w.id === t.wallet_id);
        return wallet?.type !== 'credit_card';
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'lowest') return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return result;
  }, [activeTransactions, search, filterType, filterCategory, sortBy, categories]);

  const handleDelete = (txId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to permanently delete this transaction? Your wallet balance will be automatically adjusted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(txId);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <TextInput
            placeholder="Search by category, tags, or notes..."
            value={search}
            onChangeText={setSearch}
            leftIcon={<Search color={colors.textSecondary} size={18} />}
            style={{ height: 44 }}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, { backgroundColor: colors.card, borderColor: colors.border, marginRight: 8 }]}
          onPress={handleExportPress}
        >
          <FileText color={colors.primary} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal color={showFilters ? colors.primary : colors.text} size={18} />
        </TouchableOpacity>
      </View>

      {/* Filter drawer */}
      {showFilters && (
        <Card variant="flat" style={[styles.filterPanel, { backgroundColor: colors.card }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Filter Transactions</Text>
          
          {/* Type Filter */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
          <View style={styles.row}>
            {['all', 'income', 'expense'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.filterChip,
                  { backgroundColor: filterType === t ? colors.primaryLight : colors.border },
                ]}
                onPress={() => setFilterType(t as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: filterType === t ? colors.primary : colors.textSecondary,
                      fontWeight: filterType === t ? '800' : '600',
                    },
                  ]}
                >
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Filter */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: filterCategory === 'all' ? colors.primaryLight : colors.border },
              ]}
              onPress={() => setFilterCategory('all')}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: filterCategory === 'all' ? colors.primary : colors.textSecondary,
                    fontWeight: filterCategory === 'all' ? '800' : '600',
                  },
                ]}
              >
                ALL
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: filterCategory === cat.id ? colors.primaryLight : colors.border },
                ]}
                onPress={() => setFilterCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: filterCategory === cat.id ? colors.primary : colors.textSecondary,
                      fontWeight: filterCategory === cat.id ? '800' : '600',
                    },
                  ]}
                >
                  {cat.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Account/Card Filter */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account / Card</Text>
          <View style={styles.row}>
            {[
              { id: 'all', label: 'ALL ACCOUNTS' },
              { id: 'credit_card', label: 'CREDIT CARDS ONLY' },
              { id: 'cash_bank', label: 'CASH & BANK ONLY' }
            ].map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: filterAccount === acc.id ? colors.primaryLight : colors.border },
                ]}
                onPress={() => setFilterAccount(acc.id as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: filterAccount === acc.id ? colors.primary : colors.textSecondary,
                      fontWeight: filterAccount === acc.id ? '800' : '600',
                    },
                  ]}
                >
                  {acc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort Filter */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Sort By</Text>
          <View style={styles.row}>
            {['latest', 'oldest', 'highest', 'lowest'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterChip,
                  { backgroundColor: sortBy === s ? colors.primaryLight : colors.border },
                ]}
                onPress={() => setSortBy(s as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: sortBy === s ? colors.primary : colors.textSecondary,
                      fontWeight: sortBy === s ? '800' : '600',
                    },
                  ]}
                >
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      {/* List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 15 }}>
              No transactions matching the criteria.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = categories.find((c) => c.id === item.category_id);
          return (
            <View
              style={[
                styles.transactionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.iconCircle}>
                {item.type === 'income' ? (
                  <ArrowDownRight color={colors.success} size={20} />
                ) : (
                  <ArrowUpRight color={colors.error} size={20} />
                )}
              </View>
              
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={styles.rowJustified}>
                  <Text style={[styles.txTitle, { color: colors.text }]}>
                    {cat?.name || 'Uncategorized'}
                  </Text>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: item.type === 'income' ? colors.success : colors.error },
                    ]}
                  >
                    {item.type === 'income' ? '+' : '-'}₹{Number(item.amount).toLocaleString()}
                  </Text>
                </View>

                {item.notes && (
                  <Text style={[styles.txNotes, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.notes}
                  </Text>
                )}

                <View style={[styles.rowJustified, { marginTop: 6 }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    • {item.payment_method}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/transaction/edit', params: { id: item.id } })}
                      style={{ marginRight: 16 }}
                    >
                      <Pencil color={colors.textSecondary} size={14} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Trash2 color={colors.textSecondary} size={15} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Floating Add Trigger */}
      <TouchableOpacity
        style={[styles.floatingBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/transaction/add')}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // Align with TextInput marginBottom
  },
  filterPanel: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingBottom: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowJustified: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txNotes: {
    fontSize: 12,
    marginTop: 2,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
