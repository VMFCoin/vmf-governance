'use client';

import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { cn } from '@/lib/utils';

interface SecureConnectWalletProps {
  className?: string;
  showBalance?: boolean;
  showChainStatus?: boolean;
}

// Skeleton component for loading state
const WalletSkeleton: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="h-10 w-32 bg-backgroundLight/50 rounded-lg animate-pulse border border-patriotBlue/30" />
  </div>
);

// Security wrapper to prevent interaction during hydration
const SecurityWrapper: React.FC<{
  children: React.ReactNode;
  isReady: boolean;
  isConnected: boolean;
}> = ({ children, isReady, isConnected }) => {
  const [securityDelay, setSecurityDelay] = useState(true);

  useEffect(() => {
    // Add a small security delay to prevent race conditions
    const timer = setTimeout(() => {
      setSecurityDelay(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show skeleton during security delay or hydration
  if (!isReady || securityDelay) {
    return <WalletSkeleton />;
  }

  // Add security attributes to prevent interaction during uncertain states
  return (
    <div
      data-wallet-ready={isReady}
      data-wallet-connected={isConnected}
      data-security-verified={!securityDelay}
    >
      {children}
    </div>
  );
};

export const SecureConnectWallet: React.FC<SecureConnectWalletProps> = ({
  className,
  showBalance = true,
  showChainStatus = true,
}) => {
  const [isClient, setIsClient] = useState(false);
  const { isConnected, address } = useAccount();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on server side
  if (!isClient) {
    return <WalletSkeleton />;
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <SecurityWrapper isReady={ready} isConnected={!!connected}>
            <div className={cn('flex items-center gap-2', className)}>
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      disabled={!ready}
                      className="bg-patriotRed hover:bg-red-700 text-patriotWhite font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-patriot-glow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="connect-wallet-button"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      data-testid="wrong-network-button"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    {showChainStatus && (
                      <button
                        onClick={openChainModal}
                        className="bg-backgroundLight hover:bg-backgroundAccent text-textBase border border-patriotBlue font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2"
                        type="button"
                        data-testid="chain-selector"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </button>
                    )}

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-backgroundLight hover:bg-backgroundAccent text-textBase border border-patriotBlue font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      data-testid="account-button"
                    >
                      {account.displayName}
                      {showBalance && account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </button>
                  </div>
                );
              })()}
            </div>
          </SecurityWrapper>
        );
      }}
    </ConnectButton.Custom>
  );
};
