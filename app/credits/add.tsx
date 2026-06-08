import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Info,
  Phone,
  Receipt,
  User,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DatePicker } from '../../components/common/DatePicker';
import { TextInput } from '../../components/common/TextInput';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../store/useDataStore';

const MOCK_ATTACHMENTS = [
  'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // receipt 1
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // receipt 2
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // receipt 3
];

export default function AddCreditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { wallets, addCredit } = useDataStore();

  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  const [hasDueDate, setHasDueDate] = useState(false);
  const [showMockPicker, setShowMockPicker] = useState(false);

  const activeWallets = wallets.filter((w) => !w.is_deleted && w.type !== 'credit_card');

  const handleSave = () => {
    if (!personName.trim()) {
      Alert.alert('Validation Error', 'Please enter a person name.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (hasDueDate && !dueDate) {
      Alert.alert('Validation Error', 'Please select an expected return due date.');
      return;
    }

    addCredit(
      {
        person_name: personName.trim(),
        mobile_number: mobileNumber.trim() || undefined,
        type,
        amount: amt,
        date: date.toISOString(),
        due_date: hasDueDate && dueDate ? dueDate.toISOString() : undefined,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
        attachment_url: attachmentUrl || undefined,
      },
      selectedWalletId || undefined
    );

    Alert.alert('Success 🎉', `Logged credit entry successfully!`, [
      { text: 'Okay', onPress: () => router.replace('/credits') },
    ]);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Log Credit / Loan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Toggle Lent vs Borrowed */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: type === 'lent' ? colors.successLight : colors.border,
                borderColor: type === 'lent' ? colors.success : 'transparent',
              },
            ]}
            onPress={() => setType('lent')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: type === 'lent' ? colors.success : colors.textSecondary },
              ]}
            >
              MONEY LENT (GIVEN)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: type === 'borrowed' ? colors.errorLight : colors.border,
                borderColor: type === 'borrowed' ? colors.error : 'transparent',
              },
            ]}
            onPress={() => setType('borrowed')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: type === 'borrowed' ? colors.error : colors.textSecondary },
              ]}
            >
              MONEY BORROWED
            </Text>
          </TouchableOpacity>
        </View>

        {/* Person Info */}
        <TextInput
          label="Person Name *"
          placeholder="e.g. John Doe"
          value={personName}
          onChangeText={setPersonName}
          leftIcon={<User color={colors.primary} size={18} />}
        />

        <TextInput
          label="Mobile Number (Optional)"
          placeholder="e.g. +91 9876543210"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
          leftIcon={<Phone color={colors.textSecondary} size={18} />}
        />

        {/* Amount Input */}
        <TextInput
          label="Amount (₹) *"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.amountInput}
          leftIcon={<Text style={[styles.currencySymbol, { color: colors.primary }]}>₹</Text>}
        />

        {/* Date Selector */}
        <DatePicker label="Date Logged" value={date} onChange={setDate} />

        {/* Due Date toggle & Picker */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { borderColor: colors.border, backgroundColor: hasDueDate ? colors.primary : colors.card },
            ]}
            onPress={() => {
              setHasDueDate(!hasDueDate);
              if (!hasDueDate && !dueDate) {
                const defaultDue = new Date();
                defaultDue.setDate(defaultDue.getDate() + 7);
                setDueDate(defaultDue);
              }
            }}
          >
            {hasDueDate && <Text style={styles.checkboxTick}>✓</Text>}
          </TouchableOpacity>
          <Text style={[styles.checkboxLabel, { color: colors.text }]}>Specify Expected Return Date</Text>
        </View>

        {hasDueDate && dueDate && (
          <DatePicker label="Expected Return Date" value={dueDate} onChange={setDueDate} />
        )}

        {/* Wallet Integration */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Auto-update Wallet Balance?
        </Text>
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          Selecting a wallet will automatically {type === 'lent' ? 'deduct' : 'add'} this amount from its balance.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
          <TouchableOpacity
            style={[
              styles.walletChip,
              { borderColor: colors.border, backgroundColor: selectedWalletId === '' ? colors.primaryLight : colors.card },
              selectedWalletId === '' && { borderColor: colors.primary },
            ]}
            onPress={() => setSelectedWalletId('')}
          >
            <Text style={{ color: selectedWalletId === '' ? colors.primary : colors.text, fontWeight: '700', fontSize: 12 }}>
              Don't Update Balance
            </Text>
          </TouchableOpacity>

          {activeWallets.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[
                styles.walletChip,
                { borderColor: colors.border, backgroundColor: selectedWalletId === w.id ? colors.primaryLight : colors.card },
                selectedWalletId === w.id && { borderColor: colors.primary },
              ]}
              onPress={() => setSelectedWalletId(w.id)}
            >
              <WalletIcon color={w.color} size={14} style={{ marginRight: 6 }} />
              <Text style={{ color: selectedWalletId === w.id ? colors.primary : colors.text, fontWeight: '700', fontSize: 12 }}>
                {w.name} (₹{w.balance.toFixed(0)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reason & Notes */}
        <TextInput
          label="Reason / Purpose"
          placeholder="e.g. Rent share, Dinner split, Personal loan"
          value={reason}
          onChangeText={setReason}
          leftIcon={<Info color={colors.textSecondary} size={18} />}
        />

        <TextInput
          label="Notes / Description"
          placeholder="Add extra descriptions or terms..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* Image Attachment */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Invoice / Receipt Image</Text>
        <Card variant="outlined" style={styles.attachmentCard}>
          {attachmentUrl ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: attachmentUrl }} style={styles.imagePreview} />
              <TouchableOpacity
                style={[styles.removeImageBtn, { backgroundColor: colors.error }]}
                onPress={() => setAttachmentUrl('')}
              >
                <Text style={styles.removeImageText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickImageBtn}
              onPress={() => setShowMockPicker(true)}
            >
              <ImageIcon color={colors.primary} size={28} />
              <Text style={[styles.pickImageText, { color: colors.primary }]}>
                Attach Receipt / Bill Photo
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Mock Attachment Dialog */}
        {showMockPicker && (
          <Card variant="elevated" style={[styles.mockPickerDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Select Mock Receipt</Text>
            <View style={styles.dialogGrid}>
              {MOCK_ATTACHMENTS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dialogItem}
                  onPress={() => {
                    setAttachmentUrl(url);
                    setShowMockPicker(false);
                  }}
                >
                  <Image source={{ uri: url }} style={styles.dialogThumb} />
                  <Text style={[styles.dialogThumbText, { color: colors.textSecondary }]}>Invoice #{idx+1}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Close Panel"
              variant="outline"
              onPress={() => setShowMockPicker(false)}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        <Button
          title="Save Credit Entry"
          onPress={handleSave}
          variant="primary"
          style={{ marginTop: 24, marginBottom: 40 }}
        />
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
    marginLeft: 12,
  },
  scrollContent: {
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  amountInput: {
    fontSize: 22,
    fontWeight: '800',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '800',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxTick: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 10,
  },
  helpText: {
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 16,
  },
  walletRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  walletChip: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  attachmentCard: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginBottom: 16,
    minHeight: 100,
  },
  pickImageBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pickImageText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mockPickerDialog: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  dialogTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  dialogGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dialogItem: {
    width: '30%',
    alignItems: 'center',
  },
  dialogThumb: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 6,
  },
  dialogThumbText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
