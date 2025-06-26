import { Address } from 'viem';
import {
  readContract,
  writeContract,
  simulateContract,
  watchContractEvent,
  getAccount,
  waitForTransactionReceipt,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import ERC20ABI from '@/contracts/abis/ERC20.json';
import { DEPLOYED_CONTRACTS } from '@/contracts/addresses';

export interface TokenService {
  getBalance(address: Address): Promise<bigint>;
  getDecimals(): Promise<number>;
  getSymbol(): Promise<string>;
  getName(): Promise<string>;
  getTotalSupply(): Promise<bigint>;
  approve(spender: Address, amount: bigint): Promise<string>;
  getAllowance(owner: Address, spender: Address): Promise<bigint>;
  transfer(to: Address, amount: bigint): Promise<string>;
  transferFrom(from: Address, to: Address, amount: bigint): Promise<string>;
}

export interface TransferEvent {
  from: Address;
  to: Address;
  value: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export class RealTokenService implements TokenService {
  private tokenAddress: Address;

  constructor() {
    this.tokenAddress = DEPLOYED_CONTRACTS.VMF_TOKEN as Address;
  }

  async getBalance(address: Address): Promise<bigint> {
    try {
      const balance = (await readContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [address],
      })) as bigint;

      console.log(`Balance for ${address}:`, balance.toString());
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async getDecimals(): Promise<number> {
    try {
      const decimals = (await readContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'decimals',
      })) as number;
      return decimals;
    } catch (error) {
      console.error('Error getting decimals:', error);
      throw error;
    }
  }

  async getSymbol(): Promise<string> {
    try {
      const symbol = (await readContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'symbol',
      })) as string;
      return symbol;
    } catch (error) {
      console.error('Error getting symbol:', error);
      throw error;
    }
  }

  async getName(): Promise<string> {
    try {
      const name = (await readContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'name',
      })) as string;
      return name;
    } catch (error) {
      console.error('Error getting name:', error);
      throw error;
    }
  }

  async getTotalSupply(): Promise<bigint> {
    try {
      const totalSupply = (await readContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'totalSupply',
      })) as bigint;
      return totalSupply;
    } catch (error) {
      console.error('Error getting total supply:', error);
      throw error;
    }
  }

  async approve(spender: Address, amount: bigint): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [spender, amount],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error approving:', error);
      throw error;
    }
  }

  async getAllowance(owner: Address, spender: Address): Promise<bigint> {
    try {
      const allowance = (await readContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [owner, spender],
      })) as bigint;
      return allowance;
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw error;
    }
  }

  async transfer(to: Address, amount: bigint): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'transfer',
        args: [to, amount],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error transferring:', error);
      throw error;
    }
  }

  async transferFrom(
    from: Address,
    to: Address,
    amount: bigint
  ): Promise<string> {
    try {
      const account = getAccount(config);
      if (!account.address) {
        throw new Error('No wallet connected');
      }

      // Simulate the transaction first
      const { request } = await simulateContract(config, {
        address: this.tokenAddress,
        abi: ERC20ABI,
        functionName: 'transferFrom',
        args: [from, to, amount],
        account: account.address,
      });

      // Execute the transaction
      const hash = await writeContract(config, request);
      return hash;
    } catch (error) {
      console.error('Error transferring from:', error);
      throw error;
    }
  }

  subscribeToTransferEvents(
    callback: (event: { from: Address; to: Address; value: bigint }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.tokenAddress,
      abi: ERC20ABI,
      eventName: 'Transfer',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (args && 'from' in args && 'to' in args && 'value' in args) {
            callback({
              from: args.from as Address,
              to: args.to as Address,
              value: args.value as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  subscribeToApprovalEvents(
    callback: (event: {
      owner: Address;
      spender: Address;
      value: bigint;
    }) => void
  ): () => void {
    const unwatch = watchContractEvent(config, {
      address: this.tokenAddress,
      abi: ERC20ABI,
      eventName: 'Approval',
      onLogs: logs => {
        logs.forEach((log: any) => {
          const { args } = log;
          if (args && 'owner' in args && 'spender' in args && 'value' in args) {
            callback({
              owner: args.owner as Address,
              spender: args.spender as Address,
              value: args.value as bigint,
            });
          }
        });
      },
    });

    return unwatch;
  }

  async getTransactionReceipt(hash: string) {
    return await waitForTransactionReceipt(config, {
      hash: hash as `0x${string}`,
    });
  }

  async waitForTransaction(hash: string) {
    return await waitForTransactionReceipt(config, {
      hash: hash as `0x${string}`,
      timeout: 60_000,
    });
  }
}

// Export singleton instance
export const realTokenService = new RealTokenService();
