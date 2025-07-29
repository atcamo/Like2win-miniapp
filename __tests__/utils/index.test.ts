/**
 * Unit Tests for Utility Functions
 * 
 * Tests critical utility functions including formatting,
 * validation, time calculations, and data manipulation
 */

import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  truncateString,
  formatAddress,
  formatDuration,
  getTimeUntil,
  isValidAddress,
  isValidCastHash,
  isValidUrl,
  debounce,
  throttle,
  copyToClipboard,
  generateRandomString,
  toNumber,
  get,
  isEmpty,
  retryWithBackoff,
  sleep,
} from '@/lib/utils';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-4', 'px-6');
      expect(result).toContain('px-6');
      expect(result).not.toContain('px-4');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toContain('€');
      expect(formatCurrency(1234.56, 'GBP', 'en-GB')).toContain('£');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle different locales', () => {
      const result = formatNumber(1234.56, 'de-DE');
      expect(result).toContain('1.234'); // German uses period for thousands
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal percentages', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%');
      expect(formatPercentage(0.5)).toBe('50.0%');
      expect(formatPercentage(1)).toBe('100.0%');
    });

    it('should format whole number percentages', () => {
      expect(formatPercentage(12.34, 1, false)).toBe('12.3%');
      expect(formatPercentage(50, 0, false)).toBe('50%');
    });

    it('should handle different decimal places', () => {
      expect(formatPercentage(0.12345, 3)).toBe('12.345%');
      expect(formatPercentage(0.12345, 0)).toBe('12%');
    });
  });

  describe('truncateString', () => {
    it('should truncate long strings', () => {
      expect(truncateString('This is a very long string', 10)).toBe('This is...');
      expect(truncateString('Short', 10)).toBe('Short');
    });

    it('should use custom suffix', () => {
      expect(truncateString('Long string here', 8, '---')).toBe('Long---');
    });

    it('should handle edge cases', () => {
      expect(truncateString('', 5)).toBe('');
      expect(truncateString('Test', 0)).toBe('...');
    });
  });

  describe('formatAddress', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';

    it('should format Ethereum addresses', () => {
      expect(formatAddress(address)).toBe('0x1234...5678');
    });

    it('should use custom character counts', () => {
      expect(formatAddress(address, 4, 6)).toBe('0x12...345678');
    });

    it('should handle short addresses', () => {
      expect(formatAddress('0x1234')).toBe('0x1234');
    });
  });

  describe('formatDuration', () => {
    it('should format durations in short format', () => {
      expect(formatDuration(3661000)).toBe('1h 1m 1s'); // 1h 1m 1s in ms
      expect(formatDuration(60000)).toBe('1m');
      expect(formatDuration(86400000)).toBe('1d');
    });

    it('should format durations in long format', () => {
      expect(formatDuration(3661000, 'long')).toContain('1 hour');
      expect(formatDuration(60000, 'long')).toBe('1 minute');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(999)).toBe('0s');
    });
  });

  describe('getTimeUntil', () => {
    const futureDate = new Date(Date.now() + 3661000); // 1h 1m 1s from now
    const pastDate = new Date(Date.now() - 1000);

    it('should calculate time until future date', () => {
      const result = getTimeUntil(futureDate);
      expect(result.isExpired).toBe(false);
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(1);
      expect(result.formatted).toContain('1h');
    });

    it('should handle expired dates', () => {
      const result = getTimeUntil(pastDate);
      expect(result.isExpired).toBe(true);
      expect(result.formatted).toBe('Ended');
    });

    it('should handle string dates', () => {
      const result = getTimeUntil(futureDate.toISOString());
      expect(result.isExpired).toBe(false);
    });
  });

  describe('Validation functions', () => {
    describe('isValidAddress', () => {
      it('should validate Ethereum addresses', () => {
        expect(isValidAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
        expect(isValidAddress('0x1234567890ABCDEF1234567890ABCDEF12345678')).toBe(true);
        expect(isValidAddress('invalid')).toBe(false);
        expect(isValidAddress('0x123')).toBe(false);
      });
    });

    describe('isValidCastHash', () => {
      it('should validate cast hashes', () => {
        expect(isValidCastHash('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
        expect(isValidCastHash('invalid')).toBe(false);
      });
    });

    describe('isValidUrl', () => {
      it('should validate URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
        expect(isValidUrl('invalid-url')).toBe(false);
        expect(isValidUrl('')).toBe(false);
      });
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', async () => {
      await copyToClipboard('test text');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });
  });

  describe('generateRandomString', () => {
    it('should generate random strings of specified length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
      expect(typeof result).toBe('string');
    });

    it('should use custom charset', () => {
      const result = generateRandomString(5, '12345');
      expect(result).toMatch(/^[12345]+$/);
    });
  });

  describe('toNumber', () => {
    it('should convert values to numbers', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('123.45')).toBe(123.45);
      expect(toNumber(456)).toBe(456);
    });

    it('should use fallback for invalid numbers', () => {
      expect(toNumber('invalid')).toBe(0);
      expect(toNumber('invalid', 999)).toBe(999);
      expect(toNumber(null)).toBe(0);
    });
  });

  describe('get', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John Doe',
          age: 30,
        },
        settings: {
          theme: 'dark',
        },
      },
    };

    it('should get nested object properties', () => {
      expect(get(testObj, 'user.profile.name')).toBe('John Doe');
      expect(get(testObj, 'user.settings.theme')).toBe('dark');
    });

    it('should return default value for missing properties', () => {
      expect(get(testObj, 'user.profile.email', 'N/A')).toBe('N/A');
      expect(get(testObj, 'missing.path')).toBeUndefined();
    });

    it('should handle null/undefined objects', () => {
      expect(get(null, 'any.path', 'default')).toBe('default');
      expect(get(undefined, 'any.path', 'default')).toBe('default');
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('text')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retryWithBackoff(mockFn, 3, 10);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('sleep', () => {
    jest.useFakeTimers();

    it('should delay execution', async () => {
      const promise = sleep(1000);
      
      jest.advanceTimersByTime(1000);
      
      await expect(promise).resolves.toBeUndefined();
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});