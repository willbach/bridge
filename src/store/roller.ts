import create from 'zustand';
import { L2Point, PendingTransaction } from '@urbit/roller-api/build';

import { HOUR } from 'lib/utils/roller';

const pending: PendingTransaction = {forced: true, tx: 'dskfajdkjfas', address: 'dkajfdkfjdaks'}

export interface RollerStore {
  nextBatchTime: number;
  nextRoll: string;
  pendingTransactions: PendingTransaction[];
  currentPoint: L2Point | null;
  currentL2: boolean;
  setNextBatchTime: (nextBatchTime: number) => void;
  setNextRoll: (nextRoll: string) => void;
  setPendingTransactions: (pendingTransactions: PendingTransaction[]) => void;
  setCurrentPoint: (currentPoint: L2Point) => void;
}

export const useRollerStore = create<RollerStore>(set => ({
  nextBatchTime: new Date().getTime() + HOUR,
  nextRoll: '0h 00m 00s',
  pendingTransactions: [],
  currentPoint: null,
  currentL2: false,
  setNextBatchTime: (nextBatchTime: number) => set(() => ({ nextBatchTime })),
  setNextRoll: (nextRoll: string) => set(() => ({ nextRoll })),
  setPendingTransactions: (pendingTransactions: PendingTransaction[]) =>
    set(() => ({ pendingTransactions })),
  setCurrentPoint: (currentPoint: L2Point) =>
    set(state => ({
      ...state,
      currentPoint,
      currentL2: currentPoint?.dominion === 'l2',
    })),
}));
