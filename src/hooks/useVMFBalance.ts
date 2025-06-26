'use client';

import { useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { RealTokenService } from '@/services/realTokenService';
import { config } from '@/lib/wagmi';
import { getAccount } from '@wagmi/core';

interface VMFBalanceData {
  walletBalance: bigint;
  decimals: number;
  symbol: string;
  isLoading: boolean;
  error: string | null;
}

interface UseVMFBalanceReturn extends VMFBalanceData {
  refreshBalance: () => Promise<void>;
  formatBalance: (balance: bigint) => string;
}

export function useVMFBalance(): UseVMFBalanceReturn {
  const { address, isConnected } = useAccount();
  const [walletBalance, setWalletBalance] = useState<bigint>(BigInt(0));
  const [decimals, setDecimals] = useState<number>(18);
  const [symbol, setSymbol] = useState<string>('VMF');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tokenService = new RealTokenService();

  const account = getAccount(config);

  const refreshBalance = useCallback(async () => {
    if (!account.address) {
      console.log('Wallet not connected or address not available');
      setWalletBalance(BigInt(0));
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get wallet balance and token info
      if (!address) throw new Error('Address is undefined');
      const [balance, tokenDecimals, tokenSymbol] = await Promise.all([
        tokenService.getBalance(account.address),
        tokenService.getDecimals(),
        tokenService.getSymbol(),
      ]);

      setWalletBalance(balance);
      setDecimals(tokenDecimals);
      setSymbol(tokenSymbol);
    } catch (err) {
      console.error('Error fetching VMF balance:', err);
      setError('Failed to fetch VMF balance');
      setWalletBalance(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, tokenService]);

  const formatBalance = useCallback(
    (balance: bigint): string => {
      const balanceNumber = Number(balance) / Math.pow(10, decimals);

      if (balanceNumber === 0) return '0';
      if (balanceNumber < 0.0001) return '< 0.0001';
      if (balanceNumber < 1) return balanceNumber.toFixed(4);
      if (balanceNumber >= 1000000) {
        return `${(balanceNumber / 1000000).toFixed(2)}M`;
      }
      if (balanceNumber >= 1000) {
        return `${(balanceNumber / 1000).toFixed(2)}K`;
      }

      return balanceNumber.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
    },
    [decimals]
  );

  // Fetch balance when wallet connects or address changes
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return {
    walletBalance,
    decimals,
    symbol,
    isLoading,
    error,
    refreshBalance,
    formatBalance,
  };
}
