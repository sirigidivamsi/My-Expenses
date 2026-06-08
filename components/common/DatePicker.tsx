import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Modal } from './Modal';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Maintain active calendar month/year separate from selection
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const daysCount = getDaysInMonth(currentYear, currentMonth);
    const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);
    
    const items = [];
    
    // Empty offsets for starting weekday
    for (let i = 0; i < firstDayOffset; i++) {
      items.push({ id: `empty-${i}`, day: null });
    }
    
    // Day numbers
    for (let day = 1; day <= daysCount; day++) {
      items.push({ id: `day-${day}`, day });
    }
    
    return items;
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    onChange(selectedDate);
    setModalVisible(false);
  };

  const formattedValue = useMemo(() => {
    return value.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [value]);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isSelected = (day: number) => {
    return (
      value.getDate() === day &&
      value.getMonth() === currentMonth &&
      value.getFullYear() === currentYear
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.inputButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          // Sync calendar display to current selection on open
          setCurrentMonth(value.getMonth());
          setCurrentYear(value.getFullYear());
          setModalVisible(true);
        }}
      >
        <Calendar color={colors.primary} size={18} style={{ marginRight: 10 }} />
        <Text style={[styles.inputText, { color: colors.text }]}>{formattedValue}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Select Date"
      >
        <View style={styles.calendarContainer}>
          {/* Header Month Navigation */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <ChevronLeft color={colors.text} size={20} />
            </TouchableOpacity>
            
            <Text style={[styles.monthYearText, { color: colors.text }]}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <ChevronRight color={colors.text} size={20} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day, idx) => (
              <Text key={idx} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.gridContainer}>
            {calendarDays.map((item) => {
              if (item.day === null) {
                return <View key={item.id} style={styles.dayCell} />;
              }

              const selected = isSelected(item.day);
              const today = isToday(item.day);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dayCell,
                    selected && { backgroundColor: colors.primary },
                    !selected && today && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                  onPress={() => handleSelectDay(item.day!)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: selected ? '#FFF' : colors.text },
                      selected && { fontWeight: '800' },
                      !selected && today && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    paddingVertical: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '800',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 columns
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
export default DatePicker;
