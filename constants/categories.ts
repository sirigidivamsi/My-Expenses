import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // EXPENSES
  {
    id: 'd1111111-1111-1111-1111-111111111101',
    name: 'Food',
    type: 'expense',
    icon: 'Utensils',
    color: '#EF4444', // Red
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111102',
    name: 'Travel',
    type: 'expense',
    icon: 'Car',
    color: '#3B82F6', // Blue
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111103',
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#EC4899', // Pink
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111104',
    name: 'Bills',
    type: 'expense',
    icon: 'Receipt',
    color: '#10B981', // Green
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111105',
    name: 'Fuel',
    type: 'expense',
    icon: 'Fuel',
    color: '#F59E0B', // Yellow
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111106',
    name: 'Entertainment',
    type: 'expense',
    icon: 'Film',
    color: '#8B5CF6', // Purple
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111107',
    name: 'Health',
    type: 'expense',
    icon: 'Activity',
    color: '#14B8A6', // Teal
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111108',
    name: 'Education',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#06B6D4', // Cyan
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111109',
    name: 'EMI',
    type: 'expense',
    icon: 'CreditCard',
    color: '#F97316', // Orange
    is_deleted: false,
  },
  {
    id: 'd1111111-1111-1111-1111-111111111110',
    name: 'Rent',
    type: 'expense',
    icon: 'Home',
    color: '#6366F1', // Indigo
    is_deleted: false,
  },

  // INCOME
  {
    id: 'd2222222-2222-2222-2222-222222222201',
    name: 'Salary',
    type: 'income',
    icon: 'Briefcase',
    color: '#10B981', // Green
    is_deleted: false,
  },
  {
    id: 'd2222222-2222-2222-2222-222222222202',
    name: 'Freelance',
    type: 'income',
    icon: 'Laptop',
    color: '#3B82F6', // Blue
    is_deleted: false,
  },
  {
    id: 'd2222222-2222-2222-2222-222222222203',
    name: 'Business',
    type: 'income',
    icon: 'TrendingUp',
    color: '#8B5CF6', // Purple
    is_deleted: false,
  },
  {
    id: 'd2222222-2222-2222-2222-222222222204',
    name: 'Bonus',
    type: 'income',
    icon: 'Gift',
    color: '#F59E0B', // Yellow
    is_deleted: false,
  },
  {
    id: 'd2222222-2222-2222-2222-222222222205',
    name: 'Investment',
    type: 'income',
    icon: 'PiggyBank',
    color: '#14B8A6', // Teal
    is_deleted: false,
  },
];
