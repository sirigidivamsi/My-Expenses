import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import {
  Budget,
  Category,
  Notification,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  Wallet,
  CreditCard,
  CreditCardStatement,
  CreditCardEMI,
  CreditCardRewards,
  SavingsPlan,
  Subscription,
  BillSplit,
  SyncQueueItem,
  Credit,
  CreditPayment,
  CreditReminder,
  DetectedTransaction,
  SmartExpenseSettings,
  AuditLog,
} from '../types';
import { useAuthStore } from './useAuthStore';
import { useSyncStore } from './useSyncStore';
import {
  triggerLocalNotification,
  scheduleLocalNotification,
  cancelScheduledNotification,
} from '../services/notifications';
import { generateUuid, isUuid } from '../utils/id';
import { Platform } from 'react-native';
import ExpoNotificationListener from '../modules/expo-notification-listener';


interface DataState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  notifications: Notification[];
  recurringTransactions: RecurringTransaction[];
  
  // Wealth module state lists
  creditCards: CreditCard[];
  creditCardStatements: CreditCardStatement[];
  creditCardEMIs: CreditCardEMI[];
  creditCardRewards: CreditCardRewards[];
  savingsPlans: SavingsPlan[];
  subscriptions: Subscription[];
  billSplits: BillSplit[];

  // Credits & Loans and Smart Expense Detection state lists
  credits: Credit[];
  creditPayments: CreditPayment[];
  creditReminders: CreditReminder[];
  detectedNotifications: DetectedTransaction[];
  smartExpenseSettings: SmartExpenseSettings;
  auditLogs: AuditLog[];

  // Wallets Actions
  addWallet: (wallet: Omit<Wallet, 'id' | 'user_id' | 'is_deleted'>) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  transferMoney: (fromWalletId: string, toWalletId: string, amount: number, notes?: string) => void;

  // Categories Actions
  addCategory: (category: Omit<Category, 'id' | 'is_deleted'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Transactions Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'is_deleted'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Budgets Actions
  setBudget: (category_id: string, amount: number, month: string) => void;
  deleteBudget: (id: string) => void;

  // Savings Goals Actions
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'is_deleted'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;

  // Recurring Actions
  addRecurring: (rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'is_deleted'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;

  // Notifications Actions
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Credit Card Actions
  addCreditCard: (card: Omit<CreditCard, 'id' | 'user_id' | 'wallet_id' | 'is_deleted'>) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addCreditCardEMI: (emi: Omit<CreditCardEMI, 'id' | 'is_deleted' | 'is_active'>) => void;
  updateCreditCardEMI: (id: string, updates: Partial<CreditCardEMI>) => void;
  deleteCreditCardEMI: (id: string) => void;
  recordCreditCardPayment: (cardId: string, amount: number, type: 'full' | 'partial' | 'minimum', sourceWalletId: string) => void;
  triggerCardStatementGeneration: (cardId: string) => void;

  // Savings Actions
  addSavingsPlan: (plan: Omit<SavingsPlan, 'id' | 'user_id' | 'is_deleted'>) => void;
  updateSavingsPlan: (id: string, updates: Partial<SavingsPlan>) => void;
  deleteSavingsPlan: (id: string) => void;
  recordSavingsContribution: (planId: string, amount: number, sourceWalletId: string) => void;

  // Subscription Actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'user_id' | 'is_deleted'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  recordSubscriptionPayment: (subId: string) => void;

  // Bill Split Actions
  addBillSplit: (split: Omit<BillSplit, 'id'>) => void;
  updateBillSplit: (id: string, updates: Partial<BillSplit>) => void;

  // Credits Actions
  addCredit: (credit: Omit<Credit, 'id' | 'user_id' | 'status' | 'is_deleted'>, walletId?: string) => void;
  updateCredit: (id: string, updates: Partial<Credit>) => void;
  deleteCredit: (id: string) => void;
  addCreditPayment: (payment: Omit<CreditPayment, 'id' | 'created_at'>, walletId?: string) => void;

  // Smart Expense Detection Actions
  addRawNotification: (raw: Omit<DetectedTransaction, 'id' | 'user_id' | 'status' | 'amount' | 'merchant' | 'transaction_type' | 'created_at'>) => void;
  processDetectedTransaction: (id: string, action: 'save' | 'ignore', editedTxData?: Partial<Transaction>) => void;
  updateSmartExpenseSettings: (updates: Partial<SmartExpenseSettings>) => void;
  syncDetectedNotifications: () => void;

  // Sync helpers
  loadRemoteData: (data: {
    wallets?: Wallet[];
    categories?: Category[];
    transactions?: Transaction[];
    budgets?: Budget[];
    savingsGoals?: SavingsGoal[];
    recurringTransactions?: RecurringTransaction[];
    notifications?: Notification[];
    creditCards?: CreditCard[];
    creditCardStatements?: CreditCardStatement[];
    creditCardEMIs?: CreditCardEMI[];
    creditCardRewards?: CreditCardRewards[];
    savingsPlans?: SavingsPlan[];
    subscriptions?: Subscription[];
    billSplits?: BillSplit[];
    credits?: Credit[];
    creditPayments?: CreditPayment[];
    creditReminders?: CreditReminder[];
    detectedNotifications?: DetectedTransaction[];
    auditLogs?: AuditLog[];
  }) => void;
  normalizeLegacyIds: () => void;
  clearAllLocalData: () => void;
  getFinancialMetrics: () => {
    cashAndBank: number;
    activeSavingsInvested: number;
    activeCreditsLent: number;
    activeCreditsBorrowed: number;
    totalCreditCardDebt: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  checkAndApplyAutoRollovers: () => void;
}

const DEFAULT_WALLETS = (userId: string): Wallet[] => [
  {
    id: generateUuid(),
    user_id: userId,
    name: 'Cash',
    type: 'cash',
    balance: 0.0,
    color: '#10B981', // Emerald green
    is_deleted: false,
  },
  {
    id: generateUuid(),
    user_id: userId,
    name: 'Main Bank Account',
    type: 'bank',
    balance: 0.0,
    color: '#6366F1', // Indigo
    is_deleted: false,
  },
];

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => {
      const getUserId = () => {
        return useAuthStore.getState().user?.id || 'guest';
      };

      const isGuest = () => {
        return useAuthStore.getState().isGuest || !useAuthStore.getState().user;
      };

      const queueSync = (action: 'INSERT' | 'UPDATE' | 'DELETE', table: any, data: any) => {
        if (!isGuest()) {
          useSyncStore.getState().addToQueue(action, table, data);
        }
      };

      const logAction = (action: AuditLog['action'], details: any) => {
        const userId = getUserId();
        const authUser = useAuthStore.getState().user;
        const userEmail = authUser ? authUser.email : null;
        const userName = authUser ? authUser.name : null;

        const newLog: AuditLog = {
          id: generateUuid(),
          user_id: userId,
          user_email: userEmail || undefined,
          user_name: userName || undefined,
          action,
          details,
          created_at: new Date().toISOString(),
        };

        set((state) => ({ auditLogs: [...state.auditLogs, newLog] }));
        queueSync('INSERT', 'audit_logs', newLog);
      };

      const defaultCategoryIdSet = new Set(DEFAULT_CATEGORIES.map((category) => category.id));

      const normalizeUserId = (userId: string | undefined, currentUserId: string) => {
        if (!userId) return userId;
        if (currentUserId !== 'guest' && userId === 'guest') return currentUserId;
        return userId;
      };

      const getMappedId = (idMap: Record<string, string>, id?: string | null) => {
        if (!id) return id;
        return idMap[id] || id;
      };

      const registerIfInvalidUuid = (idMap: Record<string, string>, id?: string | null) => {
        if (!id || isUuid(id)) return;
        if (!idMap[id]) {
          idMap[id] = generateUuid();
        }
      };

      const mapQueuePayload = (
        table: SyncQueueItem['table'],
        data: any,
        idMap: Record<string, string>,
        currentUserId: string
      ) => {
        if (!data || typeof data !== 'object') {
          return data;
        }

        const mapped = {
          ...data,
          id: typeof data.id === 'string' ? getMappedId(idMap, data.id) : data.id,
          user_id: normalizeUserId(data.user_id, currentUserId),
          wallet_id: getMappedId(idMap, data.wallet_id),
          category_id: getMappedId(idMap, data.category_id),
          card_id: getMappedId(idMap, data.card_id),
          payment_wallet_id: getMappedId(idMap, data.payment_wallet_id),
          transaction_id: getMappedId(idMap, data.transaction_id),
        };

        if (
          table === 'categories' &&
          currentUserId !== 'guest' &&
          !mapped.user_id &&
          mapped.id &&
          !defaultCategoryIdSet.has(mapped.id)
        ) {
          mapped.user_id = currentUserId;
        }

        return mapped;
      };

      return {
        wallets: DEFAULT_WALLETS('guest'),
        categories: DEFAULT_CATEGORIES,
        transactions: [],
        budgets: [],
        savingsGoals: [],
        notifications: [],
        recurringTransactions: [],
        creditCards: [],
        creditCardStatements: [],
        creditCardEMIs: [],
        creditCardRewards: [],
        savingsPlans: [],
        subscriptions: [],
        billSplits: [],
        credits: [],
        creditPayments: [],
        creditReminders: [],
        detectedNotifications: [],
        auditLogs: [],
        smartExpenseSettings: {
          enabled: false,
          supportedApps: [
            'com.google.android.apps.nbu.paisa.user', // Google Pay
            'com.phonepe.app',                       // PhonePe
            'net.one97.paytm',                       // Paytm
            'com.amazon.mShop.android.shopping',     // Amazon Pay
            'com.snapwork.hdfc',                     // HDFC Bank
            'com.csg.imobile',                       // ICICI Bank
            'com.sbi.anywhere',                      // SBI
            'com.axis.mobile',                       // Axis Bank
            'com.msf.kbank.mobile',                  // Kotak Bank
            'com.indusind.mobile',                   // IndusInd Bank
          ],
          autoCategorization: {
            'swiggy': 'd1111111-1111-1111-1111-111111111101', // Food
            'zomato': 'd1111111-1111-1111-1111-111111111101', // Food
            'uber': 'd1111111-1111-1111-1111-111111111102',   // Travel
            'ola': 'd1111111-1111-1111-1111-111111111102',   // Travel
            'netflix': 'd1111111-1111-1111-1111-111111111106', // Entertainment
            'spotify': 'd1111111-1111-1111-1111-111111111106', // Entertainment
            'amazon': 'd1111111-1111-1111-1111-111111111103',  // Shopping
            'flipkart': 'd1111111-1111-1111-1111-111111111103', // Shopping
          },
          autoSaveTrustedMerchants: [],
        },

        // WALLETS
        addWallet: (walletData) => {
          const userId = getUserId();
          const newWallet: Wallet = {
            ...walletData,
            id: generateUuid(),
            user_id: userId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ wallets: [...state.wallets, newWallet] }));
          queueSync('INSERT', 'wallets', newWallet);
        },

        updateWallet: (id, updates) => {
          set((state) => ({
            wallets: state.wallets.map((w) =>
              w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
            ),
          }));

          const updatedWallet = get().wallets.find((w) => w.id === id);
          if (updatedWallet) {
            queueSync('UPDATE', 'wallets', updatedWallet);
          }
        },

        deleteWallet: (id) => {
          set((state) => ({
            wallets: state.wallets.map((w) =>
              w.id === id ? { ...w, is_deleted: true, updated_at: new Date().toISOString() } : w
            ),
          }));

          const deletedWallet = get().wallets.find((w) => w.id === id);
          if (deletedWallet) {
            queueSync('UPDATE', 'wallets', deletedWallet); // Soft delete sync
          }
        },

        transferMoney: (fromWalletId, toWalletId, amount, notes) => {
          const userId = getUserId();
          const fromWallet = get().wallets.find((w) => w.id === fromWalletId);
          const toWallet = get().wallets.find((w) => w.id === toWalletId);

          if (!fromWallet || !toWallet) return;

          // Update balances
          get().updateWallet(fromWalletId, { balance: Number(fromWallet.balance) - amount });
          get().updateWallet(toWalletId, { balance: Number(toWallet.balance) + amount });

          // Create double ledger transactions
          const transferGroupId = generateUuid();
          
          const expenseTx: Transaction = {
            id: generateUuid(),
            user_id: userId,
            wallet_id: fromWalletId,
            category_id: 'd1111111-1111-1111-1111-111111111102', // Transfer/Travel fallback or special category
            amount,
            type: 'expense',
            date: new Date().toISOString(),
            notes: notes || `Transfer to ${toWallet.name}`,
            tags: ['transfer', `group:${transferGroupId}`],
            payment_method: fromWallet.name,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const incomeTx: Transaction = {
            id: generateUuid(),
            user_id: userId,
            wallet_id: toWalletId,
            category_id: 'd2222222-2222-2222-2222-222222222202', // Transfer/Freelance fallback
            amount,
            type: 'income',
            date: new Date().toISOString(),
            notes: notes || `Transfer from ${fromWallet.name}`,
            tags: ['transfer', `group:${transferGroupId}`],
            payment_method: toWallet.name,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({
            transactions: [...state.transactions, expenseTx, incomeTx],
          }));

          queueSync('INSERT', 'transactions', expenseTx);
          queueSync('INSERT', 'transactions', incomeTx);

          get().addNotification(
            'Transfer Successful',
            `Transferred ₹${amount} from ${fromWallet.name} to ${toWallet.name}.`,
            'system'
          );
        },

        // CATEGORIES
        addCategory: (catData) => {
          const userId = getUserId();
          const newCategory: Category = {
            ...catData,
            id: generateUuid(),
            user_id: userId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ categories: [...state.categories, newCategory] }));
          queueSync('INSERT', 'categories', newCategory);
        },

        updateCategory: (id, updates) => {
          set((state) => ({
            categories: state.categories.map((c) =>
              c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
            ),
          }));

          const updatedCat = get().categories.find((c) => c.id === id);
          if (updatedCat) {
            queueSync('UPDATE', 'categories', updatedCat);
          }
        },

        deleteCategory: (id) => {
          set((state) => ({
            categories: state.categories.map((c) =>
              c.id === id ? { ...c, is_deleted: true, updated_at: new Date().toISOString() } : c
            ),
          }));

          const deletedCat = get().categories.find((c) => c.id === id);
          if (deletedCat) {
            queueSync('UPDATE', 'categories', deletedCat);
          }
        },

        // TRANSACTIONS
        addTransaction: (txData) => {
          const userId = getUserId();
          const newTx: Transaction = {
            ...txData,
            id: generateUuid(),
            user_id: userId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Update Wallet Balance
          const wallet = get().wallets.find((w) => w.id === txData.wallet_id);
          if (wallet) {
            const balanceChange = txData.type === 'income' ? txData.amount : -txData.amount;
            get().updateWallet(txData.wallet_id, {
              balance: Number(wallet.balance) + balanceChange,
            });
          }

          set((state) => ({ transactions: [...state.transactions, newTx] }));
          queueSync('INSERT', 'transactions', newTx);
          logAction('TRANSACTION_CREATED', { id: newTx.id, amount: newTx.amount, type: newTx.type });

          // Check Budgets and notify
          if (txData.type === 'expense') {
            const txMonth = txData.date.substring(0, 7); // 'YYYY-MM'
            const budget = get().budgets.find(
              (b) => b.category_id === txData.category_id && b.month === txMonth && !b.is_deleted
            );

            if (budget) {
              const currentSpent = get()
                .transactions.filter(
                  (t) =>
                    t.category_id === txData.category_id &&
                    t.type === 'expense' &&
                    t.date.substring(0, 7) === txMonth &&
                    !t.is_deleted
                )
                .reduce((acc, t) => acc + Number(t.amount), 0) + Number(txData.amount);

              const cat = get().categories.find((c) => c.id === txData.category_id);

              if (currentSpent >= budget.amount) {
                get().addNotification(
                  'Budget Exceeded! ⚠️',
                  `You spent ₹${currentSpent.toFixed(0)} on ${cat?.name || 'Category'}, exceeding your monthly budget of ₹${budget.amount}.`,
                  'budget_alert'
                );
              } else if (currentSpent >= budget.amount * 0.85) {
                get().addNotification(
                  'Budget Reaching Limit 🔔',
                  `You spent ₹${currentSpent.toFixed(0)} on ${cat?.name || 'Category'} which is 85% of your ₹${budget.amount} budget limit.`,
                  'budget_alert'
                );
              }
            }
          }
        },

        updateTransaction: (id, updates) => {
          const prevTx = get().transactions.find((t) => t.id === id);
          if (!prevTx) return;

          // Revert previous wallet balance impact
          const prevWallet = get().wallets.find((w) => w.id === prevTx.wallet_id);
          if (prevWallet) {
            const revertAmount = prevTx.type === 'income' ? -prevTx.amount : prevTx.amount;
            get().updateWallet(prevTx.wallet_id, { balance: Number(prevWallet.balance) + revertAmount });
          }

          // Update Transaction state
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
            ),
          }));

          const updatedTx = get().transactions.find((t) => t.id === id);
          if (!updatedTx) return;

          // Commit new wallet balance impact
          const newWallet = get().wallets.find((w) => w.id === updatedTx.wallet_id);
          if (newWallet) {
            const commitAmount = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;
            get().updateWallet(updatedTx.wallet_id, { balance: Number(newWallet.balance) + commitAmount });
          }

          queueSync('UPDATE', 'transactions', updatedTx);
          logAction('TRANSACTION_EDITED', { id, prevAmount: prevTx.amount, newAmount: updates.amount !== undefined ? updates.amount : prevTx.amount });
        },

        deleteTransaction: (id) => {
          const prevTx = get().transactions.find((t) => t.id === id);
          if (!prevTx) return;

          // Revert balance impact
          const wallet = get().wallets.find((w) => w.id === prevTx.wallet_id);
          if (wallet) {
            const revertAmount = prevTx.type === 'income' ? -prevTx.amount : prevTx.amount;
            get().updateWallet(prevTx.wallet_id, { balance: Number(wallet.balance) + revertAmount });
          }

          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, is_deleted: true, updated_at: new Date().toISOString() } : t
            ),
          }));

          const deletedTx = get().transactions.find((t) => t.id === id);
          if (deletedTx) {
            queueSync('UPDATE', 'transactions', deletedTx);
          }
          logAction('TRANSACTION_DELETED', { id, amount: prevTx.amount });
        },

        // BUDGETS
        setBudget: (category_id, amount, month) => {
          const userId = getUserId();
          const existingBudget = get().budgets.find(
            (b) => b.category_id === category_id && b.month === month && !b.is_deleted
          );

          if (existingBudget) {
            get().deleteBudget(existingBudget.id); // Clear previous budget
          }

          const newBudget: Budget = {
            id: generateUuid(),
            user_id: userId,
            category_id,
            amount,
            month,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ budgets: [...state.budgets, newBudget] }));
          queueSync('INSERT', 'budgets', newBudget);
        },

        deleteBudget: (id) => {
          set((state) => ({
            budgets: state.budgets.map((b) =>
              b.id === id ? { ...b, is_deleted: true, updated_at: new Date().toISOString() } : b
            ),
          }));

          const deletedBudget = get().budgets.find((b) => b.id === id);
          if (deletedBudget) {
            queueSync('UPDATE', 'budgets', deletedBudget);
          }
        },

        // SAVINGS GOALS
        addGoal: (goalData) => {
          const userId = getUserId();
          const newGoal: SavingsGoal = {
            ...goalData,
            id: generateUuid(),
            user_id: userId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ savingsGoals: [...state.savingsGoals, newGoal] }));
          queueSync('INSERT', 'savings_goals', newGoal);
        },

        updateGoal: (id, updates) => {
          set((state) => ({
            savingsGoals: state.savingsGoals.map((g) =>
              g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
            ),
          }));

          const updatedGoal = get().savingsGoals.find((g) => g.id === id);
          if (updatedGoal) {
            queueSync('UPDATE', 'savings_goals', updatedGoal);
          }
          logAction('SAVINGS_GOAL_UPDATED', { id, updates });
        },

        deleteGoal: (id) => {
          set((state) => ({
            savingsGoals: state.savingsGoals.map((g) =>
              g.id === id ? { ...g, is_deleted: true, updated_at: new Date().toISOString() } : g
            ),
          }));

          const deletedGoal = get().savingsGoals.find((g) => g.id === id);
          if (deletedGoal) {
            queueSync('UPDATE', 'savings_goals', deletedGoal);
          }
        },

        // RECURRING TRANSACTIONS
        addRecurring: (recData) => {
          const userId = getUserId();
          const newRec: RecurringTransaction = {
            ...recData,
            id: generateUuid(),
            user_id: userId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ recurringTransactions: [...state.recurringTransactions, newRec] }));
          queueSync('INSERT', 'recurring_transactions', newRec);
        },

        updateRecurring: (id, updates) => {
          set((state) => ({
            recurringTransactions: state.recurringTransactions.map((r) =>
              r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
            ),
          }));

          const updatedRec = get().recurringTransactions.find((r) => r.id === id);
          if (updatedRec) {
            queueSync('UPDATE', 'recurring_transactions', updatedRec);
          }
        },

        deleteRecurring: (id) => {
          set((state) => ({
            recurringTransactions: state.recurringTransactions.map((r) =>
              r.id === id ? { ...r, is_deleted: true, updated_at: new Date().toISOString() } : r
            ),
          }));

          const deletedRec = get().recurringTransactions.find((r) => r.id === id);
          if (deletedRec) {
            queueSync('UPDATE', 'recurring_transactions', deletedRec);
          }
        },

        // NOTIFICATIONS
        addNotification: (title, message, type) => {
          const userId = getUserId();
          const newNotification: Notification = {
            id: generateUuid(),
            user_id: userId,
            title,
            message,
            type,
            read_at: null,
            created_at: new Date().toISOString(),
          };

          set((state) => ({ notifications: [newNotification, ...state.notifications] }));
          
          // Trigger true OS-level local notification
          triggerLocalNotification(title, message);
        },

        markNotificationRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ),
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // CREDIT CARDS ACTIONS
        addCreditCard: (cardData) => {
          const userId = getUserId();
          const cardId = generateUuid();
          const walletId = generateUuid();

          // 1. Create linked Wallet representation in state
          const newCardWallet: Wallet = {
            id: walletId,
            user_id: userId,
            name: `${cardData.bank_name} - ${cardData.card_name} (*${cardData.last_four})`,
            type: 'credit_card',
            balance: 0.0, // Outstanding balance initially 0
            color: cardData.card_color,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // 2. Create CreditCard object
          const newCard: CreditCard = {
            ...cardData,
            id: cardId,
            user_id: userId,
            wallet_id: walletId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // 3. Create default CreditCardRewards object
          const newRewards: CreditCardRewards = {
            id: generateUuid(),
            card_id: cardId,
            cashback_earned: 0.0,
            points_earned: 0.0,
            points_redeemed: 0.0,
            lounge_visits_remaining: cardData.lounge_visits_remaining || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({
            wallets: [...state.wallets, newCardWallet],
            creditCards: [...state.creditCards, newCard],
            creditCardRewards: [...state.creditCardRewards, newRewards],
          }));

          queueSync('INSERT', 'wallets', newCardWallet);
          queueSync('INSERT', 'credit_cards', newCard);
          queueSync('INSERT', 'credit_card_rewards', newRewards);

          get().addNotification(
            'Credit Card Registered 💳',
            `Your ${cardData.bank_name} ${cardData.card_name} card was successfully added.`,
            'system'
          );
        },

        updateCreditCard: (id, updates) => {
          set((state) => ({
            creditCards: state.creditCards.map((c) =>
              c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
            ),
          }));

          const updatedCard = get().creditCards.find((c) => c.id === id);
          if (updatedCard) {
            queueSync('UPDATE', 'credit_cards', updatedCard);

            // Keep linked wallet name and color in sync
            const wallet = get().wallets.find((w) => w.id === updatedCard.wallet_id);
            if (wallet) {
              const updatedWalletName = `${updatedCard.bank_name} - ${updatedCard.card_name} (*${updatedCard.last_four})`;
              get().updateWallet(updatedCard.wallet_id, {
                name: updatedWalletName,
                color: updatedCard.card_color,
              });
            }
            logAction('CREDIT_CARD_UPDATED', { id, updates });
          }
        },

        deleteCreditCard: (id) => {
          const card = get().creditCards.find((c) => c.id === id);
          if (!card) return;

          set((state) => ({
            creditCards: state.creditCards.map((c) =>
              c.id === id ? { ...c, is_deleted: true, updated_at: new Date().toISOString() } : c
            ),
          }));

          const deletedCard = get().creditCards.find((c) => c.id === id);
          if (deletedCard) {
            queueSync('UPDATE', 'credit_cards', deletedCard);
            // Soft delete linked wallet
            get().deleteWallet(deletedCard.wallet_id);
          }
        },

        addCreditCardEMI: (emiData) => {
          const newEMI: CreditCardEMI = {
            ...emiData,
            id: generateUuid(),
            is_active: true,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ creditCardEMIs: [...state.creditCardEMIs, newEMI] }));
          queueSync('INSERT', 'credit_card_emis', newEMI);

          // Add transaction for the EMI purchase (divided initial hit or record)
          const card = get().creditCards.find((c) => c.id === emiData.card_id);
          if (card) {
            get().addNotification(
              'EMI Conversion Tracked 📈',
              `Purchase of ₹${emiData.purchase_amount} converted to EMI (₹${emiData.emi_amount}/month for ${emiData.total_months} months).`,
              'system'
            );
          }
        },

        updateCreditCardEMI: (id, updates) => {
          set((state) => ({
            creditCardEMIs: state.creditCardEMIs.map((e) =>
              e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
            ),
          }));

          const updatedEmi = get().creditCardEMIs.find((e) => e.id === id);
          if (updatedEmi) {
            queueSync('UPDATE', 'credit_card_emis', updatedEmi);
          }
        },

        deleteCreditCardEMI: (id) => {
          set((state) => ({
            creditCardEMIs: state.creditCardEMIs.map((e) =>
              e.id === id ? { ...e, is_deleted: true, updated_at: new Date().toISOString() } : e
            ),
          }));

          const deletedEmi = get().creditCardEMIs.find((e) => e.id === id);
          if (deletedEmi) {
            queueSync('UPDATE', 'credit_card_emis', deletedEmi);
          }
        },

        recordCreditCardPayment: (cardId, amount, type, sourceWalletId) => {
          const card = get().creditCards.find((c) => c.id === cardId);
          const sourceWallet = get().wallets.find((w) => w.id === sourceWalletId);
          if (!card || !sourceWallet) return;

          // 1. Deduct amount from bank/cash source wallet
          get().updateWallet(sourceWalletId, {
            balance: Number(sourceWallet.balance) - amount,
          });

          // 2. Reduce outstanding on the credit card linked wallet (balance becomes less negative or closer to 0)
          // Outstanding balance in My Expenses is tracked as positive debt in CC Dashboard,
          // but inside the wallets balance, we subtract the debt, so we add paid balance to card wallet.
          const cardWallet = get().wallets.find((w) => w.id === card.wallet_id);
          if (cardWallet) {
            get().updateWallet(card.wallet_id, {
              balance: Number(cardWallet.balance) + amount,
            });
            // Update Card Available Limit
            get().updateCreditCard(cardId, {
              available_limit: Math.min(card.credit_limit, Number(card.available_limit) + amount),
            });
          }

          // 3. Record transaction
          const userId = getUserId();
          const paymentTx: Transaction = {
            id: generateUuid(),
            user_id: userId,
            wallet_id: sourceWalletId,
            category_id: 'd1111111-1111-1111-1111-111111111102', // Financial Services falls to generic system category
            amount,
            type: 'expense',
            date: new Date().toISOString(),
            notes: `Paid credit card bill for ${card.bank_name} ${card.card_name} (${type.toUpperCase()})`,
            tags: ['credit-card-payment', card.bank_name.toLowerCase()],
            payment_method: sourceWallet.name,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ transactions: [...state.transactions, paymentTx] }));
          queueSync('INSERT', 'transactions', paymentTx);

          // 4. Update statement status
          set((state) => {
            const statements = state.creditCardStatements.map((s) => {
              if (s.card_id === cardId && s.status !== 'paid') {
                const newPaid = Number(s.paid_amount) + amount;
                const newStatus = newPaid >= s.statement_amount ? 'paid' : 'partially_paid';
                const updatedStmt: CreditCardStatement = {
                  ...s,
                  paid_amount: newPaid,
                  status: newStatus as any,
                  updated_at: new Date().toISOString(),
                };
                queueSync('UPDATE', 'credit_card_statements', updatedStmt);
                return updatedStmt;
              }
              return s;
            });
            return { creditCardStatements: statements };
          });

          get().addNotification(
            'Card Payment Recorded Successfully ✅',
            `Recorded ₹${amount} payment to ${card.bank_name} card from ${sourceWallet.name}.`,
            'system'
          );
        },

        triggerCardStatementGeneration: (cardId) => {
          const card = get().creditCards.find((c) => c.id === cardId);
          if (!card) return;

          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth(); // 0-indexed

          // Build billing cycle
          // Start: Previous month, day of statement + 1
          // End: Current month, day of statement
          const startPeriod = new Date(currentYear, currentMonth - 1, card.statement_date + 1);
          const endPeriod = new Date(currentYear, currentMonth, card.statement_date, 23, 59, 59);
          
          // Calculate amount spent in this period
          const cycleSpend = get().transactions
            .filter((t) => t.wallet_id === card.wallet_id && !t.is_deleted && new Date(t.date) >= startPeriod && new Date(t.date) <= endPeriod)
            .reduce((sum, t) => sum + Number(t.amount), 0);

          // Due Date calculation (e.g. statement date 15th, due date 5th of next month)
          let dueYear = currentYear;
          let dueMonth = currentMonth + 1;
          if (card.due_date < card.statement_date) {
            // Due date is in next calendar month
            dueMonth = currentMonth + 1;
          } else {
            // Same month due date
            dueMonth = currentMonth;
          }
          if (dueMonth > 11) {
            dueMonth = 0;
            dueYear += 1;
          }
          const dueDateObj = new Date(dueYear, dueMonth, card.due_date, 12, 0, 0);

          const statementId = generateUuid();
          const newStatement: CreditCardStatement = {
            id: statementId,
            card_id: cardId,
            statement_period_start: startPeriod.toISOString(),
            statement_period_end: endPeriod.toISOString(),
            statement_amount: cycleSpend,
            current_outstanding: cycleSpend,
            minimum_due: Number((cycleSpend * 0.05).toFixed(2)), // 5% minimum due fallback
            due_date: dueDateObj.toISOString(),
            paid_amount: 0.0,
            status: cycleSpend > 0 ? 'unpaid' : 'paid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({
            creditCardStatements: [...state.creditCardStatements, newStatement],
          }));
          queueSync('INSERT', 'credit_card_statements', newStatement);

          if (cycleSpend > 0) {
            get().addNotification(
              `Bill Generated: ${card.bank_name} 📝`,
              `Statement generated for ₹${cycleSpend.toFixed(2)}. Due date is ${dueDateObj.toLocaleDateString()}.`,
              'recurring_tx'
            );

            const threeDaysBefore = new Date(dueDateObj);
            threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
            threeDaysBefore.setHours(9, 0, 0, 0);
            if (threeDaysBefore > new Date()) {
              scheduleLocalNotification(
                `Credit Card Bill Due Soon 💳`,
                `Your ${card.bank_name} credit card bill of ₹${cycleSpend.toFixed(2)} is due in 3 days.`,
                threeDaysBefore
              );
            }

            const dueDay = new Date(dueDateObj);
            dueDay.setHours(9, 0, 0, 0);
            if (dueDay > new Date()) {
              scheduleLocalNotification(
                `Credit Card Bill Due Today! ⚠️`,
                `Your ${card.bank_name} credit card bill of ₹${cycleSpend.toFixed(2)} is due today. Pay now to avoid late fees.`,
                dueDay
              );
            }
          }
        },

        // SAVINGS PLAN ACTIONS
        addSavingsPlan: (planData) => {
          const userId = getUserId();
          const newPlan: SavingsPlan = {
            ...planData,
            id: generateUuid(),
            user_id: userId,
            is_active: true,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ savingsPlans: [...state.savingsPlans, newPlan] }));
          queueSync('INSERT', 'savings_plans', newPlan);

          get().addNotification(
            'New Savings Goal Tracked 🎯',
            `Started tracking: ${planData.name} (${planData.type.toUpperCase()}) with monthly contribution ₹${planData.monthly_contribution}.`,
            'system'
          );
        },

        updateSavingsPlan: (id, updates) => {
          set((state) => ({
            savingsPlans: state.savingsPlans.map((p) =>
              p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
            ),
          }));

          const updatedPlan = get().savingsPlans.find((p) => p.id === id);
          if (updatedPlan) {
            queueSync('UPDATE', 'savings_plans', updatedPlan);
          }
        },

        deleteSavingsPlan: (id) => {
          set((state) => ({
            savingsPlans: state.savingsPlans.map((p) =>
              p.id === id ? { ...p, is_deleted: true, updated_at: new Date().toISOString() } : p
            ),
          }));

          const deletedPlan = get().savingsPlans.find((p) => p.id === id);
          if (deletedPlan) {
            queueSync('UPDATE', 'savings_plans', deletedPlan);
          }
        },

        recordSavingsContribution: (planId, amount, sourceWalletId) => {
          const plan = get().savingsPlans.find((p) => p.id === planId);
          const sourceWallet = get().wallets.find((w) => w.id === sourceWalletId);
          if (!plan || !sourceWallet) return;

          // 1. Deduct money from bank/cash source
          get().updateWallet(sourceWalletId, {
            balance: Number(sourceWallet.balance) - amount,
          });

          // 2. Increment invested/saved amount inside the plan
          const updatedAmount = Number(plan.current_amount) + amount;
          get().updateSavingsPlan(planId, {
            current_amount: updatedAmount,
          });

          // 3. Write transaction of type expense with specific tag
          const userId = getUserId();
          const contributionTx: Transaction = {
            id: generateUuid(),
            user_id: userId,
            wallet_id: sourceWalletId,
            category_id: 'd1111111-1111-1111-1111-111111111102', // General financial investment category mapping
            amount,
            type: 'expense',
            date: new Date().toISOString(),
            notes: `Contribution to ${plan.name} (${plan.type.toUpperCase()})`,
            tags: ['savings-contribution', plan.type],
            payment_method: sourceWallet.name,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ transactions: [...state.transactions, contributionTx] }));
          queueSync('INSERT', 'transactions', contributionTx);

          get().addNotification(
            `Recorded Contribution! 💰`,
            `Invested ₹${amount} into ${plan.name}. Progress is now ${((updatedAmount / plan.target_amount) * 100).toFixed(0)}%.`,
            'system'
          );
        },

        // SUBSCRIPTIONS ACTIONS
        addSubscription: (subData) => {
          const userId = getUserId();
          const subId = generateUuid();
          const newSub: Subscription = {
            ...subData,
            id: subId,
            user_id: userId,
            is_active: true,
            is_deleted: false,
            reminder_notification_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const rDate = new Date(newSub.next_billing_date);
          rDate.setDate(rDate.getDate() - 1);
          rDate.setHours(9, 0, 0, 0);

          if (rDate > new Date()) {
            const title = `Subscription Due Tomorrow 🍿`;
            const body = `Your subscription for ${newSub.name} (₹${newSub.amount}) is due tomorrow.`;
            scheduleLocalNotification(title, body, rDate).then((notificationId) => {
              const subWithNotif = { ...newSub, reminder_notification_id: notificationId };
              set((state) => ({ subscriptions: [...state.subscriptions, subWithNotif] }));
              queueSync('INSERT', 'subscriptions', subWithNotif);
            });
          } else {
            set((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
            queueSync('INSERT', 'subscriptions', newSub);
          }
        },

        updateSubscription: (id, updates) => {
          const prevSub = get().subscriptions.find((s) => s.id === id);
          
          set((state) => ({
            subscriptions: state.subscriptions.map((s) =>
              s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
            ),
          }));

          const updatedSub = get().subscriptions.find((s) => s.id === id);
          if (updatedSub) {
            if (prevSub?.reminder_notification_id) {
              cancelScheduledNotification(prevSub.reminder_notification_id);
            }

            if (updatedSub.is_active && !updatedSub.is_deleted) {
              const rDate = new Date(updatedSub.next_billing_date);
              rDate.setDate(rDate.getDate() - 1);
              rDate.setHours(9, 0, 0, 0);

              if (rDate > new Date()) {
                const title = `Subscription Due Tomorrow 🍿`;
                const body = `Your subscription for ${updatedSub.name} (₹${updatedSub.amount}) is due tomorrow.`;
                scheduleLocalNotification(title, body, rDate).then((notificationId) => {
                  if (notificationId) {
                    set((state) => ({
                      subscriptions: state.subscriptions.map((s) =>
                        s.id === id ? { ...s, reminder_notification_id: notificationId } : s
                      ),
                    }));
                    const finalSub = get().subscriptions.find((s) => s.id === id);
                    if (finalSub) queueSync('UPDATE', 'subscriptions', finalSub);
                  } else {
                    queueSync('UPDATE', 'subscriptions', updatedSub);
                  }
                });
                return;
              }
            }
            
            queueSync('UPDATE', 'subscriptions', updatedSub);
          }
        },

        deleteSubscription: (id) => {
          const prevSub = get().subscriptions.find((s) => s.id === id);
          if (prevSub?.reminder_notification_id) {
            cancelScheduledNotification(prevSub.reminder_notification_id);
          }

          set((state) => ({
            subscriptions: state.subscriptions.map((s) =>
              s.id === id ? { ...s, is_deleted: true, reminder_notification_id: null, updated_at: new Date().toISOString() } : s
            ),
          }));

          const deletedSub = get().subscriptions.find((s) => s.id === id);
          if (deletedSub) {
            queueSync('UPDATE', 'subscriptions', deletedSub);
          }
        },

        recordSubscriptionPayment: (subId) => {
          const sub = get().subscriptions.find((s) => s.id === subId);
          if (!sub) return;

          const sourceWallet = get().wallets.find((w) => w.id === sub.payment_wallet_id);
          if (sourceWallet) {
            get().updateWallet(sub.payment_wallet_id, {
              balance: Number(sourceWallet.balance) - sub.amount,
            });

            const userId = getUserId();
            const subTx: Transaction = {
              id: generateUuid(),
              user_id: userId,
              wallet_id: sub.payment_wallet_id,
              category_id: 'd1111111-1111-1111-1111-111111111103', // Bills & Utilities
              amount: sub.amount,
              type: 'expense',
              date: new Date().toISOString(),
              notes: `Subscription: ${sub.name}`,
              tags: ['subscription', sub.name.toLowerCase()],
              payment_method: sourceWallet.name,
              is_deleted: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            set((state) => ({ transactions: [...state.transactions, subTx] }));
            queueSync('INSERT', 'transactions', subTx);

            const nextDateObj = new Date(sub.next_billing_date);
            if (sub.billing_period === 'monthly') {
              nextDateObj.setMonth(nextDateObj.getMonth() + 1);
            } else {
              nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
            }

            get().updateSubscription(subId, {
              next_billing_date: nextDateObj.toISOString(),
            });

            get().addNotification(
              `Subscription Paid 🍿`,
              `Recorded ₹${sub.amount} payment for ${sub.name}. Next bill date is ${nextDateObj.toLocaleDateString()}.`,
              'recurring_tx'
            );
          }
        },

        // BILL SPLIT ACTIONS
        addBillSplit: (splitData) => {
          const newSplit: BillSplit = {
            ...splitData,
            id: generateUuid(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ billSplits: [...state.billSplits, newSplit] }));
          queueSync('INSERT', 'bill_splits', newSplit);
        },

        updateBillSplit: (id, updates) => {
          set((state) => ({
            billSplits: state.billSplits.map((s) =>
              s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
            ),
          }));

          const updatedSplit = get().billSplits.find((s) => s.id === id);
          if (updatedSplit) {
            queueSync('UPDATE', 'bill_splits', updatedSplit);
          }
        },

        // CREDITS & LOANS ACTIONS
        addCredit: (creditData, walletId) => {
          const userId = getUserId();
          const creditId = generateUuid();
          const newCredit: Credit = {
            ...creditData,
            id: creditId,
            user_id: userId,
            status: 'active',
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set((state) => ({ credits: [...state.credits, newCredit] }));
          queueSync('INSERT', 'credits', newCredit);

          // 1. Handle Wallet Transaction Auto-log
          if (walletId) {
            const wallet = get().wallets.find((w) => w.id === walletId);
            if (wallet) {
              const amount = Number(creditData.amount);
              // Deduct from wallet if we lent money, add to wallet if we borrowed
              const isLent = creditData.type === 'lent';
              const walletBalanceChange = isLent ? -amount : amount;

              get().updateWallet(walletId, {
                balance: Number(wallet.balance) + walletBalanceChange,
              });

              // Create transaction
              const ledgerTx: Transaction = {
                id: generateUuid(),
                user_id: userId,
                wallet_id: walletId,
                category_id: isLent ? 'd1111111-1111-1111-1111-111111111104' : 'd2222222-2222-2222-2222-222222222201', // fallback
                amount,
                type: isLent ? 'expense' : 'income',
                date: creditData.date,
                notes: `${isLent ? 'Lent to' : 'Borrowed from'} ${creditData.person_name}. ${creditData.reason || ''}`,
                tags: ['credit-loan', creditData.type, creditData.person_name.toLowerCase()],
                payment_method: wallet.name,
                is_deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              set((state) => ({ transactions: [...state.transactions, ledgerTx] }));
              queueSync('INSERT', 'transactions', ledgerTx);
            }
          }

          // 2. Schedule Due Reminders
          if (creditData.due_date) {
            const dueDate = new Date(creditData.due_date);
            const now = new Date();

            const reminderDates = [
              { label: 'Due Today ⏰', daysOffset: 0 },
              { label: 'Due in 3 Days ⏰', daysOffset: -3 },
              { label: 'Due in 7 Days ⏰', daysOffset: -7 },
              { label: 'Overdue Loan Alert ⚠️', daysOffset: 1 },
            ];

            reminderDates.forEach(async ({ label, daysOffset }) => {
              const rDate = new Date(dueDate);
              rDate.setDate(rDate.getDate() + daysOffset);
              // Set to 9:00 AM on that day
              rDate.setHours(9, 0, 0, 0);

              if (rDate > now) {
                const title = label;
                const body = `${creditData.type === 'lent' ? 'Money lent to' : 'Loan borrowed from'} ${creditData.person_name} (₹${creditData.amount}) is ${daysOffset === 1 ? 'OVERDUE' : daysOffset === 0 ? 'due today' : `due in ${Math.abs(daysOffset)} days`}.`;
                
                const notificationId = await scheduleLocalNotification(title, body, rDate);
                if (notificationId) {
                  const newReminder: CreditReminder = {
                    id: notificationId, // Using notifications scheduled ID directly as key
                    credit_id: creditId,
                    reminder_date: rDate.toISOString(),
                    status: 'pending',
                    created_at: new Date().toISOString(),
                  };

                  set((state) => ({ creditReminders: [...state.creditReminders, newReminder] }));
                  queueSync('INSERT', 'credit_reminders', newReminder);
                }
              }
            });
          }

          get().addNotification(
            'Credit Logged 💸',
            `${creditData.type === 'lent' ? 'Lent ₹' : 'Borrowed ₹'}${creditData.amount} ${creditData.type === 'lent' ? 'to' : 'from'} ${creditData.person_name}.`,
            'system'
          );
        },

        updateCredit: (id, updates) => {
          set((state) => ({
            credits: state.credits.map((c) =>
              c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
            ),
          }));

          const updatedCredit = get().credits.find((c) => c.id === id);
          if (updatedCredit) {
            queueSync('UPDATE', 'credits', updatedCredit);
          }
        },

        deleteCredit: (id) => {
          // Cancel pending reminders
          const creditReminders = get().creditReminders.filter((r) => r.credit_id === id && r.status === 'pending');
          creditReminders.forEach((r) => cancelScheduledNotification(r.id));

          set((state) => ({
            credits: state.credits.map((c) =>
              c.id === id ? { ...c, is_deleted: true, updated_at: new Date().toISOString() } : c
            ),
            creditReminders: state.creditReminders.map((r) =>
              r.credit_id === id ? { ...r, status: 'dismissed' } : r
            ),
          }));

          const deletedCredit = get().credits.find((c) => c.id === id);
          if (deletedCredit) {
            queueSync('UPDATE', 'credits', deletedCredit);
          }
        },

        addCreditPayment: (paymentData, walletId) => {
          const userId = getUserId();
          const paymentId = generateUuid();
          const newPayment: CreditPayment = {
            ...paymentData,
            id: paymentId,
            created_at: new Date().toISOString(),
          };

          set((state) => ({ creditPayments: [...state.creditPayments, newPayment] }));
          queueSync('INSERT', 'credit_payments', newPayment);

          // Find the associated credit
          const credit = get().credits.find((c) => c.id === paymentData.credit_id);
          if (!credit) return;

          // Calculate new outstanding balance
          const totalPaidSoFar = get()
            .creditPayments.filter((p) => p.credit_id === paymentData.credit_id)
            .reduce((sum, p) => sum + Number(p.amount), 0);

          const remainingBalance = Number(credit.amount) - totalPaidSoFar;
          let newStatus: Credit['status'] = 'partially_paid';
          if (remainingBalance <= 0) {
            newStatus = 'closed';

            // Cancel any remaining reminders if closed
            const pendingReminders = get().creditReminders.filter((r) => r.credit_id === credit.id && r.status === 'pending');
            pendingReminders.forEach((r) => cancelScheduledNotification(r.id));

            set((state) => ({
              creditReminders: state.creditReminders.map((r) =>
                r.credit_id === credit.id ? { ...r, status: 'dismissed' } : r
              ),
            }));
          }

          get().updateCredit(credit.id, { status: newStatus });

          // Wallet integration
          if (walletId) {
            const wallet = get().wallets.find((w) => w.id === walletId);
            if (wallet) {
              const amount = Number(paymentData.amount);
              // Lent credit paid back -> increases wallet balance (income)
              // Borrowed credit paid back -> decreases wallet balance (expense)
              const isLent = credit.type === 'lent';
              const walletBalanceChange = isLent ? amount : -amount;

              get().updateWallet(walletId, {
                balance: Number(wallet.balance) + walletBalanceChange,
              });

              // Create transaction
              const ledgerTx: Transaction = {
                id: generateUuid(),
                user_id: userId,
                wallet_id: walletId,
                category_id: isLent ? 'd2222222-2222-2222-2222-222222222201' : 'd1111111-1111-1111-1111-111111111104', // fallback
                amount,
                type: isLent ? 'income' : 'expense',
                date: paymentData.date,
                notes: `Payment for credit ${isLent ? 'lent to' : 'borrowed from'} ${credit.person_name}. Notes: ${paymentData.notes || ''}`,
                tags: ['credit-payment', credit.type, credit.person_name.toLowerCase()],
                payment_method: wallet.name,
                is_deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              set((state) => ({ transactions: [...state.transactions, ledgerTx] }));
              queueSync('INSERT', 'transactions', ledgerTx);
            }
          }

          get().addNotification(
            'Credit Payment Recorded 📝',
            `Recorded payment of ₹${paymentData.amount} for ${credit.person_name}. Remaining balance: ₹${Math.max(0, remainingBalance)}.`,
            'system'
          );
        },

        // SMART EXPENSE DETECTION ACTIONS
        addRawNotification: (raw) => {
          const userId = getUserId();

          // 1. Clean and parse amount
          const amtMatch = raw.body.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
          if (!amtMatch) return;
          const amount = parseFloat(amtMatch[1].replace(/,/g, ''));
          if (isNaN(amount)) return;

          // 2. Classify transaction type
          const bodyLower = raw.body.toLowerCase();
          const isIncome = bodyLower.includes('received') ||
                           bodyLower.includes('credited') ||
                           bodyLower.includes('refund') ||
                           bodyLower.includes('cashback') ||
                           bodyLower.includes('added to') ||
                           bodyLower.includes('credited with');
          const transaction_type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

          // 3. Extract Merchant
          let merchant = 'Merchant';
          const merchantPatterns = [
            /(?:paid|spent|sent|debited|paying)\s+(?:to|at|for|on)\s+([A-Za-z0-9\s'\.\-]+?)(?:using|on|ref|via|at|\.|$|\balert\b|\bfrom\b)/i,
            /(?:received|credited|refund|cashback|transfered)\s+(?:from|by)\s+([A-Za-z0-9\s'\.\-]+?)(?:using|on|ref|via|at|\.|$|\balert\b|\bto\b)/i
          ];
          for (const pattern of merchantPatterns) {
            const match = raw.body.match(pattern);
            if (match && match[1]) {
              const cleaned = match[1].trim();
              // Filter out noise
              if (cleaned && cleaned.toLowerCase() !== 'rs' && cleaned.toLowerCase() !== 'inr' && cleaned.length > 1) {
                merchant = cleaned;
                break;
              }
            }
          }

          // 4. Duplicate Detection
          const notificationId = raw.notification_id || generateUuid();
          const isDuplicateId = get().detectedNotifications.some(
            (dn) => dn.notification_id === notificationId
          );
          if (isDuplicateId) return;

          const recentDuplicate = get().detectedNotifications.some((dn) => {
            if (dn.amount !== amount || dn.merchant !== merchant) return false;
            // check within 5 mins
            const diffMs = Math.abs(new Date(dn.timestamp).getTime() - new Date(raw.timestamp).getTime());
            return diffMs < 5 * 60 * 1000;
          });
          if (recentDuplicate) return;

          // 5. Auto Categorization
          let categoryId = transaction_type === 'income' 
            ? 'd2222222-2222-2222-2222-222222222201' // Salary fallback
            : 'd1111111-1111-1111-1111-111111111104'; // Bills fallback

          const settings = get().smartExpenseSettings;
          const merchantLower = merchant.toLowerCase();
          for (const [kw, catId] of Object.entries(settings.autoCategorization)) {
            if (merchantLower.includes(kw.toLowerCase())) {
              categoryId = catId;
              break;
            }
          }

          const newNotification: DetectedTransaction = {
            id: generateUuid(),
            user_id: userId,
            notification_id: notificationId,
            app_name: raw.app_name,
            package_name: raw.package_name,
            title: raw.title,
            body: raw.body,
            timestamp: raw.timestamp,
            amount,
            merchant,
            transaction_type,
            status: 'pending',
            created_at: new Date().toISOString(),
          };

          set((state) => ({
            detectedNotifications: [newNotification, ...state.detectedNotifications],
          }));

          queueSync('INSERT', 'detected_notifications', newNotification);

          // Add a local system notification to alert user of newly detected transaction suggestion
          get().addNotification(
            'Transaction Detected 📱',
            `Detected ${transaction_type === 'income' ? 'income' : 'expense'} of ₹${amount} at ${merchant}. Tap to review and save.`,
            'system'
          );
        },

        processDetectedTransaction: (id, action, editedTxData) => {
          const dn = get().detectedNotifications.find((item) => item.id === id);
          if (!dn) return;

          set((state) => ({
            detectedNotifications: state.detectedNotifications.map((item) =>
              item.id === id ? { ...item, status: action === 'save' ? 'saved' : 'ignored' } : item
            ),
          }));

          const updatedDn = get().detectedNotifications.find((item) => item.id === id);
          if (updatedDn) {
            queueSync('UPDATE', 'detected_notifications', updatedDn);
          }

          // If action is SAVE, create the ledger transaction
          if (action === 'save' && editedTxData) {
            get().addTransaction({
              wallet_id: editedTxData.wallet_id || '',
              category_id: editedTxData.category_id || '',
              amount: editedTxData.amount || dn.amount,
              type: editedTxData.type || dn.transaction_type,
              date: editedTxData.date || dn.timestamp,
              notes: editedTxData.notes || `Detected via notification from ${dn.app_name}`,
              tags: ['smart-detection', dn.merchant.toLowerCase(), ... (editedTxData.tags || [])],
              payment_method: editedTxData.payment_method || dn.app_name,
            });
          }
        },

        updateSmartExpenseSettings: (updates) => {
          set((state) => ({
            smartExpenseSettings: {
              ...state.smartExpenseSettings,
              ...updates,
            },
          }));
        },

        syncDetectedNotifications: () => {
          if (Platform.OS !== 'android') return;
          try {
            const pendingStr = ExpoNotificationListener.getPendingNotifications();
            if (!pendingStr || pendingStr === '[]') return;

            const pending = JSON.parse(pendingStr);
            if (Array.isArray(pending) && pending.length > 0) {
              pending.forEach((notification: any) => {
                get().addRawNotification(notification);
              });
            }
          } catch (error) {
            console.error('Error syncing native notifications:', error);
          }
        },

        normalizeLegacyIds: () => {
          const currentUserId = getUserId();
          const state = get();
          const syncStore = useSyncStore.getState();
          const idMap: Record<string, string> = {};

          // Register known invalid IDs from persisted local data
          state.wallets.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.categories.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.transactions.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.budgets.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.savingsGoals.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.notifications.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.recurringTransactions.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.creditCards.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.creditCardStatements.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.creditCardEMIs.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.creditCardRewards.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.savingsPlans.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.subscriptions.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.billSplits.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.credits.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.creditPayments.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.creditReminders.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.detectedNotifications.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          state.auditLogs.forEach((item) => registerIfInvalidUuid(idMap, item.id));
          syncStore.pendingQueue.forEach((item) => {
            if (item.data && typeof item.data === 'object') {
              registerIfInvalidUuid(idMap, item.data.id);
            }
          });

          const hasIdRemaps = Object.keys(idMap).length > 0;
          const hasGuestOwnedRows =
            currentUserId !== 'guest' &&
            (
              state.wallets.some((item) => item.user_id === 'guest') ||
              state.categories.some(
                (item) => item.user_id === 'guest' || (!item.user_id && !defaultCategoryIdSet.has(item.id))
              ) ||
              state.transactions.some((item) => item.user_id === 'guest') ||
              state.budgets.some((item) => item.user_id === 'guest') ||
              state.savingsGoals.some((item) => item.user_id === 'guest') ||
              state.notifications.some((item) => item.user_id === 'guest') ||
              state.recurringTransactions.some((item) => item.user_id === 'guest') ||
              state.creditCards.some((item) => item.user_id === 'guest') ||
              state.savingsPlans.some((item) => item.user_id === 'guest') ||
              state.subscriptions.some((item) => item.user_id === 'guest') ||
              state.credits.some((item) => item.user_id === 'guest') ||
              state.detectedNotifications.some((item) => item.user_id === 'guest') ||
              state.auditLogs.some((item) => item.user_id === 'guest') ||
              syncStore.pendingQueue.some((item) => {
                if (!item.data || typeof item.data !== 'object') return false;
                if (item.data.user_id === 'guest') return true;
                return (
                  item.table === 'categories' &&
                  !item.data.user_id &&
                  item.data.id &&
                  !defaultCategoryIdSet.has(item.data.id)
                );
              })
            );

          if (!hasIdRemaps && !hasGuestOwnedRows) {
            return;
          }

          // Queue sync for guest items before we remap them in local state
          if (currentUserId !== 'guest') {
            state.wallets.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                };
                queueSync('INSERT', 'wallets', mapped);
              }
            });

            state.categories.forEach((item) => {
              const mappedId = getMappedId(idMap, item.id) || item.id;
              if (!defaultCategoryIdSet.has(mappedId)) {
                if (item.user_id === 'guest' || !item.user_id) {
                  const mapped = {
                    ...item,
                    id: mappedId,
                    user_id: currentUserId,
                  };
                  queueSync('INSERT', 'categories', mapped);
                }
              }
            });

            state.transactions.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                  wallet_id: getMappedId(idMap, item.wallet_id) || item.wallet_id,
                  category_id: getMappedId(idMap, item.category_id) || item.category_id,
                };
                queueSync('INSERT', 'transactions', mapped);
              }
            });

            state.budgets.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                  category_id: getMappedId(idMap, item.category_id) || item.category_id,
                };
                queueSync('INSERT', 'budgets', mapped);
              }
            });

            state.savingsGoals.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                };
                queueSync('INSERT', 'savings_goals', mapped);
              }
            });

            state.recurringTransactions.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                  wallet_id: getMappedId(idMap, item.wallet_id) || item.wallet_id,
                  category_id: getMappedId(idMap, item.category_id) || item.category_id,
                };
                queueSync('INSERT', 'recurring_transactions', mapped);
              }
            });

            state.creditCards.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                  wallet_id: getMappedId(idMap, item.wallet_id) || item.wallet_id,
                };
                queueSync('INSERT', 'credit_cards', mapped);
              }
            });

            state.creditCardStatements.forEach((item) => {
              const card = state.creditCards.find((c) => c.id === item.card_id);
              if (card && card.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  card_id: getMappedId(idMap, item.card_id) || item.card_id,
                };
                queueSync('INSERT', 'credit_card_statements', mapped);
              }
            });

            state.creditCardEMIs.forEach((item) => {
              const card = state.creditCards.find((c) => c.id === item.card_id);
              if (card && card.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  card_id: getMappedId(idMap, item.card_id) || item.card_id,
                };
                queueSync('INSERT', 'credit_card_emis', mapped);
              }
            });

            state.creditCardRewards.forEach((item) => {
              const card = state.creditCards.find((c) => c.id === item.card_id);
              if (card && card.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  card_id: getMappedId(idMap, item.card_id) || item.card_id,
                };
                queueSync('INSERT', 'credit_card_rewards', mapped);
              }
            });

            state.savingsPlans.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                };
                queueSync('INSERT', 'savings_plans', mapped);
              }
            });

            state.subscriptions.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                  payment_wallet_id: getMappedId(idMap, item.payment_wallet_id) || item.payment_wallet_id,
                };
                queueSync('INSERT', 'subscriptions', mapped);
              }
            });

            state.billSplits.forEach((item) => {
              const tx = state.transactions.find((t) => t.id === item.transaction_id);
              if (tx && tx.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  transaction_id: getMappedId(idMap, item.transaction_id) || item.transaction_id,
                };
                queueSync('INSERT', 'bill_splits', mapped);
              }
            });

            state.credits.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                };
                queueSync('INSERT', 'credits', mapped);
              }
            });

            state.creditPayments.forEach((item) => {
              const credit = state.credits.find((c) => c.id === item.credit_id);
              if (credit && credit.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  credit_id: getMappedId(idMap, item.credit_id) || item.credit_id,
                };
                queueSync('INSERT', 'credit_payments', mapped);
              }
            });

            state.creditReminders.forEach((item) => {
              const credit = state.credits.find((c) => c.id === item.credit_id);
              if (credit && credit.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  credit_id: getMappedId(idMap, item.credit_id) || item.credit_id,
                };
                queueSync('INSERT', 'credit_reminders', mapped);
              }
            });

            state.detectedNotifications.forEach((item) => {
              if (item.user_id === 'guest') {
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                };
                queueSync('INSERT', 'detected_notifications', mapped);
              }
            });

            state.auditLogs.forEach((item) => {
              if (item.user_id === 'guest') {
                const authUser = useAuthStore.getState().user;
                const userEmail = authUser ? authUser.email : null;
                const userName = authUser ? authUser.name : null;
                const mapped = {
                  ...item,
                  id: getMappedId(idMap, item.id) || item.id,
                  user_id: currentUserId,
                  user_email: userEmail || undefined,
                  user_name: userName || undefined,
                };
                queueSync('INSERT', 'audit_logs', mapped);
              }
            });

            const currentPrefs = useAuthStore.getState().preferences;
            if (currentPrefs && currentPrefs.user_id === 'guest') {
              const mappedPrefs = {
                ...currentPrefs,
                user_id: currentUserId,
              };
              queueSync('INSERT', 'user_preferences', mappedPrefs);
            }
          }

          const mapUserScopedCategoryOwner = (category: Category) => {
            const mappedCategoryId = getMappedId(idMap, category.id) || category.id;
            if (currentUserId === 'guest') return category.user_id;
            if (category.user_id === 'guest') return currentUserId;
            if (!category.user_id && !defaultCategoryIdSet.has(mappedCategoryId)) {
              return currentUserId;
            }
            return category.user_id;
          };

          set({
            wallets: state.wallets.map((wallet) => ({
              ...wallet,
              id: getMappedId(idMap, wallet.id) || wallet.id,
              user_id: normalizeUserId(wallet.user_id, currentUserId) || wallet.user_id,
            })),
            categories: state.categories.map((category) => ({
              ...category,
              id: getMappedId(idMap, category.id) || category.id,
              user_id: mapUserScopedCategoryOwner(category),
            })),
            transactions: state.transactions.map((tx) => ({
              ...tx,
              id: getMappedId(idMap, tx.id) || tx.id,
              user_id: normalizeUserId(tx.user_id, currentUserId) || tx.user_id,
              wallet_id: getMappedId(idMap, tx.wallet_id) || tx.wallet_id,
              category_id: getMappedId(idMap, tx.category_id) || tx.category_id,
            })),
            budgets: state.budgets.map((budget) => ({
              ...budget,
              id: getMappedId(idMap, budget.id) || budget.id,
              user_id: normalizeUserId(budget.user_id, currentUserId) || budget.user_id,
              category_id: getMappedId(idMap, budget.category_id) || budget.category_id,
            })),
            savingsGoals: state.savingsGoals.map((goal) => ({
              ...goal,
              id: getMappedId(idMap, goal.id) || goal.id,
              user_id: normalizeUserId(goal.user_id, currentUserId) || goal.user_id,
            })),
            notifications: state.notifications.map((notification) => ({
              ...notification,
              id: getMappedId(idMap, notification.id) || notification.id,
              user_id: normalizeUserId(notification.user_id, currentUserId) || notification.user_id,
            })),
            recurringTransactions: state.recurringTransactions.map((recurring) => ({
              ...recurring,
              id: getMappedId(idMap, recurring.id) || recurring.id,
              user_id: normalizeUserId(recurring.user_id, currentUserId) || recurring.user_id,
              wallet_id: getMappedId(idMap, recurring.wallet_id) || recurring.wallet_id,
              category_id: getMappedId(idMap, recurring.category_id) || recurring.category_id,
            })),
            creditCards: state.creditCards.map((card) => ({
              ...card,
              id: getMappedId(idMap, card.id) || card.id,
              user_id: normalizeUserId(card.user_id, currentUserId) || card.user_id,
              wallet_id: getMappedId(idMap, card.wallet_id) || card.wallet_id,
            })),
            creditCardStatements: state.creditCardStatements.map((statement) => ({
              ...statement,
              id: getMappedId(idMap, statement.id) || statement.id,
              card_id: getMappedId(idMap, statement.card_id) || statement.card_id,
            })),
            creditCardEMIs: state.creditCardEMIs.map((emi) => ({
              ...emi,
              id: getMappedId(idMap, emi.id) || emi.id,
              card_id: getMappedId(idMap, emi.card_id) || emi.card_id,
            })),
            creditCardRewards: state.creditCardRewards.map((reward) => ({
              ...reward,
              id: getMappedId(idMap, reward.id) || reward.id,
              card_id: getMappedId(idMap, reward.card_id) || reward.card_id,
            })),
            savingsPlans: state.savingsPlans.map((plan) => ({
              ...plan,
              id: getMappedId(idMap, plan.id) || plan.id,
              user_id: normalizeUserId(plan.user_id, currentUserId) || plan.user_id,
            })),
            subscriptions: state.subscriptions.map((subscription) => ({
              ...subscription,
              id: getMappedId(idMap, subscription.id) || subscription.id,
              user_id: normalizeUserId(subscription.user_id, currentUserId) || subscription.user_id,
              payment_wallet_id: getMappedId(idMap, subscription.payment_wallet_id) || subscription.payment_wallet_id,
            })),
            billSplits: state.billSplits.map((split) => ({
              ...split,
              id: getMappedId(idMap, split.id) || split.id,
              transaction_id: getMappedId(idMap, split.transaction_id) || split.transaction_id,
            })),
            credits: state.credits.map((credit) => ({
              ...credit,
              id: getMappedId(idMap, credit.id) || credit.id,
              user_id: normalizeUserId(credit.user_id, currentUserId) || credit.user_id,
            })),
            creditPayments: state.creditPayments.map((payment) => ({
              ...payment,
              id: getMappedId(idMap, payment.id) || payment.id,
              credit_id: getMappedId(idMap, payment.credit_id) || payment.credit_id,
            })),
            creditReminders: state.creditReminders.map((reminder) => ({
              ...reminder,
              id: getMappedId(idMap, reminder.id) || reminder.id,
              credit_id: getMappedId(idMap, reminder.credit_id) || reminder.credit_id,
            })),
            detectedNotifications: state.detectedNotifications.map((dn) => ({
              ...dn,
              id: getMappedId(idMap, dn.id) || dn.id,
              user_id: normalizeUserId(dn.user_id, currentUserId) || dn.user_id,
            })),
            auditLogs: state.auditLogs.map((log) => ({
              ...log,
              id: getMappedId(idMap, log.id) || log.id,
              user_id: normalizeUserId(log.user_id, currentUserId) || log.user_id,
              user_email: useAuthStore.getState().user?.email || log.user_email,
              user_name: useAuthStore.getState().user?.name || log.user_name,
            })),
          });

          const remappedQueue = syncStore.pendingQueue.map((item) => ({
            ...item,
            data: mapQueuePayload(item.table, item.data, idMap, currentUserId),
          }));

          syncStore.replaceQueue(remappedQueue);
        },

        // MIGRATION & LOCAL HELPERS
        loadRemoteData: (remote) => {
          const currentUserId = getUserId();
          if (currentUserId === 'guest') return; // Do not migrate if user is guest

          set((state) => {
            const idMap: Record<string, string> = {};
            
            // 1. Wallets Migration & Merging
            const guestWallets = state.wallets.filter((w) => w.user_id === 'guest');
            const remoteWallets = remote.wallets ? remote.wallets.filter((w) => !w.is_deleted) : [];

            let finalWallets: Wallet[] = [];

            if (remoteWallets.length > 0) {
              // Map guest wallets to existing remote wallets of the same type to avoid duplicates
              const guestCash = guestWallets.find((w) => w.type === 'cash');
              const guestBank = guestWallets.find((w) => w.type === 'bank');

              const remoteCash = remoteWallets.find((w) => w.type === 'cash');
              const remoteBank = remoteWallets.find((w) => w.type === 'bank');

              if (guestCash && remoteCash) {
                idMap[guestCash.id] = remoteCash.id;
                remoteCash.balance = Number(remoteCash.balance) + Number(guestCash.balance);
                queueSync('UPDATE', 'wallets', remoteCash);
              }
              if (guestBank && remoteBank) {
                idMap[guestBank.id] = remoteBank.id;
                remoteBank.balance = Number(remoteBank.balance) + Number(guestBank.balance);
                queueSync('UPDATE', 'wallets', remoteBank);
              }

              // Other guest wallets (e.g. custom or credit card representations created locally)
              const otherGuestWallets = guestWallets.filter(
                (w) => w.id !== guestCash?.id && w.id !== guestBank?.id
              );
              otherGuestWallets.forEach((w) => {
                const migrated = { ...w, user_id: currentUserId };
                queueSync('INSERT', 'wallets', migrated);
                remoteWallets.push(migrated);
              });

              finalWallets = remoteWallets;
            } else {
              // No remote wallets. Migrate local guest wallets or seed defaults
              if (guestWallets.length > 0) {
                finalWallets = state.wallets.map((w) => {
                  if (w.user_id === 'guest') {
                    const migrated = { ...w, user_id: currentUserId };
                    queueSync('INSERT', 'wallets', migrated);
                    return migrated;
                  }
                  return w;
                });
              } else {
                finalWallets = DEFAULT_WALLETS(currentUserId);
                finalWallets.forEach((w) => queueSync('INSERT', 'wallets', w));
              }
            }

            // Remap helper
            const remapWalletId = (walletId: string) => idMap[walletId] || walletId;

            // 2. Transactions Migration & Merging
            const migratedTransactions = state.transactions.map((t) => {
              if (t.user_id === 'guest') {
                const updated = {
                  ...t,
                  user_id: currentUserId,
                  wallet_id: remapWalletId(t.wallet_id),
                };
                queueSync('INSERT', 'transactions', updated);
                return updated;
              }
              return t;
            });
            const finalTransactions = remote.transactions
              ? [
                  ...remote.transactions.filter((t) => !t.is_deleted),
                  ...migratedTransactions.filter((lt) => !remote.transactions?.some((rt) => rt.id === lt.id)),
                ]
              : migratedTransactions;

            // 3. Subscriptions Migration & Merging
            const migratedSubscriptions = state.subscriptions.map((s) => {
              if (s.user_id === 'guest') {
                const updated = {
                  ...s,
                  user_id: currentUserId,
                  payment_wallet_id: remapWalletId(s.payment_wallet_id),
                };
                queueSync('INSERT', 'subscriptions', updated);
                return updated;
              }
              return s;
            });
            const finalSubscriptions = remote.subscriptions
              ? [
                  ...remote.subscriptions.filter((s) => !s.is_deleted),
                  ...migratedSubscriptions.filter((ls) => !remote.subscriptions?.some((rs) => rs.id === ls.id)),
                ]
              : migratedSubscriptions;

            // 4. Recurring Transactions Migration & Merging
            const migratedRecurring = state.recurringTransactions.map((r) => {
              if (r.user_id === 'guest') {
                const updated = {
                  ...r,
                  user_id: currentUserId,
                  wallet_id: remapWalletId(r.wallet_id),
                };
                queueSync('INSERT', 'recurring_transactions', updated);
                return updated;
              }
              return r;
            });
            const finalRecurring = remote.recurringTransactions
              ? [
                  ...remote.recurringTransactions.filter((r) => !r.is_deleted),
                  ...migratedRecurring.filter((lr) => !remote.recurringTransactions?.some((rr) => rr.id === lr.id)),
                ]
              : migratedRecurring;

            // 5. Credit Cards Migration & Merging
            const migratedCreditCards = state.creditCards.map((c) => {
              if (c.user_id === 'guest') {
                const updated = {
                  ...c,
                  user_id: currentUserId,
                  wallet_id: remapWalletId(c.wallet_id),
                };
                queueSync('INSERT', 'credit_cards', updated);
                return updated;
              }
              return c;
            });
            const finalCreditCards = remote.creditCards
              ? [
                  ...remote.creditCards.filter((c) => !c.is_deleted),
                  ...migratedCreditCards.filter((lc) => !remote.creditCards?.some((rc) => rc.id === lc.id)),
                ]
              : migratedCreditCards;

            // 6. Savings Plans Migration & Merging
            const migratedSavingsPlans = state.savingsPlans.map((p) => {
              if (p.user_id === 'guest') {
                const updated = { ...p, user_id: currentUserId };
                queueSync('INSERT', 'savings_plans', updated);
                return updated;
              }
              return p;
            });
            const finalSavingsPlans = remote.savingsPlans
              ? [
                  ...remote.savingsPlans.filter((p) => !p.is_deleted),
                  ...migratedSavingsPlans.filter((lp) => !remote.savingsPlans?.some((rp) => rp.id === lp.id)),
                ]
              : migratedSavingsPlans;

            // 7. Savings Goals Migration & Merging
            const migratedSavingsGoals = state.savingsGoals.map((g) => {
              if (g.user_id === 'guest') {
                const updated = { ...g, user_id: currentUserId };
                queueSync('INSERT', 'savings_goals', updated);
                return updated;
              }
              return g;
            });
            const finalSavingsGoals = remote.savingsGoals
              ? [
                  ...remote.savingsGoals.filter((g) => !g.is_deleted),
                  ...migratedSavingsGoals.filter((lg) => !remote.savingsGoals?.some((rg) => rg.id === lg.id)),
                ]
              : migratedSavingsGoals;

            // 8. Budgets Migration & Merging
            const migratedBudgets = state.budgets.map((b) => {
              if (b.user_id === 'guest') {
                const updated = { ...b, user_id: currentUserId };
                queueSync('INSERT', 'budgets', updated);
                return updated;
              }
              return b;
            });
            const finalBudgets = remote.budgets
              ? [
                  ...remote.budgets.filter((b) => !b.is_deleted),
                  ...migratedBudgets.filter((lb) => !remote.budgets?.some((rb) => rb.id === lb.id)),
                ]
              : migratedBudgets;

            // 9. Credits, Payments, Reminders Migration & Merging
            const migratedCredits = state.credits.map((cr) => {
              if (cr.user_id === 'guest') {
                const updated = { ...cr, user_id: currentUserId };
                queueSync('INSERT', 'credits', updated);
                return updated;
              }
              return cr;
            });
            const finalCredits = remote.credits
              ? [
                  ...remote.credits.filter((cr) => !cr.is_deleted),
                  ...migratedCredits.filter((lc) => !remote.credits?.some((rc) => rc.id === lc.id)),
                ]
              : migratedCredits;

            const finalCreditPayments = remote.creditPayments
              ? [
                  ...remote.creditPayments,
                  ...state.creditPayments.filter((lp) => !remote.creditPayments?.some((rp) => rp.id === lp.id)),
                ]
              : state.creditPayments;

            const finalCreditReminders = remote.creditReminders
              ? [
                  ...remote.creditReminders,
                  ...state.creditReminders.filter((lr) => !remote.creditReminders?.some((rr) => rr.id === lr.id)),
                ]
              : state.creditReminders;

            // 10. Detected Notifications Migration & Merging
            const migratedDetected = state.detectedNotifications.map((dn) => {
              if (dn.user_id === 'guest') {
                const updated = { ...dn, user_id: currentUserId };
                queueSync('INSERT', 'detected_notifications', updated);
                return updated;
              }
              return dn;
            });
            const finalDetected = remote.detectedNotifications
              ? [
                  ...remote.detectedNotifications,
                  ...migratedDetected.filter((ldn) => !remote.detectedNotifications?.some((rdn) => rdn.id === ldn.id)),
                ]
              : migratedDetected;

            // 11. Audit Logs Migration
            const migratedAuditLogs = state.auditLogs.map((log) => {
              if (log.user_id === 'guest') {
                const authUser = useAuthStore.getState().user;
                const updated = {
                  ...log,
                  user_id: currentUserId,
                  user_email: authUser?.email || undefined,
                  user_name: authUser?.name || undefined,
                };
                queueSync('INSERT', 'audit_logs', updated);
                return updated;
              }
              return log;
            });

            return {
              wallets: finalWallets,
              categories: remote.categories
                ? [...DEFAULT_CATEGORIES, ...remote.categories.filter((c) => !c.is_deleted && c.user_id === currentUserId)]
                : state.categories,
              transactions: finalTransactions,
              budgets: finalBudgets,
              savingsGoals: finalSavingsGoals,
              recurringTransactions: finalRecurring,
              notifications: remote.notifications ? remote.notifications : state.notifications,
              creditCards: finalCreditCards,
              creditCardStatements: remote.creditCardStatements ? remote.creditCardStatements : state.creditCardStatements,
              creditCardEMIs: remote.creditCardEMIs ? remote.creditCardEMIs.filter((e) => !e.is_deleted) : state.creditCardEMIs,
              creditCardRewards: remote.creditCardRewards ? remote.creditCardRewards : state.creditCardRewards,
              savingsPlans: finalSavingsPlans,
              subscriptions: finalSubscriptions,
              billSplits: remote.billSplits ? remote.billSplits : state.billSplits,
              credits: finalCredits,
              creditPayments: finalCreditPayments,
              creditReminders: finalCreditReminders,
              detectedNotifications: finalDetected,
              auditLogs: migratedAuditLogs,
            };
          });
        },

        getFinancialMetrics: () => {
          const state = get();
          
          const cashAndBank = state.wallets
            .filter((w) => !w.is_deleted && w.type !== 'credit_card')
            .reduce((sum, w) => sum + Number(w.balance), 0);

          const activeSavingsInvested = state.savingsPlans
            .filter((p) => !p.is_deleted)
            .reduce((sum, p) => sum + Number(p.current_amount), 0);

          const activeCreditsLent = state.credits
            .filter((c) => !c.is_deleted && c.type === 'lent' && c.status !== 'closed')
            .reduce((sum, c) => {
              const paid = state.creditPayments
                .filter((p) => p.credit_id === c.id)
                .reduce((s, p) => s + Number(p.amount), 0);
              return sum + Math.max(0, Number(c.amount) - paid);
            }, 0);

          const activeCreditsBorrowed = state.credits
            .filter((c) => !c.is_deleted && c.type === 'borrowed' && c.status !== 'closed')
            .reduce((sum, c) => {
              const paid = state.creditPayments
                .filter((p) => p.credit_id === c.id)
                .reduce((s, p) => s + Number(p.amount), 0);
              return sum + Math.max(0, Number(c.amount) - paid);
            }, 0);

          const totalCreditCardDebt = state.wallets
            .filter((w) => !w.is_deleted && w.type === 'credit_card')
            .reduce((sum, w) => sum + Math.abs(Math.min(0, Number(w.balance))), 0);

          const totalAssets = cashAndBank + activeSavingsInvested + activeCreditsLent;
          const totalLiabilities = totalCreditCardDebt + activeCreditsBorrowed;
          const netWorth = totalAssets - totalLiabilities;

          return {
            cashAndBank,
            activeSavingsInvested,
            activeCreditsLent,
            activeCreditsBorrowed,
            totalCreditCardDebt,
            totalAssets,
            totalLiabilities,
            netWorth,
          };
        },

        checkAndApplyAutoRollovers: () => {
          const state = get();
          const now = new Date();

          // 1. Subscriptions Auto-Rollover
          state.subscriptions
            .filter((sub) => sub.is_active && !sub.is_deleted)
            .forEach((sub) => {
              const billingDate = new Date(sub.next_billing_date);
              if (billingDate <= now) {
                console.log(`Auto-rolling subscription payment for: ${sub.name}`);
                get().recordSubscriptionPayment(sub.id);
              }
            });

          // 2. Credit Card Statement Auto-Generation
          state.creditCards
            .filter((card) => !card.is_deleted)
            .forEach((card) => {
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();
              
              const endPeriod = new Date(currentYear, currentMonth, card.statement_date, 23, 59, 59);

              if (now >= endPeriod) {
                const statementExists = state.creditCardStatements.some((stmt) => {
                  if (stmt.card_id !== card.id) return false;
                  const stmtEndDate = new Date(stmt.statement_period_end);
                  return (
                    stmtEndDate.getFullYear() === endPeriod.getFullYear() &&
                    stmtEndDate.getMonth() === endPeriod.getMonth() &&
                    Math.abs(stmtEndDate.getDate() - endPeriod.getDate()) <= 2
                  );
                });

                if (!statementExists) {
                  console.log(`Auto-generating credit card statement for: ${card.bank_name}`);
                  get().triggerCardStatementGeneration(card.id);
                }
              }
            });
        },

        clearAllLocalData: () => {
          const userId = getUserId();
          set({
            wallets: DEFAULT_WALLETS(userId),
            categories: DEFAULT_CATEGORIES,
            transactions: [],
            budgets: [],
            savingsGoals: [],
            notifications: [],
            recurringTransactions: [],
            creditCards: [],
            creditCardStatements: [],
            creditCardEMIs: [],
            creditCardRewards: [],
            savingsPlans: [],
            subscriptions: [],
            billSplits: [],
            credits: [],
            creditPayments: [],
            creditReminders: [],
            detectedNotifications: [],
            auditLogs: [],
          });
        },
      };
    },
    {
      name: 'my-expenses-local-db',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
