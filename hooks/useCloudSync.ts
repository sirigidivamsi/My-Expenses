import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { useSyncStore } from '../store/useSyncStore';
import { SyncQueueItem } from '../types';
import { supabase } from '../services/supabase';

const conflictColumnByTable: Partial<Record<SyncQueueItem['table'], string>> = {
  user_preferences: 'user_id',
};

const resolveConflictColumn = (table: SyncQueueItem['table']) => {
  return conflictColumnByTable[table] || 'id';
};

const flushQueueItem = async (item: SyncQueueItem) => {
  const payload = item.data || {};
  const key = resolveConflictColumn(item.table);

  if (item.action === 'DELETE') {
    if (!payload[key]) {
      return { error: null };
    }
    const { error } = await (supabase.from(item.table as any) as any).delete().eq(key, payload[key]);
    return { error };
  }

  const { error } = await (supabase.from(item.table as any) as any).upsert(payload, {
    onConflict: key,
  });

  return { error };
};

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);

  const pendingQueue = useSyncStore((state) => state.pendingQueue);
  const isOnline = useSyncStore((state) => state.isOnline);
  const syncTrigger = useSyncStore((state) => state.syncTrigger);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const setOnline = useSyncStore((state) => state.setOnline);
  const setSyncing = useSyncStore((state) => state.setSyncing);
  const removeFromQueue = useSyncStore((state) => state.removeFromQueue);

  const loadRemoteData = useDataStore((state) => state.loadRemoteData);
  const normalizeLegacyIds = useDataStore((state) => state.normalizeLegacyIds);

  const lastHydratedUserId = useRef<string | null>(null);
  const isUnmounted = useRef(false);
  const syncInProgress = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    return () => {
      isUnmounted.current = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id || isGuest) {
      lastHydratedUserId.current = null;
      return;
    }

    if (lastHydratedUserId.current === user.id) {
      return;
    }

    let cancelled = false;

    const hydrateRemoteData = async () => {
      setSyncing(true);
      try {
        normalizeLegacyIds();

        const [
          walletsRes,
          categoriesRes,
          transactionsRes,
          budgetsRes,
          savingsGoalsRes,
          recurringTransactionsRes,
          notificationsRes,
          creditCardsRes,
          creditCardStatementsRes,
          creditCardEMIsRes,
          creditCardRewardsRes,
          savingsPlansRes,
          subscriptionsRes,
          billSplitsRes,
          creditsRes,
          creditPaymentsRes,
          creditRemindersRes,
          detectedNotificationsRes,
        ] = await Promise.all([
          supabase.from('wallets').select('*'),
          supabase.from('categories').select('*'),
          supabase.from('transactions').select('*'),
          supabase.from('budgets').select('*'),
          supabase.from('savings_goals').select('*'),
          supabase.from('recurring_transactions').select('*'),
          supabase.from('notifications').select('*'),
          supabase.from('credit_cards').select('*'),
          supabase.from('credit_card_statements').select('*'),
          supabase.from('credit_card_emis').select('*'),
          supabase.from('credit_card_rewards').select('*'),
          supabase.from('savings_plans').select('*'),
          supabase.from('subscriptions').select('*'),
          supabase.from('bill_splits').select('*'),
          supabase.from('credits').select('*'),
          supabase.from('credit_payments').select('*'),
          supabase.from('credit_reminders').select('*'),
          supabase.from('detected_notifications').select('*'),
        ]);

        const responses = [
          walletsRes,
          categoriesRes,
          transactionsRes,
          budgetsRes,
          savingsGoalsRes,
          recurringTransactionsRes,
          notificationsRes,
          creditCardsRes,
          creditCardStatementsRes,
          creditCardEMIsRes,
          creditCardRewardsRes,
          savingsPlansRes,
          subscriptionsRes,
          billSplitsRes,
          creditsRes,
          creditPaymentsRes,
          creditRemindersRes,
          detectedNotificationsRes,
        ];

        // Log errors for individual tables but don't abort the entire load
        const tableNames = [
          'wallets', 'categories', 'transactions', 'budgets', 'savings_goals',
          'recurring_transactions', 'notifications', 'credit_cards',
          'credit_card_statements', 'credit_card_emis', 'credit_card_rewards',
          'savings_plans', 'subscriptions', 'bill_splits', 'credits',
          'credit_payments', 'credit_reminders', 'detected_notifications',
        ];
        responses.forEach((res, idx) => {
          if (res.error) {
            console.warn(`[CloudSync] Failed to fetch ${tableNames[idx]}:`, res.error.message);
          }
        });

        if (cancelled) return;

        loadRemoteData({
          wallets: walletsRes.data ?? undefined,
          categories: categoriesRes.data ?? undefined,
          transactions: transactionsRes.data ?? undefined,
          budgets: budgetsRes.data ?? undefined,
          savingsGoals: savingsGoalsRes.data ?? undefined,
          recurringTransactions: recurringTransactionsRes.data ?? undefined,
          notifications: notificationsRes.data ?? undefined,
          creditCards: creditCardsRes.data ?? undefined,
          creditCardStatements: creditCardStatementsRes.data ?? undefined,
          creditCardEMIs: creditCardEMIsRes.data ?? undefined,
          creditCardRewards: creditCardRewardsRes.data ?? undefined,
          savingsPlans: savingsPlansRes.data ?? undefined,
          subscriptions: subscriptionsRes.data ?? undefined,
          billSplits: billSplitsRes.data ?? undefined,
          credits: creditsRes.data ?? undefined,
          creditPayments: creditPaymentsRes.data ?? undefined,
          creditReminders: creditRemindersRes.data ?? undefined,
          detectedNotifications: detectedNotificationsRes.data ?? undefined,
        });
        lastHydratedUserId.current = user.id;
        setOnline(true);
      } catch (error) {
        if (!cancelled) {
          setOnline(false);
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    };

    hydrateRemoteData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest, loadRemoteData, normalizeLegacyIds, setOnline, setSyncing]);

  useEffect(() => {
    if (!user?.id || isGuest || pendingQueue.length === 0) {
      return;
    }

    if (!isOnline) {
      return;
    }

    if (syncInProgress.current) {
      return;
    }

    const flushPendingQueue = async () => {
      syncInProgress.current = true;
      setSyncing(true);
      try {
        normalizeLegacyIds();

        while (useSyncStore.getState().pendingQueue.length > 0) {
          if (isUnmounted.current) break;

          const item = useSyncStore.getState().pendingQueue[0];
          const { error } = await flushQueueItem(item);
          
          if (error) {
            console.error('Sync error for item:', item, error);
            
            // In fintech apps, data integrity is critical. We must NOT silently discard 
            // records on database/constraint errors as this leads to permanent data loss. 
            // Instead, we pause the sync queue (setOnline(false)) so the data remains 
            // safe locally on the device until the connection is restored or a patch resolves the issue.
            setOnline(false);
            return;
          }

          removeFromQueue(item.id);
        }

        setOnline(true);
      } catch (err) {
        console.error('Unhandled sync error:', err);
        if (!isUnmounted.current) {
          setOnline(false);
        }
      } finally {
        if (!isUnmounted.current) {
          syncInProgress.current = false;
          setSyncing(false);
        }
      }
    };

    flushPendingQueue();
  }, [
    user?.id,
    isGuest,
    pendingQueue.length,
    isOnline,
    syncTrigger,
    normalizeLegacyIds,
    removeFromQueue,
    setOnline,
    setSyncing,
  ]);

};
