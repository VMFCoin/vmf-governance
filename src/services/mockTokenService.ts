import { MockTransaction, TokenApproval } from '@/types';

export class MockTokenService {
  private balances = new Map<string, bigint>();
  private allowances = new Map<string, TokenApproval>();
  private transactions = new Map<string, MockTransaction>();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Give some addresses mock token balances for testing
    const mockAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0x0987654321098765432109876543210987654321',
    ];

    mockAddresses.forEach(address => {
      this.balances.set(
        address.toLowerCase(),
        BigInt('1000000000000000000000')
      ); // 1000 tokens
    });
  }

  async getBalance(address: string): Promise<bigint> {
    await this.simulateDelay();
    return this.balances.get(address.toLowerCase()) || BigInt(0);
  }

  async approve(
    spender: string,
    amount: bigint,
    owner: string
  ): Promise<MockTransaction> {
    await this.simulateDelay();

    const txHash = this.generateTxHash();
    const transaction: MockTransaction = {
      hash: txHash,
      status: 'pending',
      type: 'approve',
      timestamp: new Date(),
    };

    this.transactions.set(txHash, transaction);

    // Simulate transaction confirmation after delay
    setTimeout(() => {
      const approval: TokenApproval = {
        owner: owner.toLowerCase(),
        spender: spender.toLowerCase(),
        amount,
        timestamp: new Date(),
      };

      this.allowances.set(
        `${owner.toLowerCase()}-${spender.toLowerCase()}`,
        approval
      );

      const confirmedTx = { ...transaction, status: 'confirmed' as const };
      this.transactions.set(txHash, confirmedTx);
    }, 2000);

    return transaction;
  }

  async getAllowance(owner: string, spender: string): Promise<bigint> {
    await this.simulateDelay();
    const key = `${owner.toLowerCase()}-${spender.toLowerCase()}`;
    return this.allowances.get(key)?.amount || BigInt(0);
  }

  async transfer(
    from: string,
    to: string,
    amount: bigint
  ): Promise<MockTransaction> {
    await this.simulateDelay();

    const fromBalance = this.balances.get(from.toLowerCase()) || BigInt(0);
    if (fromBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const txHash = this.generateTxHash();
    const transaction: MockTransaction = {
      hash: txHash,
      status: 'pending',
      type: 'lock',
      timestamp: new Date(),
    };

    this.transactions.set(txHash, transaction);

    // Simulate transaction confirmation
    setTimeout(() => {
      this.balances.set(from.toLowerCase(), fromBalance - amount);
      const toBalance = this.balances.get(to.toLowerCase()) || BigInt(0);
      this.balances.set(to.toLowerCase(), toBalance + amount);

      const confirmedTx = { ...transaction, status: 'confirmed' as const };
      this.transactions.set(txHash, confirmedTx);
    }, 3000);

    return transaction;
  }

  async getTransaction(hash: string): Promise<MockTransaction | null> {
    return this.transactions.get(hash) || null;
  }

  private generateTxHash(): string {
    return (
      '0x' +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    );
  }

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );
  }

  // Helper method to add balance for testing
  addBalance(address: string, amount: bigint): void {
    const current = this.balances.get(address.toLowerCase()) || BigInt(0);
    this.balances.set(address.toLowerCase(), current + amount);
  }
}

export const mockTokenService = new MockTokenService();
