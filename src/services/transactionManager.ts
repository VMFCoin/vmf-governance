import { type Hash, type TransactionReceipt } from 'viem';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  // Token operations
  TOKEN_APPROVE = 'token_approve',
  TOKEN_TRANSFER = 'token_transfer',

  // Escrow operations
  CREATE_LOCK = 'create_lock',
  INCREASE_LOCK_AMOUNT = 'increase_lock_amount',
  INCREASE_LOCK_DURATION = 'increase_lock_duration',
  EXIT_LOCK = 'exit_lock',

  // Voting operations
  CAST_VOTE = 'cast_vote',
  RESET_VOTES = 'reset_votes',

  // Exit queue operations
  ENTER_QUEUE = 'enter_queue',
  EXIT_QUEUE = 'exit_queue',
  CLAIM_FROM_QUEUE = 'claim_from_queue',
}

export interface Transaction {
  id: string;
  hash: Hash;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date;
  confirmations: number;
  requiredConfirmations: number;
  receipt?: TransactionReceipt;
  error?: string;
  metadata?: Record<string, any>;
  retryCount: number;
  maxRetries: number;
}

export interface TransactionState {
  transactions: Record<string, Transaction>;
  pendingTransactions: string[];
  recentTransactions: string[];
}

export interface TransactionActions {
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'timestamp' | 'retryCount'>
  ) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  retryTransaction: (id: string) => Promise<void>;
  clearOldTransactions: (olderThanHours?: number) => void;
  getTransaction: (id: string) => Transaction | undefined;
  getPendingTransactions: () => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
  getTransactionsByType: (type: TransactionType) => Transaction[];
}

export type TransactionStore = TransactionState & TransactionActions;

// Create the transaction store
export const useTransactionStore = create<TransactionStore>()(
  subscribeWithSelector((set, get) => ({
    transactions: {},
    pendingTransactions: [],
    recentTransactions: [],

    addTransaction: transactionData => {
      const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transaction: Transaction = {
        ...transactionData,
        id,
        timestamp: new Date(),
        retryCount: 0,
      };

      set(state => ({
        transactions: {
          ...state.transactions,
          [id]: transaction,
        },
        pendingTransactions:
          transaction.status === TransactionStatus.PENDING
            ? [...state.pendingTransactions, id]
            : state.pendingTransactions,
        recentTransactions: [id, ...state.recentTransactions.slice(0, 49)], // Keep last 50
      }));

      return id;
    },

    updateTransaction: (id, updates) => {
      set(state => {
        const existingTransaction = state.transactions[id];
        if (!existingTransaction) return state;

        const updatedTransaction = { ...existingTransaction, ...updates };
        const newTransactions = {
          ...state.transactions,
          [id]: updatedTransaction,
        };

        // Update pending transactions list
        let newPendingTransactions = state.pendingTransactions;
        if (
          existingTransaction.status === TransactionStatus.PENDING &&
          updates.status &&
          updates.status !== TransactionStatus.PENDING
        ) {
          newPendingTransactions = state.pendingTransactions.filter(
            txId => txId !== id
          );
        } else if (
          existingTransaction.status !== TransactionStatus.PENDING &&
          updates.status === TransactionStatus.PENDING
        ) {
          newPendingTransactions = [...state.pendingTransactions, id];
        }

        return {
          transactions: newTransactions,
          pendingTransactions: newPendingTransactions,
        };
      });
    },

    removeTransaction: id => {
      set(state => {
        const { [id]: removed, ...remainingTransactions } = state.transactions;
        return {
          transactions: remainingTransactions,
          pendingTransactions: state.pendingTransactions.filter(
            txId => txId !== id
          ),
          recentTransactions: state.recentTransactions.filter(
            txId => txId !== id
          ),
        };
      });
    },

    retryTransaction: async id => {
      const transaction = get().transactions[id];
      if (!transaction || transaction.retryCount >= transaction.maxRetries) {
        return;
      }

      get().updateTransaction(id, {
        retryCount: transaction.retryCount + 1,
        status: TransactionStatus.PENDING,
        error: undefined,
      });

      // The actual retry logic would be handled by the calling service
    },

    clearOldTransactions: (olderThanHours = 24) => {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

      set(state => {
        const filteredTransactions: Record<string, Transaction> = {};
        const filteredRecent: string[] = [];

        Object.entries(state.transactions).forEach(([id, transaction]) => {
          if (
            transaction.timestamp > cutoffTime ||
            transaction.status === TransactionStatus.PENDING
          ) {
            filteredTransactions[id] = transaction;
            if (state.recentTransactions.includes(id)) {
              filteredRecent.push(id);
            }
          }
        });

        return {
          transactions: filteredTransactions,
          recentTransactions: filteredRecent,
          pendingTransactions: state.pendingTransactions.filter(
            id => filteredTransactions[id]?.status === TransactionStatus.PENDING
          ),
        };
      });
    },

    getTransaction: id => {
      return get().transactions[id];
    },

    getPendingTransactions: () => {
      const { transactions, pendingTransactions } = get();
      return pendingTransactions.map(id => transactions[id]).filter(Boolean);
    },

    getRecentTransactions: (limit = 10) => {
      const { transactions, recentTransactions } = get();
      return recentTransactions
        .slice(0, limit)
        .map(id => transactions[id])
        .filter(Boolean);
    },

    getTransactionsByType: type => {
      const { transactions } = get();
      return Object.values(transactions).filter(tx => tx.type === type);
    },
  }))
);

// Transaction Manager Class
export class TransactionManager {
  private static instance: TransactionManager;
  private confirmationCheckInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_REQUIRED_CONFIRMATIONS = 3;
  private readonly CONFIRMATION_CHECK_INTERVAL = 5000; // 5 seconds

  private constructor() {
    this.startConfirmationMonitoring();
  }

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  /**
   * Submit a new transaction for monitoring
   */
  async submitTransaction(
    hash: Hash,
    type: TransactionType,
    metadata?: Record<string, any>,
    requiredConfirmations?: number
  ): Promise<string> {
    const transactionId = useTransactionStore.getState().addTransaction({
      hash,
      type,
      status: TransactionStatus.PENDING,
      confirmations: 0,
      requiredConfirmations:
        requiredConfirmations || this.DEFAULT_REQUIRED_CONFIRMATIONS,
      metadata,
      maxRetries: 3,
    });

    // Start monitoring this transaction
    this.monitorTransaction(transactionId);

    return transactionId;
  }

  /**
   * Monitor a specific transaction for confirmations
   */
  private async monitorTransaction(transactionId: string): Promise<void> {
    const transaction = useTransactionStore
      .getState()
      .getTransaction(transactionId);
    if (!transaction) return;

    try {
      // This would use the appropriate service to check transaction status
      // For now, we'll simulate the monitoring
      await this.checkTransactionStatus(transactionId);
    } catch (error) {
      console.error(`Error monitoring transaction ${transactionId}:`, error);
      useTransactionStore.getState().updateTransaction(transactionId, {
        status: TransactionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check the status of a transaction
   */
  private async checkTransactionStatus(transactionId: string): Promise<void> {
    const transaction = useTransactionStore
      .getState()
      .getTransaction(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return;
    }

    try {
      // In a real implementation, this would use the appropriate service
      // to check the transaction receipt and confirmations
      // For now, we'll simulate this

      // Simulate getting transaction receipt
      const receipt = await this.getTransactionReceipt(transaction.hash);

      if (receipt) {
        const confirmations = await this.getConfirmationCount(transaction.hash);

        useTransactionStore.getState().updateTransaction(transactionId, {
          receipt,
          confirmations,
          status:
            confirmations >= transaction.requiredConfirmations
              ? TransactionStatus.CONFIRMED
              : TransactionStatus.PENDING,
        });

        // If confirmed, stop monitoring
        if (confirmations >= transaction.requiredConfirmations) {
          this.onTransactionConfirmed(transactionId);
        }
      }
    } catch (error) {
      console.error(
        `Error checking transaction status for ${transactionId}:`,
        error
      );

      // Increment retry count
      const updatedTransaction = useTransactionStore
        .getState()
        .getTransaction(transactionId);
      if (
        updatedTransaction &&
        updatedTransaction.retryCount < updatedTransaction.maxRetries
      ) {
        useTransactionStore.getState().updateTransaction(transactionId, {
          retryCount: updatedTransaction.retryCount + 1,
        });
      } else {
        useTransactionStore.getState().updateTransaction(transactionId, {
          status: TransactionStatus.FAILED,
          error:
            error instanceof Error
              ? error.message
              : 'Transaction monitoring failed',
        });
      }
    }
  }

  /**
   * Get transaction receipt (placeholder - would use actual service)
   */
  private async getTransactionReceipt(
    hash: Hash
  ): Promise<TransactionReceipt | null> {
    // This would be implemented using the actual blockchain service
    // For now, return null to simulate pending transaction
    return null;
  }

  /**
   * Get confirmation count (placeholder - would use actual service)
   */
  private async getConfirmationCount(hash: Hash): Promise<number> {
    // This would be implemented using the actual blockchain service
    // For now, return 0 to simulate pending transaction
    return 0;
  }

  /**
   * Handle confirmed transaction
   */
  private onTransactionConfirmed(transactionId: string): void {
    const transaction = useTransactionStore
      .getState()
      .getTransaction(transactionId);
    if (!transaction) return;

    console.log(`Transaction confirmed: ${transaction.hash}`);

    // Emit custom event for transaction confirmation
    window.dispatchEvent(
      new CustomEvent('transactionConfirmed', {
        detail: { transactionId, transaction },
      })
    );
  }

  /**
   * Start monitoring all pending transactions
   */
  private startConfirmationMonitoring(): void {
    if (this.confirmationCheckInterval) {
      clearInterval(this.confirmationCheckInterval);
    }

    this.confirmationCheckInterval = setInterval(() => {
      const pendingTransactions = useTransactionStore
        .getState()
        .getPendingTransactions();

      pendingTransactions.forEach(transaction => {
        this.monitorTransaction(transaction.id);
      });
    }, this.CONFIRMATION_CHECK_INTERVAL);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.confirmationCheckInterval) {
      clearInterval(this.confirmationCheckInterval);
      this.confirmationCheckInterval = null;
    }
  }

  /**
   * Get transaction status summary
   */
  getTransactionSummary(): {
    pending: number;
    confirmed: number;
    failed: number;
    total: number;
  } {
    const transactions = Object.values(
      useTransactionStore.getState().transactions
    );

    return {
      pending: transactions.filter(
        tx => tx.status === TransactionStatus.PENDING
      ).length,
      confirmed: transactions.filter(
        tx => tx.status === TransactionStatus.CONFIRMED
      ).length,
      failed: transactions.filter(tx => tx.status === TransactionStatus.FAILED)
        .length,
      total: transactions.length,
    };
  }

  /**
   * Clean up old transactions
   */
  cleanup(olderThanHours = 24): void {
    useTransactionStore.getState().clearOldTransactions(olderThanHours);
  }
}

// Export singleton instance
export const transactionManager = TransactionManager.getInstance();

// Helper functions for transaction type descriptions
export const getTransactionTypeDescription = (
  type: TransactionType
): string => {
  const descriptions: Record<TransactionType, string> = {
    [TransactionType.TOKEN_APPROVE]: 'Approve Token Spending',
    [TransactionType.TOKEN_TRANSFER]: 'Transfer Tokens',
    [TransactionType.CREATE_LOCK]: 'Create Token Lock',
    [TransactionType.INCREASE_LOCK_AMOUNT]: 'Increase Lock Amount',
    [TransactionType.INCREASE_LOCK_DURATION]: 'Increase Lock Duration',
    [TransactionType.EXIT_LOCK]: 'Exit Token Lock',
    [TransactionType.CAST_VOTE]: 'Cast Vote',
    [TransactionType.RESET_VOTES]: 'Reset Votes',
    [TransactionType.ENTER_QUEUE]: 'Enter Exit Queue',
    [TransactionType.EXIT_QUEUE]: 'Exit Queue',
    [TransactionType.CLAIM_FROM_QUEUE]: 'Claim from Queue',
  };

  return descriptions[type] || 'Unknown Transaction';
};

// Helper function to get status color
export const getTransactionStatusColor = (
  status: TransactionStatus
): string => {
  const colors: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: 'text-yellow-600',
    [TransactionStatus.CONFIRMED]: 'text-green-600',
    [TransactionStatus.FAILED]: 'text-red-600',
    [TransactionStatus.CANCELLED]: 'text-gray-600',
  };

  return colors[status] || 'text-gray-600';
};
