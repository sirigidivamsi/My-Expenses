import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { SyncQueueItem } from '../types';
import { generateUuid } from '../utils/id';

interface SyncState {
  pendingQueue: SyncQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  setOnline: (status: boolean) => void;
  setSyncing: (status: boolean) => void;
  addToQueue: (action: SyncQueueItem['action'], table: SyncQueueItem['table'], data: any) => void;
  removeFromQueue: (id: string) => void;
  replaceQueue: (items: SyncQueueItem[]) => void;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingQueue: [],
      isOnline: true,
      isSyncing: false,

      setOnline: (status) => set({ isOnline: status }),
      setSyncing: (status) => set({ isSyncing: status }),

      addToQueue: (action, table, data) => {
        const newItem: SyncQueueItem = {
          id: generateUuid(),
          action,
          table,
          data,
          timestamp: new Date().toISOString(),
        };

        // If updating an existing item that is already in queue as INSERT, we can merge or replace
        // But a simple chronological queue is extremely robust and avoids conflict resolution bugs.
        set((state) => ({
          pendingQueue: [...state.pendingQueue, newItem],
        }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          pendingQueue: state.pendingQueue.filter((item) => item.id !== id),
        }));
      },

      replaceQueue: (items) => set({ pendingQueue: items }),

      clearQueue: () => set({ pendingQueue: [] }),
    }),
    {
      name: 'my-expenses-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingQueue: state.pendingQueue,
      }),
    }
  )
);
export type { SyncState };
