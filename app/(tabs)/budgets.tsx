import { Plus, Target, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TextInput } from '../../components/common/TextInput';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';

// Animated progress bar component for budget bars
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

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { budgets, transactions, categories, setBudget, deleteBudget } = useDataStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const currentMonth = useMemo(() => {
    return new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  }, []);

  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.is_deleted && t.date.substring(0, 7) === currentMonth);
  }, [transactions, currentMonth]);

  // Aggregate total budgets & expenses
  const budgetStats = useMemo(() => {
    const totalBudget = budgets
      .filter((b) => !b.is_deleted && b.month === currentMonth)
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const totalSpent = activeTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remaining = Math.max(0, totalBudget - totalSpent);
    const progress = totalBudget > 0 ? totalSpent / totalBudget : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      progress,
    };
  }, [budgets, activeTransactions, currentMonth]);

  // Map category data including active budgets
  const categoryBudgetData = useMemo(() => {
    return categories
      .filter((c) => c.type === 'expense' && !c.is_deleted)
      .map((cat) => {
        const budget = budgets.find(
          (b) => b.category_id === cat.id && b.month === currentMonth && !b.is_deleted
        );

        const spent = activeTransactions
          .filter((t) => t.category_id === cat.id && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          category: cat,
          budgetAmount: budget ? Number(budget.amount) : 0,
          budgetId: budget ? budget.id : null,
          spent,
        };
      });
  }, [categories, budgets, activeTransactions, currentMonth]);

  const handleSetBudgetClick = (catId: string, currentVal: number) => {
    setSelectedCatId(catId);
    setBudgetAmount(currentVal > 0 ? currentVal.toString() : '');
    setModalVisible(true);
  };

  const handleSaveBudget = () => {
    const amt = parseFloat(budgetAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly budget limit.');
      return;
    }

    setBudget(selectedCatId, amt, currentMonth);
    setModalVisible(false);
    setSelectedCatId('');
    setBudgetAmount('');
  };

  const handleDeleteBudget = (budgetId: string) => {
    Alert.alert(
      'Remove Budget',
      'Are you sure you want to remove the monthly limit for this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteBudget(budgetId);
          },
        },
      ]
    );
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Overview Card */}
        <View style={styles.headerCardWrapper}>
          <Card variant="elevated" style={{ backgroundColor: colors.card }}>
            <View style={styles.row}>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  OVERALL BUDGETS ({new Date().toLocaleString('default', { month: 'long' })})
                </Text>
                <Text style={[styles.spentText, { color: colors.text }]}>
                  ₹{budgetStats.totalSpent.toLocaleString()} / ₹{budgetStats.totalBudget.toLocaleString()}
                </Text>
              </View>
              <Target color={colors.primary} size={28} />
            </View>

            {/* Progress bar */}
            <AnimatedProgressBar
              progress={Math.min(100, budgetStats.progress * 100)}
              color={budgetStats.progress >= 1 ? colors.error : colors.primary}
              border={colors.border}
              height={10}
            />

          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              Spent: {Math.round(budgetStats.progress * 100)}%
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
              Remaining: ₹{budgetStats.remaining.toLocaleString()}
            </Text>
          </View>
        </Card>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Limits</Text>

      {/* Category List */}
      <FlatList
        data={categoryBudgetData}
        keyExtractor={(item) => item.category.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const percent = item.budgetAmount > 0 ? item.spent / item.budgetAmount : 0;
          return (
            <View
              style={[
                styles.budgetListItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <View style={[styles.colorDot, { backgroundColor: item.category.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{item.category.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                    Spent ₹{item.spent.toLocaleString()}
                  </Text>
                </View>
                {item.budgetAmount > 0 ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.budgetVal, { color: colors.text }]}>
                      Limit: ₹{item.budgetAmount.toLocaleString()}
                    </Text>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        onPress={() => handleSetBudgetClick(item.category.id, item.budgetAmount)}
                        style={{ marginRight: 12 }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>EDIT</Text>
                      </TouchableOpacity>
                      {item.budgetId && (
                        <TouchableOpacity onPress={() => item.budgetId && handleDeleteBudget(item.budgetId)}>
                          <Trash2 color={colors.textSecondary} size={15} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  <Button
                    title="Set Limit"
                    onPress={() => handleSetBudgetClick(item.category.id, 0)}
                    variant="outline"
                    size="small"
                    style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                  />
                )}
              </View>

              {/* Progress bar */}
              {item.budgetAmount > 0 && (
                <AnimatedProgressBar
                  progress={Math.min(100, percent * 100)}
                  color={percent >= 1 ? colors.error : colors.primary}
                  border={colors.border}
                  height={6}
                />
              )}
            </View>
          );
        }}
      />

      {/* Set Budget Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Set Category Limit"
      >
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
          Set your maximum monthly spending limit for this category. We will notify you when you reach 85% and exceed it.
        </Text>
        <TextInput
          label="Monthly Budget Limit (₹)"
          placeholder="e.g. 5000"
          keyboardType="numeric"
          value={budgetAmount}
          onChangeText={setBudgetAmount}
          autoFocus
        />
        <Button
          title="Save Budget Limit"
          onPress={handleSaveBudget}
          variant="primary"
          style={{ width: '100%', marginTop: 10 }}
        />
      </Modal>
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCardWrapper: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spentText: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  progressBarBG: {
    height: 10,
    borderRadius: 5,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  budgetListItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
  },
  budgetVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  listProgressBarBG: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  listProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

