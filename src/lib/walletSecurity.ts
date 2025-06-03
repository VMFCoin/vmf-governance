'use client';

interface SecurityCheck {
  isValid: boolean;
  reason?: string;
  canProceed: boolean;
}

export class WalletSecurityManager {
  private static instance: WalletSecurityManager;
  private securityChecks: Map<string, number> = new Map();
  private hydrationComplete = false;
  private securityDelay = 500; // ms

  private constructor() {}

  public static getInstance(): WalletSecurityManager {
    if (!WalletSecurityManager.instance) {
      WalletSecurityManager.instance = new WalletSecurityManager();
    }
    return WalletSecurityManager.instance;
  }

  public markHydrationComplete(): void {
    setTimeout(() => {
      this.hydrationComplete = true;
    }, this.securityDelay);
  }

  public validateWalletInteraction(
    address: string | null,
    action: string
  ): SecurityCheck {
    // Check if hydration is complete
    if (!this.hydrationComplete) {
      return {
        isValid: false,
        reason: 'Wallet state not fully hydrated',
        canProceed: false,
      };
    }

    // Check if address is valid
    if (!address || !this.isValidEthereumAddress(address)) {
      return {
        isValid: false,
        reason: 'Invalid wallet address',
        canProceed: false,
      };
    }

    // Check for rapid successive calls (potential attack)
    const checkKey = `${address}-${action}`;
    const lastCheck = this.securityChecks.get(checkKey);
    const now = Date.now();

    if (lastCheck && now - lastCheck < 1000) {
      return {
        isValid: false,
        reason: 'Rate limit exceeded',
        canProceed: false,
      };
    }

    this.securityChecks.set(checkKey, now);

    return {
      isValid: true,
      canProceed: true,
    };
  }

  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  public clearSecurityChecks(): void {
    this.securityChecks.clear();
  }
}

export const walletSecurity = WalletSecurityManager.getInstance();
