import { useRouter } from 'expo-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  TrendingUp,
  Wallet as WalletIcon,
  Zap,
  CreditCard,
  Tv,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import React, { useMemo, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { WeeklyTrendChart } from '../../components/charts/InteractiveCharts';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const { isGuest, signOut } = useAuthStore();
  const {
    wallets,
    transactions,
    addNotification,
    getFinancialMetrics,
    checkAndApplyAutoRollovers,
    budgets,
  } = useDataStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [includeCreditCards, setIncludeCreditCards] = React.useState(true);

  // Trigger Rollover checks on app mount
  useEffect(() => {
    checkAndApplyAutoRollovers();
  }, []);

  // Page entrance transition animations
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      addNotification('Data Refreshed', 'Your dashboard is up to date.', 'system');
    }, 1500);
  }, []);

  // Compute stats
  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.is_deleted);
  }, [transactions]);

  const stats = useMemo(() => {
    const totalIncome = activeTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = activeTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        if (!includeCreditCards) {
          const wallet = wallets.find((w) => w.id === t.wallet_id);
          if (wallet?.type === 'credit_card') return false;
        }
        return true;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const { cashAndBank, netWorth } = getFinancialMetrics();
    const totalBalance = includeCreditCards ? netWorth : cashAndBank;

    const savings = Math.max(0, totalIncome - totalExpense);

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      savings,
    };
  }, [activeTransactions, wallets, includeCreditCards, getFinancialMetrics]);

  // Compute Weekly Trend Data (Last 7 Days)
  const weeklyTrendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = days.map((day) => ({ day, amount: 0 }));

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    activeTransactions
      .filter((t) => {
        if (!includeCreditCards) {
          const wallet = wallets.find((w) => w.id === t.wallet_id);
          if (wallet?.type === 'credit_card') return false;
        }
        return t.type === 'expense' && new Date(t.date) >= oneWeekAgo;
      })
      .forEach((t) => {
        const dateObj = new Date(t.date);
        const dayIdx = dateObj.getDay(); // 0 (Sun) to 6 (Sat)
        result[dayIdx].amount += Number(t.amount);
      });

    return result;
  }, [activeTransactions, includeCreditCards, wallets]);

  // Generate Smart Financial Insights
  const insights = useMemo(() => {
    const list = [];
    if (stats.totalExpense > stats.totalIncome * 0.8 && stats.totalIncome > 0) {
      list.push({
        title: 'High Spending Rate Alert ⚠️',
        desc: `You spent ${((stats.totalExpense / stats.totalIncome) * 100).toFixed(0)}% of your income this month. Consider cutting down backlogs.`,
        color: colors.error,
      });
    }

    // Category analysis
    const categoryTotals: Record<string, number> = {};
    activeTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + Number(t.amount);
      });

    let highestCatId = '';
    let highestCatAmount = 0;
    Object.entries(categoryTotals).forEach(([id, amt]) => {
      if (amt > highestCatAmount) {
        highestCatAmount = amt;
        highestCatId = id;
      }
    });

    if (highestCatId) {
      const catName = useDataStore.getState().categories.find((c) => c.id === highestCatId)?.name || 'Food';
      list.push({
        title: `${catName} is your top category 🍕`,
        desc: `You spent ₹${highestCatAmount.toFixed(0)} in ${catName} recently. Budgeting here could increase savings!`,
        color: colors.purple,
      });
    }

    if (stats.savings > 0) {
      list.push({
        title: 'Great Job Saving! 💰',
        desc: `You saved ₹${stats.savings.toFixed(0)} so far from your salary and freelance jobs!`,
        color: colors.success,
      });
    }

    if (list.length === 0) {
      list.push({
        title: 'Insights are warming up 🚀',
        desc: 'Add more transactions to unlock customized dynamic financial intelligence!',
        color: colors.accent,
      });
    }

    return list;
  }, [stats, activeTransactions, colors]);

  const recentTransactions = useMemo(() => {
    return [...activeTransactions]
      .filter((t) => {
        if (!includeCreditCards) {
          const wallet = wallets.find((w) => w.id === t.wallet_id);
          if (wallet?.type === 'credit_card') return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [activeTransactions, includeCreditCards, wallets]);

  const budgetProgress = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    const totalBudget = budgets
      .filter((b) => !b.is_deleted && b.month === currentMonth)
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const totalSpent = activeTransactions
      .filter((t) => t.type === 'expense' && t.date.substring(0, 7) === currentMonth)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalBudget,
      totalSpent,
      percentage: totalBudget > 0 ? totalSpent / totalBudget : 0,
      remaining: Math.max(0, totalBudget - totalSpent),
    };
  }, [budgets, activeTransactions]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
      {/* Guest Mode Upgrade Banner */}
      {isGuest && (
        <View style={[styles.upgradeBanner, { backgroundColor: colors.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.upgradeTitle}>Upgrade Account 🚀</Text>
            <Text style={styles.upgradeSub}>Secure remote backups and cloud sync.</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => {
              signOut(); // Log out from guest state to redirect back to auth register
            }}
          >
            <Text style={[styles.upgradeBtnText, { color: colors.primary }]}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Balance Card */}
      <View style={styles.statsContainer}>
        <Card variant="elevated" style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total Balance</Text>
              <Text style={[styles.balanceText, { color: colors.text }]}>
                ₹{stats.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.balanceIcon, { backgroundColor: colors.primaryLight }]}>
              <WalletIcon color={colors.primary} size={24} />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.metricRow}>
                <ArrowDownRight color={colors.success} size={16} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Income</Text>
              </View>
              <Text style={[styles.metricVal, { color: colors.success }]}>
                ₹{stats.totalIncome.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={{ flex: 1, paddingLeft: 16 }}>
              <View style={styles.metricRow}>
                <ArrowUpRight color={colors.error} size={16} />
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Expenses</Text>
              </View>
              <Text style={[styles.metricVal, { color: colors.error }]}>
                ₹{stats.totalExpense.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Credit Card Filter Toggle */}
        <TouchableOpacity
          style={[styles.filterRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setIncludeCreditCards(!includeCreditCards)}
        >
          <View style={[
            styles.checkbox,
            {
              borderColor: colors.primary,
              backgroundColor: includeCreditCards ? colors.primary : 'transparent'
            }
          ]}>
            {includeCreditCards && <Check color="#FFF" size={12} />}
          </View>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Include Credit Card Expenses</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Budget Summary Widget */}
      {budgetProgress.totalBudget > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/budgets')}>
            <Card variant="outlined" style={styles.budgetCard}>
              <View style={styles.rowJustified}>
                <View style={styles.flexRow}>
                  <Zap color={colors.primary} size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.budgetWidgetTitle, { color: colors.text }]}>
                    Monthly Budget Progress
                  </Text>
                </View>
                <Text style={[styles.budgetWidgetPercent, { color: colors.primary }]}>
                  {Math.round(budgetProgress.percentage * 100)}%
                </Text>
              </View>
              
              <View style={[styles.progressBarBG, { backgroundColor: colors.border, marginTop: 10 }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: budgetProgress.percentage >= 1 ? colors.error : colors.primary,
                      width: `${Math.min(100, budgetProgress.percentage * 100)}%`,
                    },
                  ]}
                />
              </View>

              <View style={[styles.rowJustified, { marginTop: 8 }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                  Spent ₹{budgetProgress.totalSpent.toLocaleString()} of ₹{budgetProgress.totalBudget.toLocaleString()}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                  ₹{budgetProgress.remaining.toLocaleString()} left
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions Grid */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      </View>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push('/transaction/add')}
        >
          <PlusCircle color={colors.primary} size={24} style={{ marginBottom: 6 }} />
          <Text style={[styles.actionText, { color: colors.text, fontSize: 10 }]}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/budgets')}
        >
          <TrendingUp color={colors.accent} size={24} style={{ marginBottom: 6 }} />
          <Text style={[styles.actionText, { color: colors.text, fontSize: 10 }]}>Budgets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push('/credit-cards')}
        >
          <CreditCard color={colors.purple} size={24} style={{ marginBottom: 6 }} />
          <Text style={[styles.actionText, { color: colors.text, fontSize: 10 }]}>Cards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, marginRight: 0 }]}
          onPress={() => router.push('/subscriptions')}
        >
          <Tv color={colors.success} size={24} style={{ marginBottom: 6 }} />
          <Text style={[styles.actionText, { color: colors.text, fontSize: 10 }]}>Bills</Text>
        </TouchableOpacity>
      </View>

      {/* Charts Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Spending Trend</Text>
      </View>
      <View style={styles.chartContainer}>
        <Card variant="flat" style={{ backgroundColor: colors.card }}>
          <WeeklyTrendChart data={weeklyTrendData} />
        </Card>
      </View>

      {/* Smart Insights Cards */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Insights</Text>
      </View>
      <View style={styles.insightsList}>
        {insights.map((insight, idx) => (
          <Card key={idx} variant="outlined" style={[styles.insightCard, { borderColor: insight.color }]}>
            <View style={styles.insightHeader}>
              <Zap color={insight.color} size={18} style={{ marginRight: 8 }} />
              <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
            </View>
            <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>{insight.desc}</Text>
          </Card>
        ))}
      </View>

      {/* Recent Transactions List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {recentTransactions.length === 0 ? (
          <Card variant="flat" style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              No transactions added yet.
            </Text>
          </Card>
        ) : (
          recentTransactions.map((item) => {
            const cat = useDataStore.getState().categories.find((c) => c.id === item.category_id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.txItem, { borderBottomColor: colors.border }]}
                onPress={() => router.push({ pathname: '/transaction/edit', params: { id: item.id } })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txName, { color: colors.text }]}>{cat?.name || 'Uncategorized'}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    • {item.payment_method}
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
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  upgradeTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  upgradeSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  upgradeBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  balanceCard: {
    padding: 20,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    marginRight: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    paddingHorizontal: 16,
  },
  insightsList: {
    paddingHorizontal: 16,
  },
  insightCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  budgetCard: {
    padding: 16,
    borderRadius: 16,
  },
  rowJustified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetWidgetTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  budgetWidgetPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBG: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
