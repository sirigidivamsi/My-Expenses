import { useRouter } from 'expo-router';
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard as CardIcon,
  HelpCircle,
  Info,
  Plus,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';
import { CreditCard } from '../../types';

export default function CreditCardDashboard() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const { creditCards, wallets, creditCardStatements, transactions } = useDataStore();

  const activeCards = useMemo(() => {
    return creditCards.filter((c) => !c.is_deleted);
  }, [creditCards]);

  // Compute overall credit metrics dynamically based on wallet balances
  const overallMetrics = useMemo(() => {
    let totalLimit = 0;
    let utilizedAmount = 0;

    activeCards.forEach((c) => {
      totalLimit += Number(c.credit_limit);
      const wallet = wallets.find((w) => w.id === c.wallet_id);
      if (wallet) {
        utilizedAmount += Math.max(0, -Number(wallet.balance));
      }
    });

    const availableLimit = Math.max(0, totalLimit - utilizedAmount);
    const utilizationPct = totalLimit > 0 ? (utilizedAmount / totalLimit) * 100 : 0;

    return {
      totalLimit,
      availableLimit,
      utilizedAmount,
      utilizationPct,
    };
  }, [activeCards, wallets]);

  // Get active statements/bills that are unpaid
  const upcomingBills = useMemo(() => {
    return creditCardStatements
      .filter((s) => s.status !== 'paid')
      .map((stmt) => {
        const card = activeCards.find((c) => c.id === stmt.card_id);
        const daysLeft = Math.ceil(
          (new Date(stmt.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        );
        return {
          ...stmt,
          card,
          daysLeft,
        };
      })
      .filter((s) => s.card !== undefined)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [creditCardStatements, activeCards]);

  // Filter for credit card transactions
  const creditTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.is_deleted) return false;
        const wallet = wallets.find((w) => w.id === t.wallet_id);
        return wallet?.type === 'credit_card';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, wallets]);

  // Get warning details for utilization
  const getUtilizationWarning = (pct: number) => {
    if (pct >= 75) {
      return {
        text: 'CRITICAL: High Credit Utilization (Above 75%)! This negatively impacts your credit score. Consider making immediate payments to restore limits.',
        color: colors.error,
      };
    } else if (pct >= 50) {
      return {
        text: 'WARNING: Moderately High Utilization (Above 50%). Keep checking purchases to avoid crossing the 75% limit.',
        color: colors.purple,
      };
    } else if (pct >= 30) {
      return {
        text: 'NOTICE: Utilization crossed 30%. It is generally recommended to keep utilization below 30% for a healthy credit profile.',
        color: colors.accent,
      };
    }
    return {
      text: 'EXCELLENT: Your overall credit utilization is below the recommended 30% limit. Excellent credit health!',
      color: colors.success,
    };
  };

  const utilizationWarning = getUtilizationWarning(overallMetrics.utilizationPct);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Credit Cards</Text>
        <TouchableOpacity
          style={[styles.addCardBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/credit-cards/add')}
        >
          <Plus color="#FFF" size={18} />
        </TouchableOpacity>
      </View>

      {/* 1. Overall Dashboard Summary */}
      <Card variant="elevated" style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          TOTAL CREDIT UTILIZED
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          ₹{overallMetrics.utilizedAmount.toLocaleString('en-IN')}
        </Text>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, overallMetrics.utilizationPct)}%`,
                  backgroundColor:
                    overallMetrics.utilizationPct >= 75
                      ? colors.error
                      : overallMetrics.utilizationPct >= 30
                      ? colors.accent
                      : colors.success,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressPctText, { color: colors.text }]}>
            {overallMetrics.utilizationPct.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Limit</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ₹{overallMetrics.totalLimit.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Available</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              ₹{overallMetrics.availableLimit.toLocaleString()}
            </Text>
          </View>
        </View>
      </Card>

      {/* 2. Utilization Alerts */}
      {activeCards.length > 0 && (
        <Card
          variant="flat"
          style={[
            styles.warningCard,
            { backgroundColor: utilizationWarning.color + '15', borderColor: utilizationWarning.color },
          ]}
        >
          <View style={styles.warningHeader}>
            <AlertTriangle color={utilizationWarning.color} size={18} style={{ marginRight: 8 }} />
            <Text style={[styles.warningTitle, { color: utilizationWarning.color }]}>
              Credit Health Insights
            </Text>
          </View>
          <Text style={[styles.warningText, { color: colors.text }]}>{utilizationWarning.text}</Text>
        </Card>
      )}

      {/* 3. Card Carousel (List of Cards) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Cards ({activeCards.length})</Text>
      </View>

      {activeCards.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <CardIcon color={colors.textSecondary} size={36} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No credit cards registered yet. Click the "+" button at the top to add your first card.
          </Text>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        >
          {activeCards.map((card) => {
            const wallet = wallets.find((w) => w.id === card.wallet_id);
            const cardSpend = wallet ? Math.max(0, -Number(wallet.balance)) : 0;
            const cardUsagePct = (cardSpend / card.credit_limit) * 100;
            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.ccWrapper, { shadowColor: card.card_color }]}
                onPress={() => router.push(`/credit-cards/${card.id}`)}
              >
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
                      <Text style={styles.cardFooterVal}>₹{cardSpend.toLocaleString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardFooterLabel}>Limit</Text>
                      <Text style={styles.cardFooterVal}>₹{card.credit_limit.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
                {/* Visual card metrics */}
                <View style={styles.cardCardMetrics}>
                  <Text style={[styles.cardCardLabel, { color: colors.textSecondary }]}>
                    Utilization: <Text style={{ color: colors.text, fontWeight: '700' }}>{cardUsagePct.toFixed(0)}%</Text>
                  </Text>
                  <Text style={[styles.cardCardLabel, { color: colors.textSecondary }]}>
                    Due: <Text style={{ color: colors.primary, fontWeight: '700' }}>Day {card.due_date}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 4. Upcoming Bills Widget */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Bills</Text>
      </View>

      {upcomingBills.length === 0 ? (
        <Card variant="flat" style={styles.emptyBillsCard}>
          <Calendar color={colors.textSecondary} size={24} style={{ marginBottom: 6 }} />
          <Text style={[styles.emptyBillsText, { color: colors.textSecondary }]}>
            All credit card statements fully paid. Great job!
          </Text>
        </Card>
      ) : (
        upcomingBills.map((stmt) => (
          <TouchableOpacity
            key={stmt.id}
            onPress={() => router.push(`/credit-cards/${stmt.card_id}`)}
          >
            <Card variant="outlined" style={styles.billCard}>
              <View style={styles.billHeaderRow}>
                <View style={styles.billTitleBox}>
                  <View style={[styles.colorDot, { backgroundColor: stmt.card?.card_color }]} />
                  <Text style={[styles.billCardName, { color: colors.text }]}>
                    {stmt.card?.bank_name} {stmt.card?.card_name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.daysBadge,
                    {
                      backgroundColor:
                        stmt.daysLeft <= 2
                          ? colors.error + '20'
                          : stmt.daysLeft <= 5
                          ? colors.accent + '20'
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.daysBadgeText,
                      {
                        color:
                          stmt.daysLeft <= 2
                            ? colors.error
                            : stmt.daysLeft <= 5
                            ? colors.accent
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {stmt.daysLeft <= 0
                      ? 'Due Today'
                      : `Due in ${stmt.daysLeft} days`}
                  </Text>
                </View>
              </View>

              <View style={styles.billMetricsRow}>
                <View>
                  <Text style={[styles.billMetricLabel, { color: colors.textSecondary }]}>
                    Statement Amount
                  </Text>
                  <Text style={[styles.billMetricVal, { color: colors.text }]}>
                    ₹{stmt.statement_amount.toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.billMetricLabel, { color: colors.textSecondary }]}>
                    Outstanding Due
                  </Text>
                  <Text style={[styles.billMetricVal, { color: colors.text, fontWeight: '800' }]}>
                    ₹{(stmt.statement_amount - stmt.paid_amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}

      {/* 5. Credit Card Transactions */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Credit Card Transactions</Text>
      </View>

      {creditTransactions.length === 0 ? (
        <Card variant="flat" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center' }]}>
            No credit card transactions found.
          </Text>
        </Card>
      ) : (
        creditTransactions.map((item) => {
          const cat = useDataStore.getState().categories.find((c) => c.id === item.category_id);
          const wallet = wallets.find((w) => w.id === item.wallet_id);
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
                  })}{' '}
                  • {wallet?.name || item.payment_method}
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
  addCardBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    flex: 1,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPctText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  warningCard: {
    padding: 14,
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  carouselContainer: {
    paddingRight: 16,
    paddingBottom: 16,
  },
  ccWrapper: {
    width: 280,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  digitalCard: {
    height: 160,
    padding: 16,
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTypeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.8,
  },
  cardNameText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 4,
  },
  cardMidRow: {
    marginVertical: 4,
  },
  cardNumberText: {
    color: '#FFF',
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '800',
  },
  cardCardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyBillsCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyBillsText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  billCard: {
    marginBottom: 12,
    padding: 14,
  },
  billHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  billCardName: {
    fontSize: 14,
    fontWeight: '800',
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  billMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  billMetricVal: {
    fontSize: 15,
    fontWeight: '700',
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
