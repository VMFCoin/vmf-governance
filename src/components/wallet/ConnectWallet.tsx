'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';

interface ConnectWalletProps {
  className?: string;
  showBalance?: boolean;
  showChainStatus?: boolean;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({
  className,
  showBalance = true,
  showChainStatus = true,
}) => {
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
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            className={cn('flex items-center gap-2', className)}
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-patriotRed hover:bg-red-700 text-patriotWhite font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-patriot-glow hover:shadow-lg"
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
        );
      }}
    </ConnectButton.Custom>
  );
};
