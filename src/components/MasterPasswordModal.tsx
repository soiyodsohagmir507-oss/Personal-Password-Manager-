import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Key, Copy, Check, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { generateSalt, generateRecoveryKey, hashString, deriveKey, decryptData } from '../lib/crypto';
import { t } from '../lib/i18n';
import { CredentialAccount, UserSettings } from '../types';

interface MasterPasswordModalProps {
  isConfigured: boolean;
  masterPasswordHash: string | null;
  recoveryKeyHash: string | null;
  salt: string | null;
  encryptedAccountsBlob?: string | null;
  encryptedAccountsBlobForRecovery?: string | null;
  encryptedDEKByMaster?: string | null;
  encryptedDEKByRecovery?: string | null;
  twoFactorEnabled: boolean;
  twoFactorCode?: string | null;
  language: 'bn' | 'en';
  onUnlockSuccess: (key: CryptoKey, masterPassword: string) => void;
  onInitialSetup: (
    masterHash: string,
    recoveryHash: string,
    salt: string,
    cryptoKey: CryptoKey,
    recoveryKey: string,
    masterPassword: string
  ) => void;
  onResetPassword: (
    masterHash: string,
    recoveryHash: string,
    salt: string,
    cryptoKey: CryptoKey,
    recoveryKey: string,
    masterPassword: string,
    recoveredAccounts: CredentialAccount[],
    recoveredDEK?: string | null
  ) => void;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isConfigured,
  masterPasswordHash,
  recoveryKeyHash,
  salt,
  encryptedAccountsBlob,
  encryptedAccountsBlobForRecovery,
  encryptedDEKByMaster,
  encryptedDEKByRecovery,
  twoFactorEnabled,
  twoFactorCode,
  language,
  onUnlockSuccess,
  onInitialSetup,
  onResetPassword,
}) => {
  // States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [twoFactorInput, setTwoFactorInput] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingCryptoKey, setPendingCryptoKey] = useState<CryptoKey | null>(null);
  const [recoveredAccounts, setRecoveredAccounts] = useState<CredentialAccount[]>([]);
  const [recoveredDEK, setRecoveredDEK] = useState<string | null>(null);
  const [verifiedRecoveryKey, setVerifiedRecoveryKey] = useState('');

  // Setup Step state (0 = Enter Passwords, 1 = Save Recovery Key)
  const [setupStep, setSetupStep] = useState(0);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState('');
  const [generatedSalt, setGeneratedSalt] = useState('');
  const [generatedMasterHash, setGeneratedMasterHash] = useState('');
  const [generatedRecoveryHash, setGeneratedRecoveryHash] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Setup / Reset Master Password
  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg(language === 'bn' ? 'মাস্টার পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে' : 'Master password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t(language, 'masterPasswordMismatch'));
      return;
    }

    setLoading(true);
    try {
      if (isResettingPassword) {
        const activeSalt = salt || generatedSalt;
        if (!activeSalt) throw new Error('Salt missing for password reset');

        const newMasterHash = await hashString(password, activeSalt);
        const derivedCryptoKey = await deriveKey(password, activeSalt);

        onResetPassword(
          newMasterHash,
          recoveryKeyHash || generatedRecoveryHash,
          activeSalt,
          derivedCryptoKey,
          verifiedRecoveryKey,
          password,
          recoveredAccounts,
          recoveredDEK
        );

        setIsResettingPassword(false);
        setPassword('');
        setConfirmPassword('');
        return;
      }

      // First time setup
      const newSalt = generateSalt(16);
      const newRecoveryKey = generateRecoveryKey();

      const mHash = await hashString(password, newSalt);
      const rHash = await hashString(newRecoveryKey, newSalt);
      const derivedCryptoKey = await deriveKey(password, newSalt);

      setGeneratedSalt(newSalt);
      setGeneratedMasterHash(mHash);
      setGeneratedRecoveryHash(rHash);
      setGeneratedRecoveryKey(newRecoveryKey);
      setPendingCryptoKey(derivedCryptoKey);
      setSetupStep(1); // Proceed to show Recovery Key to user only on initial setup
    } catch (err) {
      console.error('Setup error:', err);
      setErrorMsg('Failed to process setup');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    if (generatedSalt && pendingCryptoKey) {
      onInitialSetup(
        generatedMasterHash,
        generatedRecoveryHash,
        generatedSalt,
        pendingCryptoKey,
        generatedRecoveryKey,
        password
      );
    } else if (salt && pendingCryptoKey) {
      const mHash = await hashString(password, salt);
      const rHash = await hashString(generatedRecoveryKey, salt);
      onInitialSetup(mHash, rHash, salt, pendingCryptoKey, generatedRecoveryKey, password);
    }
  };

  // Unlock Existing Vault
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password || !salt || !masterPasswordHash) return;

    setLoading(true);
    try {
      const computedHash = await hashString(password, salt);
      if (computedHash !== masterPasswordHash) {
        setErrorMsg(t(language, 'incorrectMasterPassword'));
        setLoading(false);
        return;
      }

      const derivedCryptoKey = await deriveKey(password, salt);

      if (twoFactorEnabled) {
        setPendingCryptoKey(derivedCryptoKey);
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      onUnlockSuccess(derivedCryptoKey, password);
    } catch (err) {
      console.error('Unlock error:', err);
      setErrorMsg('Error unlocking vault');
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode && twoFactorInput.trim() !== twoFactorCode.trim()) {
      setErrorMsg(language === 'bn' ? 'ভুল ২এফএ কোড!' : 'Invalid 2FA Verification Code!');
      return;
    }
    if (pendingCryptoKey) {
      onUnlockSuccess(pendingCryptoKey, password);
    }
  };

  // Recover with Recovery Key
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recoveryInput || !salt || !recoveryKeyHash) return;

    setLoading(true);
    try {
      const formattedInput = recoveryInput.trim().toUpperCase();
      const computedHash = await hashString(formattedInput, salt);

      if (computedHash !== recoveryKeyHash) {
        setErrorMsg(language === 'bn' ? 'রিকভারি কি মিলছে না! সঠিক কি দিন।' : 'Invalid Recovery Key!');
        setLoading(false);
        return;
      }

      const recCryptoKey = await deriveKey(formattedInput, salt);
      let decryptedDEKStr: string | null = null;
      let decryptedAccounts: CredentialAccount[] = [];

      // 1. Try DEK decryption if present
      if (encryptedDEKByRecovery) {
        try {
          decryptedDEKStr = await decryptData(encryptedDEKByRecovery, recCryptoKey);
          if (decryptedDEKStr && encryptedAccountsBlob) {
            const dekKey = await deriveKey(decryptedDEKStr, salt);
            const accs = await decryptData(encryptedAccountsBlob, dekKey);
            if (accs && Array.isArray(accs)) {
              decryptedAccounts = accs;
            }
          }
        } catch (dekErr) {
          console.warn('DEK decryption failed during recovery:', dekErr);
        }
      }

      // 2. Fallback to legacy direct recovery decryption if DEK wasn't used/available
      if (decryptedAccounts.length === 0) {
        try {
          const targetBlob = encryptedAccountsBlobForRecovery || encryptedAccountsBlob;
          if (targetBlob) {
            const accs = await decryptData(targetBlob, recCryptoKey);
            if (accs && Array.isArray(accs)) {
              decryptedAccounts = accs;
            }
          }
        } catch (decErr) {
          console.warn('Legacy accounts decryption failed during recovery:', decErr);
        }
      }

      setVerifiedRecoveryKey(formattedInput);
      setRecoveredDEK(decryptedDEKStr);
      setRecoveredAccounts(decryptedAccounts || []);
      setIsRecoveryMode(false);
      setIsResettingPassword(true);
      setSetupStep(0);
      setPassword('');
      setConfirmPassword('');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error verifying recovery key');
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(generatedRecoveryKey);
    setCopiedRecovery(true);
    setTimeout(() => setCopiedRecovery(false), 2500);
  };

  const downloadRecoveryKey = () => {
    const text = `=========================================\nPERSONAL PASSWORD MANAGER RECOVERY KEY\n=========================================\n\nRecovery Key: ${generatedRecoveryKey}\nCreated: ${new Date().toLocaleString()}\n\nKEEP THIS KEY SAFE AND CONFIDENTIAL!\nIT IS THE ONLY WAY TO RESTORE YOUR ENCRYPTED VAULT IF YOU FORGET YOUR MASTER PASSWORD.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password_manager_recovery_key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass p-6 md:p-8 rounded-2xl shadow-2xl text-slate-100"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/30 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isResettingPassword
              ? (language === 'bn' ? 'নতুন মাস্টার পাসওয়ার্ড দিন' : 'Reset Master Password')
              : (!isConfigured
                ? (language === 'bn' ? 'ভল্ট তৈরি করুন (Create Vault)' : 'Create Your Vault')
                : (language === 'bn' ? 'ভল্ট লগইন (Vault Login)' : 'Vault Login'))}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isResettingPassword
              ? (language === 'bn' ? 'রিকভারির পর আপনার নতুন মাস্টার পাসওয়ার্ড সেট করুন।' : 'Choose a new Master Password after recovery.')
              : (!isConfigured
                ? (language === 'bn' ? 'আপনার ভল্টের জন্য মাস্টার পাসওয়ার্ড দুইবার লিখুন।' : 'Set a Master Password to protect your vault.')
                : (language === 'bn' ? 'আপনার ভল্টে প্রবেশ করতে মাস্টার পাসওয়ার্ড লিখুন।' : 'Enter your Master Password to unlock your vault.'))}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. SETUP / RESET MASTER PASSWORD MODE */}
        {(!isConfigured || isResettingPassword) && setupStep === 0 && (
          <form onSubmit={handleStartSetup} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-300">
              {isResettingPassword
                ? (language === 'bn' ? '🔑 রিকভারি সফল! আপনার নতুন মাস্টার পাসওয়ার্ড সেট করুন। ভল্টের আগের সমস্ত তথ্য আগের মতোই অক্ষত থাকবে।' : '🔑 Recovery successful! Set your new Master Password. All existing vault records will be preserved.')
                : (language === 'bn' ? '🔒 প্রথমবার সেটআপ: একটি বিশ্বস্ত মাস্টার পাসওয়ার্ড নির্বাচন করুন। এটি আপনার সব সংরক্ষিত ডেটা এনক্রিপ্ট করবে।' : '🔒 First-time setup: Choose a secure master password. This will encrypt all your vault records.')}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t(language, 'masterPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(language, 'enterMasterPassword')}
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t(language, 'confirmMasterPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t(language, 'confirmMasterPassword')}
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
            >
              {loading
                ? 'Processing...'
                : isResettingPassword
                ? (language === 'bn' ? 'নতুন মাস্টার পাসওয়ার্ড সেট করুন' : 'Set New Master Password')
                : t(language, 'createVault')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. RECOVERY KEY GENERATED DISPLAY STEP */}
        {!isConfigured && !isResettingPassword && setupStep === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <Key className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h3 className="font-semibold text-lg">{t(language, 'recoveryKey')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t(language, 'recoveryKeyWarning')}</p>
            </div>

            <div className="bg-black/40 border border-amber-500/30 rounded-xl p-4 text-center font-mono text-amber-300 tracking-wider text-base font-bold select-all">
              {generatedRecoveryKey}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyRecoveryKey}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition text-slate-200"
              >
                {copiedRecovery ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedRecovery ? 'Copied!' : 'Copy Key'}
              </button>
              <button
                type="button"
                onClick={downloadRecoveryKey}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition text-slate-200"
              >
                <Key className="w-4 h-4 text-blue-400" />
                Download TXT
              </button>
            </div>

            <button
              type="button"
              onClick={handleFinishSetup}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition mt-2 flex items-center justify-center gap-2"
            >
              <span>{language === 'bn' ? 'আমি রিকভারি কোড সেভ করেছি, ভল্ট লগইন পেজে যান' : 'I have saved my Recovery Key, proceed to Vault Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. UNLOCK CONFIGURED VAULT MODE */}
        {isConfigured && !isRecoveryMode && !requires2FA && !isResettingPassword && (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'bn' ? 'মাস্টার পাসওয়ার্ড (Master Password)' : 'Master Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? (language === 'bn' ? 'আনলক হচ্ছে...' : 'Unlocking...') : (language === 'bn' ? 'ভল্ট লগইন (Vault Login)' : 'Vault Login')}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(true);
                  setErrorMsg('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন? রিকভারি কি ব্যবহার করুন' : 'Forgot password? Use Recovery Key'}
              </button>
            </div>
          </form>
        )}

        {/* 4. 2FA VERIFICATION STEP */}
        {requires2FA && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="text-center mb-2">
              <ShieldCheck className="w-10 h-10 text-blue-400 mx-auto mb-1" />
              <h3 className="font-semibold text-sm">
                {language === 'bn' ? 'টু-ফ্যাক্টর (2FA) পিন প্রদান করুন' : 'Enter 2FA Verification Code'}
              </h3>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={twoFactorInput}
                onChange={(e) => setTwoFactorInput(e.target.value)}
                placeholder="6-Digit PIN"
                className="w-full bg-white/5 border border-white/10 text-slate-100 text-center font-mono text-lg tracking-widest rounded-xl py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-900/30"
            >
              {language === 'bn' ? 'পিন ভেরিফাই করুন' : 'Verify PIN'}
            </button>
          </form>
        )}

        {/* 5. RECOVERY KEY INPUT MODE */}
        {isRecoveryMode && (
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <div className="text-center mb-2">
              <Key className="w-8 h-8 text-amber-400 mx-auto mb-1" />
              <h3 className="font-semibold text-sm">{t(language, 'recoveryKey')}</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {language === 'bn' ? 'আপনার সংরক্ষিত ২৪-ডিজিট রিকভারি কি লিখুন' : 'Enter your 24-character Recovery Key'}
              </label>
              <input
                type="text"
                required
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-white/5 border border-white/10 font-mono text-center text-sm py-2.5 rounded-xl text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRecoveryMode(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10"
              >
                {t(language, 'cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition"
              >
                {loading ? 'Verifying...' : 'Restore'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
