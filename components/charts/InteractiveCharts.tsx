import React from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width - 32; // Accommodate dashboard padding

// ==========================================
// 1. DONUT / PIE CHART (Expense by Category)
// ==========================================
interface DonutData {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon?: string;
}

interface DonutChartProps {
  data: DonutData[];
  onSelectCategory?: (id: string) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, onSelectCategory }) => {
  const { colors } = useTheme();
  
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No data available for this month</Text>
      </View>
    );
  }

  const size = 180;
  const radius = 60;
  const strokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;

  return (
    <View style={styles.row}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {data.map((item, idx) => {
              const percentage = (item.amount / total) * 100;
              const strokeLength = (circumference * percentage) / 100;
              const strokeOffset = circumference - strokeLength;
              const rotation = currentAngle;
              currentAngle += (percentage / 100) * 360;

              return (
                <Path
                  key={idx}
                  d={`M ${center} ${center - radius} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${
                    center + radius * Math.sin((percentage / 100) * 2 * Math.PI)
                  } ${center - radius * Math.cos((percentage / 100) * 2 * Math.PI)}`}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  transform={`rotate(${rotation}, ${center}, ${center})`}
                  onPress={() => onSelectCategory?.(item.id)}
                />
              );
            })}
          </G>
        </Svg>
        {/* Center label */}
        <View style={[styles.donutCenterLabel, { top: center - 30, left: center - 50 }]}>
          <Text style={[styles.donutTotalText, { color: colors.text }]}>
            ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>TOTAL SPENT</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.slice(0, 5).map((item, idx) => {
          const percentage = ((item.amount / total) * 100).toFixed(0);
          return (
            <TouchableOpacity
              key={idx}
              style={styles.legendRow}
              onPress={() => onSelectCategory?.(item.id)}
            >
              <View style={[styles.legendIndicator, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
                  ₹{item.amount.toFixed(0)} ({percentage}%)
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ==========================================
// 2. INCOME VS EXPENSE BAR CHART
// ==========================================
interface BarChartProps {
  data: {
    label: string; // e.g. 'Jan', 'Feb'
    income: number;
    expense: number;
  }[];
}

export const IncomeExpenseBarChart: React.FC<BarChartProps> = ({ data }) => {
  const { colors } = useTheme();

  const chartHeight = 160;
  const paddingBottom = 25;
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000 // Prevent division by zero
  );

  const usableHeight = chartHeight - paddingBottom;
  const barWidth = 14;
  const gap = 4;
  const groupGap = 20;

  return (
    <View style={styles.barChartContainer}>
      <Svg width={SCREEN_WIDTH} height={chartHeight}>
        <G>
          {data.map((group, idx) => {
            const groupWidth = barWidth * 2 + gap + groupGap;
            const startX = 35 + idx * groupWidth;

            // Calculations for income and expense bars
            const incomeHeight = (group.income / maxVal) * usableHeight;
            const expenseHeight = (group.expense / maxVal) * usableHeight;

            const incomeY = usableHeight - incomeHeight;
            const expenseY = usableHeight - expenseHeight;

            return (
              <G key={idx}>
                {/* Income Bar */}
                <Rect
                  x={startX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeHeight}
                  fill={colors.success}
                  rx={4}
                />
                {/* Expense Bar */}
                <Rect
                  x={startX + barWidth + gap}
                  y={expenseY}
                  width={barWidth}
                  height={expenseHeight}
                  fill={colors.error}
                  rx={4}
                />
                {/* Month label */}
                <SvgText
                  x={startX + barWidth - 2}
                  y={chartHeight - 6}
                  fill={colors.textSecondary}
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {group.label}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

// ==========================================
// 3. WEEKLY TREND AREA CHART
// ==========================================
interface AreaChartProps {
  data: {
    day: string; // 'M', 'T', 'W' etc.
    amount: number;
  }[];
}

export const WeeklyTrendChart: React.FC<AreaChartProps> = ({ data }) => {
  const { colors } = useTheme();

  const height = 150;
  const width = SCREEN_WIDTH;
  const paddingX = 20;
  const paddingY = 20;

  const maxVal = Math.max(...data.map((d) => d.amount), 500);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Construct points
  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * usableWidth;
    const y = height - paddingY - (d.amount / maxVal) * usableHeight;
    return { x, y };
  });

  // Construct Line Path and Area Path
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Close area to bottom
    areaPath =
      `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
        height - paddingY
      } Z`;
  }

  return (
    <View style={styles.barChartContainer}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Area */}
        {areaPath && <Path d={areaPath} fill="url(#areaGrad)" />}

        {/* Stroke Line */}
        {linePath && (
          <Path d={linePath} fill="none" stroke={colors.accent} strokeWidth={2.5} />
        )}

        {/* Interactive node circles */}
        {points.map((p, idx) => (
          <G key={idx}>
            <Rect
              x={p.x - 2}
              y={p.y - 2}
              width={4}
              height={4}
              fill={colors.accent}
              rx={2}
            />
            {/* Axis text */}
            <SvgText
              x={p.x}
              y={height - 4}
              fill={colors.textSecondary}
              fontSize={10}
              fontWeight="600"
              textAnchor="middle"
            >
              {data[idx].day}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  donutCenterLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 60,
  },
  donutTotalText: {
    fontSize: 20,
    fontWeight: '800',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
  },
  barChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
