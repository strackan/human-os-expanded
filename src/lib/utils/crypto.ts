/**
 * Crypto utilities for encrypting/decrypting OAuth tokens
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a string value
 *
 * @param text - Plain text to encrypt
 * @param password - Encryption password/key
 * @returns Base64-encoded encrypted data (salt:iv:tag:ciphertext)
 */
export function encrypt(text: string, password: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key
  const key = deriveKey(password, salt);

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted
  const result = Buffer.concat([salt, iv, tag, encrypted]);

  // Return as base64
  return result.toString('base64');
}

/**
 * Decrypt an encrypted string value
 *
 * @param encryptedData - Base64-encoded encrypted data
 * @param password - Encryption password/key
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string, password: string): string {
  // Decode from base64
  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract salt, iv, tag, and ciphertext
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  // Derive encryption key
  const key = deriveKey(password, salt);

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
