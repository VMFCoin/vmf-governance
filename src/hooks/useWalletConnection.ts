import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';
import { useUIStore } from '@/stores/useUIStore';
import { walletApi } from '@/lib/api';
import { isValidEthereumAddress } from '@/lib/utils';

interface UseWalletConnectionReturn {
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  ensName: string | null;
  vmfBalance: number;
  votingPower: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const {
    isConnected,
    address,
    ensName,
    vmfBalance,
    votingPower,
    setWalletData,
    setVMFBalance,
    disconnect,
  } = useWalletStore();

  const { showSuccessToast, showErrorToast, showInfoToast, setLoading } =
    useUIStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  }, []);

  // Get current account from MetaMask
  const getCurrentAccount = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled()) return null;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }, [isMetaMaskInstalled]);

  // Request account access
  const requestAccount = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error('Failed to connect to wallet');
    }
  }, [isMetaMaskInstalled]);

  // Sign a message with the connected wallet
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!isMetaMaskInstalled() || !address) {
        throw new Error('Wallet not connected');
      }

      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
        return signature;
      } catch (error: any) {
        if (error.code === 4001) {
          throw new Error('User rejected the signature request');
        }
        throw new Error('Failed to sign message');
      }
    },
    [isMetaMaskInstalled, address]
  );

  // Switch to a specific network
  const switchNetwork = useCallback(
    async (chainId: number): Promise<void> => {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (error: any) {
        if (error.code === 4902) {
          throw new Error('Network not added to MetaMask');
        }
        throw new Error('Failed to switch network');
      }
    },
    [isMetaMaskInstalled]
  );

  // Fetch VMF balance and voting power
  const fetchBalance = useCallback(
    async (walletAddress: string) => {
      try {
        const response = await walletApi.getVMFBalance(walletAddress);
        if (response.success && response.data) {
          setVMFBalance(response.data.balance);
        }
      } catch (error) {
        console.error('Error fetching VMF balance:', error);
      }
    },
    [setVMFBalance]
  );

  // Connect wallet
  const connectWallet = useCallback(async (): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      setError(
        'MetaMask is not installed. Please install MetaMask to continue.'
      );
      showErrorToast(
        'MetaMask Required',
        'Please install MetaMask to connect your wallet.'
      );
      return;
    }

    setIsConnecting(true);
    setError(null);
    setLoading(true, 'Connecting wallet...');

    try {
      const account = await requestAccount();

      if (!account || !isValidEthereumAddress(account)) {
        throw new Error('Invalid wallet address');
      }

      // Create authentication message
      const message = `Sign this message to authenticate with VMF Governance.\n\nTimestamp: ${Date.now()}`;
      const signature = await signMessage(message);

      // Authenticate with backend
      const authResponse = await walletApi.connectWallet(account, signature);

      if (authResponse.success && authResponse.data) {
        setWalletData({
          isConnected: true,
          address: account,
          ensName: authResponse.data.user.ensName,
        });
        await fetchBalance(account);

        showSuccessToast(
          'Wallet Connected',
          'Successfully connected to your wallet.'
        );
      } else {
        throw new Error(authResponse.error || 'Authentication failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet';
      setError(errorMessage);
      showErrorToast('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
      setLoading(false);
    }
  }, [
    isMetaMaskInstalled,
    requestAccount,
    signMessage,
    setWalletData,
    fetchBalance,
    showSuccessToast,
    showErrorToast,
    setLoading,
  ]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      await walletApi.disconnectWallet();
      disconnect();
      showInfoToast(
        'Wallet Disconnected',
        'Your wallet has been disconnected.'
      );
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [disconnect, showInfoToast]);

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== address) {
        // Account changed, reconnect
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged
        );
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, address, connectWallet, disconnectWallet]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      const account = await getCurrentAccount();
      if (account && isValidEthereumAddress(account)) {
        setWalletData({
          isConnected: true,
          address: account,
        });
        await fetchBalance(account);
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled, getCurrentAccount, setWalletData, fetchBalance]);

  return {
    isConnecting,
    isConnected,
    address,
    ensName,
    vmfBalance,
    votingPower,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
    error,
  };
};
