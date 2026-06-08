import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../store/useDataStore';
import { CreditCardType } from '../../types';

const CARD_COLORS = [
  '#1E293B', // Slate
  '#0F172A', // Dark Slate
  '#1E3A8A', // Dark Blue
  '#312E81', // Indigo
  '#581C87', // Purple
  '#701A75', // Fuchsia
  '#881337', // Rose
  '#064E3B', // Dark Green
];

export default function AddCreditCardScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { addCreditCard } = useDataStore();

  const [bankName, setBankName] = useState('');
  const [cardName, setCardName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [cardType, setCardType] = useState<CreditCardType>('visa');
  const [creditLimit, setCreditLimit] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  const [annualFee, setAnnualFee] = useState('');
  const [annualWaiver, setAnnualWaiver] = useState('');
  const [loungeVisits, setLoungeVisits] = useState('');

  const handleAddCard = () => {
    if (!bankName || !cardName || !lastFour || !creditLimit || !statementDate || !dueDate) {
      Alert.alert('Incomplete Form', 'Please fill in all mandatory fields.');
      return;
    }

    if (lastFour.length !== 4 || isNaN(Number(lastFour))) {
      Alert.alert('Invalid Number', 'Last 4 digits must contain exactly 4 numeric characters.');
      return;
    }

    const sDay = Number(statementDate);
    const dDay = Number(dueDate);

    if (sDay < 1 || sDay > 31 || dDay < 1 || dDay > 31) {
      Alert.alert('Invalid Days', 'Statement and Due dates must be days of the month (between 1 and 31).');
      return;
    }

    addCreditCard({
      bank_name: bankName.trim(),
      card_name: cardName.trim(),
      last_four: lastFour,
      card_type: cardType,
      credit_limit: Number(creditLimit),
      available_limit: Number(creditLimit),
      statement_date: sDay,
      due_date: dDay,
      interest_rate: interestRate ? Number(interestRate) : undefined,
      card_color: selectedColor,
      annual_fee: annualFee ? Number(annualFee) : 0,
      annual_fee_waiver_spend: annualWaiver ? Number(annualWaiver) : 0,
      lounge_visits_remaining: loungeVisits ? Number(loungeVisits) : 0,
    });

    router.back();
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Credit Card</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Card Preview */}
      <View style={styles.previewBox}>
        <View style={[styles.digitalCard, { backgroundColor: selectedColor }]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.bankNameText}>{bankName || 'BANK NAME'}</Text>
            <Text style={styles.cardTypeText}>{cardType.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardNameText}>{cardName || 'Card Name'}</Text>
          
          <View style={styles.cardMidRow}>
            <Text style={styles.cardNumberText}>••••  ••••  ••••  {lastFour || '0000'}</Text>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardFooterLabel}>Outstanding</Text>
              <Text style={styles.cardFooterVal}>₹0.00</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardFooterLabel}>Limit</Text>
              <Text style={styles.cardFooterVal}>
                ₹{creditLimit ? Number(creditLimit).toLocaleString() : '1,00,000'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Input Form */}
      <Text style={[styles.label, { color: colors.text }]}>Bank Name *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="e.g. HDFC / SBI / ICICI"
        placeholderTextColor={colors.textSecondary}
        value={bankName}
        onChangeText={setBankName}
      />

      <Text style={[styles.label, { color: colors.text }]}>Card Name *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="e.g. Millennia / Cashback / Amazon Pay"
        placeholderTextColor={colors.textSecondary}
        value={cardName}
        onChangeText={setCardName}
      />

      <View style={styles.inputRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Last 4 Digits *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. 1234"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={4}
            value={lastFour}
            onChangeText={setLastFour}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Credit Limit *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="₹1,50,000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={creditLimit}
            onChangeText={setCreditLimit}
          />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Card Network *</Text>
      <View style={styles.typeSelectorGrid}>
        {(['visa', 'mastercard', 'rupay', 'amex'] as CreditCardType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              { borderColor: colors.border },
              cardType === type && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setCardType(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: colors.text },
                cardType === type && { color: '#FFF', fontWeight: '800' },
              ]}
            >
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Statement Date *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Day (e.g. 15)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
            value={statementDate}
            onChangeText={setStatementDate}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Payment Due Date *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Day (e.g. 5)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Interest Rate (APR % p.a.)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. 42.0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={interestRate}
            onChangeText={setInterestRate}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Annual Lounge Visits</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. 8"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={loungeVisits}
            onChangeText={setLoungeVisits}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Annual Fee</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="₹999"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={annualFee}
            onChangeText={setAnnualFee}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.label, { color: colors.text }]}>Fee Waiver Spend</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="₹1,50,000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={annualWaiver}
            onChangeText={setAnnualWaiver}
          />
        </View>
      </View>

      {/* Card Theme Picker */}
      <Text style={[styles.label, { color: colors.text }]}>Select Card Theme</Text>
      <View style={styles.colorPaletteGrid}>
        {CARD_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorDot,
              { backgroundColor: color },
              selectedColor === color && { borderColor: '#E2E8F0', borderWidth: 2.5 },
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
      <Button
        title="Register Credit Card"
        onPress={handleAddCard}
        style={styles.registerBtn}
      />
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
    marginBottom: 16,
    marginTop: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  previewBox: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  digitalCard: {
    width: '100%',
    height: 180,
    padding: 20,
    justifyContent: 'space-between',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTypeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.8,
  },
  cardNameText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 4,
  },
  cardMidRow: {
    marginVertical: 4,
  },
  cardNumberText: {
    color: '#FFF',
    fontSize: 18,
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
    fontSize: 15,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeSelectorGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginTop: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  registerBtn: {
    marginTop: 16,
    height: 52,
  },
});
