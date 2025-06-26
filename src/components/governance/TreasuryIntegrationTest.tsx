'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { treasuryService, TreasuryBalance } from '@/services/treasuryService';
import { formatEther } from 'viem';

export function TreasuryIntegrationTest() {
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTreasuryService = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const treasuryBalance = await treasuryService.getTreasuryBalance();
      setBalance(treasuryBalance);

      // Test other methods
      const transactions = await treasuryService.getTransactionHistory(5);
      const plans = await treasuryService.getDistributionPlans();
      const contracts = await treasuryService.getTreasuryContracts();

      console.log('Treasury Integration Test Results:');
      console.log('- Balance:', treasuryBalance);
      console.log('- Transactions:', transactions);
      console.log('- Distribution Plans:', plans);
      console.log('- Treasury Contracts:', contracts);
      console.log(
        '- Is Contract Deployed:',
        treasuryService.isContractDeployed()
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testTreasuryService();
  }, []);

  return (
    <Card className="p-6 max-w-md">
      <h3 className="text-lg font-semibold text-patriotWhite mb-4">
        Treasury Integration Test
      </h3>

      {isLoading && (
        <div className="flex items-center space-x-2 text-textSecondary">
          <div className="w-4 h-4 border-2 border-patriotBlue border-t-transparent rounded-full animate-spin"></div>
          <span>Testing treasury service...</span>
        </div>
      )}

      {error && <div className="text-red-400 text-sm">Error: {error}</div>}

      {balance && !isLoading && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-textSecondary">Contract Status:</span>
            <span className="text-patriotWhite">
              {treasuryService.isContractDeployed() ? 'Deployed' : 'Mock'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Total Balance:</span>
            <span className="text-patriotWhite">
              {formatEther(balance.totalBalance)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Available:</span>
            <span className="text-green-400">
              {formatEther(balance.availableBalance)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Assets:</span>
            <span className="text-patriotWhite">
              {balance.assets.length} tokens
            </span>
          </div>
        </div>
      )}

      <Button
        onClick={testTreasuryService}
        disabled={isLoading}
        className="w-full mt-4"
        size="sm"
      >
        {isLoading ? 'Testing...' : 'Test Again'}
      </Button>
    </Card>
  );
}
