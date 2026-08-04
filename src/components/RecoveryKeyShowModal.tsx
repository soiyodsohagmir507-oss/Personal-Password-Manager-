import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Copy, Check, Download, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RecoveryKeyShowModalProps {
  recoveryKey: string;
  language: 'bn' | 'en';
  onClose: () => void;
}

export function RecoveryKeyShowModal({
  recoveryKey,
  language,
  onClose,
}: RecoveryKeyShowModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const content = `=========================================\nPERSONAL PASSWORD MANAGER RECOVERY KEY\n=========================================\n\nRecovery Key: ${recoveryKey}\nCreated: ${new Date().toLocaleString()}\n\nKEEP THIS KEY SAFE AND CONFIDENTIAL!\nIT IS THE ONLY WAY TO RESTORE YOUR ENCRYPTED VAULT IF YOU FORGET YOUR MASTER PASSWORD.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vault_recovery_key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-inner">
            <Key className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {language === 'bn' ? 'আপনার রিকভারি কি (Recovery Key)' : 'Your Vault Recovery Key'}
          </h2>
          <p className="text-xs text-amber-300/80 mt-1.5 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              {language === 'bn'
                ? 'এটি আপনার ২৪-ডিজিট সিক্রেট রিকভারি কি। কোনো কারণে মাস্টার পাসওয়ার্ড ভুলে গেলে এটি দিয়েই শুধুমাত্র আপনার একাউন্ট রিকভার বা আনলক করা যাবে। এটি নিরাপদ স্থানে সেভ করে রাখুন।'
                : 'This is your 24-digit secret recovery key. If you ever forget your Master Password, this key is the ONLY way to restore your encrypted vault. Save it in a safe place.'}
            </span>
          </p>
        </div>

        {/* RECOVERY KEY DISPLAY BOX */}
        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 text-center font-mono text-amber-400 tracking-wider text-base md:text-lg font-bold select-all my-4 shadow-inner">
          {recoveryKey}
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? (language === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : language === 'bn' ? 'কপি করুন' : 'Copy Key'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>{language === 'bn' ? 'ফাইল ডাউনলোড' : 'Download TXT'}</span>
          </button>
        </div>

        {/* CONTINUE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'bn' ? 'আমি নিরাপদ স্থানে সেভ করেছি, ভল্টে প্রবেশ করুন' : "I've Saved My Key, Open Vault"}</span>
        </button>
      </motion.div>
    </div>
  );
}
