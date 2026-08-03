import { EncryptedVaultData, ActivityLog } from '../types';

export async function fetchVaultData(): Promise<EncryptedVaultData> {
  try {
    const res = await fetch('/api/vault');
    if (!res.ok) throw new Error('Failed to fetch vault from server');
    return await res.json();
  } catch (err) {
    console.error('Error loading vault data:', err);
    // Return empty fallback
    return {
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
}

export async function saveVaultData(vault: EncryptedVaultData): Promise<boolean> {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vault),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving vault data:', err);
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
