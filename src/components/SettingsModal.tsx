import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sliders,
  Key,
  Lock,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  Download,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { UserSettings } from '../types';
import { hashString, deriveKey, generateSalt } from '../lib/crypto';
import { t } from '../lib/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  language: 'bn' | 'en';
  theme: 'dark' | 'light';
  salt: string | null;
  recoveryKeyHash: string | null;
  masterPasswordPlain: string;
  customCategories: string[];
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onUpdateMasterPassword: (newHash: string, newSalt: string, newKey: CryptoKey, newPlain: string) => void;
  onAddCustomCategory: (name: string) => void;
  onDeleteCustomCategory: (name: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  language,
  theme,
  salt,
  masterPasswordPlain,
  customCategories,
  onUpdateSettings,
  onUpdateMasterPassword,
  onAddCustomCategory,
  onDeleteCustomCategory,
  onToast,
}) => {
  // Master Password Change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  // 2FA state
  const [twoFactorPIN, setTwoFactorPIN] = useState(settings.twoFactorCode || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(settings.twoFactorEnabled);

  // Custom Category Input
  const [catInput, setCatInput] = useState('');

  if (!isOpen) return null;

  const handleMasterPasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== masterPasswordPlain) {
      onToast(t(language, 'incorrectMasterPassword'), 'error');
      return;
    }
    if (newPass.length < 8) {
      onToast('New password must be at least 8 characters long', 'error');
      return;
    }
    if (newPass !== confirmNewPass) {
      onToast(t(language, 'masterPasswordMismatch'), 'error');
      return;
    }

    try {
      const newSalt = generateSalt(16);
      const newHash = await hashString(newPass, newSalt);
      const newKey = await deriveKey(newPass, newSalt);

      onUpdateMasterPassword(newHash, newSalt, newKey, newPass);
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
      onToast('Master Password updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      onToast('Failed to change Master Password', 'error');
    }
  };

  const handle2FAToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    if (!enabled) {
      onUpdateSettings({ twoFactorEnabled: false, twoFactorCode: null });
      onToast('2FA disabled', 'info');
    } else {
      const pin = twoFactorPIN || '123456';
      onUpdateSettings({ twoFactorEnabled: true, twoFactorCode: pin });
      onToast('2FA PIN enabled', 'success');
    }
  };

  const handleAddCategory = () => {
    if (catInput.trim()) {
      onAddCustomCategory(catInput.trim());
      setCatInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">{t(language, 'settings')}</h2>
              <p className="text-xs text-slate-400">Configure security, auto-lock, and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs">
          {/* 1. AUTO LOCK & CLIPBOARD CLEAR */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Session & Vault Security</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t(language, 'autoLock')}</label>
                <select
                  value={settings.autoLockMinutes}
                  onChange={(e) => onUpdateSettings({ autoLockMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value={1}>1 Minute</option>
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={0}>{t(language, 'never')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Auto-Clear Clipboard</label>
                <select
                  value={settings.autoClearClipboardSeconds}
                  onChange={(e) => onUpdateSettings({ autoClearClipboardSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value={10}>10 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={60}>60 Seconds</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. CHANGE MASTER PASSWORD */}
          <form onSubmit={handleMasterPasswordChangeSubmit} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Change Master Password</span>
            </h3>

            <div>
              <label className="block text-slate-400 mb-1">Current Master Password</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition"
            >
              Update Master Password
            </button>
          </form>

          {/* 3. TWO FACTOR AUTHENTICATION (2FA PIN) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Two-Factor Authentication (2FA PIN)</span>
            </h3>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => handle2FAToggle(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Enable 6-Digit PIN on Login</span>
              </label>

              {twoFactorEnabled && (
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorPIN}
                  onChange={(e) => {
                    setTwoFactorPIN(e.target.value);
                    onUpdateSettings({ twoFactorCode: e.target.value });
                  }}
                  placeholder="123456"
                  className="w-24 bg-slate-900 border border-indigo-500 rounded-xl px-2 py-1 text-center font-mono font-bold text-indigo-300"
                />
              )}
            </div>
          </div>

          {/* 4. CUSTOM CATEGORIES MANAGER */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200">Custom Categories</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                placeholder="Category name..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {customCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => onDeleteCustomCategory(cat)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
