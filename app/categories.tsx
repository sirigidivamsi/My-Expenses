import { useRouter } from 'expo-router';
import * as Lucide from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { TextInput } from '../components/common/TextInput';
import { useTheme } from '../hooks/useTheme';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { Category } from '../types';

const CURATED_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#64748B', // Slate
  '#A855F7', // Purple-pink
];

const CURATED_ICONS = [
  'Utensils',
  'Car',
  'ShoppingBag',
  'Receipt',
  'Fuel',
  'Film',
  'Activity',
  'GraduationCap',
  'CreditCard',
  'Home',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Gift',
  'PiggyBank',
  'Coffee',
  'Heart',
  'Music',
  'Plane',
  'Gamepad2',
  'Shield',
  'Store',
  'Smile',
  'Coins',
];

// Helper component to render icon dynamically
const CategoryIcon = ({ name, color, size = 20 }: { name: string; color: string; size?: number }) => {
  const IconComponent = (Lucide as any)[name] || Lucide.Folder;
  return <IconComponent color={color} size={size} />;
};

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { categories, addCategory, updateCategory, deleteCategory } = useDataStore();
  const { isGuest } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CURATED_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(CURATED_ICONS[0]);

  // Filter categories by active tab
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === activeTab && !c.is_deleted);
  }, [categories, activeTab]);

  const openAddModal = () => {
    if (isGuest) {
      Alert.alert(
        'Login Required 🔑',
        'Please sign up or log in to create custom categories. This feature is only available for registered users.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up / Login', onPress: () => router.replace('/(auth)/login') }
        ]
      );
      return;
    }
    setEditingCategory(null);
    setName('');
    setSelectedColor(CURATED_COLORS[0]);
    setSelectedIcon(CURATED_ICONS[0]);
    setModalVisible(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedColor(cat.color);
    setSelectedIcon(cat.icon);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a category name.');
      return;
    }

    if (editingCategory) {
      // Edit mode
      updateCategory(editingCategory.id, {
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
      Alert.alert('Updated', 'Category updated successfully.');
    } else {
      // Add mode
      addCategory({
        name: name.trim(),
        type: activeTab,
        color: selectedColor,
        icon: selectedIcon,
      });
      Alert.alert('Success', 'New custom category created successfully.');
    }

    setModalVisible(false);
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"? Existing transactions in this category will remain, but the category won't be available for new transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategory(cat.id);
            setModalVisible(false);
            Alert.alert('Deleted', 'Category deleted successfully.');
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Lucide.ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'expense' && {
              borderBottomColor: colors.error,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab('expense')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'expense' ? colors.error : colors.textSecondary },
              activeTab === 'expense' && { fontWeight: '800' },
            ]}
          >
            EXPENSES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'income' && {
              borderBottomColor: colors.success,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab('income')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'income' ? colors.success : colors.textSecondary },
              activeTab === 'income' && { fontWeight: '800' },
            ]}
          >
            INCOME
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSystem = !item.user_id || item.user_id === 'guest_default';
          return (
            <Card
              variant="outlined"
              style={[
                styles.categoryCard,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                <CategoryIcon name={item.icon} color={item.color} size={22} />
              </View>
              <View style={{ flex: 1, paddingLeft: 14 }}>
                <Text style={[styles.catName, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {isSystem ? 'System Category' : 'Custom Category'}
                </Text>
              </View>
              {!isSystem ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                    <Lucide.Pencil color={colors.primary} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                    <Lucide.Trash2 color={colors.error} size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>SYSTEM</Text>
                </View>
              )}
            </Card>
          );
        }}
      />

      {/* Add Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
      >
        <Lucide.Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Add / Edit Category Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <View style={styles.formContainer}>
          <TextInput
            label="Category Name *"
            placeholder="e.g. Subscriptions, Gifts, Rent"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {/* Color Picker */}
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Select Color</Text>
          <View style={styles.gridRow}>
            {CURATED_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && {
                    borderColor: colors.text,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Lucide.Check color="#FFF" size={14} style={{ alignSelf: 'center' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon Picker */}
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Select Icon</Text>
          <View style={styles.gridRow}>
            {CURATED_ICONS.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconDot,
                  {
                    borderColor: selectedIcon === iconName ? selectedColor : colors.border,
                    backgroundColor: selectedIcon === iconName ? selectedColor + '15' : colors.card,
                  },
                ]}
                onPress={() => setSelectedIcon(iconName)}
              >
                <CategoryIcon
                  name={iconName}
                  color={selectedIcon === iconName ? selectedColor : colors.textSecondary}
                  size={20}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={editingCategory ? 'Save Changes' : 'Create Category'}
            onPress={handleSave}
            variant="primary"
            style={{ marginTop: 24 }}
          />

          {editingCategory && (
            <Button
              title="Delete Category"
              onPress={() => handleDelete(editingCategory)}
              variant="danger"
              style={{ marginTop: 12 }}
            />
          )}
        </View>
      </Modal>
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
    paddingBottom: 8,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  fab: {
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
  formContainer: {
    paddingVertical: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  iconDot: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
