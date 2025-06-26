import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
  waitForTransactionReceipt,
  watchContractEvent,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { votingEscrowABI } from '@/contracts/abis/VotingEscrow';
import { nftLockABI } from '@/contracts/abis/NFTLock';
import { exitQueueABI } from '@/contracts/abis/ExitQueue';
import { getContractAddressFromEnv } from '@/contracts/addresses';
import { TokenLock } from '@/types';

export interface NFTLock {
  tokenId: number;
  owner: Address;
  amount: bigint;
  lockEnd: number;
  votingPower: bigint;
  createdAt: Date;
  isWarmupComplete: boolean;
  warmupEndsAt: Date;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  transferable: boolean;
  delegatedTo?: Address;
  exitQueuePosition?: number;
  canWithdraw: boolean;
}

export interface NFTLockHistory {
  tokenId: number;
  action:
    | 'created'
    | 'increased_amount'
    | 'increased_duration'
    | 'transferred'
    | 'delegated'
    | 'exit_queue_entered'
    | 'withdrawn';
  amount?: bigint;
  duration?: number;
  from?: Address;
  to?: Address;
  timestamp: Date;
  transactionHash: string;
}

export interface UseNFTLocksReturn {
  locks: NFTLock[];
  isLoading: boolean;
  error: Error | null;
  createLock: (amount: bigint, duration: number) => Promise<number>;
  increaseLock: (tokenId: number, amount: bigint) => Promise<void>;
  increaseLockDuration: (tokenId: number, newEnd: number) => Promise<void>;
  enterExitQueue: (tokenId: number) => Promise<void>;
  claimFromQueue: (tokenId: number) => Promise<void>;
  transferLock: (tokenId: number, to: Address) => Promise<void>;
  delegateVotingPower: (tokenId: number, delegate: Address) => Promise<void>;
  removeDelegation: (tokenId: number) => Promise<void>;
  getLockHistory: (tokenId: number) => Promise<NFTLockHistory[]>;
  getLockMetadata: (tokenId: number) => Promise<NFTLock['metadata']>;
  refreshLocks: () => Promise<void>;
  isTransferEnabled: boolean;
  totalVotingPower: bigint;
  totalLockedAmount: bigint;
}

export function useNFTLocks(): UseNFTLocksReturn {
  const [locks, setLocks] = useState<NFTLock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTransferEnabled, setIsTransferEnabled] = useState(false);

  const votingEscrowAddress = getContractAddressFromEnv(
    'VOTING_ESCROW'
  ) as Address;
  const nftLockAddress = getContractAddressFromEnv('NFT_LOCK') as Address;
  const exitQueueAddress = getContractAddressFromEnv('EXIT_QUEUE') as Address;

  const WARMUP_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
  const MAX_TIME = BigInt(4 * 365 * 24 * 60 * 60); // 4 years in seconds

  // Check if transfers are enabled
  const checkTransferStatus = useCallback(async () => {
    try {
      const whitelistAnyAddress = '0x' + 'f'.repeat(40); // WHITELIST_ANY_ADDRESS constant
      const enabled = await readContract(config, {
        address: nftLockAddress,
        abi: nftLockABI,
        functionName: 'whitelisted',
        args: [whitelistAnyAddress],
      });
      setIsTransferEnabled(Boolean(enabled));
    } catch (error) {
      console.error('Error checking transfer status:', error);
    }
  }, [nftLockAddress]);

  // Get lock metadata from tokenURI
  const getLockMetadata = useCallback(
    async (tokenId: number): Promise<NFTLock['metadata']> => {
      try {
        const tokenURI = (await readContract(config, {
          address: nftLockAddress,
          abi: nftLockABI,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)],
        })) as string;

        if (tokenURI.startsWith('data:application/json;base64,')) {
          const base64Data = tokenURI.split(',')[1];
          const jsonData = atob(base64Data);
          return JSON.parse(jsonData);
        } else if (tokenURI.startsWith('http')) {
          const response = await fetch(tokenURI);
          return response.json();
        }
        return undefined;
      } catch (error) {
        console.error('Error getting lock metadata:', error);
        return undefined;
      }
    },
    [nftLockAddress]
  );

  // Get user's NFT locks
  const fetchUserLocks = useCallback(
    async (userAddress: Address): Promise<NFTLock[]> => {
      try {
        const balance = (await readContract(config, {
          address: nftLockAddress,
          abi: nftLockABI,
          functionName: 'balanceOf',
          args: [userAddress],
        })) as bigint;

        const userLocks: NFTLock[] = [];

        for (let i = 0; i < Number(balance); i++) {
          const tokenId = (await readContract(config, {
            address: nftLockAddress,
            abi: nftLockABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [userAddress, BigInt(i)],
          })) as bigint;

          const lockData = (await readContract(config, {
            address: votingEscrowAddress,
            abi: votingEscrowABI,
            functionName: 'locked',
            args: [tokenId],
          })) as [bigint, bigint];

          const [amount, end] = lockData;

          const votingPower = (await readContract(config, {
            address: votingEscrowAddress,
            abi: votingEscrowABI,
            functionName: 'balanceOfNFT',
            args: [tokenId],
          })) as bigint;

          const createdAt = new Date(); // This would need to be fetched from events in a real implementation
          const warmupEndsAt = new Date(createdAt.getTime() + WARMUP_PERIOD);
          const isWarmupComplete = Date.now() > warmupEndsAt.getTime();

          // Check if in exit queue
          let exitQueuePosition: number | undefined;
          let canWithdraw = false;
          try {
            const queueInfo = await readContract(config, {
              address: exitQueueAddress,
              abi: exitQueueABI,
              functionName: 'getQueuePosition',
              args: [tokenId],
            });
            exitQueuePosition = queueInfo ? Number(queueInfo) : undefined;

            if (exitQueuePosition !== undefined) {
              canWithdraw = (await readContract(config, {
                address: exitQueueAddress,
                abi: exitQueueABI,
                functionName: 'canWithdraw',
                args: [tokenId],
              })) as boolean;
            }
          } catch {
            // Not in queue or queue check failed
          }

          const metadata = await getLockMetadata(Number(tokenId));

          userLocks.push({
            tokenId: Number(tokenId),
            owner: userAddress,
            amount,
            lockEnd: Number(end),
            votingPower,
            createdAt,
            isWarmupComplete,
            warmupEndsAt,
            metadata,
            transferable: isTransferEnabled,
            exitQueuePosition,
            canWithdraw,
          });
        }

        return userLocks;
      } catch (error) {
        console.error('Error fetching user locks:', error);
        throw error;
      }
    },
    [
      nftLockAddress,
      votingEscrowAddress,
      exitQueueAddress,
      getLockMetadata,
      isTransferEnabled,
      WARMUP_PERIOD,
    ]
  );

  // Refresh locks
  const refreshLocks = useCallback(async () => {
    const account = getAccount(config);
    if (!account.address) return;

    setIsLoading(true);
    setError(null);

    try {
      await checkTransferStatus();
      const userLocks = await fetchUserLocks(account.address);
      setLocks(userLocks);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [checkTransferStatus, fetchUserLocks]);

  // Create a new lock
  const createLock = useCallback(
    async (amount: bigint, duration: number): Promise<number> => {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      try {
        const unlockTime = Math.floor(Date.now() / 1000) + duration;

        const { request } = await simulateContract(config, {
          address: votingEscrowAddress,
          abi: votingEscrowABI,
          functionName: 'createLock',
          args: [amount],
          account: account.address,
        });

        const hash = await writeContract(config, request);
        const receipt = await waitForTransactionReceipt(config, { hash });

        // Extract token ID from events
        const lockCreatedEvent = receipt.logs.find(
          log => log.address.toLowerCase() === votingEscrowAddress.toLowerCase()
        );

        if (lockCreatedEvent) {
          // Parse the token ID from the event - this would need proper event parsing
          const tokenId = 1; // Placeholder - would extract from event data
          await refreshLocks();
          return tokenId;
        }

        throw new Error('Failed to get token ID from transaction');
      } catch (error) {
        console.error('Error creating lock:', error);
        throw error;
      }
    },
    [votingEscrowAddress, refreshLocks]
  );

  // Increase lock amount
  const increaseLock = useCallback(
    async (tokenId: number, amount: bigint): Promise<void> => {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      try {
        const { request } = await simulateContract(config, {
          address: votingEscrowAddress,
          abi: votingEscrowABI,
          functionName: 'increaseAmount',
          args: [BigInt(tokenId), amount],
          account: account.address,
        });

        const hash = await writeContract(config, request);
        await waitForTransactionReceipt(config, { hash });
        await refreshLocks();
      } catch (error) {
        console.error('Error increasing lock amount:', error);
        throw error;
      }
    },
    [votingEscrowAddress, refreshLocks]
  );

  // Increase lock duration
  const increaseLockDuration = useCallback(
    async (tokenId: number, newEnd: number): Promise<void> => {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      try {
        const { request } = await simulateContract(config, {
          address: votingEscrowAddress,
          abi: votingEscrowABI,
          functionName: 'increaseUnlockTime',
          args: [BigInt(tokenId), BigInt(newEnd)],
          account: account.address,
        });

        const hash = await writeContract(config, request);
        await waitForTransactionReceipt(config, { hash });
        await refreshLocks();
      } catch (error) {
        console.error('Error increasing lock duration:', error);
        throw error;
      }
    },
    [votingEscrowAddress, refreshLocks]
  );

  // Enter exit queue
  const enterExitQueue = useCallback(
    async (tokenId: number): Promise<void> => {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      try {
        const { request } = await simulateContract(config, {
          address: exitQueueAddress,
          abi: exitQueueABI,
          functionName: 'enterQueue',
          args: [BigInt(tokenId)],
          account: account.address,
        });

        const hash = await writeContract(config, request);
        await waitForTransactionReceipt(config, { hash });
        await refreshLocks();
      } catch (error) {
        console.error('Error entering exit queue:', error);
        throw error;
      }
    },
    [exitQueueAddress, refreshLocks]
  );

  // Claim from exit queue
  const claimFromQueue = useCallback(
    async (tokenId: number): Promise<void> => {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      try {
        const { request } = await simulateContract(config, {
          address: exitQueueAddress,
          abi: exitQueueABI,
          functionName: 'withdraw',
          args: [BigInt(tokenId)],
          account: account.address,
        });

        const hash = await writeContract(config, request);
        await waitForTransactionReceipt(config, { hash });
        await refreshLocks();
      } catch (error) {
        console.error('Error claiming from queue:', error);
        throw error;
      }
    },
    [exitQueueAddress, refreshLocks]
  );

  // Transfer lock (if enabled)
  const transferLock = useCallback(
    async (tokenId: number, to: Address): Promise<void> => {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      if (!isTransferEnabled) {
        throw new Error('Transfers are not enabled');
      }

      try {
        const { request } = await simulateContract(config, {
          address: nftLockAddress,
          abi: nftLockABI,
          functionName: 'transferFrom',
          args: [account.address, to, BigInt(tokenId)],
          account: account.address,
        });

        const hash = await writeContract(config, request);
        await waitForTransactionReceipt(config, { hash });
        await refreshLocks();
      } catch (error) {
        console.error('Error transferring lock:', error);
        throw error;
      }
    },
    [nftLockAddress, isTransferEnabled, refreshLocks]
  );

  // Delegate voting power (if supported)
  const delegateVotingPower = useCallback(
    async (tokenId: number, delegate: Address): Promise<void> => {
      // This would depend on whether the deployed contract supports delegation
      throw new Error(
        'Delegation not implemented - check if supported by deployed contract'
      );
    },
    []
  );

  // Remove delegation (if supported)
  const removeDelegation = useCallback(
    async (tokenId: number): Promise<void> => {
      // This would depend on whether the deployed contract supports delegation
      throw new Error(
        'Delegation not implemented - check if supported by deployed contract'
      );
    },
    []
  );

  // Get lock history from events
  const getLockHistory = useCallback(
    async (tokenId: number): Promise<NFTLockHistory[]> => {
      // This would require querying historical events for the specific token ID
      // For now, returning empty array as this requires more complex event querying
      return [];
    },
    []
  );

  // Calculate totals
  const totalVotingPower = locks.reduce(
    (sum, lock) => sum + lock.votingPower,
    BigInt(0)
  );
  const totalLockedAmount = locks.reduce(
    (sum, lock) => sum + lock.amount,
    BigInt(0)
  );

  // Initialize on mount
  useEffect(() => {
    refreshLocks();
  }, [refreshLocks]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    const account = getAccount(config);
    if (!account.address) return;

    const unsubscribeDeposit = watchContractEvent(config, {
      address: votingEscrowAddress,
      abi: votingEscrowABI,
      eventName: 'Deposit',
      onLogs: () => refreshLocks(),
    });

    const unsubscribeWithdraw = watchContractEvent(config, {
      address: votingEscrowAddress,
      abi: votingEscrowABI,
      eventName: 'Withdraw',
      onLogs: () => refreshLocks(),
    });

    return () => {
      unsubscribeDeposit();
      unsubscribeWithdraw();
    };
  }, [votingEscrowAddress, refreshLocks]);

  return {
    locks,
    isLoading,
    error,
    createLock,
    increaseLock,
    increaseLockDuration,
    enterExitQueue,
    claimFromQueue,
    transferLock,
    delegateVotingPower,
    removeDelegation,
    getLockHistory,
    getLockMetadata,
    refreshLocks,
    isTransferEnabled,
    totalVotingPower,
    totalLockedAmount,
  };
}
