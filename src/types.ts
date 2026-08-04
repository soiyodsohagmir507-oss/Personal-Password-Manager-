export type CategoryType =
  | 'Gmail'
  | 'Facebook'
  | 'Instagram'
  | 'X (Twitter)'
  | 'LinkedIn'
  | 'GitHub'
  | 'Microsoft'
  | 'Apple'
  | 'Banking'
  | 'Hosting'
  | 'Domain'
  | 'Shopping'
  | 'Entertainment'
  | 'Gaming'
  | 'Work'
  | 'General'
  | string;

export interface PasswordHistoryItem {
  id: string;
  password: string; // Decrypted at runtime in session
  changedAt: string;
}

export interface CredentialAccount {
  id: string;
  websiteName: string;
  websiteUrl: string;
  username: string;
  email: string;
  phoneNumber?: string;
  password: string; // Plaintext when in decrypted session memory
  notes?: string;
  category: CategoryType;
  tags: string[];
  isFavorite: boolean;
  isTrash: boolean;
  deletedAt?: string;
  createdDate: string;
  updatedDate: string;
  passwordHistory?: PasswordHistoryItem[];
  // Calculated properties for auditor
  strengthScore?: number; // 0 to 100
  strengthLabel?: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Ultra';
  isDuplicate?: boolean;
}

export interface UserSettings {
  autoLockMinutes: number; // 1, 5, 15, 30, 0 (never)
  language: 'bn' | 'en';
  theme: 'dark' | 'light';
  twoFactorEnabled: boolean;
  twoFactorCode?: string | null;
  autoClearClipboardSeconds: number; // 10, 30, 60, 0
}

export interface EncryptedVaultData {
  isConfigured: boolean;
  masterPasswordHash: string | null; // PBKDF2 hash of master password
  recoveryKeyHash: string | null;
  salt: string | null;
  encryptedAccountsBlob: string | null; // AES-256-GCM encrypted payload of CredentialAccount[]
  encryptedAccountsBlobForRecovery?: string | null; // AES-256-GCM encrypted payload with recovery key
  customCategories: string[];
  settings: UserSettings;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  category: 'auth' | 'account' | 'security' | 'backup' | 'system';
  timestamp: string;
}

export interface PasswordGeneratorOptions {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
  mode: 'random' | 'passphrase';
  wordCount?: number;
  wordSeparator?: string;
}

export interface PasswordStrengthResult {
  score: number; // 0-100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Ultra';
  color: string;
  crackTimeText: string;
  suggestions: string[];
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  isLongEnough: boolean;
}
