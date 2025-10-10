import crypto from 'crypto';

/**
 * Generate a secure random token for email validation
 * @returns {string} A URL-safe random token
 */
export function generateEmailToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate token expiry timestamp (24 hours from now)
 * @returns {string} ISO timestamp for 24 hours from now
 */
export function generateTokenExpiry(): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hours from now
  return expiry.toISOString();
}

/**
 * Check if a token has expired
 * @param {string} expiryDate - ISO timestamp of expiry
 * @returns {boolean} True if expired, false otherwise
 */
export function isTokenExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return now > expiry;
}

/**
 * Hash a token for storage (optional, for extra security)
 * @param {string} token - The token to hash
 * @returns {string} Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
