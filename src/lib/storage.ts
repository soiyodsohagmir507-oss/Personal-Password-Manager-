import { EncryptedVaultData, ActivityLog } from '../types';
import {
  fetchUserVaultData,
  saveUserVaultData,
  fetchUserActivityLogs,
  addUserActivityLog,
  clearUserActivityLogs,
  auth
} from './firebase';

function getEffectiveUid(userId?: string): string | null {
  if (userId) return userId;
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  try {
    const raw = localStorage.getItem('current_local_vault_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) return parsed.uid;
    }
  } catch (e) {}
  return null;
}

export async function fetchVaultData(userId?: string): Promise<EncryptedVaultData> {
  const uid = getEffectiveUid(userId);

  if (uid) {
    // Attempt Firestore load for authenticated user
    const firestoreVault = await fetchUserVaultData(uid);
    if (firestoreVault && firestoreVault.isConfigured) {
      try {
        localStorage.setItem(`vault_data_backup_${uid}`, JSON.stringify(firestoreVault));
      } catch (e) {
        console.error('Error caching vault locally:', e);
      }
      return firestoreVault;
    }

    // Check local storage backup for this specific user
    try {
      const local = localStorage.getItem(`vault_data_backup_${uid}`);
      if (local) {
        const parsed: EncryptedVaultData = JSON.parse(local);
        if (parsed && parsed.isConfigured) {
          saveUserVaultData(uid, parsed).catch(() => {});
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading user local backup:', e);
    }
  }

  // Fallback to server API if no user or first time
  let serverData: EncryptedVaultData | null = null;
  try {
    const res = await fetch('/api/vault');
    if (res.ok) {
      serverData = await res.json();
    }
  } catch (err) {
    console.error('Error loading vault data from server:', err);
  }

  return serverData || {
    isConfigured: false,
    masterPasswordHash: null,
    recoveryKeyHash: null,
    salt: null,
    encryptedAccountsBlob: null,
    customCategories: [],
    settings: {
      autoLockMinutes: 5,
      language: 'bn',
      theme: 'dark',
      twoFactorEnabled: false,
      twoFactorCode: null,
      autoClearClipboardSeconds: 30,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function saveVaultData(vault: EncryptedVaultData, userId?: string): Promise<boolean> {
  const uid = getEffectiveUid(userId);

  if (uid) {
    try {
      localStorage.setItem(`vault_data_backup_${uid}`, JSON.stringify(vault));
    } catch (e) {
      console.error('Error writing local user backup:', e);
    }
    return await saveUserVaultData(uid, vault);
  }

  // Fallback to server API
  try {
    localStorage.setItem('vault_data_backup', JSON.stringify(vault));
  } catch (e) {
    console.error('Error writing local vault backup:', e);
  }

  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vault),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving vault data to server:', err);
    return false;
  }
}

export async function fetchActivityLogs(userId?: string): Promise<ActivityLog[]> {
  const uid = getEffectiveUid(userId);
  if (uid) {
    return await fetchUserActivityLogs(uid);
  }
  try {
    const res = await fetch('/api/logs');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function recordActivityLog(
  action: string,
  details = '',
  category: 'auth' | 'account' | 'security' | 'backup' | 'system' = 'system',
  userId?: string
) {
  const uid = getEffectiveUid(userId);
  if (uid) {
    await addUserActivityLog(uid, action, details, category);
    return;
  }
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, category }),
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

export async function clearActivityLogs(userId?: string): Promise<boolean> {
  const uid = getEffectiveUid(userId);
  if (uid) {
    return await clearUserActivityLogs(uid);
  }
  try {
    const res = await fetch('/api/logs', { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export function getWebsiteFaviconUrl(urlOrDomain: string): string {
  if (!urlOrDomain) return '';
  let domain = urlOrDomain.trim();
  try {
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      domain = 'https://' + domain;
    }
    const parsed = new URL(domain);
    domain = parsed.hostname;
  } catch {
    domain = domain.replace(/^https?:\/\//, '').split('/')[0];
  }
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}
