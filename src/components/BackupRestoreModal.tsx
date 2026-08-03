import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { CredentialAccount } from '../types';
import { encryptData, decryptData, deriveKey, generateSalt } from '../lib/crypto';
import { t } from '../lib/i18n';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: CredentialAccount[];
  masterPasswordKey: CryptoKey | null;
  masterPasswordPlain: string;
  language: 'bn' | 'en';
  onImportAccounts: (imported: CredentialAccount[]) => void;
  onToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  accounts,
  masterPasswordKey,
  masterPasswordPlain,
  language,
  onImportAccounts,
  onToast,
}) => {
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Export Encrypted JSON Backup
  const handleExportEncryptedBackup = async () => {
    try {
      setLoading(true);
      const pass = backupPassphrase || masterPasswordPlain;
      const salt = generateSalt(16);
      const exportKey = await deriveKey(pass, salt);

      const activeAccounts = accounts.filter((a) => !a.isTrash);
      const encryptedBlob = await encryptData(activeAccounts, exportKey);

      const backupData = {
        app: 'Personal Password Manager',
        version: '1.0',
        salt,
        createdAt: new Date().toISOString(),
        encryptedAccountsBlob: encryptedBlob,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      onToast(language === 'bn' ? 'ব্যাকআপ সফলভাবে ডাওনলোড হয়েছে!' : 'Backup exported successfully!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      onToast('Export failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export Unencrypted CSV
  const handleExportCSV = () => {
    if (
      !confirm(
        language === 'bn'
          ? 'সতর্কতা: CSV ফাইলে আপনার পাসওয়ার্ড সাধারণ টেক্সটে সংরক্ষিত হবে। আপনি কি নিশ্চিত?'
          : 'Warning: CSV files store passwords in plain cleartext! Are you sure you want to export?'
      )
    ) {
      return;
    }

    const headers = ['Website Name', 'Website URL', 'Username', 'Email', 'Password', 'Category', 'Notes'];
    const activeAccounts = accounts.filter((a) => !a.isTrash);

    const csvRows = [headers.join(',')];

    activeAccounts.forEach((acc) => {
      const row = [
        `"${(acc.websiteName || '').replace(/"/g, '""')}"`,
        `"${(acc.websiteUrl || '').replace(/"/g, '""')}"`,
        `"${(acc.username || '').replace(/"/g, '""')}"`,
        `"${(acc.email || '').replace(/"/g, '""')}"`,
        `"${(acc.password || '').replace(/"/g, '""')}"`,
        `"${(acc.category || '').replace(/"/g, '""')}"`,
        `"${(acc.notes || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvStr = csvRows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault_credentials_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    onToast('CSV exported', 'info');
  };

  // Import Backup JSON
  const handleImportFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setLoading(true);
    try {
      const fileText = await importFile.text();
      const parsedBackup = JSON.parse(fileText);

      if (!parsedBackup.encryptedAccountsBlob || !parsedBackup.salt) {
        onToast('Invalid backup file format', 'error');
        setLoading(false);
        return;
      }

      const pass = importPassphrase || masterPasswordPlain;
      const importKey = await deriveKey(pass, parsedBackup.salt);

      const decryptedAccounts: CredentialAccount[] = await decryptData(
        parsedBackup.encryptedAccountsBlob,
        importKey
      );

      if (Array.isArray(decryptedAccounts)) {
        onImportAccounts(decryptedAccounts);
        onToast(
          language === 'bn'
            ? `${decryptedAccounts.length} টি অ্যাকাউন্ট ইম্পোর্ট করা হয়েছে!`
            : `Imported ${decryptedAccounts.length} accounts successfully!`,
          'success'
        );
        onClose();
      } else {
        onToast('Failed to decrypt import data', 'error');
      }
    } catch (err) {
      console.error(err);
      onToast(language === 'bn' ? 'ভুল পাসওয়ার্ড বা ফাইল কারাপ্ট করা!' : 'Incorrect password or corrupted backup file!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass rounded-2xl p-6 shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{t(language, 'backupRestore')}</h2>
              <p className="text-xs text-slate-400">Encrypted export & restore system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs">
          {/* SECTION 1: EXPORT */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{t(language, 'exportBackup')}</span>
            </h3>
            <p className="text-slate-400">
              {language === 'bn'
                ? 'আপনার সম্পূর্ণ পাসওয়ার্ড ভল্ট AES-256 এনক্রিপ্ট করে ডাওনলোড করুন।'
                : 'Download an encrypted JSON file containing all your active accounts.'}
            </p>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Encryption Passphrase (Defaults to Master Password)
              </label>
              <input
                type="password"
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                placeholder="Optional custom passphrase"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportEncryptedBackup}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <FileJson className="w-4 h-4" />
                <span>Export Encrypted JSON</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: IMPORT */}
          <form onSubmit={handleImportFileSubmit} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>{t(language, 'importBackup')}</span>
            </h3>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Select JSON Backup File</label>
              <input
                type="file"
                accept=".json"
                required
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs file:font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">File Decryption Passphrase</label>
              <input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder="Passphrase used during export"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !importFile}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Decrypting Import...' : 'Import & Restore Vault'}</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
