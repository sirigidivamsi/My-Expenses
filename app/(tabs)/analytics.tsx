import { Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DonutChart, IncomeExpenseBarChart } from '../../components/charts/InteractiveCharts';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';


export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { transactions, categories, wallets } = useDataStore();

  // State for chart range mode and selected reference date
  const [chartMode, setChartMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Animation values for chart transitions
  const chartOpacity = useRef(new Animated.Value(1)).current;

  // Page entrance transitions
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

  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.is_deleted);
  }, [transactions]);

  // 1. Calculate Category expense values for Donut Chart
  const categoryChartData = useMemo(() => {
    const expenseTotals: Record<string, number> = {};
    activeTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        expenseTotals[t.category_id] = (expenseTotals[t.category_id] || 0) + Number(t.amount);
      });

    return Object.entries(expenseTotals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Other',
          amount,
          color: cat?.color || colors.primary,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [activeTransactions, categories, colors]);

  // 2. Calculations for dynamic chart views
  // Daily View (Mon-Sun of selected week)
  const currentWeekRange = useMemo(() => {
    const day = selectedDate.getDay();
    const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1); // Monday adjustment
    const monday = new Date(selectedDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  }, [selectedDate]);

  const dailyChartData = useMemo(() => {
    const { monday } = currentWeekRange;
    const daysLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return daysLabel.map((dayLabel, idx) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);
      
      const targetDateStr = targetDate.toISOString().substring(0, 10);
      
      const income = activeTransactions
        .filter((t) => t.type === 'income' && t.date.substring(0, 10) === targetDateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = activeTransactions
        .filter((t) => t.type === 'expense' && t.date.substring(0, 10) === targetDateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        label: dayLabel,
        income,
        expense,
      };
    });
  }, [activeTransactions, currentWeekRange]);

  // Weekly View (Weeks of selected month)
  const currentMonthRange = useMemo(() => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startOfMonth, endOfMonth };
  }, [selectedDate]);

  const weeklyChartData = useMemo(() => {
    const { startOfMonth, endOfMonth } = currentMonthRange;
    const year = startOfMonth.getFullYear();
    const month = startOfMonth.getMonth();
    const totalDays = endOfMonth.getDate();

    const weekRanges = [
      { label: 'W1', start: 1, end: 7 },
      { label: 'W2', start: 8, end: 14 },
      { label: 'W3', start: 15, end: 21 },
      { label: 'W4', start: 22, end: 28 },
    ];
    if (totalDays > 28) {
      weekRanges.push({ label: 'W5', start: 29, end: totalDays });
    }

    return weekRanges.map((w) => {
      const income = activeTransactions
        .filter((t) => {
          if (t.type !== 'income') return false;
          const tDate = new Date(t.date);
          return (
            tDate.getFullYear() === year &&
            tDate.getMonth() === month &&
            tDate.getDate() >= w.start &&
            tDate.getDate() <= w.end
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = activeTransactions
        .filter((t) => {
          if (t.type !== 'expense') return false;
          const tDate = new Date(t.date);
          return (
            tDate.getFullYear() === year &&
            tDate.getMonth() === month &&
            tDate.getDate() >= w.start &&
            tDate.getDate() <= w.end
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        label: w.label,
        income,
        expense,
      };
    });
  }, [activeTransactions, currentMonthRange]);

  // Monthly View (Last 6 Months from now)
  const monthlyBarChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;

      const income = activeTransactions
        .filter((t) => t.type === 'income' && t.date.substring(0, 7) === monthStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = activeTransactions
        .filter((t) => t.type === 'expense' && t.date.substring(0, 7) === monthStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      result.push({
        label: monthLabel,
        income,
        expense,
      });
    }

    return result;
  }, [activeTransactions]);

  const activeChartData = useMemo(() => {
    if (chartMode === 'daily') return dailyChartData;
    if (chartMode === 'weekly') return weeklyChartData;
    return monthlyBarChartData;
  }, [chartMode, dailyChartData, weeklyChartData, monthlyBarChartData]);

  // Navigation Handlers
  const handlePrevRange = () => {
    const newDate = new Date(selectedDate);
    if (chartMode === 'daily') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else if (chartMode === 'weekly') {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextRange = () => {
    const newDate = new Date(selectedDate);
    if (chartMode === 'daily') {
      newDate.setDate(selectedDate.getDate() + 7);
    } else if (chartMode === 'weekly') {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Label for navigation range
  const navigationLabel = useMemo(() => {
    if (chartMode === 'daily') {
      const { monday, sunday } = currentWeekRange;
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      };
      return `${formatDate(monday)} - ${formatDate(sunday)}`;
    } else if (chartMode === 'weekly') {
      return selectedDate.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
    }
    return 'Last 6 Months';
  }, [chartMode, currentWeekRange, selectedDate]);

  // Mode Transition Animation
  const handleModeChange = (mode: 'daily' | 'weekly' | 'monthly') => {
    Animated.timing(chartOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setChartMode(mode);
      setSelectedDate(new Date()); // reset to today
      Animated.timing(chartOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };



  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Financial Breakdown</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            Analyze category spending and income dynamics.
          </Text>
        </View>

        {/* Expense by Category Card */}
        <View style={styles.cardWrapper}>
          <Card variant="elevated" style={{ backgroundColor: colors.card }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Expense by Category</Text>
            <DonutChart
              data={categoryChartData}
              onSelectCategory={(catId) => {
                router.push({
                  pathname: '/(tabs)/transactions',
                  params: { categoryId: catId },
                });
              }}
            />
          </Card>
        </View>

        {/* Income vs Expense Card */}
        <View style={styles.cardWrapper}>
          <Card variant="elevated" style={{ backgroundColor: colors.card }}>
            <View style={styles.chartHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Income vs Expenses</Text>
              
              {/* Segmented Control */}
              <View style={[styles.segmentedControl, { backgroundColor: colors.border }]}>
                {(['daily', 'weekly', 'monthly'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.segmentBtn,
                      chartMode === m && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleModeChange(m)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: chartMode === m ? '#FFF' : colors.textSecondary },
                      ]}
                    >
                      {m === 'daily' ? 'Daily' : m === 'weekly' ? 'Weekly' : 'Monthly'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Navigation row for daily/weekly modes */}
            {chartMode !== 'monthly' && (
              <View style={styles.navigationRow}>
                <TouchableOpacity onPress={handlePrevRange} style={styles.navBtn}>
                  <ChevronLeft color={colors.primary} size={18} />
                </TouchableOpacity>
                <Text style={[styles.navigationLabel, { color: colors.text }]}>
                  {navigationLabel}
                </Text>
                <TouchableOpacity onPress={handleNextRange} style={styles.navBtn}>
                  <ChevronRight color={colors.primary} size={18} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.error }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Expense</Text>
              </View>
              {chartMode === 'monthly' && (
                <Text style={{ marginLeft: 'auto', fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                  {navigationLabel}
                </Text>
              )}
            </View>

            <Animated.View style={{ opacity: chartOpacity }}>
              <IncomeExpenseBarChart data={activeChartData} />
            </Animated.View>
          </Card>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navBtn: {
    padding: 4,
  },
  navigationLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
