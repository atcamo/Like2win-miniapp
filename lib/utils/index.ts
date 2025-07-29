/**
 * Utility Functions
 * 
 * This module contains commonly used utility functions throughout the application.
 * Includes className utilities, formatting helpers, validation helpers, and more.
 * 
 * @module Utils
 * @version 1.0.0
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * This utility is essential for conditional classes and avoiding Tailwind conflicts
 * 
 * @param inputs - Class names to combine
 * @returns Combined class string
 * 
 * @example
 * ```typescript
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency string
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1000, 'EUR', 'de-DE') // "1.000,00 €"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formats a number with thousands separators
 * 
 * @param num - Number to format
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted number string
 * 
 * @example
 * ```typescript
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.56, 'de-DE') // "1.234,56"
 * ```
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formats a percentage value
 * 
 * @param value - Value to format (0-1 or 0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @param asDecimal - Whether input is decimal (0-1) or percentage (0-100)
 * @returns Formatted percentage string
 * 
 * @example
 * ```typescript
 * formatPercentage(0.1234) // "12.3%"
 * formatPercentage(12.34, 1, false) // "12.3%"
 * ```
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  asDecimal: boolean = true
): string {
  const percentage = asDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Truncates a string to a specified length with ellipsis
 * 
 * @param str - String to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 * 
 * @example
 * ```typescript
 * truncateString('This is a long string', 10) // "This is a..."
 * truncateString('Short', 10) // "Short"
 * ```
 */
export function truncateString(
  str: string,
  length: number,
  suffix: string = '...'
): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Formats an Ethereum address for display
 * 
 * @param address - Ethereum address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address
 * 
 * @example
 * ```typescript
 * formatAddress('0x1234567890abcdef1234567890abcdef12345678') 
 * // "0x1234...5678"
 * ```
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a time duration in milliseconds to human readable format
 * 
 * @param ms - Duration in milliseconds
 * @param format - Format type ('short' | 'long')
 * @returns Formatted duration string
 * 
 * @example
 * ```typescript
 * formatDuration(3661000) // "1h 1m 1s"
 * formatDuration(3661000, 'long') // "1 hour 1 minute 1 second"
 * ```
 */
export function formatDuration(ms: number, format: 'short' | 'long' = 'short'): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(format === 'short' ? `${days}d` : `${days} day${days > 1 ? 's' : ''}`);
  }
  if (remainingHours > 0) {
    parts.push(format === 'short' ? `${remainingHours}h` : `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0) {
    parts.push(format === 'short' ? `${remainingMinutes}m` : `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
  }
  if (remainingSeconds > 0 && days === 0) {
    parts.push(format === 'short' ? `${remainingSeconds}s` : `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Calculates time until a future date
 * 
 * @param endDate - End date
 * @param now - Current date (default: new Date())
 * @returns Time remaining object
 * 
 * @example
 * ```typescript
 * const timeLeft = getTimeUntil(new Date('2024-12-31'));
 * console.log(timeLeft.formatted); // "5d 12h 30m"
 * ```
 */
export function getTimeUntil(endDate: Date | string, now: Date = new Date()) {
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'Ended',
      totalSeconds: 0,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0 && days === 0) formatted += `${minutes}m`;
  if (formatted === '' && seconds > 0) formatted = `${seconds}s`;
  
  formatted = formatted.trim() || '0s';

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    formatted,
    totalSeconds,
  };
}

/**
 * Validates an Ethereum address
 * 
 * @param address - Address to validate
 * @returns Whether the address is valid
 * 
 * @example
 * ```typescript
 * isValidAddress('0x1234567890abcdef1234567890abcdef12345678') // true
 * isValidAddress('invalid') // false
 * ```
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates a Farcaster cast hash
 * 
 * @param hash - Hash to validate
 * @returns Whether the hash is valid
 */
export function isValidCastHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(hash);
}

/**
 * Validates a URL
 * 
 * @param url - URL to validate
 * @returns Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounces a function call
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Copies text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 * 
 * @example
 * ```typescript
 * await copyToClipboard('0x1234...5678');
 * ```
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Failed to copy text:', error);
      throw new Error('Failed to copy text to clipboard');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Generates a random string
 * 
 * @param length - Length of the string
 * @param charset - Character set to use
 * @returns Random string
 */
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Converts a value to a number, with fallback
 * 
 * @param value - Value to convert
 * @param fallback - Fallback value if conversion fails
 * @returns Converted number or fallback
 */
export function toNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Safely accesses a nested object property
 * 
 * @param obj - Object to access
 * @param path - Property path (e.g., 'user.profile.name')
 * @param defaultValue - Default value if path doesn't exist
 * @returns Property value or default
 * 
 * @example
 * ```typescript
 * const name = get(user, 'profile.name', 'Unknown');
 * ```
 */
export function get(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * 
 * @param value - Value to check
 * @returns Whether the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Retries a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise that resolves with the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Creates a promise that resolves after a specified delay
 * 
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}