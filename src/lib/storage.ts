import { EncryptedVaultData, ActivityLog } from '../types';

export async function fetchVaultData(): Promise<EncryptedVaultData> {
  let serverData: EncryptedVaultData | null = null;
  try {
    const res = await fetch('/api/vault');
    if (res.ok) {
      serverData = await res.json();
    }
  } catch (err) {
    console.error('Error loading vault data from server:', err);
  }

  // If server has configured vault data, cache in localStorage and return
  if (serverData && serverData.isConfigured) {
    try {
      localStorage.setItem('vault_data_backup', JSON.stringify(serverData));
    } catch (e) {
      console.error('Error writing local vault backup:', e);
    }
    return serverData;
  }

  // Fallback to local storage if server is unconfigured or unavailable
  try {
    const local = localStorage.getItem('vault_data_backup');
    if (local) {
      const parsed: EncryptedVaultData = JSON.parse(local);
      if (parsed && parsed.isConfigured) {
        // Automatically re-sync server in background
        saveVaultData(parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local vault backup:', e);
  }

  // Default empty vault config
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

export async function saveVaultData(vault: EncryptedVaultData): Promise<boolean> {
  // Save to localStorage immediately
  try {
    localStorage.setItem('vault_data_backup', JSON.stringify(vault));
  } catch (e) {
    console.error('Error writing local vault backup:', e);
  }

  // Sync to server endpoint
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

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
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
  category: 'auth' | 'account' | 'security' | 'backup' | 'system' = 'system'
) {
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

export async function clearActivityLogs(): Promise<boolean> {
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
