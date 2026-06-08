import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  Filter,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../store/useDataStore';
import { Credit } from '../../types';

export default function CreditsDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { credits, creditPayments } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'partially_paid' | 'closed'>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'closed'>('pending');

  // Filter out deleted credits
  const nonDeletedCredits = useMemo(() => {
    return credits.filter((c) => !c.is_deleted);
  }, [credits]);

  // Compute stats
  const stats = useMemo(() => {
    let totalLent = 0;
    let totalBorrowed = 0;
    let pendingReceivable = 0;
    let pendingPayable = 0;

    nonDeletedCredits.forEach((c) => {
      const paid = creditPayments
        .filter((p) => p.credit_id === c.id)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(c.amount) - paid;

      if (c.type === 'lent') {
        totalLent += Number(c.amount);
        if (c.status !== 'closed') {
          pendingReceivable += remaining;
        }
      } else {
        totalBorrowed += Number(c.amount);
        if (c.status !== 'closed') {
          pendingPayable += remaining;
        }
      }
    });

    // Upcoming dues (next 7 days)
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const upcomingDues = nonDeletedCredits.filter((c) => {
      if (c.status === 'closed' || !c.due_date) return false;
      const dueDate = new Date(c.due_date);
      return dueDate >= now && dueDate <= next7Days;
    });

    return {
      totalLent,
      totalBorrowed,
      pendingReceivable,
      pendingPayable,
      upcomingDuesCount: upcomingDues.length,
    };
  }, [nonDeletedCredits, creditPayments]);

  // Filter and sort items
  const filteredCredits = useMemo(() => {
    return nonDeletedCredits
      .filter((c) => {
        // Search query filter
        const matchesSearch = c.person_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (c.reason && c.reason.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Type filter
        const matchesType = filterType === 'all' || c.type === filterType;

        // Status tab mapping
        const matchesTab = activeTab === 'pending' ? c.status !== 'closed' : c.status === 'closed';

        // Additional status filter
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

        return matchesSearch && matchesType && matchesTab && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [nonDeletedCredits, searchQuery, filterType, filterStatus, activeTab]);

  const renderCreditItem = ({ item }: { item: Credit }) => {
    const paidAmount = creditPayments
      .filter((p) => p.credit_id === item.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(item.amount) - paidAmount;
    const isLent = item.type === 'lent';

    return (
      <TouchableOpacity
        style={styles.listItemWrapper}
        onPress={() => router.push(`/credits/${item.id}`)}
      >
        <Card variant="flat" style={[styles.listItem, { backgroundColor: colors.card }]}>
          <View style={styles.itemHeader}>
            <View style={styles.personRow}>
              <View style={[styles.avatar, { backgroundColor: isLent ? colors.successLight : colors.errorLight }]}>
                <User color={isLent ? colors.success : colors.error} size={18} />
              </View>
              <View>
                <Text style={[styles.personName, { color: colors.text }]}>{item.person_name}</Text>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>

            <View style={styles.amountCol}>
              <Text style={[styles.amountValue, { color: isLent ? colors.success : colors.error }]}>
                ₹{Number(item.amount).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.remainingValue, { color: colors.textSecondary }]}>
                Bal: ₹{remaining.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {item.reason && (
            <Text style={[styles.reasonText, { color: colors.textSecondary }]} numberOfLines={1}>
              Reason: {item.reason}
            </Text>
          )}

          {item.due_date && item.status !== 'closed' && (
            <View style={styles.dueRow}>
              <Calendar size={12} color={colors.textSecondary} />
              <Text style={[styles.dueText, { color: new Date(item.due_date) < new Date() ? colors.error : colors.textSecondary }]}>
                Due: {new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {new Date(item.due_date) < new Date() ? ' (OVERDUE)' : ''}
              </Text>
            </View>
          )}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === 'closed'
                      ? colors.successLight
                      : item.status === 'partially_paid'
                      ? colors.primaryLight
                      : colors.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      item.status === 'closed'
                        ? colors.success
                        : item.status === 'partially_paid'
                        ? colors.primary
                        : colors.warning,
                  },
                ]}
              >
                {item.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={16} />
          </View>
        </Card>
      </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Credits & Loans</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/credits/add')}
        >
          <Plus color="#FFF" size={16} />
          <Text style={styles.addBtnText}>Log Entry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          <Card variant="elevated" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>MONEY LENT</Text>
              <TrendingUp color={colors.success} size={18} />
            </View>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              ₹{stats.pendingReceivable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
              Pending Receivables (Total: ₹{stats.totalLent.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </Text>
          </Card>

          <Card variant="elevated" style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>MONEY BORROWED</Text>
              <TrendingDown color={colors.error} size={18} />
            </View>
            <Text style={[styles.metricValue, { color: colors.error }]}>
              ₹{stats.pendingPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
              Pending Payables (Total: ₹{stats.totalBorrowed.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </Text>
          </Card>
        </View>

        {/* Due Alerts Info */}
        {stats.upcomingDuesCount > 0 && (
          <Card variant="flat" style={[styles.alertCard, { backgroundColor: colors.warning + '15' }]}>
            <Text style={[styles.alertText, { color: colors.warning }]}>
              ⚠️ You have {stats.upcomingDuesCount} loan payments coming due in the next 7 days. Check reminders!
            </Text>
          </Card>
        )}

        {/* Search and Filters */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBarWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Search color={colors.textSecondary} size={18} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or reason..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {/* Type Filters */}
            {(['all', 'lent', 'borrowed'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  filterType === type && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    filterType === type && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {type === 'all' ? 'All Transactions' : type === 'lent' ? 'Lent' : 'Borrowed'}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Status Filters */}
            {(['all', 'active', 'partially_paid'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  filterStatus === status && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    filterStatus === status && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {status === 'all' ? 'All Status' : status === 'active' ? 'Active' : 'Partially Paid'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tabs for Pending vs Closed */}
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pending' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
            onPress={() => {
              setActiveTab('pending');
              setFilterStatus('all');
            }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.primary : colors.textSecondary }]}>
              Pending (Active)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'closed' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
            onPress={() => {
              setActiveTab('closed');
              setFilterStatus('all');
            }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'closed' ? colors.primary : colors.textSecondary }]}>
              Settled (Closed)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credits List */}
        {filteredCredits.length === 0 ? (
          <Card variant="flat" style={styles.emptyCard}>
            <ArrowUpDown color={colors.textSecondary} size={32} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No matching records found. Let's log your first credit/loan entry!
            </Text>
          </Card>
        ) : (
          filteredCredits.map((item) => (
            <View key={item.id}>
              {renderCreditItem({ item })}
            </View>
          ))
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 14,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  alertCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  filterSection: {
    marginBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    height: 32,
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabsWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listItemWrapper: {
    marginBottom: 12,
  },
  listItem: {
    padding: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  personName: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  remainingValue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  reasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
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
    lineHeight: 18,
  },
});
