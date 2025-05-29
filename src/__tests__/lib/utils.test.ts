import {
  cn,
  formatWalletAddress,
  formatTimeRemaining,
  formatVMFBalance,
  formatCompactNumber,
  truncateText,
  capitalizeFirst,
  slugify,
  isValidEthereumAddress,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe(
        'base conditional'
      );
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('handles empty strings', () => {
      expect(cn('base', '', 'end')).toBe('base end');
    });

    it('merges Tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
  });

  describe('formatWalletAddress', () => {
    it('formats Ethereum addresses correctly', () => {
      const address = '0x1234567890123456789012345678901234567890';
      expect(formatWalletAddress(address)).toBe('0x1234...7890');
    });

    it('handles short addresses', () => {
      const address = '0x123456';
      expect(formatWalletAddress(address)).toBe('0x123456');
    });

    it('handles custom length', () => {
      const address = '0x1234567890123456789012345678901234567890';
      // With startChars: 6, endChars: 6 -> '0x1234' (first 6) + '...' + '567890' (last 6)
      expect(formatWalletAddress(address, 6, 6)).toBe('0x1234...567890');
    });
  });

  describe('formatTimeRemaining', () => {
    it('formats days and hours correctly', () => {
      const futureDate = new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
      );
      const result = formatTimeRemaining(futureDate);
      expect(result).toMatch(/\d+d \d+h remaining/);
    });

    it('formats hours and minutes correctly', () => {
      const futureDate = new Date(
        Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000
      );
      expect(formatTimeRemaining(futureDate)).toBe('5h 30m remaining');
    });

    it('formats minutes correctly', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000);
      expect(formatTimeRemaining(futureDate)).toBe('30m remaining');
    });

    it('handles past dates', () => {
      const pastDate = new Date(Date.now() - 60 * 1000);
      expect(formatTimeRemaining(pastDate)).toBe('Ended');
    });
  });

  describe('formatVMFBalance', () => {
    it('formats small numbers correctly', () => {
      expect(formatVMFBalance(123)).toBe('123 VMF');
    });

    it('formats thousands correctly', () => {
      expect(formatVMFBalance(1234)).toBe('1.2K VMF');
    });

    it('formats millions correctly', () => {
      expect(formatVMFBalance(1234567)).toBe('1.2M VMF');
    });

    it('handles zero', () => {
      expect(formatVMFBalance(0)).toBe('0 VMF');
    });
  });

  describe('formatCompactNumber', () => {
    it('formats large numbers with compact notation', () => {
      expect(formatCompactNumber(1234)).toBe('1.2K');
      expect(formatCompactNumber(1234567)).toBe('1.2M');
      expect(formatCompactNumber(1234567890)).toBe('1.2B');
    });

    it('handles small numbers', () => {
      expect(formatCompactNumber(123)).toBe('123');
    });
  });

  describe('truncateText', () => {
    it('truncates long text correctly', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
    });

    it('does not truncate short text', () => {
      expect(truncateText('Short', 10)).toBe('Short');
    });

    it('handles custom suffix', () => {
      expect(truncateText('Long text here', 8, '---')).toBe('Long ---');
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('handles empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('handles single character', () => {
      expect(capitalizeFirst('a')).toBe('A');
    });
  });

  describe('slugify', () => {
    it('converts text to slug format', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('handles special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('handles multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });
  });

  describe('isValidEthereumAddress', () => {
    it('validates correct Ethereum addresses', () => {
      expect(
        isValidEthereumAddress('0x1234567890123456789012345678901234567890')
      ).toBe(true);
    });

    it('rejects invalid addresses', () => {
      expect(isValidEthereumAddress('invalid')).toBe(false);
      expect(isValidEthereumAddress('0x123')).toBe(false);
      expect(
        isValidEthereumAddress('1234567890123456789012345678901234567890')
      ).toBe(false);
    });
  });
});
