// Core Types for My Expenses Mobile App

export interface User {
  id: string;
  name: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  auth_provider?: 'email' | 'google';
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  currency: string; // e.g., 'INR', 'USD', 'EUR'
  notifications_enabled: boolean;
  recurring_reminders: boolean;
  budget_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

export type WalletType = 'cash' | 'bank' | 'credit_card' | 'upi' | 'other';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  created_at?: string;
  updated_at?: string;
  is_deleted: boolean;
}

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id?: string; // null means default system category
  name: string;
  type: TransactionType;
  icon: string; // Lucide icon name
  color: string;
  created_at?: string;
  updated_at?: string;
  is_deleted: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO string
  notes?: string;
  tags: string[];
  payment_method: string; // Wallet name or payment mode
  attachment_url?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // 'YYYY-MM'
  created_at?: string;
  updated_at?: string;
  is_deleted: boolean;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string; // ISO string
  saved_amount: number;
  created_at?: string;
  updated_at?: string;
  is_deleted: boolean;
}

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  interval: RecurringInterval;
  next_occurrence: string; // ISO string
  notes?: string;
  tags: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  is_deleted: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'budget_alert' | 'goal_reminder' | 'recurring_tx' | 'system';
  read_at?: string | null;
  created_at: string; // ISO string
}

export interface Attachment {
  id: string;
  transaction_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

// Sync Queue Types for Offline-First Syncing
export interface SyncQueueItem {
  id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 
    | 'wallets' 
    | 'categories' 
    | 'transactions' 
    | 'budgets' 
    | 'savings_goals' 
    | 'recurring_transactions' 
    | 'user_preferences'
    | 'credit_cards'
    | 'credit_card_statements'
    | 'credit_card_emis'
    | 'credit_card_rewards'
    | 'savings_plans'
    | 'subscriptions'
    | 'bill_splits'
    | 'credits'
    | 'credit_payments'
    | 'credit_reminders'
    | 'detected_notifications'
    | 'audit_logs';
  data: any;
  timestamp: string; // ISO string
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  action: 
    | 'TRANSACTION_CREATED' 
    | 'TRANSACTION_EDITED' 
    | 'TRANSACTION_DELETED' 
    | 'CREDIT_CARD_UPDATED' 
    | 'SAVINGS_GOAL_UPDATED';
  details: any;
  created_at: string; // ISO string
}

// ----------------------------------------------------
// NEW WEALTH MODULE TYPES
// ----------------------------------------------------

export type CreditCardType = 'visa' | 'mastercard' | 'rupay' | 'amex';

export interface CreditCard {
  id: string;
  user_id: string;
  wallet_id: string; // Linked wallet in wallets table
  card_name: string;
  bank_name: string;
  last_four: string;
  card_type: CreditCardType;
  credit_limit: number;
  available_limit: number;
  statement_date: number; // Day of the month, e.g. 15
  due_date: number; // Day of the month, e.g. 5
  interest_rate?: number;
  card_color: string;
  annual_fee?: number;
  annual_fee_waiver_spend?: number;
  expiry_month?: number;
  expiry_year?: number;
  lounge_visits_remaining?: number;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreditCardStatement {
  id: string;
  card_id: string;
  statement_period_start: string; // ISO string
  statement_period_end: string; // ISO string
  statement_amount: number;
  current_outstanding: number;
  minimum_due: number;
  due_date: string; // ISO string
  paid_amount: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  created_at?: string;
  updated_at?: string;
}

export interface CreditCardEMI {
  id: string;
  card_id: string;
  purchase_name: string;
  purchase_amount: number;
  emi_amount: number;
  interest_rate: number;
  total_months: number;
  remaining_months: number;
  paid_emis: number;
  start_date: string; // ISO string
  is_active: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreditCardRewards {
  id: string;
  card_id: string;
  cashback_earned: number;
  points_earned: number;
  points_redeemed: number;
  lounge_visits_remaining: number;
  created_at?: string;
  updated_at?: string;
}

export type SavingsPlanType =
  | 'rd' // Recurring Deposit
  | 'sip' // Mutual Fund SIP
  | 'gold' // Gold Savings Scheme
  | 'chit' // Chit Fund / Chitti
  | 'fd' // Fixed Deposit
  | 'ppf' // Public Provident Fund
  | 'nps' // National Pension System
  | 'emergency_fund' // Emergency Fund
  | 'goal'; // Goal-based custom savings

export interface SavingsPlan {
  id: string;
  user_id: string;
  type: SavingsPlanType;
  name: string;
  institution_name: string; // Bank name / AMC / Jeweller / Chitti Organizer
  monthly_contribution: number;
  contribution_date?: number; // Day of the month
  start_date: string; // ISO string
  maturity_date?: string; // ISO string
  interest_rate?: number;
  target_amount: number;
  current_amount: number; // Saved / invested till date
  is_active: boolean;
  is_deleted: boolean;
  // Dynamic fields parsed from JSON for custom plans
  details?: {
    total_members?: number; // Chit funds
    total_duration?: number; // Chit funds (months)
    auction_status?: string; // Chit funds
    prize_received?: boolean; // Chit funds
    bonus_month_eligible?: boolean; // Gold savings schemes
    annual_target?: number; // PPF annual limits
    account_number?: string; // PPF/NPS/Bank
    goal_name?: string; // Goal matching
  };
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  billing_period: 'monthly' | 'yearly';
  next_billing_date: string; // ISO string
  payment_wallet_id: string; // Paid via which wallet (cash/card/bank)
  is_active: boolean;
  is_deleted: boolean;
  reminder_notification_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BillSplit {
  id: string;
  transaction_id: string;
  description: string;
  total_amount: number;
  your_share: number;
  friend_name: string;
  friend_share: number;
  status: 'pending' | 'settled';
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------
// CREDITS & LOANS MODULE TYPES
// ----------------------------------------------------

export interface Credit {
  id: string;
  user_id: string;
  person_name: string;
  mobile_number?: string;
  type: 'lent' | 'borrowed';
  amount: number;
  date: string; // ISO string
  due_date?: string; // ISO string
  reason?: string;
  notes?: string;
  status: 'active' | 'partially_paid' | 'closed';
  attachment_url?: string;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreditPayment {
  id: string;
  credit_id: string;
  amount: number;
  date: string; // ISO string
  notes?: string;
  created_at?: string;
}

export interface CreditReminder {
  id: string;
  credit_id: string;
  reminder_date: string; // ISO string
  status: 'pending' | 'sent' | 'dismissed';
  created_at?: string;
}

// ----------------------------------------------------
// SMART EXPENSE DETECTION TYPES
// ----------------------------------------------------

export interface DetectedTransaction {
  id: string;
  user_id: string;
  notification_id?: string;
  app_name: string;
  package_name?: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  amount: number;
  merchant: string;
  transaction_type: 'income' | 'expense';
  status: 'pending' | 'saved' | 'ignored';
  created_at?: string;
}

export interface SmartExpenseSettings {
  enabled: boolean;
  supportedApps: string[];
  autoCategorization: Record<string, string>; // merchant keyword -> categoryId
  autoSaveTrustedMerchants: string[]; // list of merchants to auto-save (if we want, or keep empty)
}

