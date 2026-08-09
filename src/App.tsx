import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
  Layers,
  Star,
  ShieldAlert,
  Trash2,
  Sparkles,
  KeyRound,
  Download,
  Sliders,
  History,
  Grid,
  List,
  Folder,
  Tag,
} from 'lucide-react';

import {
  CredentialAccount,
  EncryptedVaultData,
  UserSettings,
  CategoryType,
} from './types';
import {
  fetchVaultData,
  saveVaultData,
  recordActivityLog,
} from './lib/storage';
import {
  encryptData,
  decryptData,
  evaluatePasswordStrength,
  generateSalt,
  generateRecoveryKey,
  hashString,
  deriveKey,
} from './lib/crypto';
import { t } from './lib/i18n';

// Components
import { MasterPasswordModal } from './components/MasterPasswordModal';
import { AuthModal } from './components/AuthModal';
import { onAuthUserChanged, logoutUser, emailToUsername, auth, VaultUser } from './lib/firebase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CredentialCard } from './components/CredentialCard';
import { AddEditModal } from './components/AddEditModal';
import { CredentialDetailModal } from './components/CredentialDetailModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { SecurityAuditView } from './components/SecurityAuditView';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { TrashBinView } from './components/TrashBinView';
import { ActivityLogModal } from './components/ActivityLogModal';
import { SettingsModal } from './components/SettingsModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { RecoveryKeyShowModal } from './components/RecoveryKeyShowModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const PRESET_CATEGORIES: string[] = [
  'Gmail',
  'Facebook',
  'Instagram',
  'X (Twitter)',
  'LinkedIn',
  'GitHub',
  'Microsoft',
  'Apple',
  'Banking',
  'Hosting',
  'Domain',
  'Shopping',
  'Entertainment',
  'Gaming',
  'Work',
  'General',
];

export default function App() {
  // Auth State
  const [authUser, setAuthUser] = useState<VaultUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Vault Meta State
  const [vaultConfig, setVaultConfig] = useState<EncryptedVaultData | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [masterPasswordPlain, setMasterPasswordPlain] = useState('');
  const [dek, setDek] = useState<string | null>(null);
  const [dekKey, setDekKey] = useState<CryptoKey | null>(null);

  // Unencrypted Session Data
  const [accounts, setAccounts] = useState<CredentialAccount[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    autoLockMinutes: 5,
    language: 'bn',
    theme: 'dark',
    twoFactorEnabled: false,
    twoFactorCode: null,
    autoClearClipboardSeconds: 30,
  });

  // UI Filtering & Views
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'a-z' | 'z-a' | 'newest' | 'updated'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Derived custom categories combined from explicit customCategories state + any categories found in stored accounts
  const allCustomCategories = useMemo(() => {
    const set = new Set(customCategories);
    accounts.forEach((acc) => {
      if (acc.category && !PRESET_CATEGORIES.includes(acc.category)) {
        set.add(acc.category);
      }
    });
    return Array.from(set);
  }, [customCategories, accounts]);

  // Modals Visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<CredentialAccount | null>(null);
  const [selectedDetailAccount, setSelectedDetailAccount] = useState<CredentialAccount | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeRecoveryKey, setActiveRecoveryKey] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Load & Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      if (user) {
        const data = await fetchVaultData(user.uid);
        setVaultConfig(data);
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.customCategories) {
          setCustomCategories(data.customCategories);
        }
        setIsLocked(true);
      } else {
        setVaultConfig(null);
        setAccounts([]);
        setCryptoKey(null);
        setIsLocked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setAuthUser(null);
    setVaultConfig(null);
    setAccounts([]);
    setCryptoKey(null);
    setIsLocked(true);
    addToast('Logged out successfully', 'info');
  };

  // Keyboard shortcut for Quick Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save vault data to server whenever accounts / customCategories / settings change in decrypted state
  const syncVaultToServer = async (
    updatedAccounts: CredentialAccount[],
    updatedCategories = customCategories,
    updatedSettings = settings
  ) => {
    if (!vaultConfig) return;
    const activeEncryptionKey = dekKey || cryptoKey;
    if (!activeEncryptionKey) return;

    try {
      const encryptedBlob = await encryptData(updatedAccounts, activeEncryptionKey);
      const newVault: EncryptedVaultData = {
        ...vaultConfig,
        isConfigured: true,
        encryptedAccountsBlob: encryptedBlob,
        customCategories: updatedCategories,
        settings: updatedSettings,
        updatedAt: new Date().toISOString(),
      };

      setVaultConfig(newVault);
      await saveVaultData(newVault);
    } catch (err) {
      console.error('Failed to sync vault to server:', err);
      addToast('Sync failed', 'error');
    }
  };

  // 2. Unlock Vault Callback
  const handleUnlockSuccess = async (key: CryptoKey, masterPassPlain: string) => {
    setCryptoKey(key);
    setMasterPasswordPlain(masterPassPlain);

    if (vaultConfig && vaultConfig.encryptedAccountsBlob) {
      try {
        let activeDek = dek;
        let activeDekKey = dekKey;
        let decryptedAccounts: CredentialAccount[] = [];

        if (vaultConfig.encryptedDEKByMaster) {
          activeDek = await decryptData(vaultConfig.encryptedDEKByMaster, key);
          if (activeDek && vaultConfig.salt) {
            activeDekKey = await deriveKey(activeDek, vaultConfig.salt);
            decryptedAccounts = await decryptData(vaultConfig.encryptedAccountsBlob, activeDekKey);
          }
        } else {
          // Legacy vault without DEK
          decryptedAccounts = await decryptData(vaultConfig.encryptedAccountsBlob, key);
          if (vaultConfig.salt) {
            activeDek = generateSalt(32);
            activeDekKey = await deriveKey(activeDek, vaultConfig.salt);
            const newAccountsBlob = await encryptData(decryptedAccounts || [], activeDekKey);
            const newEncryptedDEKByMaster = await encryptData(activeDek, key);

            const upgradedVault: EncryptedVaultData = {
              ...vaultConfig,
              encryptedAccountsBlob: newAccountsBlob,
              encryptedDEKByMaster: newEncryptedDEKByMaster,
            };
            setVaultConfig(upgradedVault);
            saveVaultData(upgradedVault);
          }
        }

        setDek(activeDek);
        setDekKey(activeDekKey);
        setAccounts(decryptedAccounts || []);
      } catch (err) {
        console.error('Decryption failed:', err);
        addToast('Decryption error: Check master password', 'error');
        return;
      }
    } else {
      setAccounts([]);
    }

    setIsLocked(false);
    recordActivityLog('Vault Unlocked', 'Master Password authenticated', 'auth');
    addToast('Vault unlocked successfully', 'success');
  };

  // 3. First Time Setup Callback
  const handleInitialSetup = async (
    masterHash: string,
    recoveryHash: string,
    salt: string,
    key: CryptoKey,
    recoveryKey: string,
    masterPassPlain: string
  ) => {
    const newDek = generateSalt(32);
    const recCryptoKey = await deriveKey(recoveryKey, salt);
    const newDekKey = await deriveKey(newDek, salt);

    const encryptedDEKByMaster = await encryptData(newDek, key);
    const encryptedDEKByRecovery = await encryptData(newDek, recCryptoKey);
    const encryptedAccountsBlob = await encryptData([], newDekKey);

    const newVault: EncryptedVaultData = {
      isConfigured: true,
      masterPasswordHash: masterHash,
      recoveryKeyHash: recoveryHash,
      salt: salt,
      encryptedAccountsBlob,
      encryptedAccountsBlobForRecovery: encryptedAccountsBlob,
      encryptedDEKByMaster,
      encryptedDEKByRecovery,
      customCategories: [],
      settings,
      updatedAt: new Date().toISOString(),
    };

    setVaultConfig(newVault);
    setDek(newDek);
    setDekKey(newDekKey);
    setIsLocked(true); // Keep vault locked so user enters Master Password on Vault Login page
    await saveVaultData(newVault);
    recordActivityLog('Vault Initialized', 'First-time master password configured', 'auth');
    addToast(
      settings.language === 'bn'
        ? 'ভল্ট সফলভাবে তৈরি হয়েছে! এবার মাস্টার পাসওয়ার্ড দিয়ে ভল্ট লগইন করুন।'
        : 'Vault created! Please enter your Master Password on the Vault Login page.',
      'success'
    );
  };

  // 3b. Master Password Reset Callback (via Recovery Key)
  const handleResetMasterPassword = async (
    masterHash: string,
    recoveryHash: string,
    salt: string,
    key: CryptoKey,
    recoveryKey: string,
    masterPassPlain: string,
    recoveredAccountsList: CredentialAccount[],
    recoveredDEKStr?: string | null
  ) => {
    const accountsToKeep = recoveredAccountsList.length > 0 ? recoveredAccountsList : accounts;
    const activeDek = recoveredDEKStr || dek || generateSalt(32);
    const activeDekKey = await deriveKey(activeDek, salt);

    const newEncryptedDEKByMaster = await encryptData(activeDek, key);
    const newAccountsBlob = await encryptData(accountsToKeep, activeDekKey);

    let newEncryptedDEKByRecovery = vaultConfig?.encryptedDEKByRecovery || null;
    if (recoveryKey) {
      const recCryptoKey = await deriveKey(recoveryKey, salt);
      newEncryptedDEKByRecovery = await encryptData(activeDek, recCryptoKey);
    }

    const updatedVault: EncryptedVaultData = {
      ...vaultConfig,
      isConfigured: true,
      masterPasswordHash: masterHash,
      recoveryKeyHash: recoveryHash || vaultConfig?.recoveryKeyHash || null,
      salt: salt,
      encryptedAccountsBlob: newAccountsBlob,
      encryptedAccountsBlobForRecovery: newAccountsBlob,
      encryptedDEKByMaster: newEncryptedDEKByMaster,
      encryptedDEKByRecovery: newEncryptedDEKByRecovery,
      updatedAt: new Date().toISOString(),
    };

    setVaultConfig(updatedVault);
    setDek(activeDek);
    setDekKey(activeDekKey);
    setAccounts(accountsToKeep);
    setIsLocked(true); // Keep vault locked so user enters Master Password on Vault Login page
    await saveVaultData(updatedVault);
    recordActivityLog('Vault Password Reset', 'Master password reset via recovery key', 'security');
    addToast(
      settings.language === 'bn'
        ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এবার নতুন মাস্টার পাসওয়ার্ড দিয়ে ভল্ট লগইন করুন।'
        : 'Master password reset successfully! Please log in with your new password.',
      'success'
    );
  };

  // 4. Vault Authentication Handler
  const handleAuthSuccess = async (accountPassword: string) => {
    const activeUid = authUser?.uid || auth.currentUser?.uid;
    if (!activeUid) return;
    const data = await fetchVaultData(activeUid);
    setVaultConfig(data);
    setIsLocked(true); // Always require Vault unlock/login
  };

  // Lock Vault
  const handleLockVault = () => {
    setIsLocked(true);
    setCryptoKey(null);
    setMasterPasswordPlain('');
    setAccounts([]);
    recordActivityLog('Vault Locked', 'User locked session', 'auth');
  };

  // Account Operations
  const handleSaveAccount = (accountData: Partial<CredentialAccount>) => {
    let updatedList: CredentialAccount[] = [];

    if (accountData.id) {
      // Editing existing account
      updatedList = accounts.map((acc) => {
        if (acc.id === accountData.id) {
          const history = acc.passwordHistory || [];
          if (accountData.password && accountData.password !== acc.password) {
            history.unshift({
              id: `h_${Date.now()}`,
              password: acc.password,
              changedAt: new Date().toISOString(),
            });
          }
          return {
            ...acc,
            ...accountData,
            passwordHistory: history,
            updatedDate: new Date().toISOString(),
          } as CredentialAccount;
        }
        return acc;
      });
      addToast('Account updated!', 'success');
      recordActivityLog('Updated Account', accountData.websiteName || '', 'account');
    } else {
      // Create new account
      const newAcc: CredentialAccount = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        websiteName: accountData.websiteName || 'Untitled',
        websiteUrl: accountData.websiteUrl || '',
        username: accountData.username || '',
        email: accountData.email || '',
        phoneNumber: accountData.phoneNumber || '',
        password: accountData.password || '',
        notes: accountData.notes || '',
        category: accountData.category || 'General',
        tags: accountData.tags || [],
        isFavorite: !!accountData.isFavorite,
        isTrash: false,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        passwordHistory: [],
      };
      updatedList = [newAcc, ...accounts];
      addToast('New account added!', 'success');
      recordActivityLog('Created Account', newAcc.websiteName, 'account');
    }

    setAccounts(updatedList);

    const savedCat = accountData.category;
    let updatedCategories = customCategories;
    if (savedCat && !PRESET_CATEGORIES.includes(savedCat) && !customCategories.includes(savedCat)) {
      updatedCategories = [...customCategories, savedCat];
      setCustomCategories(updatedCategories);
    }

    syncVaultToServer(updatedList, updatedCategories);
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, isFavorite: !acc.isFavorite };
      }
      return acc;
    });
    setAccounts(updated);
    syncVaultToServer(updated);
  };

  const handleDeleteAccount = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, isTrash: true, deletedAt: new Date().toISOString() };
      }
      return acc;
    });
    setAccounts(updated);
    syncVaultToServer(updated);
    addToast('Account moved to Trash', 'info');
    recordActivityLog('Moved to Trash', id, 'account');
  };

  const handleRestoreAccount = (id: string) => {
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, isTrash: false, deletedAt: undefined };
      }
      return acc;
    });
    setAccounts(updated);
    syncVaultToServer(updated);
    addToast('Account restored!', 'success');
  };

  const handlePermanentDelete = (id: string) => {
    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    syncVaultToServer(updated);
    addToast('Permanently deleted', 'info');
  };

  const handleEmptyTrash = () => {
    const updated = accounts.filter((acc) => !acc.isTrash);
    setAccounts(updated);
    syncVaultToServer(updated);
    addToast('Trash bin emptied', 'info');
  };

  const handleImportAccounts = (imported: CredentialAccount[]) => {
    const existingIds = new Set(accounts.map((a) => a.id));
    const merged = [...accounts];

    imported.forEach((item) => {
      if (!existingIds.has(item.id)) {
        merged.push(item);
      } else {
        // Re-assign new ID to avoid conflict
        merged.push({
          ...item,
          id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        });
      }
    });

    setAccounts(merged);
    syncVaultToServer(merged);
    recordActivityLog('Imported Backup', `${imported.length} items imported`, 'backup');
  };

  // Category counts computation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.forEach((acc) => {
      if (!acc.isTrash) {
        counts[acc.category] = (counts[acc.category] || 0) + 1;
      }
    });
    return counts;
  }, [accounts]);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isTrash), [accounts]);
  const trashAccounts = useMemo(() => accounts.filter((a) => a.isTrash), [accounts]);
  const favoriteAccounts = useMemo(() => activeAccounts.filter((a) => a.isFavorite), [activeAccounts]);

  // Security Issue Counts for badge
  const securityIssueCount = useMemo(() => {
    let weak = 0;
    const passMap = new Map<string, number>();
    activeAccounts.forEach((acc) => {
      const s = evaluatePasswordStrength(acc.password);
      if (s.score < 55) weak++;
      if (acc.password) passMap.set(acc.password, (passMap.get(acc.password) || 0) + 1);
    });
    let dups = 0;
    passMap.forEach((cnt) => {
      if (cnt > 1) dups += cnt;
    });
    return weak + dups;
  }, [activeAccounts]);

  // Filtered & Sorted accounts list for active main view
  const filteredAccounts = useMemo(() => {
    let list = activeAccounts;

    if (selectedCategory === 'FAVORITES') {
      list = list.filter((a) => a.isFavorite);
    } else if (selectedCategory !== 'ALL' && selectedCategory !== 'AUDIT' && selectedCategory !== 'TRASH') {
      list = list.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.websiteName.toLowerCase().includes(q) ||
          a.websiteUrl.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.phoneNumber && a.phoneNumber.toLowerCase().includes(q)) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (sortBy === 'a-z') return a.websiteName.localeCompare(b.websiteName);
      if (sortBy === 'z-a') return b.websiteName.localeCompare(a.websiteName);
      if (sortBy === 'newest') return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      if (sortBy === 'updated') return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
      return 0;
    });
  }, [activeAccounts, selectedCategory, searchQuery, sortBy]);

  // Clipboard copy helpers
  const handleCopyUsername = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast(t(settings.language, 'usernameCopied'), 'success');
  };

  const handleCopyPassword = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast(t(settings.language, 'passwordCopied'), 'success');

    if (settings.autoClearClipboardSeconds > 0) {
      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, settings.autoClearClipboardSeconds * 1000);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white ${settings.theme}`}>
      {/* Toast Overlay */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* RECOVERY KEY SHOW MODAL ON NEW ACCOUNT CREATION */}
      {activeRecoveryKey && (
        <RecoveryKeyShowModal
          recoveryKey={activeRecoveryKey}
          language={settings.language}
          onClose={() => setActiveRecoveryKey(null)}
        />
      )}

      {/* AUTH SCREEN (LOGIN / SIGNUP) */}
      {!authLoading && !authUser && (
        <AuthModal
          language={settings.language}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* MASTER PASSWORD AUTH / SETUP SCREEN */}
      {authUser && isLocked && vaultConfig && (
        <MasterPasswordModal
          isConfigured={vaultConfig.isConfigured}
          masterPasswordHash={vaultConfig.masterPasswordHash}
          recoveryKeyHash={vaultConfig.recoveryKeyHash}
          salt={vaultConfig.salt}
          encryptedAccountsBlob={vaultConfig.encryptedAccountsBlob}
          encryptedAccountsBlobForRecovery={vaultConfig.encryptedAccountsBlobForRecovery || null}
          twoFactorEnabled={settings.twoFactorEnabled}
          twoFactorCode={settings.twoFactorCode}
          language={settings.language}
          onUnlockSuccess={handleUnlockSuccess}
          onInitialSetup={handleInitialSetup}
          onResetPassword={handleResetMasterPassword}
        />
      )}

      {/* MAIN UNLOCKED APPLICATION INTERFACE */}
      {authUser && !isLocked && (
        <div className="flex flex-col min-h-screen">
          {/* Header Bar */}
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            language={settings.language}
            theme={settings.theme}
            autoLockMinutes={settings.autoLockMinutes}
            weakCount={securityIssueCount}
            duplicateCount={0}
            userEmail={authUser.email}
            onLogout={handleLogout}
            onToggleLanguage={() => {
              const lang = settings.language === 'bn' ? 'en' : 'bn';
              const newSettings = { ...settings, language: lang as 'bn' | 'en' };
              setSettings(newSettings);
              syncVaultToServer(accounts, customCategories, newSettings);
            }}
            onToggleTheme={() => {
              const theme = settings.theme === 'dark' ? 'light' : 'dark';
              const newSettings = { ...settings, theme: theme as 'dark' | 'light' };
              setSettings(newSettings);
              syncVaultToServer(accounts, customCategories, newSettings);
            }}
            onLockVault={handleLockVault}
            onOpenAddModal={() => {
              setAccountToEdit(null);
              setIsAddModalOpen(true);
            }}
            onOpenGenerator={() => setIsGeneratorModalOpen(true)}
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenAudit={() => setSelectedCategory('AUDIT')}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          {/* Main Layout Area */}
          <div className="flex flex-1">
            {/* Sidebar Navigation */}
            <Sidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
              totalAccounts={activeAccounts.length}
              favoriteCount={favoriteAccounts.length}
              trashCount={trashAccounts.length}
              securityIssueCount={securityIssueCount}
              language={settings.language}
              customCategories={allCustomCategories}
              onOpenGenerator={() => setIsGeneratorModalOpen(true)}
              onOpenBackup={() => setIsBackupModalOpen(true)}
              onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
              onOpenAudit={() => setSelectedCategory('AUDIT')}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Dashboard Workspace */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto bg-[#0A0C10]">
              {/* Top Glass Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="glass p-5 rounded-2xl">
                  <div className="text-xs text-slate-500 mb-1 font-medium">{t(settings.language, 'totalAccounts')}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">{activeAccounts.length}</div>
                </div>
                <div className="glass p-5 rounded-2xl">
                  <div className="text-xs text-slate-500 mb-1 font-medium">{t(settings.language, 'favorites')}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">{favoriteAccounts.length}</div>
                </div>
                <div className="glass p-5 rounded-2xl">
                  <div className="text-xs text-slate-500 mb-1 font-medium">Security Issues</div>
                  <div className={`text-2xl sm:text-3xl font-bold ${securityIssueCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {securityIssueCount < 10 ? `0${securityIssueCount}` : securityIssueCount}
                  </div>
                </div>
                <div className="glass p-5 rounded-2xl">
                  <div className="text-xs text-slate-500 mb-1 font-medium">Master Auth</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
                    <span className="status-dot status-secure"></span>
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* VIEW 1: SECURITY AUDIT VIEW */}
              {selectedCategory === 'AUDIT' && (
                <SecurityAuditView
                  accounts={accounts}
                  language={settings.language}
                  onEditAccount={(acc) => {
                    setAccountToEdit(acc);
                    setIsAddModalOpen(true);
                  }}
                />
              )}

              {/* VIEW 2: TRASH BIN VIEW */}
              {selectedCategory === 'TRASH' && (
                <TrashBinView
                  trashAccounts={trashAccounts}
                  language={settings.language}
                  onRestore={handleRestoreAccount}
                  onPermanentDelete={handlePermanentDelete}
                  onEmptyTrash={handleEmptyTrash}
                />
              )}

              {/* VIEW 3: MAIN CREDENTIALS GRID/LIST */}
              {selectedCategory !== 'AUDIT' && selectedCategory !== 'TRASH' && (
                <div className="space-y-5">
                  {/* Category Top Bar Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass p-4 rounded-2xl">
                    <div>
                      <h2 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                        <span>
                          {selectedCategory === 'ALL'
                            ? t(settings.language, 'totalAccounts')
                            : selectedCategory === 'FAVORITES'
                            ? t(settings.language, 'favorites')
                            : selectedCategory}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-semibold border border-blue-500/30">
                          {filteredAccounts.length}
                        </span>
                      </h2>
                    </div>

                    {/* Sorting & Layout Toggles */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Category Dropdown Filter */}
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-slate-300">
                        <Filter className="w-3.5 h-3.5 text-blue-400" />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="bg-transparent focus:outline-none cursor-pointer text-xs"
                        >
                          <option value="ALL" className="bg-[#0D1117]">
                            {settings.language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}
                          </option>
                          <option value="FAVORITES" className="bg-[#0D1117]">
                            {settings.language === 'bn' ? 'প্রিয় (Favorites)' : 'Favorites'}
                          </option>
                          <optgroup label={settings.language === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Categories'} className="bg-[#0D1117]">
                            {PRESET_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="bg-[#0D1117]">
                                {cat} ({categoryCounts[cat] || 0})
                              </option>
                            ))}
                          </optgroup>
                          {allCustomCategories.length > 0 && (
                            <optgroup label={settings.language === 'bn' ? 'কাস্টম ক্যাটাগরি' : 'Custom Categories'} className="bg-[#0D1117]">
                              {allCustomCategories.map((cat) => (
                                <option key={cat} value={cat} className="bg-[#0D1117]">
                                  {cat} ({categoryCounts[cat] || 0})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-slate-300">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={sortBy}
                          onChange={(e: any) => setSortBy(e.target.value)}
                          className="bg-transparent focus:outline-none cursor-pointer text-xs"
                        >
                          <option value="newest" className="bg-[#0D1117]">Newest First</option>
                          <option value="a-z" className="bg-[#0D1117]">A - Z</option>
                          <option value="z-a" className="bg-[#0D1117]">Z - A</option>
                          <option value="updated" className="bg-[#0D1117]">Last Updated</option>
                        </select>
                      </div>

                      {/* View Mode Switch */}
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1 rounded-lg transition ${
                            viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Grid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1 rounded-lg transition ${
                            viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Quick Category Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        selectedCategory === 'ALL'
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30 font-semibold'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{settings.language === 'bn' ? 'সকল' : 'All'}</span>
                      <span className="opacity-75 font-mono text-[10px]">({activeAccounts.length})</span>
                    </button>

                    <button
                      onClick={() => setSelectedCategory('FAVORITES')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        selectedCategory === 'FAVORITES'
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30 font-semibold'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{t(settings.language, 'favorites')}</span>
                      <span className="opacity-75 font-mono text-[10px]">({favoriteAccounts.length})</span>
                    </button>

                    {/* All Categories Pills */}
                    {[...PRESET_CATEGORIES, ...allCustomCategories]
                      .filter((cat, idx, self) => self.indexOf(cat) === idx)
                      .filter((cat) => (categoryCounts[cat] || 0) > 0 || selectedCategory === cat || allCustomCategories.includes(cat))
                      .map((cat) => {
                        const count = categoryCounts[cat] || 0;
                        const isSelected = selectedCategory === cat;
                        const isCustom = allCustomCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30 font-semibold'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                            }`}
                          >
                            {isCustom ? <Folder className="w-3.5 h-3.5 text-blue-400" /> : <Tag className="w-3.5 h-3.5 opacity-60" />}
                            <span>{cat}</span>
                            <span className="opacity-75 font-mono text-[10px]">({count})</span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Empty Vault State */}
                  {filteredAccounts.length === 0 ? (
                    <div className="p-12 text-center glass rounded-2xl text-slate-400 space-y-3">
                      <ShieldCheck className="w-12 h-12 text-blue-400/60 mx-auto" />
                      <h3 className="font-semibold text-slate-200">{t(settings.language, 'noAccountsFound')}</h3>
                      <p className="text-xs max-w-sm mx-auto">
                        {settings.language === 'bn'
                          ? 'নতুন কোনো অ্যাকাউন্ট যুক্ত করার জন্য উপরের "+ Add Account" বাটনে ক্লিক করুন।'
                          : 'Click "+ Add Account" to save credentials securely in your vault.'}
                      </p>
                      <button
                        onClick={() => {
                          setAccountToEdit(null);
                          setIsAddModalOpen(true);
                        }}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition"
                      >
                        + Add Account
                      </button>
                    </div>
                  ) : (
                    /* Account Cards Grid or List */
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                          : 'space-y-3'
                      }
                    >
                      <AnimatePresence>
                        {filteredAccounts.map((acc) => (
                          <CredentialCard
                            key={acc.id}
                            account={acc}
                            language={settings.language}
                            onSelect={setSelectedDetailAccount}
                            onToggleFavorite={handleToggleFavorite}
                            onCopyUsername={handleCopyUsername}
                            onCopyPassword={handleCopyPassword}
                            onDelete={handleDeleteAccount}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* ALL MODALS */}
      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAccountToEdit(null);
        }}
        onSave={handleSaveAccount}
        accountToEdit={accountToEdit}
        presetCategory={selectedCategory}
        customCategories={allCustomCategories}
        language={settings.language}
        onOpenGeneratorModal={() => setIsGeneratorModalOpen(true)}
      />

      <CredentialDetailModal
        account={selectedDetailAccount}
        isOpen={!!selectedDetailAccount}
        onClose={() => setSelectedDetailAccount(null)}
        language={settings.language}
        onEdit={(acc) => {
          setAccountToEdit(acc);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteAccount}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        onCopyUsername={handleCopyUsername}
        onCopyPassword={handleCopyPassword}
      />

      <PasswordGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        language={settings.language}
        onCopyToast={(msg) => addToast(msg, 'success')}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        accounts={accounts}
        masterPasswordKey={cryptoKey}
        masterPasswordPlain={masterPasswordPlain}
        language={settings.language}
        onImportAccounts={handleImportAccounts}
        onToast={addToast}
      />

      <ActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        language={settings.language}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        language={settings.language}
        theme={settings.theme}
        salt={vaultConfig?.salt || null}
        recoveryKeyHash={vaultConfig?.recoveryKeyHash || null}
        masterPasswordPlain={masterPasswordPlain}
        customCategories={customCategories}
        onUpdateSettings={(newSet) => {
          const updated = { ...settings, ...newSet };
          setSettings(updated);
          syncVaultToServer(accounts, customCategories, updated);
          addToast('Settings updated', 'success');
        }}
        onUpdateMasterPassword={(newHash, newSalt, newKey, newPlain) => {
          setCryptoKey(newKey);
          setMasterPasswordPlain(newPlain);
          if (vaultConfig) {
            const updatedVault = {
              ...vaultConfig,
              masterPasswordHash: newHash,
              salt: newSalt,
            };
            setVaultConfig(updatedVault);
            saveVaultData(updatedVault);
          }
        }}
        onAddCustomCategory={(cName) => {
          if (!customCategories.includes(cName)) {
            const updated = [...customCategories, cName];
            setCustomCategories(updated);
            syncVaultToServer(accounts, updated, settings);
            addToast(`Category "${cName}" added`, 'success');
          }
        }}
        onDeleteCustomCategory={(cName) => {
          const updated = customCategories.filter((c) => c !== cName);
          setCustomCategories(updated);
          syncVaultToServer(accounts, updated, settings);
        }}
        onToast={addToast}
      />

      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        accounts={accounts}
        onSelectAccount={setSelectedDetailAccount}
      />
    </div>
  );
}
