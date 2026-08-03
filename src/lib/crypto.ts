import { PasswordGeneratorOptions, PasswordStrengthResult } from '../types';

// Utility to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random salt in base64
export function generateSalt(length = 16): string {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  return bufferToBase64(randomBytes.buffer);
}

// Generate Recovery Key (formatted 24-character hex string like XXXX-XXXX-XXXX-XXXX)
export function generateRecoveryKey(): string {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 24)}`;
}

// Derive AES-256-GCM Key using PBKDF2 (100,000 iterations for robust security)
export async function deriveKey(masterPassword: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(masterPassword);
  const saltBuffer = base64ToBuffer(saltBase64);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Hash Master Password or Recovery Key for verification store
export async function hashString(value: string, saltBase64: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBuf = base64ToBuffer(saltBase64);
  const valBuf = enc.encode(value);

  // Combine value and salt
  const combined = new Uint8Array(valBuf.byteLength + saltBuf.byteLength);
  combined.set(new Uint8Array(valBuf), 0);
  combined.set(new Uint8Array(saltBuf), valBuf.byteLength);

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
  return bufferToBase64(hashBuffer);
}

// AES-256-GCM Encryption
export async function encryptData(data: any, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const plaintext = enc.encode(jsonString);

  // 12-byte IV for AES-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext
  );

  // Pack IV and Ciphertext together
  const packed = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), iv.byteLength);

  return bufferToBase64(packed.buffer);
}

// AES-256-GCM Decryption
export async function decryptData(encryptedBase64: string, key: CryptoKey): Promise<any> {
  const packedBuffer = base64ToBuffer(encryptedBase64);
  const packedBytes = new Uint8Array(packedBuffer);

  const iv = packedBytes.slice(0, 12);
  const ciphertext = packedBytes.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}

// --- PASSWORD GENERATOR ---
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'O0l1I|';

const WORD_LIST = [
  'falcon', 'harbor', 'summit', 'nebula', 'glacier', 'orbit', 'shield', 'phoenix',
  'quantum', 'vortex', 'titan', 'beacon', 'breeze', 'echo', 'zenith', 'pulse',
  'atlas', 'cyber', 'matrix', 'starlight', 'shadow', 'aurora', 'prism', 'valkyrie',
  'thunder', 'spark', 'galaxy', 'canyon', 'blaze', 'horizon', 'safeguard', 'anchor'
];

export function generatePassword(options: PasswordGeneratorOptions): string {
  if (options.mode === 'passphrase') {
    const count = options.wordCount || 4;
    const separator = options.wordSeparator || '-';
    const chosenWords: string[] = [];
    const randomArray = new Uint32Array(count);
    window.crypto.getRandomValues(randomArray);

    for (let i = 0; i < count; i++) {
      const index = randomArray[i] % WORD_LIST.length;
      let word = WORD_LIST[index];
      if (i === 0) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      chosenWords.push(word);
    }
    // append a random number to passphrase for added strength
    const num = Math.floor(Math.random() * 90) + 10;
    return chosenWords.join(separator) + separator + num;
  }

  let charset = '';
  if (options.useUppercase) charset += UPPERCASE;
  if (options.useLowercase) charset += LOWERCASE;
  if (options.useNumbers) charset += NUMBERS;
  if (options.useSymbols) charset += SYMBOLS;

  if (options.excludeAmbiguous) {
    for (const char of AMBIGUOUS) {
      charset = charset.replaceAll(char, '');
    }
  }

  if (!charset) {
    charset = LOWERCASE + NUMBERS;
  }

  const length = Math.max(6, Math.min(64, options.length));
  const result: string[] = [];
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result.push(charset[randomValues[i] % charset.length]);
  }

  return result.join('');
}

// --- PASSWORD STRENGTH EVALUATOR ---
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Weak',
      color: '#ef4444',
      crackTimeText: 'Instant',
      suggestions: ['Enter a password'],
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSymbols: false,
      isLongEnough: false,
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 12;

  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasNumbers) poolSize += 10;
  if (hasSymbols) poolSize += 32;

  // Calculate entropy: log2(poolSize^length)
  const entropy = password.length * (Math.log2(poolSize || 1));

  let score = Math.min(100, Math.round((entropy / 80) * 100));
  if (password.length < 8) {
    score = Math.min(score, 25);
  }

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Ultra' = 'Weak';
  let color = '#ef4444'; // red

  if (score < 30) {
    label = 'Weak';
    color = '#ef4444';
  } else if (score < 55) {
    label = 'Fair';
    color = '#f59e0b'; // amber
  } else if (score < 75) {
    label = 'Good';
    color = '#3b82f6'; // blue
  } else if (score < 90) {
    label = 'Strong';
    color = '#10b981'; // green
  } else {
    label = 'Ultra';
    color = '#8b5cf6'; // purple
  }

  // Crack time estimation based on 10 billion guesses/sec
  const guesses = Math.pow(poolSize || 2, password.length);
  const secondsToCrack = guesses / 10000000000;

  let crackTimeText = 'Instant';
  if (secondsToCrack < 1) crackTimeText = 'Less than a second';
  else if (secondsToCrack < 60) crackTimeText = `${Math.round(secondsToCrack)} seconds`;
  else if (secondsToCrack < 3600) crackTimeText = `${Math.round(secondsToCrack / 60)} minutes`;
  else if (secondsToCrack < 86400) crackTimeText = `${Math.round(secondsToCrack / 3600)} hours`;
  else if (secondsToCrack < 31536000) crackTimeText = `${Math.round(secondsToCrack / 86400)} days`;
  else if (secondsToCrack < 31536000 * 100) crackTimeText = `${Math.round(secondsToCrack / 31536000)} years`;
  else if (secondsToCrack < 31536000 * 1000000) crackTimeText = 'Centuries';
  else crackTimeText = 'Eons (Unhackable)';

  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push('Increase length to at least 12 characters.');
  if (!hasUppercase) suggestions.push('Include uppercase letters (A-Z).');
  if (!hasLowercase) suggestions.push('Include lowercase letters (a-z).');
  if (!hasNumbers) suggestions.push('Include numbers (0-9).');
  if (!hasSymbols) suggestions.push('Include special symbols (!@#$).');

  return {
    score,
    label,
    color,
    crackTimeText,
    suggestions,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
    isLongEnough,
  };
}
